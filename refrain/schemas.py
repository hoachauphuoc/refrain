"""Request models (the server's copy of the browser's checks) and the JSON schemas for Gemini's answers."""
from typing import Annotated, Literal, Optional

from pydantic import BaseModel, Field, StrictBool, StrictInt, StringConstraints, ValidationError

SURVEY_MESSAGES = {
    "age": "Enter a whole number from 1 to 120.",
    "goal": "Write a goal of up to 200 characters, or tap one of the examples.",
    "minutesPerDay": "Enter a whole number from 5 to 1,440.",
    "maxMinutes": "Enter a whole number from 5 to 120.",
}
MAX_OVER_DAILY = "This can't be more than your minutes per day."


class Survey(BaseModel):
    age: Annotated[StrictInt, Field(ge=1, le=120)]
    goal: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
    minutes_per_day: Annotated[StrictInt, Field(ge=5, le=1440, alias="minutesPerDay")]
    max_minutes: Annotated[StrictInt, Field(ge=5, le=120, alias="maxMinutes")]


def _field_errors(error, messages):
    fields = {}
    for item in error.errors():
        name = item["loc"][0] if item["loc"] else "body"
        fields.setdefault(name, messages.get(name, "Check this answer."))
    return fields


def parse_survey(data):
    """(survey, None) when valid, else (None, {field: message in plain words})."""
    try:
        survey = Survey.model_validate(data)
    except ValidationError as error:
        return None, _field_errors(error, SURVEY_MESSAGES)
    if survey.max_minutes > survey.minutes_per_day:
        return None, {"maxMinutes": MAX_OVER_DAILY}
    return survey, None


def roadmap_answer_schema(max_minutes):
    """Built per request, because the stage limits come from this user's maximum."""
    return {
        "type": "object",
        "properties": {
            "stages": {
                "type": "array",
                "minItems": 4,
                "maxItems": 6,
                "items": {"type": "integer", "minimum": 2, "maximum": max_minutes},
                "description": "Session lengths in whole minutes, never decreasing, ending at the maximum.",
            },
            "reason": {
                "type": "string",
                "description": "One or two sentences on why the plan starts there, naming at least one of their answers.",
            },
        },
        "required": ["stages", "reason"],
    }


# --- Debrief ---

def _text(max_length, min_length=0):
    return Annotated[str, StringConstraints(strip_whitespace=True, min_length=min_length, max_length=max_length)]


class Tap(BaseModel):
    at_sec: Annotated[StrictInt, Field(ge=0, le=7200, alias="atSec")]
    note: _text(60) = ""


class ResumeNote(BaseModel):
    where: _text(160) = ""
    next: _text(160) = ""


class DebriefSurvey(BaseModel):
    age: Annotated[StrictInt, Field(ge=1, le=120)]
    goal: _text(200, min_length=1)


class Debrief(BaseModel):
    survey: DebriefSurvey
    topic: _text(120, min_length=1)
    explanation: Optional[_text(1500)] = None
    taps: Annotated[list[Tap], Field(max_length=200)] = []
    planned_minutes: Annotated[StrictInt, Field(ge=1, le=120, alias="plannedMinutes")]
    demo: StrictBool = False
    seconds_done: Annotated[StrictInt, Field(ge=0, le=7200, alias="secondsDone")]
    outcome: Literal["completed", "pulled_away", "lost_focus"]
    resume_note: Optional[ResumeNote] = Field(default=None, alias="resumeNote")
    stages: Annotated[list[Annotated[StrictInt, Field(ge=2, le=120)]], Field(min_length=4, max_length=6)]
    stage_index: Annotated[StrictInt, Field(ge=0, alias="stageIndex")]
    previous_rule: Optional[_text(300)] = Field(default=None, alias="previousRule")

    @property
    def notes(self):
        return [tap.note for tap in self.taps if tap.note]


def parse_debrief(data):
    """(debrief, None) when valid, else (None, {field: message}). A blank explanation counts as skipped."""
    try:
        debrief = Debrief.model_validate(data)
    except ValidationError as error:
        return None, _field_errors(error, {})
    fields = {}
    if any(a > b for a, b in zip(debrief.stages, debrief.stages[1:])):
        fields["stages"] = "Stages never get shorter."
    if debrief.stage_index >= len(debrief.stages):
        fields["stageIndex"] = "The stage must be inside the roadmap."
    elif debrief.planned_minutes != (1 if debrief.demo else debrief.stages[debrief.stage_index]):
        fields["plannedMinutes"] = "A session lasts its stage's minutes, or 1 with Demo length."
    if debrief.seconds_done > debrief.planned_minutes * 60:
        fields["secondsDone"] = "A session can't run longer than planned."
    if fields:
        return None, fields
    if not debrief.explanation:
        debrief.explanation = None
    return debrief, None


def debrief_answer_schema(with_explanation, with_pattern, with_rule):
    """Built per request: Gemini is only asked for the parts code doesn't write itself."""
    properties, required = {}, []
    if with_explanation:
        properties["got"] = {
            "type": "string",
            "description": "One or two sentences naming at least one point from their explanation.",
        }
        properties["missing"] = {
            "type": "string",
            "description": "One specific idea from the topic their explanation left out, or that nothing important is missing.",
        }
        properties["questions"] = {
            "type": "array",
            "minItems": 2,
            "maxItems": 2,
            "items": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "answer": {"type": "string", "description": "A one-line answer."},
                },
                "required": ["question", "answer"],
            },
        }
        required += ["got", "missing", "questions"]
    if with_pattern:
        properties["pattern"] = {
            "type": "string",
            "description": "The pattern in their distraction notes, quoting at least one note word for word.",
        }
        required.append("pattern")
    if with_rule:
        properties["rule"] = {"type": "string", "description": "One sentence: If ..., then I'll ..."}
        required.append("rule")
    return {"type": "object", "properties": properties, "required": required}
