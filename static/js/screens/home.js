// Home: the goal, the roadmap stages, the rule, starting a session, the history, and Reset everything.

import { $, el } from "../dom.js";
import { ruleAtWork, topNotes, totals, warmupDue } from "../progress.js";
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
}

// Keep the current stage in view when the row scrolls sideways. Runs once Home is on screen,
// because a hidden row has no layout to measure.
function centerCurrentStage() {
  const list = $("#home-stages");
  const card = list.children[store.state.stageIndex];
  if (card) list.scrollLeft = card.offsetLeft - list.offsetLeft - (list.clientWidth - card.clientWidth) / 2;
}

function renderRule(rule) {
  $("#home-rule").classList.toggle("empty", !rule);
  $("#home-rule-text").textContent = rule ? rule.text : "Your first rule will come from your first session.";
  const source = rule ? ruleSource(rule) : "";
  $("#home-rule-source").textContent = source;
  $("#home-rule-source").hidden = !source;
  renderRuleAtWork(rule);
}

// Rule at work: how often the notes behind the rule came up in the last few sessions, oldest first.
function renderRuleAtWork(rule) {
  const line = $("#home-rule-work");
  const work = ruleAtWork(rule, store.state.history);
  line.hidden = !work;
  if (!work) return;
  const notes = rule.fromNotes.map((note) => `“${note}”`).join(" or ");
  const most = Math.max(1, ...work.counts);
  const bars = el("span", { className: "work-bars", attrs: { "aria-hidden": "true" } }, work.counts.map((count) => {
    const bar = el("span", { className: count === 0 ? "work-bar zero" : "work-bar" });
    bar.style.height = `${Math.max(14, (count / most) * 100)}%`;
    return bar;
  }));
  const text = work.counts.length === 1
    ? `${notes} came up ${plural(work.counts[0], "time")} last session. Your next sessions will show whether it pulls you less.`
    : `${notes} came up ${work.counts.join(" → ")} times in your last ${work.counts.length} sessions.`;
  const trend = { less: "Less often", same: "About the same", more: "More often", new: "New" }[work.trend];
  // replaceChildren would write a null as the text "null", so only real nodes go in.
  line.replaceChildren(...[
    el("strong", { text: "Rule at work" }),
    bars,
    el("span", { className: "work-text", text }),
    trend ? el("span", { className: `trend ${work.trend}`, text: trend }) : null,
  ].filter(Boolean));
}

// Where the rule came from, so it reads as yours rather than a generic tip.
function ruleSource(rule) {
  if (rule.fromNotes?.length) return `From your notes: ${rule.fromNotes.map((note) => `“${note}”`).join(", ")}.`;
  if (rule.pulledAway) return "Written after a session you were pulled away from.";
  return "";
}

