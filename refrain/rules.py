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


# --- Progression: up, hold, or ease back. Taps never cause an ease back. ---

SENTENCES = {
    "within": "Up a stage to {next} minutes: you stayed within the {allowance} distractions this session allows.",
    "at_top": ("Holding at {next} minutes, the top of your roadmap, because you stayed within "
               "the {allowance} distractions this session allows."),
    "over": ("Holding at {next} minutes: you noticed {taps} distractions and this session allows {allowance}, "
             "and every one was a rep of coming back."),
    "pulled_away": "Holding at {next} minutes, because being pulled away is not a focus lapse.",
    "lost_focus": ("Easing back to {next} minutes, a length you've already reached, "
                   "so the next session is one you can finish."),
    "lost_focus_first": "Staying at {next} minutes, your first stage, so the next session is one you can finish.",
}

# "Phone" is left out on purpose: scrolling a phone is the user's own distraction, not an outside interruption.
OUTSIDE_WORDS = ("meeting", "call", "manager", "boss", "urgent", "colleague", "client", "customer")
_OUTSIDE = re.compile(r"\b(?:" + "|".join(OUTSIDE_WORDS) + r")s?\b", re.IGNORECASE)
_IF_THEN = re.compile(r"If .+, then I(?:'|’)ll .+|If .+, then I will .+", re.DOTALL)


def tap_allowance(minutes):
    """One distraction tap per 5 planned minutes, and at least 2: 25 → 5, 12 → 2, a demo minute → 2."""
    return max(2, minutes // 5)


def progress(stages, stage_index, outcome, taps, minutes):
    """The roadmap change for one finished session, decided by code alone.

    `stages` is the list of stage lengths, `minutes` the length actually planned (1 for a demo).
    """
    allowance = tap_allowance(minutes)
    on_last = stage_index == len(stages) - 1
    if outcome == "completed" and taps <= allowance:
        change, new_index, code = ("hold", stage_index, "at_top") if on_last else ("up", stage_index + 1, "within")
    elif outcome == "completed":
        change, new_index, code = "hold", stage_index, "over"
    elif outcome == "pulled_away":
        change, new_index, code = "hold", stage_index, "pulled_away"
    elif stage_index > 0:  # lost focus
        change, new_index, code = "ease_back", stage_index - 1, "lost_focus"
    else:
        change, new_index, code = "hold", stage_index, "lost_focus_first"
    return {
        "change": change,
        "new_index": new_index,
        "next_minutes": stages[new_index],
        "allowance": allowance,
        "taps": taps,
        "reason_code": code,
    }


def roadmap_sentence(result):
    return SENTENCES[result["reason_code"]].format(
        next=result["next_minutes"], allowance=result["allowance"], taps=result["taps"]
    )


def outside_interruption(outcome, notes):
    """True when the session ended "pulled away" or a note names a meeting, a call, a manager, and so on."""
    return outcome == "pulled_away" or any(_OUTSIDE.search(note) for note in notes)


# --- Checks on the coach's debrief ---

def is_if_then(rule):
    return _IF_THEN.fullmatch(rule.strip()) is not None


def quotes_note(text, notes):
    """True when the text contains at least one note word for word (case-insensitive)."""
    lowered = text.lower()
    return any(note.lower() in lowered for note in notes if note)


_QUOTE_EDGES = " \t\n\"'“”‘’.,;:!?"


def verbatim_quotes(quotes, explanation, limit=3):
    """(kept, dropped): the phrases that really are in the explanation, as the explanation writes them.

    Matching ignores case and the quotation marks or end punctuation the coach may add, and each kept
    phrase is the explanation's own text, so the browser can mark exactly those characters.
    """
    kept, dropped, lowered = [], 0, explanation.lower()
    for quote in quotes if isinstance(quotes, list) else []:
        phrase = quote.strip(_QUOTE_EDGES) if isinstance(quote, str) else ""
        if len(phrase) < 3:
            continue
        at = lowered.find(phrase.lower()) if len(lowered) == len(explanation) else explanation.find(phrase)
        if at < 0:
            dropped += 1
            continue
        exact = explanation[at:at + len(phrase)]
        if exact not in kept and len(kept) < limit:
            kept.append(exact)
    return kept, dropped


def notes_lead(notes):
    """'You noted “Slack” and “email ping”.' from the first two different notes."""
    first = []
    for note in notes:
        if note and note.lower() not in (seen.lower() for seen in first):
            first.append(note)
        if len(first) == 2:
            break
    return "You noted " + " and ".join(f"“{note}”" for note in first) + "."
