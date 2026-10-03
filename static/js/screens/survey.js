// Survey: four answers, checked as they're typed, then the coach builds the roadmap.

import { post, WAITS } from "../api.js";
import { $ } from "../dom.js";
import { store } from "../store.js";

const NUMBERS = {
  // Adults only, as Google Cloud's generative AI terms require (the server checks the same range).
  age: { input: "#survey-age", min: 18, max: 120, message: "Refrain is for adults. Enter your age as a whole number from 18 to 120." },
  minutesPerDay: { input: "#survey-daily", min: 5, max: 1440, message: "Enter a whole number from 5 to 1,440." },
  maxMinutes: { input: "#survey-max", min: 5, max: 120, message: "Enter a whole number from 5 to 120." },
};
const GOAL_MESSAGE = "Write your goal, or tap one of the examples.";
const MAX_OVER_DAILY = "This can't be more than your minutes per day.";
const SUBMIT_LABEL = "Build my roadmap";

const inputs = {
  age: "#survey-age",
  goal: "#survey-goal",
  minutesPerDay: "#survey-daily",
  maxMinutes: "#survey-max",
};
const touched = new Set();
let busy = false;
let nav;

function wholeNumber(text, min, max) {
  const trimmed = text.trim();
  if (!/^\d{1,4}$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return n >= min && n <= max ? n : null;
}

function read() {
  const values = {};
  const errors = {};
  for (const [name, rule] of Object.entries(NUMBERS)) {
    const n = wholeNumber($(rule.input).value, rule.min, rule.max);
    if (n === null) errors[name] = rule.message;
    else values[name] = n;
  }
  const goal = $("#survey-goal").value.trim();
  if (goal) values.goal = goal;
  else errors.goal = GOAL_MESSAGE;
  if (!errors.maxMinutes && !errors.minutesPerDay && values.maxMinutes > values.minutesPerDay) {
    errors.maxMinutes = MAX_OVER_DAILY;
  }
  return { values, errors };
}

function render(serverFields = null) {
  const { errors } = read();
  for (const [name, selector] of Object.entries(inputs)) {
    const input = $(selector);
    const message = serverFields?.[name] ?? (touched.has(name) ? errors[name] : undefined);
    $(`${selector}-msg`).textContent = message ?? "";
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }
  $("#survey-fields").disabled = busy;
  $("#survey-submit").disabled = busy || Object.keys(errors).length > 0;
}

async function submit(event) {
  event.preventDefault();
  const { values, errors } = read();
  if (busy || Object.keys(errors).length > 0) return;

  busy = true;
  $("#survey-status").textContent = WAITS.roadmap;
  $("#survey-submit").textContent = "Building your roadmap…";
  render();

  const result = await post("/api/roadmap", values);
  busy = false;

  if (result.ok) {
    const { stages, reason, source, simulated } = result.data;
    store.update({
      survey: values,
      roadmap: { stages, reason, source, simulated },
      stageIndex: 0,
      rule: null,
      warmup: null,
      resume: null,
      pending: null,
      history: [],
    });
    $("#survey-submit").textContent = SUBMIT_LABEL;
    $("#survey-status").textContent = "";
    render();
    nav.go("home");
    return;
  }

  // The answers stay filled in; the same button tries again.
  $("#survey-status").textContent = result.code === "invalid_input" ? "Check the answers above." : result.message;
  $("#survey-submit").textContent = "Try again";
  render(result.fields);
}

export function init(navigation) {
  nav = navigation;
  for (const [name, selector] of Object.entries(inputs)) {
    const input = $(selector);
    input.addEventListener("input", () => {
      if (input.value.trim()) touched.add(name);
      render();
    });
    input.addEventListener("blur", () => {
      touched.add(name);
      render();
    });
  }
  for (const chip of document.querySelectorAll("#survey-goal-examples .chip")) {
    chip.addEventListener("click", () => {
      $("#survey-goal").value = chip.dataset.goal;
      touched.add("goal");
      render();
    });
  }
  $("#survey-form").addEventListener("submit", submit);
}

export function enter() {
  render();
}

export function reset() {
  $("#survey-form").reset();
  touched.clear();
  busy = false;
  $("#survey-status").textContent = "";
  $("#survey-submit").textContent = SUBMIT_LABEL;
  render();
}
