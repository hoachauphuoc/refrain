// Home: the goal, the roadmap stages, the rule, the session history, and Reset everything.

import { $, el } from "../dom.js";
import { store } from "../store.js";

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
  const card = $("#home-rule");
  card.classList.toggle("empty", !rule);
  $("#home-rule-text").textContent = rule ? rule.text : "Your first rule will come from your first session.";
}

function render() {
  const { survey, roadmap, stageIndex, rule, history } = store.state;
  $("#home-goal").textContent = survey.goal;
  renderStages(roadmap.stages, stageIndex);
  $("#home-reason").textContent = roadmap.reason;
  $("#home-tags").replaceChildren(
    ...[roadmap.source === "default" && "Default plan", roadmap.simulated && "Simulated coach"]
      .filter(Boolean)
      .map((label) => el("span", { className: "tag", text: label })),
  );
  renderRule(rule);
  $("#home-history-empty").hidden = history.length > 0;
}

function closeConfirm() {
  $("#home-reset-confirm").hidden = true;
  $("#home-reset").hidden = false;
}

export function init(nav) {
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