// Shown only after "I was pulled away" with a note; cleared when the next session ends.
function renderPickup(resume) {
  $("#home-pickup").hidden = !resume;
  if (!resume) return;
  $("#home-pickup-topic").textContent = resume.topic;
  $("#home-pickup-lines").replaceChildren(
    ...[["Where you stopped", resume.where], ["Your next step", resume.next]]
      .filter(([, text]) => text)
      .map(([label, text]) =>
        el("p", { className: "pickup-line" }, [el("span", { className: "pickup-key", text: `${label}: ` }), text]),
      ),
  );
  // Picking up usually means the same topic, so offer it when the field is empty.
  if (!$("#home-topic").value.trim()) $("#home-topic").value = resume.topic;
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

function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function recallText(recall) {
  const asked = recall.got + recall.partly + recall.missed;
  return `warm-up ${recall.got} of ${asked}${recall.partly ? `, ${recall.partly} partly` : ""}`;
}

// Counters count up once per visit, the first time Home shows them; with reduced motion they just appear.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let counted = false;

function countUp(node, target) {
  if (counted || reducedMotion.matches || target === 0) {
    node.textContent = String(target);
    return;
  }
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min(1, (now - start) / 700);
    node.textContent = String(Math.round(target * (1 - (1 - progress) ** 3)));
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Running totals only: they grow with every session and never reset, so a missed day costs nothing.
function renderCounters(history) {
  const sum = totals(history, store.state.reviews);
  // Warm-up recall stays a line of its own: how much of what you studied you could bring back.
  $("#home-totals").hidden = sum.recall.asked === 0;
  $("#home-totals").textContent = `Warm-ups: ${sum.recall.got} of ${sum.recall.asked} answers recalled${sum.recall.partly ? `, ${sum.recall.partly} partly` : ""}.`;
  $("#home-counters").hidden = sum.sessions === 0;
  if (sum.sessions === 0) return;
  const values = { sessions: sum.sessions, minutes: Math.floor(sum.seconds / 60), returns: sum.returns, kept: sum.kept };
  for (const [key, value] of Object.entries(values)) countUp($(`#count-${key}`), value);
  counted = true;
}

// What pulls you away most: the three most frequent notes, each with a bar.
function renderPulls(history) {
  $("#home-pulls").hidden = history.length === 0;
  const top = topNotes(history);
  $("#home-pulls-empty").hidden = top.length > 0;
  const most = top[0]?.count ?? 1;
  $("#home-pulls-list").replaceChildren(
    ...top.map(({ note, count }) => {
      const bar = el("span", { className: "pull-bar" });
      bar.style.width = `${Math.max(8, (count / most) * 100)}%`;
      return el("li", { className: "pull" }, [
        el("span", { className: "pull-note", text: note }),
        el("span", { className: "pull-count", text: `${count}×` }),
        el("span", { className: "pull-track", attrs: { "aria-hidden": "true" } }, [bar]),
      ]);
    }),
  );
}

// One line of the sky: the session as a line, with a star at each return. Older rows have no tap times.
function skyLine(row) {
  if (!Array.isArray(row.tapSecs)) return null;
  const length = row.plannedMinutes * 60;
  const line = el("span", { className: "sky-line", attrs: { "aria-hidden": "true" } });
  const done = el("span", { className: "sky-done" });
  done.style.width = `${Math.min(100, (row.secondsDone / length) * 100)}%`;
  line.append(done);
  for (const sec of row.tapSecs) {
    const star = el("span", { className: "sky-star" });
    star.style.left = `${Math.min(100, (sec / length) * 100)}%`;
    line.append(star);
  }
  return line;
}

function renderHistory(history) {
  $("#home-history-empty").hidden = history.length > 0;
  $("#home-sky-hint").hidden = !history.some((row) => Array.isArray(row.tapSecs));
  renderCounters(history);
  renderPulls(history);
  $("#home-history").replaceChildren(
    ...history.map((row) =>
      el("li", { className: "history-row" }, [
        el("span", { className: "h-when", text: when(row.endedAt) }),
        el("span", { className: "h-topic", text: row.topic }),
        skyLine(row),
        el("span", {
          className: "h-meta",
          text: [sessionLength(row), OUTCOMES[row.outcome], `${row.taps} noted`, row.recall && recallText(row.recall)]
            .filter(Boolean)
            .join(" · "),
        }),
        el("span", { className: `h-change ${row.change}`, text: CHANGES[row.change] }),
      ]),
    ),
  );
}

function renderStart() {
  const button = $("#home-start-btn");
  button.disabled = $("#home-topic").value.trim() === "";
  button.textContent = warmupDue(store.state) ? "Start with warm-up" : "Start session";
}

function render() {
  const { survey, roadmap, stageIndex, rule, resume, history, settings } = store.state;
  $("#home-goal").textContent = survey.goal;
  renderStages(roadmap.stages, stageIndex);
  $("#home-reason").textContent = roadmap.reason;
  $("#home-tags").replaceChildren(
    ...[roadmap.source === "default" && "Default plan", roadmap.simulated && "Simulated coach"]
      .filter(Boolean)
      .map((label) => el("span", { className: "tag", text: label })),
  );
  renderRule(rule);
  renderPickup(resume);
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
  const { roadmap, stageIndex, settings } = store.state;
  const demo = Boolean(settings.demoLength);
  const session = { topic, plannedMinutes: demo ? 1 : roadmap.stages[stageIndex].minutes, demo };
  // Questions waiting from the last debrief, or one back for review, come first; otherwise the session starts.
  nav.go(warmupDue(store.state) ? "warmup" : "focus", session);
}

let nav;

export function init(navigation) {
  nav = navigation;
  document.addEventListener("refrain:shown", (event) => {
    if (event.detail === "home") centerCurrentStage();
  });
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
  counted = false;
}
