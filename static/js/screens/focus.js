// Focus: the dark screen, the countdown, one-tap distraction logging with an optional note.
// The running session lives only in memory: closing the page discards it, as the PRD requires.

import { $ } from "../dom.js";
import { store } from "../store.js";
import { cancelChime, formatClock, scheduleChime, startCountdown } from "../timer.js";

let nav;
let session = null;
let stopCountdown = null;

function elapsedSeconds() {
  return Math.min(session.plannedMinutes * 60, Math.floor((Date.now() - session.startedAt) / 1000));
}

function noteOpen() {
  return !$("#focus-note-row").hidden;
}

function openNote() {
  $("#focus-note").value = "";
  $("#focus-note-row").hidden = false;
  $("#focus-note").focus();
}

function closeNote() {
  $("#focus-note-row").hidden = true;
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
  const n = session.taps.length;
  $("#focus-tally").textContent = n === 0 ? "Tap whenever your attention slips." : `${n} noted`;
}

function tap() {
  if (!session) return;
  saveTypedNote(); // a new tap first saves the note typed for the previous one
  session.taps.push({ atSec: elapsedSeconds(), note: "" });
  renderTally();
  openNote();
}

function backToButton() {
  closeNote();
  $("#focus-distracted").focus();
}

function endSession(outcome, resumeNote = null) {
  if (!session) return;
  saveTypedNote();
  stopCountdown?.();
  if (outcome !== "completed") cancelChime();
  const finished = session;
  const secondsDone = outcome === "completed" ? finished.plannedMinutes * 60 : elapsedSeconds();
  session = null;
  closeNote();

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
}

// enter({ topic, plannedMinutes, demo }) starts the countdown at once.
export function enter({ topic, plannedMinutes, demo }) {
  const now = Date.now();
  session = { topic, plannedMinutes, demo, startedAt: now, endAt: now + plannedMinutes * 60_000, taps: [] };

  $("#focus-topic").textContent = topic;
  const { rule } = store.state;
  $("#focus-rule").hidden = !rule;
  $("#focus-rule").textContent = rule ? rule.text : "";
  closeNote();
  renderTally();

  scheduleChime(plannedMinutes * 60);
  stopCountdown = startCountdown(
    session.endAt,
    (left) => {
      $("#focus-countdown").textContent = formatClock(left);
    },
    () => endSession("completed"),
  );
}
