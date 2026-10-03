"""One real Gemini call through the app's own client: confirms the SDK settings, prints tokens and cost.

From the repo root, after `gcloud auth application-default login` and copying .env.example to .env:
    python scripts/smoke_gemini.py
"""
import json
import logging
import os
import sys
from pathlib import Path

import google.auth
from dotenv import load_dotenv
from google.auth import exceptions as auth_exceptions

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env")

from refrain import coach, rules, schemas  # noqa: E402
from refrain.gemini import CoachError, Gemini  # noqa: E402

SAMPLE = {"age": 34, "goal": "Study for a certification after work", "minutesPerDay": 60, "maxMinutes": 30}


def main():
    logging.basicConfig(level=logging.INFO, format="log: %(message)s")
    project = os.environ.get("GOOGLE_CLOUD_PROJECT")
    if not project:
        print("Set GOOGLE_CLOUD_PROJECT in .env first (copy .env.example to .env).")
        return 2
    try:
        credentials, _ = google.auth.default()
    except auth_exceptions.DefaultCredentialsError:
        print("No Google sign-in found. Run: gcloud auth application-default login")
        return 2
    print(f"quota project used for billing: {getattr(credentials, 'quota_project_id', None)}")

    gemini = Gemini(
        project=project,
        location=os.environ.get("GOOGLE_CLOUD_LOCATION", "global"),
        model=os.environ.get("REFRAIN_MODEL", "gemini-3.8-flash"),
        thinking=os.environ.get("REFRAIN_THINKING", "medium"),
    )
    print(f"project {gemini.project} · location {gemini.location} · model {gemini.model} · thinking {gemini.thinking}")

    survey, _ = schemas.parse_survey(SAMPLE)
    try:
        data = gemini.generate_json(
            "roadmap", coach.SYSTEM, coach.roadmap_prompt(survey), schemas.roadmap_answer_schema(survey.max_minutes)
        )
    except CoachError as e:
        print(f"FAILED: {e} ({e.__cause__!r})")
        return 1

    print(json.dumps(data, indent=2, ensure_ascii=False))
    reason = data.get("reason", "")
    print(f"check_roadmap: {rules.check_roadmap(data.get('stages'), survey.max_minutes)} · "
          f"mentions_survey: {rules.mentions_survey(reason, survey)} · has_claim: {rules.has_claim(reason)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
