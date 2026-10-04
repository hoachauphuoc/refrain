// Focus: the dark screen, the countdown inside the ring, one-tap distraction logging with an optional note,
// and End early (pulled away, lost focus, or keep going) while the countdown keeps running.
// Each tap lights a star on the ring: a return, never a failure.
// The running session lives only in memory: closing the page discards it, as the PRD requires.

import { $, el, ringStar } from "../dom.js";
import { planFrom, RING_LENGTH, starPoint } from "../progress.js";
import { store } from "../store.js";
import { cancelChime, formatClock, scheduleChime, startCountdown } from "../timer.js";

const NOTED_MS = 2000;

let nav;
let session = null;
let stopCountdown = null;
let notedTimer = null;

function elapsedSeconds() {
  return Math.min(session.plannedMinutes * 60, Math.floor((Date.now() - session.startedAt) / 1000));
}

function noteOpen() {
  return !$("#focus-note-row").hidden;
}

function openNote() {
  $("#focus-note").value = "";
  $("#focus-plan").hidden = !$("#focus-plan").hasChildNodes();
  $("#focus-note-row").hidden = false;
  $("#focus-note").focus();
}

function closeNote() {
  $("#focus-note-row").hidden = true;
  $("#focus-plan").hidden = true;
  $("#focus-note").value = "";
}

// Attaches any typed note to the latest tap.
function saveTypedNote() {
  const text = $("#focus-note").value.trim().slice(0, 60);
  if (session && noteOpen() && text && session.taps.length > 0) {
    session.taps[session.taps.length - 1].note = text;
  }
}

function renderTally() {
  clearTimeout(notedTimer);
  const n = session.taps.length;
  $("#focus-tally").textContent = n === 0 ? "Tap whenever your attention slips." : `${n} noted`;
}

// The ring fills as the session runs, redrawn from the countdown so it never drifts.
function renderRing(msLeft) {
  const done = 1 - msLeft / (session.plannedMinutes * 60_000);
  $("#focus-ring").setAttribute("stroke-dashoffset", (RING_LENGTH * (1 - Math.min(1, Math.max(0, done)))).toFixed(2));
}

// One star for each return, placed at the moment of the tap; only a new one twinkles.
function addStar(fraction) {
  for (const old of document.querySelectorAll("#focus-stars .new")) old.classList.remove("new");
  $("#focus-stars").append(ringStar(starPoint(fraction), true));
}

function tap() {
  if (!session) return;
  saveTypedNote(); // a new tap first saves the note typed for the previous one
  const elapsedMs = Date.now() - session.startedAt;
  session.taps.push({ atSec: elapsedSeconds(), note: "" });
  addStar(elapsedMs / (session.plannedMinutes * 60_000));
  renderTally();
  openNote();
}

// Back to the button, with a moment's acknowledgement that the slip was noticed.
function backToButton() {
  closeNote();
  if (session) {
    clearTimeout(notedTimer);
    $("#focus-tally").textContent = `Noted. Back to ${session.topic}.`;
    notedTimer = setTimeout(() => session && renderTally(), NOTED_MS);
  }
  $("#focus-distracted").focus();
}

// --- End early: the panel takes the Distracted button's place; the countdown keeps running ---

const SESSION_CONTROLS = ["#focus-distracted", "#focus-tally", ".focus-links"];

function panelOpen() {
  return !$("#focus-end-panel").hidden;
}

function openEndPanel() {
  if (!session) return;
  saveTypedNote();
  closeNote();
  for (const selector of SESSION_CONTROLS) $(selector).hidden = true;
  $("#focus-end-choices").hidden = false;
  $("#focus-resume").hidden = true;
  $("#focus-end-panel").hidden = false;
  $("#focus-pulled").focus();
}

function closeEndPanel() {
  $("#focus-end-panel").hidden = true;
  $("#focus-resume").reset();
  for (const selector of SESSION_CONTROLS) $(selector).hidden = false;
}

function keepGoing() {
  closeEndPanel();
  $("#focus-distracted").focus();
}

