"""Refrain's JSON API: check the input, check the rate limits, ask the coach, answer with JSON."""
from flask import Blueprint, current_app, jsonify, request

from . import coach, rules, schemas
from .ratelimit import CappedGemini, RateLimited, client_ip

bp = Blueprint("api", __name__, url_prefix="/api")


def _limits():
    return current_app.extensions["refrain.limits"]


def _gemini():
    return CappedGemini(current_app.extensions["refrain.gemini"], _limits())


def _error(status, code, **extra):
    return jsonify({"error": code, **extra}), status


@bp.post("/roadmap")
def roadmap():
    survey, fields = schemas.parse_survey(request.get_json(silent=True))
    if fields:
        return _error(400, "invalid_input", fields=fields)
    gemini = _gemini()
    try:
        _limits().admit(client_ip())
        stages, reason, source = coach.build_roadmap(gemini, survey)
    except RateLimited:
        return _error(429, "rate_limited")
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


@bp.post("/check")
def check():
    warmup, fields = schemas.parse_check(request.get_json(silent=True))
    if fields:
        return _error(400, "invalid_input", fields=fields)
    gemini = _gemini()
    try:
        _limits().admit(client_ip())
        verdicts = coach.check_warmup(gemini, warmup)
    except RateLimited:
        return _error(429, "rate_limited")
    except coach.CoachUnavailable:
        return _error(503, "coach_unavailable")
    return jsonify({"results": [{"verdict": v} for v in verdicts], "simulated": gemini.simulated})


@bp.post("/debrief")
def debrief():
    session, fields = schemas.parse_debrief(request.get_json(silent=True))
    if fields:
        return _error(400, "invalid_input", fields=fields)
    # The fixed rules decide the roadmap change first, so it comes back even when the coach can't answer.
    result = rules.progress(session.stages, session.stage_index, session.outcome, len(session.taps),
                            session.planned_minutes)
    progression = {
        "change": result["change"],
        "newStageIndex": result["new_index"],
        "nextMinutes": result["next_minutes"],
        "allowance": result["allowance"],
        "sentence": rules.roadmap_sentence(result),
    }
    gemini = _gemini()
    try:
        _limits().admit(client_ip())
        coaching, coach_error = coach.write_debrief(gemini, session, result), None
    except RateLimited:
        coaching, coach_error = None, "rate_limited"
    except coach.CoachUnavailable:
        coaching, coach_error = None, "coach_unavailable"
    return jsonify({
        "progression": progression,
        "coach": coaching,
        "coachError": coach_error,
        "simulated": gemini.simulated,
    })
