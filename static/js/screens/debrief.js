// Teach-back and Debrief: one screen in two states, under the summary of the session just finished.
// The roadmap change is applied once per session, whether or not the coach answers.

import { MESSAGES, post, WAITS, WORK } from "../api.js";
import { $, el, hideWork, ringStar, showWork } from "../dom.js";
import { clock, longestStretch, markSegments, RING_LENGTH, starPoint } from "../progress.js";
import { store } from "../store.js";

const MAX_EXPLANATION = 1500;
let nav;
let sending = false;

function requestBody(pending) {
  const { survey, rule } = store.state;
  return {
    survey: { age: survey.age, goal: survey.goal },
    topic: pending.topic,
    explanation: pending.explanation,
    taps: pending.taps,
    plannedMinutes: pending.plannedMinutes,
    demo: pending.demo,
    secondsDone: pending.secondsDone,
    outcome: pending.outcome,
    resumeNote: pending.resumeNote,
    stages: pending.stages,
    stageIndex: pending.stageIndexBefore, // the stage the session ran at, so a retry gets the same progression
    previousRule: rule ? rule.text : null,
  };
}

// --- The session just finished: its ring, and three numbers ---

function renderSummary(pending) {
  const length = pending.plannedMinutes * 60;
  const done = Math.min(1, pending.secondsDone / length);
  $("#summary-ring").setAttribute("stroke-dashoffset", (RING_LENGTH * (1 - done)).toFixed(2));
  $("#summary-stars").replaceChildren(...pending.taps.map((tap) => ringStar(starPoint(tap.atSec / length))));
  const best = longestStretch(pending.taps.map((tap) => tap.atSec), pending.secondsDone);
  $("#summary-focused").textContent = clock(pending.secondsDone);
  $("#summary-returns").textContent = String(pending.taps.length);
  $("#summary-longest").textContent = clock(best.to - best.from);
}

// --- Teach-back ---

function renderTeachButton() {
  const text = $("#teach-text").value;
  $("#teach-count").textContent = `${text.length.toLocaleString("en-US")} / 1,500`;
  $("#teach-submit").disabled = sending || text.trim() === "";
  $("#teach-skip").disabled = sending;
  $("#teach-text").disabled = sending;
}

function showTeach(pending) {
  $("#teach").hidden = false;
  $("#debrief").hidden = true;
  $("#teach-topic").textContent = pending.topic;
  $("#teach-text").value = pending.explanation ?? "";
  $("#teach-status").textContent = "";
  $("#teach-submit").textContent = "Get feedback";
  hideWork($("#teach-work"));
  renderTeachButton();
}

async function submitTeach(explanation) {
  const pending = store.state.pending;
  if (!pending || sending) return;
  pending.explanation = explanation;
  pending.submitted = true;
  store.save();
  sending = true;
  $("#teach-submit").textContent = "The coach is thinking…";
  $("#teach-status").textContent = WAITS.debrief;
  showWork($("#teach-work"), explanation ? WORK.debrief : WORK.debriefSkipped);
  renderTeachButton();
  await fetchDebrief();
}

// --- Debrief cards ---

function card(title, body, className = "") {
  return el("article", { className: `debrief-card card ${className}`.trim() }, [el("h3", { text: title }), ...body]);
}

function para(text, className) {
  return el("p", { className, text });
}

// Text with some phrases marked: every piece is plain text, and only the marks are elements.
function marked(text, phrases, markClass) {
  return markSegments(text, phrases).map((piece) =>
    piece.marked ? el("mark", { className: markClass, text: piece.text }) : piece.text,
  );
}

// The first two different notes (as the server's notes_lead picks them), so Home can say where the rule came from.
function firstNotes(taps) {
  const notes = [];
  for (const { note } of taps) {
    if (note && !notes.some((seen) => seen.toLowerCase() === note.toLowerCase())) notes.push(note);
    if (notes.length === 2) break;
  }
  return notes;
}

function fromNotesLine(notes) {
  return notes.length ? para(`From your notes: ${notes.map((note) => `“${note}”`).join(", ")}.`, "rule-source") : null;
}

