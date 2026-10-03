// Teach-back and Debrief: one screen in two states.
// The roadmap change is applied once per session, whether or not the coach answers.

import { MESSAGES, post } from "../api.js";
import { $, el } from "../dom.js";
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
  renderTeachButton();
  await fetchDebrief();
}

// --- Debrief ---

function card(title, body, className = "") {
  return el("article", { className: `debrief-card card ${className}`.trim() }, [el("h3", { text: title }), ...body]);
}

function para(text, className) {
  return el("p", { className, text });
}

function ruleCard(coach) {
  if (coach.rule && !coach.keepPreviousRule) return card("Your rule", [para(coach.rule, "rule-text")], "rule");
  const previous = store.state.rule;
  const text = previous ? `Your rule stays: ${previous.text}` : "No new rule this time — nothing pulled you away.";
  return card("Your rule", [para(text, previous ? "rule-text" : "muted")], previous ? "rule" : "");
}

function roadmapCard(progression) {
  return card("Your roadmap", [para(progression.sentence)], "roadmap");
}

function renderCards(coach, progression) {
  const cards = [];
  if (coach) {
    if (coach.got) cards.push(card("What you got", [para(coach.got)]));
    if (coach.missing) cards.push(card("What's missing", [para(coach.missing)]));
    if (coach.questions?.length === 2) {
      cards.push(card("Next warm-up", [
        el("ol", { className: "questions" }, coach.questions.map((q) => el("li", { text: q.question }))),
        para("You'll answer these from memory before your next session.", "muted small"),
      ]));
    }
    if (coach.pattern) cards.push(card("Your pattern", [para(coach.pattern)]));
    cards.push(ruleCard(coach));
  }
  if (progression) cards.push(roadmapCard(progression));
  $("#debrief-cards").replaceChildren(...cards);
}

function showDebrief({ coach = null, progression = null, simulated = false, message = "" }) {
  $("#teach").hidden = true;
  $("#debrief").hidden = false;
  $("#debrief-leave").hidden = true;
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
  }

  if (!coach) {
    const message = coachError === "rate_limited" ? MESSAGES.rateLimited : MESSAGES.unavailable;
    showDebrief({ progression, simulated, message });
    return;
  }

  const changes = { pending: null };
  if (coach.rule && !coach.keepPreviousRule) changes.rule = { text: coach.rule, createdAt: new Date().toISOString() };
  if (coach.questions?.length === 2) changes.warmup = { topic: pending.topic, items: coach.questions };
  // Rendered before the rule is replaced, so "Your rule stays" can still read the previous one.
  showDebrief({ coach, progression, simulated });
  store.update(changes);
}

async function retry() {
  if (sending || !store.state.pending) return;
  sending = true;
  $("#debrief-retry").disabled = true;
  $("#debrief-retry").textContent = "The coach is thinking…";
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
  if (!pending.submitted) {
    showTeach(pending);
    return;
  }
  $("#debrief-title").textContent = pending.topic;
  showDebrief({ progression: pending.progression, message: MESSAGES.unavailable });
}
