"""Fixed rules: plain Python with no AI and no network, so the numbers are always right.

The roadmap half lives here first: checking an AI roadmap, the built-in default plan,
sessions per day, and the text checks on the AI's reason.
"""
import re
from fractions import Fraction
from math import floor

CLAIM_MARKERS = (
    "%", "percent", "studies show", "research shows", "proven",
    "adhd", "dopamine", "clinical", "diagnos", "disorder",
)


def sessions_per_day(daily, minutes):
    """Whole sessions of this length that fit in the daily minutes, at most 6."""
    return min(6, daily // minutes)


def check_roadmap(stages, max_minutes):
    """4–6 whole numbers, each at least 2, never decreasing, starting below the maximum and ending at it."""
    if not isinstance(stages, list) or not 4 <= len(stages) <= 6:
        return False
    if not all(type(s) is int and s >= 2 for s in stages):
        return False
    if any(a > b for a, b in zip(stages, stages[1:])):
        return False
    return stages[0] < max_minutes and stages[-1] == max_minutes


def _half_up(x):
    return floor(x + Fraction(1, 2))


def default_roadmap(max_minutes):
    """An even climb from about 30% of the maximum up to the maximum.

    4 stages under 10 minutes, otherwise 5. Rounded half up to whole minutes, or to
    multiples of 5 from a 30-minute maximum (from 20 it would repeat stages). Exact
    fractions keep 0.3 × 15 at 4.5, so it rounds to 5 as written.
    """
    count = 4 if max_minutes < 10 else 5
    start = max(2, _half_up(Fraction(3, 10) * max_minutes))
    step = Fraction(max_minutes - start, count - 1)
    unit = 5 if max_minutes >= 30 else 1
    stages = [_half_up((start + step * i) / unit) * unit for i in range(count)]
    stages[-1] = max_minutes
    return stages


def default_reason(survey, stages):
    return (
        f'For your goal, "{survey.goal}", you can give {survey.minutes_per_day} minutes a day '
        f"and up to {survey.max_minutes} per session, so this plan starts at {stages[0]} minutes "
        f"and builds to {survey.max_minutes} in {len(stages)} stages."
    )


def _has_number(text, number):
    return re.search(rf"(?<!\d){number}(?!\d)", text) is not None


def mentions_survey(reason, survey):
    """True when the reason names the age, the daily or maximum minutes, or a goal word of 4+ letters."""
    if any(_has_number(reason, n) for n in (survey.age, survey.minutes_per_day, survey.max_minutes)):
        return True
    words = set(re.findall(r"[^\W\d_]{4,}", reason.lower()))
    goal_words = set(re.findall(r"[^\W\d_]{4,}", survey.goal.lower()))
    return bool(words & goal_words)


def has_claim(text):
    """Flags statistics, research, and medical claims the coach must never make."""
    lowered = text.lower()
    return any(marker in lowered for marker in CLAIM_MARKERS)
