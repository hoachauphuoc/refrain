import pytest

from refrain import rules
from refrain.gemini import CoachError

SURVEY = {"age": 34, "goal": "Study for a certification after work", "minutesPerDay": 60, "maxMinutes": 30}
GOOD = {"stages": [10, 15, 20, 25, 30], "reason": "With 60 minutes after work, you start at 10 and build to 30."}


def post_roadmap(client, **changes):
    return client.post("/api/roadmap", json={**SURVEY, **changes})


def test_roadmap_returns_stages_with_sessions_per_day(client, fake):
    response = post_roadmap(client)
    assert response.status_code == 200
    body = response.get_json()
    assert body["source"] == "ai" and body["simulated"] is True
    minutes = [stage["minutes"] for stage in body["stages"]]
    assert rules.check_roadmap(minutes, 30)
    for stage in body["stages"]:
        assert stage["sessionsPerDay"] >= 1
        assert stage["sessionsPerDay"] * stage["minutes"] <= SURVEY["minutesPerDay"]
    assert fake.calls == ["roadmap"]


@pytest.mark.parametrize("changes, field", [
    ({"age": 0}, "age"),
    ({"age": 121}, "age"),
    ({"age": "34"}, "age"),
    ({"age": 34.5}, "age"),
    ({"goal": "   "}, "goal"),
    ({"goal": "x" * 201}, "goal"),
    ({"minutesPerDay": 4}, "minutesPerDay"),
    ({"minutesPerDay": 1441}, "minutesPerDay"),
    ({"maxMinutes": 121}, "maxMinutes"),
    ({"maxMinutes": 4}, "maxMinutes"),
])
def test_roadmap_rejects_invalid_answers(client, fake, changes, field):
    response = post_roadmap(client, **changes)
    assert response.status_code == 400
    body = response.get_json()
    assert body["error"] == "invalid_input"
    assert field in body["fields"] and body["fields"][field]
    assert fake.calls == []


def test_maximum_above_daily_minutes_is_rejected_in_plain_words(client):
    response = post_roadmap(client, minutesPerDay=20, maxMinutes=30)
    assert response.status_code == 400
    assert response.get_json()["fields"] == {"maxMinutes": "This can't be more than your minutes per day."}


def test_missing_body_is_rejected(client):
    response = client.post("/api/roadmap", data="not json", content_type="text/plain")
    assert response.status_code == 400
    assert response.get_json()["error"] == "invalid_input"


def test_a_broken_answer_is_retried_once(client, fake):
    fake.queue = [{"stages": [10, 20, 15, 25, 30], "reason": GOOD["reason"]}, GOOD]
    body = post_roadmap(client).get_json()
    assert body["source"] == "ai"
    assert [s["minutes"] for s in body["stages"]] == GOOD["stages"]
    assert fake.calls == ["roadmap", "roadmap"]


@pytest.mark.parametrize("bad", [
    {"stages": [10, 15, 20, 25, 28], "reason": GOOD["reason"]},                                   # last stage is not the maximum
    {"stages": GOOD["stages"], "reason": "Starting small makes the first sessions easy wins."},   # ignores the survey
    {"stages": GOOD["stages"], "reason": "Studies show 30 minutes is ideal."},                    # a research claim
])
def test_two_broken_answers_fall_back_to_the_default_plan(client, fake, bad):
    fake.queue = [bad, bad]
    body = post_roadmap(client).get_json()
    assert body["source"] == "default"
    assert [s["minutes"] for s in body["stages"]] == rules.default_roadmap(30)
    assert "Study for a certification after work" in body["reason"]
    assert fake.calls == ["roadmap", "roadmap"]


def test_a_busy_coach_is_retried_once(client, fake):
    fake.queue = [CoachError("429 busy"), GOOD]
    response = post_roadmap(client)
    assert response.status_code == 200
    assert response.get_json()["source"] == "ai"
    assert fake.calls == ["roadmap", "roadmap"]


def test_an_unreachable_coach_answers_503_and_never_the_default_plan(client, fake):
    fake.queue = [CoachError("503"), CoachError("503")]
    response = post_roadmap(client)
    assert response.status_code == 503
    assert response.get_json() == {"error": "coach_unavailable"}
    assert fake.calls == ["roadmap", "roadmap"]


def test_missing_credentials_are_not_retried(client, fake):
    fake.queue = [CoachError("No Google Cloud credentials", retryable=False)]
    response = post_roadmap(client)
    assert response.status_code == 503
    assert fake.calls == ["roadmap"]


def test_page_and_api_carry_the_security_headers(client):
    for response in (client.get("/"), post_roadmap(client)):
        assert response.headers["Content-Security-Policy"].startswith("default-src 'self'")
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert response.headers["Referrer-Policy"] == "no-referrer"


def test_index_and_scripts_are_served(client):
    assert b'<script type="module" src="/static/js/main.js">' in client.get("/").data
    script = client.get("/static/js/main.js")
    assert script.status_code == 200
    assert script.mimetype == "text/javascript"


def test_oversized_requests_are_refused(client):
    response = post_roadmap(client, goal="x" * 40_000)
    assert response.status_code == 413
