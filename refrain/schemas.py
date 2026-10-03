"""Request models (the server's copy of the browser's checks) and the JSON schemas for Gemini's answers."""
from typing import Annotated

from pydantic import BaseModel, Field, StrictInt, StringConstraints, ValidationError

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
