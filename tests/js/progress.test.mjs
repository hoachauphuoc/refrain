// The pure helpers in static/js/progress.js.
// Run with: node --test "tests/js/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  afterCheck, backAgainLabel, clock, dueReviews, keptCount, longestStretch, markSegments, notesMatching, planFrom,
  RING, RING_LENGTH, ruleAtWork, starPoint, stretches, topNotes, totals, warmupDue,
} from "../../static/js/progress.js";

test("the ring starts at the top and fills clockwise", () => {
  const { center, radius } = RING;
  assert.deepEqual(starPoint(0), { x: center, y: center - radius });
  assert.deepEqual(starPoint(0.25), { x: center + radius, y: center });
  assert.deepEqual(starPoint(0.5), { x: center, y: center + radius });
  assert.deepEqual(starPoint(0.75), { x: center - radius, y: center });
});

test("a tap outside the session is kept on the ring", () => {
  assert.deepEqual(starPoint(-0.2), starPoint(0));
  assert.deepEqual(starPoint(1.4), starPoint(1));
  assert.deepEqual(starPoint(Number.NaN), starPoint(0));
});

test("the ring's length matches its radius", () => {
  assert.equal(Math.round(RING_LENGTH * 100) / 100, 578.05);
});

test("the plan is the then-part of the rule", () => {
  assert.equal(planFrom("If team chat pulls at me, then I'll note it and come back to my topic."), "note it and come back to my topic");
  assert.equal(planFrom("If a meeting pulls me away, then I will write down where I stopped and my next step."), "write down where I stopped and my next step");
  assert.equal(planFrom("If an email pings, Then I’ll park it until the break!"), "park it until the break");
  assert.equal(planFrom("If I want to check my phone, then, I'll leave it face down"), "leave it face down");
});

test("there is no plan when the rule has no then-part", () => {
  assert.equal(planFrom("Keep your phone in another room."), null);
  assert.equal(planFrom(""), null);
  assert.equal(planFrom(null), null);
  assert.equal(planFrom(undefined), null);
});

const EXPLAINED = "A risk register lists each risk with its likelihood and impact.";
const join = (pieces) => pieces.map((p) => (p.marked ? `[${p.text}]` : p.text)).join("");

test("phrases are marked where they appear, ignoring case, and the text is kept whole", () => {
  const pieces = markSegments(EXPLAINED, ["risk register", "LIKELIHOOD and impact"]);
  assert.equal(join(pieces), "A [risk register] lists each risk with its [likelihood and impact].");
  assert.equal(pieces.map((p) => p.text).join(""), EXPLAINED);
});

test("overlapping and repeated phrases merge into one mark each", () => {
  assert.equal(join(markSegments("Slack and slack again", ["slack"])), "[Slack] and [slack] again");
  assert.equal(join(markSegments(EXPLAINED, ["risk register lists", "register lists each"])),
    "A [risk register lists each] risk with its likelihood and impact.");
});

test("nothing is marked for missing, empty, or one-letter phrases", () => {
  assert.equal(join(markSegments(EXPLAINED, ["a heat map", "", "A", null])), EXPLAINED);
  assert.deepEqual(markSegments(EXPLAINED, null), [{ text: EXPLAINED, marked: false }]);
  assert.deepEqual(markSegments("", ["risk"]), []);
});

test("stretches run from the start, through each return, to the end", () => {
  assert.deepEqual(stretches([40, 15], 60), [{ from: 0, to: 15 }, { from: 15, to: 40 }, { from: 40, to: 60 }]);
  assert.deepEqual(stretches([], 60), [{ from: 0, to: 60 }]);
  assert.deepEqual(stretches([90], 60), [{ from: 0, to: 60 }, { from: 60, to: 60 }]);
});

test("the longest stretch is the best run of the session", () => {
  assert.deepEqual(longestStretch([15, 40], 60), { from: 15, to: 40 });
  assert.deepEqual(longestStretch([], 600), { from: 0, to: 600 });
});

test("clock shows minutes and seconds", () => {
  assert.equal(clock(75), "1:15");
  assert.equal(clock(0), "0:00");
  assert.equal(clock(1500), "25:00");
  assert.equal(clock(-3), "0:00");
});

// --- Spaced warm-ups ---

const TOPIC = "Managing risks";
const Q1 = { question: "What two scores rank a risk?", answer: "Likelihood and impact.", topic: TOPIC };
const Q2 = { question: "What else does each risk need?", answer: "An owner and a plan.", topic: TOPIC };
const OCT3 = "2026-10-03T09:00:00.000Z";

test("a missed question is back at the next warm-up, a got one after three sessions", () => {
  const reviews = afterCheck([], [{ ...Q1, verdict: "missed" }, { ...Q2, verdict: "got" }], 4, OCT3);
  assert.deepEqual(reviews.map((r) => [r.box, r.due, r.kept]), [[1, 5, false], [2, 7, false]]);
  assert.deepEqual(dueReviews(reviews, 4), []); // not in the same session
  assert.deepEqual(dueReviews(reviews, 5).map((r) => r.question), [Q1.question]);
  assert.deepEqual(dueReviews(reviews, 7, 2).map((r) => r.question), [Q1.question, Q2.question]);
});

test("getting it twice keeps the idea, and a kept idea never comes back", () => {
  let reviews = afterCheck([], [{ ...Q1, verdict: "partly" }], 0, OCT3);
  reviews = afterCheck(reviews, [{ ...Q1, verdict: "got" }], 1, OCT3);
  assert.deepEqual([reviews[0].box, reviews[0].due, reviews[0].kept], [2, 4, false]);
  reviews = afterCheck(reviews, [{ ...Q1, verdict: "got" }], 4, OCT3);
  assert.equal(reviews[0].kept, true);
  assert.equal(keptCount(reviews), 1);
  assert.deepEqual(dueReviews(reviews, 100), []);
});

