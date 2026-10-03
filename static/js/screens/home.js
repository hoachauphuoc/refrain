// Home: the goal, the roadmap stages, the rule, starting a session, the history, and Reset everything.

import { $, el } from "../dom.js";
import { store } from "../store.js";
import { unlockSound } from "../timer.js";

const OUTCOMES = { completed: "completed", pulled_away: "pulled away", lost_focus: "ended early" };
const CHANGES = { up: "Up", hold: "Hold", ease_back: "Ease back" };

function renderStages(stages, current) {
  const list = $("#home-stages");
  list.replaceChildren(
    ...stages.map((stage, i) => {
      const state = i < current ? "done" : i === current ? "current" : "later";
      const item = el("li", { className: `stage ${state}` }, [
        el("span", { className: "stage-label", text: `Stage ${i + 1}` }),
        el("span", { className: "stage-minutes" }, [String(stage.minutes), el("small", { text: " min" })]),
        el("span", { className: "stage-per-day", text: `${stage.sessionsPerDay} a day` }),
        el("span", { className: "stage-state", text: state === "done" ? "Done" : state === "current" ? "Now" : "" }),
      ]);
      if (state === "current") item.setAttribute("aria-current", "step");
      return item;
    }),
  );
  // Keep the current stage in view when the row scrolls sideways (after the screen is shown).
  requestAnimationFrame(() => {
    const card = list.children[current];
    if (card) list.scrollLeft = card.offsetLeft - list.offsetLeft - (list.clientWidth - card.clientWidth) / 2;
  });
}

function renderRule(rule) {
  $("#home-rule").classList.toggle("empty", !rule);
  $("#home-rule-text").textContent = rule ? rule.text : "Your first rule will come from your first session.";
}

function sessionLength(row) {
  if (row.demo) return "1 min demo";
  if (row.outcome === "completed") return `${row.plannedMinutes} min`;
  return `${Math.floor(row.secondsDone / 60)} of ${row.plannedMinutes} min`;
}

function when(iso) {
  const date = new Date(iso);
  const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} · ${time}`;
}

function renderHistory(history) {
  $("#home-history-empty").hidden = history.length > 0;
  $("#home-history").replaceChildren(
    ...history.map((row) =>
      el("li", { className: "history-row" }, [
        el("span", { className: "h-when", text: when(row.endedAt) }),
        el("span", { className: "h-topic", text: row.topic }),
        el("span", { className: "h-meta", text: `${sessionLength(row)} · ${OUTCOMES[row.outcome]} · ${row.taps} noted` }),
        el("span", { className: `h-change ${row.change}`, text: CHANGES[row.change] }),
      ]),
    ),
  );
}

function renderStart() {
  const button = $("#home-start-btn");
  button.disabled = $("#home-topic").value.trim() === "";
  button.textContent = store.state.warmup ? "Start with warm-up" : "Start session";
}

function render() {
  const { survey, roadmap, stageIndex, rule, history, settings } = store.state;
  $("#home-goal").textContent = survey.goal;
  renderStages(roadmap.stages, stageIndex);
  $("#home-reason").textContent = roadmap.reason;
  $("#home-tags").replaceChildren(
    ...[roadmap.source === "default" && "Default plan", roadmap.simulated && "Simulated coach"]
      .filter(Boolean)
      .map((label) => el("span", { className: "tag", text: label })),
  );
  renderRule(rule);
  $("#home-demo").checked = Boolean(settings.demoLength);
  renderStart();
  renderHistory(history);
}

function closeConfirm() {
  $("#home-reset-confirm").hidden = true;
  $("#home-reset").hidden = false;
}

function startSession() {
  const topic = $("#home-topic").value.trim();
  if (!topic) return;
  unlockSound(); // this click is what lets the browser play the end chime
  const { roadmap, stageIndex, settings, warmup } = store.state;
  const demo = Boolean(settings.demoLength);
  const session = { topic, plannedMinutes: demo ? 1 : roadmap.stages[stageIndex].minutes, demo };
  // Questions saved by the last debrief come first; otherwise the session starts directly.
  nav.go(warmup ? "warmup" : "focus", session);
}

let nav;

export function init(navigation) {
  nav = navigation;
  $("#home-topic").addEventListener("input", renderStart);
  $("#home-topic").addEventListener("keydown", (event) => {
    if (event.key === "Enter") startSession();
  });
  $("#home-demo").addEventListener("change", (event) => {
    store.update({ settings: { ...store.state.settings, demoLength: event.target.checked } });
  });
  $("#home-start-btn").addEventListener("click", startSession);

  $("#home-reset").addEventListener("click", () => {
    $("#home-reset").hidden = true;
    $("#home-reset-confirm").hidden = false;
    $("#home-reset-cancel").focus();
  });
  $("#home-reset-cancel").addEventListener("click", () => {
    closeConfirm();
    $("#home-reset").focus();
  });
  $("#home-reset-confirm").addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeConfirm();
      $("#home-reset").focus();
    }
  });
  $("#home-reset-erase").addEventListener("click", () => {
    store.reset();
    nav.resetAll();
    closeConfirm();
    nav.go("welcome");
  });
}

export function enter() {
  closeConfirm();
  render();
}

export function reset() {
  $("#home-topic").value = "";
}