// Your explanation on the lamp-lit page, with what you got marked in your own words.
function wordsCard(explanation, coach) {
  const page = el("div", { className: "page" }, [
    el("p", { className: "your-words" }, marked(explanation, coach.gotQuotes ?? [], "got-mark")),
    para(coach.got, "got-line"),
    el("p", { className: "add-line" }, [el("strong", { text: "What's missing: " }), coach.missing]),
  ]);
  return card("Your words", [page], "words");
}

function warmupCard(questions) {
  return card("Next warm-up", [
    el("ol", { className: "questions" }, questions.map((q) => el("li", { text: q.question }))),
    para("You'll answer these from memory before your next session.", "muted small"),
  ]);
}

function percent(fraction) {
  return `${(Math.min(1, Math.max(0, fraction)) * 100).toFixed(2)}%`;
}

// The session as a line: what you focused, a star at each return with its note, the longest stretch aglow.
function sessionCard(pending, pattern) {
  const length = pending.plannedMinutes * 60;
  const taps = pending.taps;
  const best = longestStretch(taps.map((tap) => tap.atSec), pending.secondsDone);
  const line = el("div", { className: "timeline", attrs: { "aria-hidden": "true" } });
  const done = el("span", { className: "done" });
  done.style.width = percent(pending.secondsDone / length);
  line.append(done);
  if (best.to > best.from) {
    const glow = el("span", { className: "best" });
    glow.style.left = percent(best.from / length);
    glow.style.width = percent((best.to - best.from) / length);
    line.append(glow);
  }
  for (const tap of taps) {
    const star = el("span", { className: "dot" });
    star.style.left = percent(tap.atSec / length);
    line.append(star);
  }
  const returns = taps.length
    ? el("ol", { className: "returns" }, taps.map((tap) =>
        el("li", {}, [el("span", { className: "at", text: clock(tap.atSec) }), tap.note || "no note"])))
    : null;
  const ending = { completed: "", pulled_away: ", then pulled away", lost_focus: ", then ended early" }[pending.outcome];
  const caption = taps.length === 1 ? "1 return" : `${taps.length} returns`;
  return card("Your session", [
    line,
    returns,
    para(`${clock(pending.secondsDone)} focused${ending} · ${caption} · longest stretch ${clock(best.to - best.from)}`, "timeline-caption"),
    pattern ? para(pattern, "pattern") : null,
  ], "session");
}

// The rule, with the words that came from your notes highlighted.
function ruleCard(coach, pending) {
  if (coach.rule && !coach.keepPreviousRule) {
    const notes = firstNotes(pending.taps);
    return card("Your rule", [el("p", { className: "rule-text" }, marked(coach.rule, notes, "note-mark")), fromNotesLine(notes)], "rule");
  }
  const previous = store.state.rule;
  if (!previous) return card("Your rule", [para("No new rule this time — nothing pulled you away.", "muted")]);
  const notes = previous.fromNotes ?? [];
  return card("Your rule", [
    el("p", { className: "rule-text" }, ["Your rule stays: ", ...marked(previous.text, notes, "note-mark")]),
    fromNotesLine(notes),
  ], "rule");
}

// The roadmap as a small path; moving up lights the next stage once.
function roadmapCard(progression) {
  const stages = store.state.roadmap?.stages ?? [];
  const now = progression.newStageIndex;
  const path = el("ol", { className: "mini-path", attrs: { "aria-hidden": "true" } }, stages.map((stage, i) =>
    el("li", {
      className: i < now ? "done" : i > now ? "later" : progression.change === "up" ? "current lit" : "current",
      text: `${stage.minutes} min`,
    })));
  return card("Your roadmap", [path, para(progression.sentence)], "roadmap");
}

function renderCards(coach, progression) {
  const pending = store.state.pending;
  const cards = [];
  if (coach?.got && pending?.explanation) cards.push(wordsCard(pending.explanation, coach));
  if (coach?.questions?.length === 2) cards.push(warmupCard(coach.questions));
  if (pending) cards.push(sessionCard(pending, coach?.pattern));
  if (coach) cards.push(ruleCard(coach, pending));
  if (progression) cards.push(roadmapCard(progression));
  $("#debrief-cards").replaceChildren(...cards);
}

