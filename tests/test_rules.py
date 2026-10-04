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


# --- Progression ---

STAGES = [10, 15, 20, 25, 30]


@pytest.mark.parametrize("minutes, expected", [(25, 5), (12, 2), (1, 2), (10, 2), (30, 6), (120, 24)])
def test_tap_allowance(minutes, expected):
    assert rules.tap_allowance(minutes) == expected


@pytest.mark.parametrize("index, outcome, taps, minutes, change, new_index, code", [
    (1, "completed", 3, 15, "up", 2, "within"),            # within the allowance → up
    (1, "completed", 0, 15, "up", 2, "within"),
    (4, "completed", 2, 30, "hold", 4, "at_top"),          # within, on the last stage → hold
    (1, "completed", 4, 15, "hold", 1, "over"),            # more taps than allowed → hold
    (1, "pulled_away", 9, 15, "hold", 1, "pulled_away"),   # pulled away → hold, whatever the taps
    (2, "lost_focus", 0, 20, "ease_back", 1, "lost_focus"),
    (0, "lost_focus", 0, 10, "hold", 0, "lost_focus_first"),  # never below the first stage
    (0, "completed", 2, 1, "up", 1, "within"),             # a demo minute allows 2
    (0, "completed", 3, 1, "hold", 0, "over"),
])
def test_progress_every_row(index, outcome, taps, minutes, change, new_index, code):
    result = rules.progress(STAGES, index, outcome, taps, minutes)
    assert (result["change"], result["new_index"], result["reason_code"]) == (change, new_index, code)
    assert result["next_minutes"] == STAGES[new_index]
    assert result["allowance"] == rules.tap_allowance(minutes)


def test_taps_never_ease_the_roadmap_back():
    for taps in range(0, 60):
        assert rules.progress(STAGES, 3, "completed", taps, 25)["change"] in ("up", "hold")


@pytest.mark.parametrize("index, outcome, taps, minutes, sentence", [
    (0, "completed", 2, 1, "Up a stage to 15 minutes: you stayed within the 2 distractions this session allows."),
    (4, "completed", 1, 30, "Holding at 30 minutes, the top of your roadmap, because you stayed within "
                           "the 6 distractions this session allows."),
    (1, "completed", 4, 15, "Holding at 15 minutes: you noticed 4 distractions and this session allows 3, "
                           "and every one was a rep of coming back."),
    (1, "pulled_away", 0, 15, "Holding at 15 minutes, because being pulled away is not a focus lapse."),
    (2, "lost_focus", 1, 20, "Easing back to 15 minutes, a length you've already reached, "
                            "so the next session is one you can finish."),
    (0, "lost_focus", 1, 10, "Staying at 10 minutes, your first stage, so the next session is one you can finish."),
])
def test_roadmap_sentence(index, outcome, taps, minutes, sentence):
    assert rules.roadmap_sentence(rules.progress(STAGES, index, outcome, taps, minutes)) == sentence


@pytest.mark.parametrize("outcome, notes, expected", [
    ("pulled_away", [], True),
    ("completed", ["team meeting"], True),
    ("completed", ["Manager asked something"], True),
    ("completed", ["client calls"], True),
    ("completed", ["urgent email"], True),
    ("completed", ["Slack", "email ping"], False),
    ("completed", ["phone"], False),       # the user's own distraction, not an outside interruption
    ("completed", ["recall the formula"], False),  # whole words only: "recall" is not "call"
    ("lost_focus", [], False),
])
def test_outside_interruption(outcome, notes, expected):
    assert rules.outside_interruption(outcome, notes) is expected


@pytest.mark.parametrize("rule, expected", [
    ("If Slack pings, then I'll note it and reply at the break.", True),
    ("If Slack pings, then I’ll note it and reply at the break.", True),
    ("If a meeting pulls me away, then I will write where I stopped.", True),
    ("When Slack pings, I'll note it.", False),
    ("If Slack pings I'll note it.", False),
    ("Note Slack pings and reply at the break.", False),
])
def test_is_if_then(rule, expected):
    assert rules.is_if_then(rule) is expected


def test_quotes_note_is_word_for_word_and_case_insensitive():
    assert rules.quotes_note("Twice it was slack that pulled you.", ["Slack"])
    assert not rules.quotes_note("A chat ping pulled you twice.", ["Slack", "email ping"])


EXPLAINED = "A risk register lists each risk with its likelihood and impact. You score them to decide which to handle first."


def test_verbatim_quotes_keep_only_the_users_own_words_as_they_wrote_them():
    kept, dropped = rules.verbatim_quotes(
        ["“Risk register lists each risk.”", "a heat map", "likelihood and impact", "likelihood AND impact"], EXPLAINED)
    assert kept == ["risk register lists each risk", "likelihood and impact"]
    assert dropped == 1


def test_verbatim_quotes_keep_at_most_three_and_ignore_scraps():
    quotes = ["A risk register", "each risk", "its likelihood", "You score them", "to", ""]
    kept, dropped = rules.verbatim_quotes(quotes, EXPLAINED)
    assert kept == ["A risk register", "each risk", "its likelihood"]
    assert dropped == 0


@pytest.mark.parametrize("quotes", [None, "risk register", [None, 3]])
def test_verbatim_quotes_survive_answers_of_the_wrong_shape(quotes):
    assert rules.verbatim_quotes(quotes, EXPLAINED) == ([], 0)


def test_notes_lead_uses_the_first_two_different_notes():
    assert rules.notes_lead(["Slack", "slack", "email ping", "news"]) == "You noted “Slack” and “email ping”."
    assert rules.notes_lead(["Slack"]) == "You noted “Slack”."
