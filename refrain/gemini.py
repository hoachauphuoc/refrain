"""Gemini 3.8 Flash on Vertex AI, one log line per call, and the simulated coach."""
import json
import logging
import re
import threading
import time

import httpx
from google import genai
from google.auth import exceptions as auth_exceptions
from google.genai import errors, types

from . import rules

log = logging.getLogger("refrain.gemini")

# Global endpoint prices through Dec 31, 2026; both double from Jan 1, 2027.
USD_PER_INPUT_TOKEN = 0.75 / 1_000_000
USD_PER_OUTPUT_TOKEN = 3.75 / 1_000_000  # thinking tokens bill as output
TIMEOUT_MS = 25_000  # two tries fit inside Cloud Run's 60-second request limit
RETRYABLE_CODES = {408, 429, 500, 502, 503, 504}


class CoachError(Exception):
    """A Gemini call gave no usable answer. `retryable` says whether one more try could help."""

    def __init__(self, message, retryable=True):
        super().__init__(message)
        self.retryable = retryable


def estimate_usd(prompt_tokens, total_tokens):
    """Everything after the prompt bills as output, so thinking counts once either way."""
    return prompt_tokens * USD_PER_INPUT_TOKEN + (total_tokens - prompt_tokens) * USD_PER_OUTPUT_TOKEN


def _log(event, **fields):
    # Counts and codes only: never survey answers, notes, or explanations.
    log.info(json.dumps({"event": event, **fields}))


def _ms_since(started):
    return round((time.monotonic() - started) * 1000)


class Gemini:
    simulated = False

    def __init__(self, project, location, model, thinking):
        self.project = project
        self.location = location
        self.model = model
        self.thinking = thinking
        self._client = None
        self._lock = threading.Lock()

    def _get_client(self):
        # Built on first use, so the server starts even before anyone has signed in.
        with self._lock:
            if self._client is None:
                self._client = genai.Client(
                    enterprise=True,
                    project=self.project,
                    location=self.location,
                    http_options=types.HttpOptions(timeout=TIMEOUT_MS),
                )
            return self._client

    def generate_json(self, job, system, user, schema):
        """One stateless call that must answer with a JSON object matching `schema`."""
        started = time.monotonic()
        try:
            response = self._get_client().models.generate_content(
                model=self.model,
                contents=user,
                config=types.GenerateContentConfig(
                    system_instruction=system,
                    response_mime_type="application/json",
                    response_json_schema=schema,
                    thinking_config=types.ThinkingConfig(thinking_level=self.thinking),
                    # Refrain never gives the model tools, so function calling stays off.
                    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                ),
            )
        except errors.APIError as e:
            _log("gemini_error", job=job, code=e.code, status=e.status, latency_ms=_ms_since(started))
            raise CoachError(f"Gemini answered {e.code} {e.status}", retryable=e.code in RETRYABLE_CODES) from e
        except httpx.HTTPError as e:
            _log("gemini_error", job=job, code=type(e).__name__, latency_ms=_ms_since(started))
            raise CoachError("Gemini could not be reached") from e
        except auth_exceptions.GoogleAuthError as e:
            _log("gemini_error", job=job, code="no_credentials",
                 hint="run: gcloud auth application-default login", latency_ms=_ms_since(started))
            raise CoachError("No Google Cloud credentials", retryable=False) from e
        except Exception as e:  # any other SDK failure is still just "the coach couldn't answer"
            _log("gemini_error", job=job, code=type(e).__name__, latency_ms=_ms_since(started))
            raise CoachError("Gemini call failed", retryable=False) from e

        usage = response.usage_metadata
        prompt = (usage and usage.prompt_token_count) or 0
        total = (usage and usage.total_token_count) or 0
        _log(
            "gemini_call",
            job=job,
            prompt_tokens=prompt,
            output_tokens=total - prompt,
            thoughts_tokens=(usage and usage.thoughts_token_count) or 0,
            total_tokens=total,
            latency_ms=_ms_since(started),
            est_usd=round(estimate_usd(prompt, total), 6),
        )
        if not isinstance(response.parsed, dict):
            raise CoachError("Gemini's answer was not a JSON object")
        return response.parsed


class FakeGemini:
    """Fixed, valid answers for each job (REFRAIN_FAKE_AI=1). Tests can queue answers or CoachErrors first."""

    simulated = True

    def __init__(self):
        self.queue = []
        self.calls = []
        self.prompts = []

    def generate_json(self, job, system, user, schema):
        self.calls.append(job)
        self.prompts.append(user)
        if self.queue:
            answer = self.queue.pop(0)
            if isinstance(answer, Exception):
                raise answer
            return answer
        return getattr(self, f"_{job}")(schema, _user_data(user))

    @staticmethod
    def _roadmap(schema, data):
        top = schema["properties"]["stages"]["items"]["maximum"]
        stages = rules.default_roadmap(top)
        return {
            "stages": stages,
            "reason": f"A simulated plan: it starts at {stages[0]} minutes and builds to your {top}-minute maximum.",
        }

    @staticmethod
    def _debrief(schema, data):
        wanted = schema["properties"]
        notes = [item["note"] for item in data.get("distraction_notes", [])]
        answer = {}
        if "got" in wanted:
            answer["got"] = f"You put the core of \"{data['topic']}\" in your own words."
            # The first few words of each sentence, copied exactly, so the marks show in the simulated debrief.
            sentences = re.split(r"(?<=[.!?])\s+", data["explanation"].strip())
            answer["got_quotes"] = [m.group(0) for s in sentences[:2] if (m := re.match(r"\S+(?:[ \t]+\S+){0,3}", s))]
            answer["missing"] = "Simulated: a real coach would name one idea your explanation left out."
            answer["questions"] = [
                {"question": f"What is the main idea of {data['topic']}?", "answer": "The idea you explained."},
                {"question": "Which step would you explain first, and why?", "answer": "The first step you named."},
            ]
        if "pattern" in wanted:
            answer["pattern"] = f"You noted \u201c{notes[0]}\u201d, and each time you came back to your topic."
        if "rule" in wanted:
            if data["how_it_ended"].startswith("pulled away"):
                answer["rule"] = "If something pulls me away, then I'll write where I stopped and my next step before I go."
            elif notes:
                answer["rule"] = f"If {notes[0]} pulls at me, then I'll note it and come back to my topic."
            else:
                answer["rule"] = "If my attention slips, then I'll tap, name it, and come back."
        return answer

    @staticmethod
    def _check(schema, data):
        verdicts = []
        for item in data.get("items", []):
            saved = set(re.findall(r"[^\W\d_]{4,}", item["saved_answer"].lower()))
            theirs = set(re.findall(r"[^\W\d_]{4,}", item["their_answer"].lower()))
            verdicts.append("got" if saved & theirs else "partly")
        return {"verdicts": verdicts}


def _user_data(prompt):
    """The JSON inside <user_data> \u2026 </user_data>, so the simulated coach can echo the user's own notes."""
    start, end = prompt.find("<user_data>"), prompt.rfind("</user_data>")
    if start == -1 or end == -1:
        return {}
    return json.loads(prompt[start + len("<user_data>"):end])
