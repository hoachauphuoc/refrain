import pytest

from refrain import rules, schemas


def survey(age=34, goal="Study for a certification after work", daily=60, top=30):
    parsed, fields = schemas.parse_survey({"age": age, "goal": goal, "minutesPerDay": daily, "maxMinutes": top})
    assert fields is None
    return parsed


@pytest.mark.parametrize("daily, minutes, expected", [(60, 10, 6), (60, 30, 2), (60, 60, 1), (300, 10, 6), (25, 12, 2)])
def test_sessions_per_day(daily, minutes, expected):
    assert rules.sessions_per_day(daily, minutes) == expected


def test_check_roadmap_accepts_a_valid_climb():
    assert rules.check_roadmap([10, 15, 20, 25, 30], 30)
    assert rules.check_roadmap([2, 3, 3, 5], 5)  # equal neighbours are allowed; only decreases are not


@pytest.mark.parametrize("stages", [
    [10, 20, 30],                    # too few
    [5, 10, 15, 20, 25, 28, 30],     # too many
    [10, 20, 15, 25, 30],            # decreases
    [30, 30, 30, 30],                # first stage is not below the maximum
    [10, 15, 20, 25],                # last stage is not the maximum
    [1, 10, 20, 30],                 # a stage below 2 minutes
    [10.0, 15, 20, 30],              # not whole numbers
    [True, 15, 20, 30],
    "10, 15, 20, 30",
    None,
])
def test_check_roadmap_rejects(stages):
    assert not rules.check_roadmap(stages, 30)


@pytest.mark.parametrize("top, expected", [
    (5, [2, 3, 4, 5]),
    (12, [4, 6, 8, 10, 12]),
    (30, [10, 15, 20, 25, 30]),
    (60, [20, 30, 40, 50, 60]),
])
def test_default_roadmap_examples(top, expected):
    assert rules.default_roadmap(top) == expected


@pytest.mark.parametrize("top", range(5, 121))
def test_default_roadmap_is_valid_for_every_maximum(top):
    stages = rules.default_roadmap(top)
    assert rules.check_roadmap(stages, top)
    assert len(set(stages)) == len(stages), "no two stages the same length"
    assert len(stages) == (4 if top < 10 else 5)
    # Every stage fits in the day, because the maximum never exceeds the daily minutes.
    assert all(rules.sessions_per_day(top, m) >= 1 for m in stages)


def test_default_reason_names_the_goal_and_both_minute_answers():
    s = survey()
    stages = rules.default_roadmap(30)
    reason = rules.default_reason(s, stages)
    assert '"Study for a certification after work"' in reason
    assert "60 minutes a day" in reason and "up to 30 per session" in reason
    assert rules.mentions_survey(reason, s)
    assert not rules.has_claim(reason)


@pytest.mark.parametrize("reason, expected", [
    ("At 34, after a full workday, a short first session is easier to finish.", True),  # age
    ("With 60 minutes a day, you have room to build up.", True),                        # daily minutes
    ("We build to your 30-minute maximum.", True),                                      # maximum
    ("Certification study after work goes best in short blocks.", True),                # goal words
    ("Starting small makes the first sessions easy wins.", False),
    ("A 300-word note is plenty.", False),                                              # 300 is not 30
])
def test_mentions_survey(reason, expected):
    assert rules.mentions_survey(reason, survey()) is expected


@pytest.mark.parametrize("text, expected", [
    ("Studies show short sessions work.", True),
    ("90% of learners do better.", True),
    ("This is proven to help.", True),
    ("Good for ADHD.", True),
    ("Short sessions you can finish build the habit.", False),
])
def test_has_claim(text, expected):
    assert rules.has_claim(text) is expected
