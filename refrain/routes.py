"""Refrain's JSON API: check the input, ask the coach, answer with JSON."""
from flask import Blueprint, current_app, jsonify, request

from . import coach, rules, schemas

bp = Blueprint("api", __name__, url_prefix="/api")


def _gemini():
    return current_app.extensions["refrain.gemini"]


def _error(status, code, **extra):
    return jsonify({"error": code, **extra}), status


@bp.post("/roadmap")
def roadmap():
    survey, fields = schemas.parse_survey(request.get_json(silent=True))
    if fields:
        return _error(400, "invalid_input", fields=fields)
    gemini = _gemini()
    try:
        stages, reason, source = coach.build_roadmap(gemini, survey)
    except coach.CoachUnavailable:
        return _error(503, "coach_unavailable")
    return jsonify({
        "stages": [
            {"minutes": m, "sessionsPerDay": rules.sessions_per_day(survey.minutes_per_day, m)}
            for m in stages
        ],
        "reason": reason,
        "source": source,
        "simulated": gemini.simulated,
    })
