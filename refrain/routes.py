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


@bp.post("/check")
def check():
    warmup, fields = schemas.parse_check(request.get_json(silent=True))
    if fields:
        return _error(400, "invalid_input", fields=fields)
    gemini = _gemini()
    try:
        verdicts = coach.check_warmup(gemini, warmup)
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
        coaching, coach_error = coach.write_debrief(gemini, session, result), None
    except coach.CoachUnavailable:
        coaching, coach_error = None, "coach_unavailable"
    return jsonify({
        "progression": progression,
        "coach": coaching,
        "coachError": coach_error,
        "simulated": gemini.simulated,
    })