function showResumeForm() {
  $("#focus-end-choices").hidden = true;
  $("#focus-resume").hidden = false;
  $("#focus-where").focus();
}

function saveAndEnd(event) {
  event.preventDefault();
  const where = $("#focus-where").value.trim().slice(0, 160);
  const next = $("#focus-next-step").value.trim().slice(0, 160);
  endSession("pulled_away", { where, next });
}

function renderNextStep() {
  // The note from "I was pulled away" last time: the next step, or else where they stopped.
  const { resume } = store.state;
  const line = resume?.next ? `Next step: ${resume.next}` : resume?.where ? `Where you stopped: ${resume.where}` : "";
  $("#focus-next").textContent = line;
  $("#focus-next").hidden = !line;
}

function endSession(outcome, resumeNote = null) {
  if (!session) return;
  saveTypedNote();
  stopCountdown?.();
  clearTimeout(notedTimer);
  if (outcome !== "completed") cancelChime();
  const finished = session;
  const secondsDone = outcome === "completed" ? finished.plannedMinutes * 60 : elapsedSeconds();
  session = null;
  closeNote();
  if (panelOpen()) closeEndPanel(); // zero while the panel is open counts as completed

  const { roadmap, stageIndex } = store.state;
  const wroteNote = Boolean(resumeNote && (resumeNote.where || resumeNote.next));
  store.update({
    pending: {
      endedAt: new Date().toISOString(),
      topic: finished.topic,
      plannedMinutes: finished.plannedMinutes,
      demo: finished.demo,
      secondsDone,
      outcome,
      taps: finished.taps,
      recall: finished.recall,
      resumeNote: wroteNote ? resumeNote : null,
      explanation: null,
      submitted: false,
      stageIndexBefore: stageIndex,
      stages: roadmap.stages.map((stage) => stage.minutes),
      progressionApplied: false,
      progression: null,
    },
    // Every session end replaces the "Pick up where you left off" note, or clears it.
    resume: wroteNote ? { topic: finished.topic, ...resumeNote } : null,
  });
  nav.go("debrief");
}

export function init(navigation) {
  nav = navigation;
  $("#focus-distracted").addEventListener("click", tap);
  $("#focus-note").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveTypedNote();
      backToButton();
    } else if (event.key === "Escape") {
      backToButton();
    }
  });
  $("#focus-note-skip").addEventListener("click", backToButton);

  $("#focus-end").addEventListener("click", openEndPanel);
  $("#focus-pulled").addEventListener("click", showResumeForm);
  $("#focus-lost").addEventListener("click", () => endSession("lost_focus"));
  $("#focus-keep").addEventListener("click", keepGoing);
  $("#focus-keep-resume").addEventListener("click", keepGoing);
  $("#focus-resume").addEventListener("submit", saveAndEnd);
  $("#focus-end-panel").addEventListener("keydown", (event) => {
    if (event.key === "Escape") keepGoing();
  });
}

// enter({ topic, plannedMinutes, demo, recall }) starts the countdown at once.
// `recall` is the warm-up's { got, partly, missed } when the session opened with one.
export function enter({ topic, plannedMinutes, demo, recall = null }) {
  const now = Date.now();
  session = { topic, plannedMinutes, demo, recall, startedAt: now, endAt: now + plannedMinutes * 60_000, taps: [] };

  $("#focus-topic").textContent = topic;
  renderNextStep();
  const { rule } = store.state;
  $("#focus-rule").hidden = !rule;
  $("#focus-rule").textContent = rule ? rule.text : "";
  // The plan from the rule, shown while a note is typed: support at the moment it is needed.
  const plan = rule ? planFrom(rule.text) : null;
  $("#focus-plan").replaceChildren(...(plan ? ["Your plan: ", el("strong", { text: plan })] : []));
  $("#focus-stars").replaceChildren();
  closeNote();
  closeEndPanel();
  renderTally();

  scheduleChime(plannedMinutes * 60);
  stopCountdown = startCountdown(
    session.endAt,
    (left) => {
      $("#focus-countdown").textContent = formatClock(left);
      renderRing(left);
    },
    () => endSession("completed"),
  );
}