test("missing it from the second box sends it back to the first", () => {
  let reviews = afterCheck([], [{ ...Q1, verdict: "got" }], 0, OCT3);
  reviews = afterCheck(reviews, [{ ...Q1, verdict: "missed" }], 3, OCT3);
  assert.deepEqual([reviews[0].box, reviews[0].due, reviews[0].kept], [1, 4, false]);
});

test("a check never changes the saved list in place", () => {
  const saved = afterCheck([], [{ ...Q1, verdict: "missed" }], 0, OCT3);
  const copy = structuredClone(saved);
  afterCheck(saved, [{ ...Q1, verdict: "got" }], 1, OCT3);
  assert.deepEqual(saved, copy);
});

test("the warm-up opens for new questions or a review that is due, and old saved data has neither", () => {
  const reviews = afterCheck([], [{ ...Q1, verdict: "missed" }], 2, OCT3);
  assert.equal(warmupDue({ warmup: null, reviews, history: [1, 2] }), false);
  assert.equal(warmupDue({ warmup: null, reviews, history: [1, 2, 3] }), true);
  assert.equal(warmupDue({ warmup: { topic: TOPIC, items: [] }, reviews: [], history: [] }), true);
  assert.equal(warmupDue({ warmup: null, history: [] }), false); // saved before reviews existed
});

test("the back-again line says why the question is back", () => {
  const [missed] = afterCheck([], [{ ...Q1, verdict: "missed" }], 0, OCT3);
  const [partly] = afterCheck([], [{ ...Q1, verdict: "partly" }], 0, OCT3);
  const [got] = afterCheck([], [{ ...Q1, verdict: "got" }], 0, OCT3);
  assert.equal(backAgainLabel(missed), "Back again: you missed this on Oct 3.");
  assert.equal(backAgainLabel(partly), "Back again: you partly had this on Oct 3.");
  assert.equal(backAgainLabel(got), "Back again: you had this on Oct 3. Get it once more to keep it.");
});

// --- Home ---

const row = (endedAt, notes, extra = {}) => ({
  endedAt, topic: TOPIC, plannedMinutes: 10, demo: false, secondsDone: 600, outcome: "completed",
  taps: notes.length, tapSecs: notes.map((_, i) => 60 * (i + 1)), notes, recall: null, change: "up", stageAfter: 1, ...extra,
});

test("totals add up sessions, focus, returns, recall, and ideas kept", () => {
  const history = [
    row("2026-10-04T10:00:00Z", ["team chat"], { recall: { got: 1, partly: 1, missed: 0 } }),
    row("2026-10-04T09:00:00Z", ["team chat", "email ping"], { secondsDone: 300 }),
  ];
  const kept = [{ kept: true }, { kept: false }];
  assert.deepEqual(totals(history, kept), {
    sessions: 2, seconds: 900, returns: 3, kept: 1, recall: { got: 1, partly: 1, asked: 2 },
  });
  assert.deepEqual(totals([], undefined), { sessions: 0, seconds: 0, returns: 0, kept: 0, recall: { got: 0, partly: 0, asked: 0 } });
});

test("a note counts for the rule when it names one of the rule's notes", () => {
  assert.equal(notesMatching(["Team chat", "team chat again", "email", ""], ["team chat"]), 2);
  assert.equal(notesMatching(["phone"], []), 0);
});

const RULE = {
  text: "If team chat pings, then I'll note it and reply at the break.",
  createdAt: "2026-10-04T11:05:00Z", fromNotes: ["team chat"], pulledAway: false,
};

test("rule at work follows the rule's notes through the last sessions, oldest first", () => {
  const history = [
    row("2026-10-04T11:00:00Z", ["email ping"]),
    row("2026-10-04T10:00:00Z", ["team chat"]),
    row("2026-10-04T09:00:00Z", ["team chat", "team chat"]),
  ];
  assert.deepEqual(ruleAtWork(RULE, history), { counts: [2, 1, 0], trend: "less" });
  assert.deepEqual(ruleAtWork(RULE, history, 2), { counts: [1, 0], trend: "less" });
  assert.deepEqual(ruleAtWork(RULE, [row("y", ["team chat", "team chat"]), row("x", ["team chat"])]), { counts: [1, 2], trend: "more" });
  assert.deepEqual(ruleAtWork(RULE, [row("x", ["team chat"]), row("w", [])]), { counts: [0, 1], trend: "new" });
  assert.deepEqual(ruleAtWork(RULE, [row("x", ["team chat"])]), { counts: [1], trend: null });
});

test("rule at work needs a rule with notes, and skips rows saved before notes were kept", () => {
  const old = { ...row("2026-10-04T10:00:00Z", []), notes: undefined, tapSecs: undefined, taps: 3 };
  assert.equal(ruleAtWork(RULE, [old]), null);
  assert.equal(ruleAtWork(RULE, []), null);
  assert.equal(ruleAtWork(null, [row("x", ["team chat"])]), null);
  assert.equal(ruleAtWork({ ...RULE, fromNotes: [] }, [row("x", ["team chat"])]), null); // pulled away, no notes
});

test("top notes are the most frequent, ignoring case, with the first spelling kept", () => {
  const history = [row("b", ["Team chat", "phone"]), row("a", ["team chat", "email", "phone", "team chat"])];
  assert.deepEqual(topNotes(history), [{ note: "Team chat", count: 3 }, { note: "phone", count: 2 }, { note: "email", count: 1 }]);
  assert.deepEqual(topNotes([{ ...row("c", []), notes: undefined }]), []);
});
