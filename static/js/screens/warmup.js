// Warm-up: answer the last session's two questions from memory, then the coach marks each one.
// A coach outage never blocks studying: Start focusing works whether or not the check came back.

import { post } from "../api.js";
import { $, el } from "../dom.js";
import { store } from "../store.js";
import { unlockSound } from "../timer.js";

const LABELS = { got: "Got it", partly: "Partly", missed: "Missed" };
const MAX_ANSWER = 600;

let nav;
let next = null; // the session to start afterwards: { topic, plannedMinutes, demo }
let recall = null; // { got, partly, missed } once the check came back
let busy = false;

function answerBoxes() {
  return [...document.querySelectorAll("#warmup-items textarea")];
}

function renderItems(items) {
  $("#warmup-items").replaceChildren(
    ...items.map((item, i) =>
      el("li", { className: "warmup-item" }, [
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
  start.className = state === "checked" ? "primary" : "secondary";
  for (const box of answerBoxes()) box.readOnly = state === "busy" || state === "checked";
}

function showVerdicts(items, verdicts) {
  verdicts.forEach((verdict, i) => {
    const line = $(`#warmup-verdict-${i}`);
    line.replaceChildren(
      el("span", { className: `verdict ${verdict}`, text: LABELS[verdict] }),
      el("span", { className: "saved-answer", text: items[i].answer }),
    );
    line.hidden = false;
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
  const { warmup } = store.state;
  if (busy || !warmup) return;
  busy = true;
  $("#warmup-status").textContent = "";
  renderButtons("busy");

  const responses = answerBoxes().map((box) => box.value.trim().slice(0, MAX_ANSWER));
  const result = await post("/api/check", {
    topic: warmup.topic,
    items: warmup.items.map((item, i) => ({ question: item.question, answer: item.answer, response: responses[i] })),
  });
  busy = false;

  if (!result.ok) {
    $("#warmup-status").textContent = result.message;
    renderButtons("failed");
    return;
  }
  const verdicts = result.data.results.map((r) => r.verdict);
  recall = { got: 0, partly: 0, missed: 0 };
  for (const verdict of verdicts) recall[verdict] += 1;
  showVerdicts(warmup.items, verdicts);
  $("#warmup-tags").replaceChildren(
    ...(result.data.simulated ? [el("span", { className: "tag", text: "Simulated coach" })] : []),
  );
  $("#warmup-status").textContent = summary(recall);
  renderButtons("checked");
  $("#warmup-start").focus();
}

function startFocusing() {
  unlockSound(); // this click also lets the browser play the end chime
  store.update({ warmup: null }); // the questions are used; the next teach-back writes new ones
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
  recall = null;
  busy = false;
  $("#warmup-from").textContent = `From your last session on “${warmup.topic}”. Answer from memory, without your notes.`;
  renderItems(warmup.items);
  $("#warmup-tags").replaceChildren();
  $("#warmup-status").textContent = "";
  renderButtons("ready");
}

export function reset() {
  next = null;
  recall = null;
  $("#warmup-items").replaceChildren();
}