function showDebrief({ coach = null, progression = null, simulated = false, message = "" }) {
  $("#teach").hidden = true;
  $("#debrief").hidden = false;
  $("#debrief-leave").hidden = true;
  hideWork($("#teach-work"));
  hideWork($("#debrief-work"));
  $("#debrief-title").textContent = store.state.pending?.topic ?? $("#debrief-title").textContent;
  renderCards(coach, progression);
  $("#debrief-tags").replaceChildren(...(simulated ? [el("span", { className: "tag", text: "Simulated coach" })] : []));
  $("#debrief-status").textContent = message;
  $("#debrief-retry").hidden = !message;
  $("#debrief-retry").disabled = false;
  $("#debrief-retry").textContent = "Try again";
  $("#debrief-back").hidden = false;
  $("#debrief-title").focus({ preventScroll: true });
}

function historyRow(pending, progression) {
  return {
    endedAt: pending.endedAt,
    topic: pending.topic,
    plannedMinutes: pending.plannedMinutes,
    demo: pending.demo,
    secondsDone: pending.secondsDone,
    outcome: pending.outcome,
    taps: pending.taps.length,
    recall: pending.recall ?? null,
    change: progression.change,
    stageAfter: progression.newStageIndex,
  };
}

async function fetchDebrief() {
  const pending = store.state.pending;
  const result = await post("/api/debrief", requestBody(pending));
  sending = false;

  if (!result.ok) {
    // The server never answered (or refused the request): nothing is applied yet.
    showDebrief({ progression: pending.progression, message: result.message });
    return;
  }

  const { progression, coach, coachError, simulated } = result.data;
  if (!pending.progressionApplied) {
    pending.progressionApplied = true;
    pending.progression = progression;
    store.update({
      stageIndex: progression.newStageIndex,
      history: [historyRow(pending, progression), ...store.state.history],
    });
    nav.topbar();
  }

  if (!coach) {
    const message = coachError === "rate_limited" ? MESSAGES.rateLimited : MESSAGES.unavailable;
    showDebrief({ progression, simulated, message });
    return;
  }

  const changes = { pending: null };
  if (coach.rule && !coach.keepPreviousRule) {
    changes.rule = {
      text: coach.rule,
      createdAt: new Date().toISOString(),
      fromNotes: firstNotes(pending.taps),
      pulledAway: pending.outcome === "pulled_away",
    };
  }
  if (coach.questions?.length === 2) changes.warmup = { topic: pending.topic, items: coach.questions };
  // Rendered before the rule is replaced and pending is cleared, so the cards can still read both.
  showDebrief({ coach, progression, simulated });
  store.update(changes);
}

async function retry() {
  if (sending || !store.state.pending) return;
  sending = true;
  $("#debrief-retry").disabled = true;
  $("#debrief-retry").textContent = "The coach is thinking…";
  $("#debrief-status").textContent = WAITS.debrief;
  showWork($("#debrief-work"), store.state.pending.explanation ? WORK.debrief : WORK.debriefSkipped);
  await fetchDebrief();
}

function leave() {
  const pending = store.state.pending;
  if (pending && !pending.progressionApplied) {
    // The server never saw this session, so leaving now means it won't count.
    $("#debrief-leave").hidden = false;
    $("#debrief-back").hidden = true;
    $("#debrief-leave-no").focus();
    return;
  }
  store.update({ pending: null });
  nav.go("home");
}

export function init(navigation) {
  nav = navigation;
  $("#teach-text").addEventListener("input", renderTeachButton);
  $("#teach-submit").addEventListener("click", () => {
    const text = $("#teach-text").value.trim().slice(0, MAX_EXPLANATION);
    if (text) submitTeach(text);
  });
  $("#teach-skip").addEventListener("click", () => submitTeach(null));
  $("#debrief-retry").addEventListener("click", retry);
  $("#debrief-back").addEventListener("click", leave);
  $("#debrief-leave-yes").addEventListener("click", () => {
    store.update({ pending: null });
    nav.go("home");
  });
  $("#debrief-leave-no").addEventListener("click", () => {
    $("#debrief-leave").hidden = true;
    $("#debrief-back").hidden = false;
    $("#debrief-back").focus();
  });
}

// Opens Teach-back for a session not sent yet, or the debrief retry state for one that was sent.
export function enter() {
  const pending = store.state.pending;
  sending = false;
  renderSummary(pending);
  if (!pending.submitted) {
    showTeach(pending);
    return;
  }
  $("#debrief-title").textContent = pending.topic;
  showDebrief({ progression: pending.progression, message: MESSAGES.unavailable });
}
