// Warm-up: answer the last session's two questions from memory, plus one earlier question that is back
// for review, then the coach marks each one. Missed ideas come back until they're kept (progress.js).
// A coach outage never blocks studying: Start focusing works whether or not the check came back.

import { post, WAITS, WORK } from "../api.js";
import { $, el, hideWork, showWork } from "../dom.js";
import { afterCheck, backAgainLabel, dueReviews } from "../progress.js";
import { store } from "../store.js";
import { unlockSound } from "../timer.js";

const LABELS = { got: "Got it", partly: "Partly", missed: "Missed" };
const MAX_ANSWER = 600;

let nav;
let next = null; // the session to start afterwards: { topic, plannedMinutes, demo }
let items = []; // what this warm-up asks: { question, answer, topic, review } (review: the saved entry, or null)
let recall = null; // { got, partly, missed } once the check came back
let busy = false;

// The last session's questions first, then at most one earlier question that is due again.
function warmupItems() {
  const { warmup, reviews, history } = store.state;
  const fresh = (warmup?.items ?? []).map((item) => ({ question: item.question, answer: item.answer, topic: warmup.topic, review: null }));
  const back = dueReviews(reviews, history.length)
    .filter((review) => !fresh.some((item) => item.question === review.question))
    .map((review) => ({ question: review.question, answer: review.answer, topic: review.topic, review }));
  return [...fresh, ...back];
}

function answerBoxes() {
  return [...document.querySelectorAll("#warmup-items textarea")];
}

function renderItems() {
  $("#warmup-items").replaceChildren(
    ...items.map((item, i) =>
      el("li", { className: item.review ? "warmup-item review" : "warmup-item" }, [
        item.review ? el("p", { className: "back-again ico i-rotate", text: backAgainLabel(item.review) }) : null,
        el("label", { text: item.question, attrs: { for: `warmup-answer-${i}` } }),
        el("textarea", { attrs: { id: `warmup-answer-${i}`, rows: "2", maxlength: String(MAX_ANSWER) } }),
        el("p", { className: "verdict-line", attrs: { id: `warmup-verdict-${i}`, hidden: "" } }),
      ]),
    ),
  );
}

// "ready" → "busy" → "checked", or "failed" with Try again; Start focusing shows once a check was tried.
function renderButtons(state) {
  const check = $("#warmup-check");
  const start = $("#warmup-start");
  check.hidden = state === "checked";
  check.disabled = state === "busy";
  check.textContent = { busy: "The coach is thinking…", failed: "Try again" }[state] ?? "Check";
  start.hidden = state === "ready" || state === "busy";
  start.className = state === "checked" ? "primary go" : "secondary";
  for (const box of answerBoxes()) box.readOnly = state === "busy" || state === "checked";
}

function showVerdicts(verdicts, reviews) {
  verdicts.forEach((verdict, i) => {
    const item = items[i];
    // Kept: it was back for its second recall, and this time it was got again.
    const kept = item.review && reviews.some((r) => r.kept && r.question === item.question && r.topic === item.topic);
    $(`#warmup-verdict-${i}`).replaceChildren(
      el("span", { className: `verdict ${verdict}`, text: LABELS[verdict] }),
      kept ? el("span", { className: "kept", text: "Idea kept" }) : null,
      el("span", { className: "saved-answer", text: item.answer }),
    );
    $(`#warmup-verdict-${i}`).hidden = false;
  });
}

function summary(counts) {
  const parts = [
    counts.got && `${counts.got} got it`,
    counts.partly && `${counts.partly} partly`,
    counts.missed && `${counts.missed} missed`,
  ].filter(Boolean);
  return `Checked: ${parts.join(", ")}.`;
}

async function check(event) {
  event.preventDefault();
  if (busy || items.length === 0) return;
  busy = true;
  $("#warmup-status").textContent = WAITS.check;
  showWork($("#warmup-work"), WORK.check);
  renderButtons("busy");

  const responses = answerBoxes().map((box) => box.value.trim().slice(0, MAX_ANSWER));
  const result = await post("/api/check", {
    topic: items[0].topic,
    items: items.map((item, i) => ({ question: item.question, answer: item.answer, response: responses[i] })),
  });
  busy = false;
  hideWork($("#warmup-work"));

  if (!result.ok) {
    // Nothing is marked, so every question stays where it was, and a review stays due.
    $("#warmup-status").textContent = result.message;
    renderButtons("failed");
    return;
  }
  const verdicts = result.data.results.map((r) => r.verdict);
  recall = { got: 0, partly: 0, missed: 0 };
  for (const verdict of verdicts) recall[verdict] += 1;
  const { reviews, history } = store.state;
  const checked = items.map((item, i) => ({ question: item.question, answer: item.answer, topic: item.topic, verdict: verdicts[i] }));
  const updated = afterCheck(reviews, checked, history.length, new Date().toISOString());
  store.update({ reviews: updated });
  showVerdicts(verdicts, updated);
  $("#warmup-tags").replaceChildren(
    ...(result.data.simulated ? [el("span", { className: "tag", text: "Simulated coach" })] : []),
  );
  $("#warmup-status").textContent = summary(recall);
  renderButtons("checked");
  $("#warmup-start").focus();
}

function startFocusing() {
  unlockSound(); // this click also lets the browser play the end chime
  store.update({ warmup: null }); // the new questions are used; the next teach-back writes new ones
  nav.go("focus", { ...next, recall });
}

export function init(navigation) {
  nav = navigation;
  $("#warmup-form").addEventListener("submit", check);
  $("#warmup-start").addEventListener("click", startFocusing);
}

// enter({ topic, plannedMinutes, demo }): the session that starts after the warm-up.
export function enter(session) {
  const { warmup } = store.state;
  next = session;
  items = warmupItems();
  recall = null;
  busy = false;
  $("#warmup-from").textContent = warmup
    ? `From your last session on “${warmup.topic}”. Answer from memory, without your notes.`
    : `An idea from an earlier session on “${items[0]?.topic ?? ""}”. Answer from memory, without your notes.`;
  renderItems();
  $("#warmup-tags").replaceChildren();
  $("#warmup-status").textContent = "";
  hideWork($("#warmup-work"));
  renderButtons("ready");
}

export function reset() {
  next = null;
  items = [];
  recall = null;
  $("#warmup-items").replaceChildren();
}
