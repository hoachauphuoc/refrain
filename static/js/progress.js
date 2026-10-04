// Pure helpers behind the progress views: no DOM and no storage, so tests/js can run them in Node.

// The focus ring in index.html: a circle of radius 92 centred in a 200 × 200 viewBox.
export const RING = { center: 100, radius: 92 };
export const RING_LENGTH = 2 * Math.PI * RING.radius;

// Where a moment of the session sits on the ring: 0 is the top, and the ring fills clockwise.
export function starPoint(fraction, { center, radius } = RING) {
  const f = Math.min(1, Math.max(0, Number(fraction) || 0));
  const angle = -Math.PI / 2 + f * 2 * Math.PI;
  const round = (n) => Math.round(n * 100) / 100;
  return { x: round(center + radius * Math.cos(angle)), y: round(center + radius * Math.sin(angle)) };
}

// The "then" half of an if-then rule, shown as "Your plan: …" while a note is typed.
// "If team chat pings, then I'll note it and reply at the break." → "note it and reply at the break"
export function planFrom(rule) {
  if (typeof rule !== "string") return null;
  const match = rule.match(/\bthen,?\s+I(?:'|’)?ll\s+(.+)$/i) ?? rule.match(/\bthen,?\s+I\s+will\s+(.+)$/i);
  if (!match) return null;
  const plan = match[1].trim().replace(/[.!\s]+$/, "");
  return plan || null;
}

// The text in pieces, with every place a phrase appears (ignoring case) marked, so a screen can wrap
// the marked pieces in <mark> while every piece still goes in as plain text.
// markSegments("Slack pinged", ["slack"]) → [{ text: "Slack", marked: true }, { text: " pinged", marked: false }]
export function markSegments(text, phrases) {
  const source = typeof text === "string" ? text : "";
  // Lower-casing can change the length of a few characters; then match case as written instead.
  const folds = source.toLowerCase().length === source.length;
  const haystack = folds ? source.toLowerCase() : source;
  const ranges = [];
  for (const phrase of Array.isArray(phrases) ? phrases : []) {
    const needle = typeof phrase === "string" ? phrase.trim() : "";
    if (needle.length < 2) continue;
    const wanted = folds ? needle.toLowerCase() : needle;
    for (let at = haystack.indexOf(wanted); at >= 0; at = haystack.indexOf(wanted, at + wanted.length)) {
      ranges.push([at, at + wanted.length]);
    }
  }
  ranges.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const merged = [];
  for (const [start, end] of ranges) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  const pieces = [];
  let at = 0;
  for (const [start, end] of merged) {
    if (start > at) pieces.push({ text: source.slice(at, start), marked: false });
    pieces.push({ text: source.slice(start, end), marked: true });
    at = end;
  }
  if (at < source.length) pieces.push({ text: source.slice(at), marked: false });
  return pieces;
}

// The focus stretches between returns, in seconds: from the start, through each tap, to the end.
// stretches([15, 40], 60) → [{ from: 0, to: 15 }, { from: 15, to: 40 }, { from: 40, to: 60 }]
export function stretches(tapSecs, endSec) {
  const end = Math.max(0, Number(endSec) || 0);
  const marks = (Array.isArray(tapSecs) ? tapSecs : [])
    .map(Number)
    .filter(Number.isFinite)
    .map((sec) => Math.min(end, Math.max(0, sec)))
    .sort((a, b) => a - b);
  const out = [];
  let from = 0;
  for (const to of [...marks, end]) {
    out.push({ from, to });
    from = to;
  }
  return out;
}

// The longest of those stretches, so the debrief can show the best run of the session.
export function longestStretch(tapSecs, endSec) {
  return stretches(tapSecs, endSec).reduce((best, s) => (s.to - s.from > best.to - best.from ? s : best));
}

// 75 → "1:15"
export function clock(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

// --- Spaced warm-ups, counted in sessions rather than days (two Leitner boxes) ---
// Missed or partly → box 1, back at the next warm-up. Got → box 2, back after three sessions.
// Got again from box 2 → kept: it stops coming back and counts as an idea kept.
// `done` is the number of sessions finished so far (the length of the history).
export const REVIEW_GAP = { again: 1, later: 3 };

const sameItem = (a, b) => a.question === b.question && a.topic === b.topic;

// Questions back for review now, the longest-waiting first.
export function dueReviews(reviews, done, limit = 1) {
  return (Array.isArray(reviews) ? reviews : [])
    .filter((review) => !review.kept && review.due <= done)
    .sort((a, b) => a.due - b.due)
    .slice(0, limit);
}

// Whether the next session opens with a warm-up: new questions are waiting, or one is back for review.
export function warmupDue(state) {
  return Boolean(state.warmup) || dueReviews(state.reviews, state.history?.length ?? 0).length > 0;
}

// The reviews after a check. `checked` lists { question, answer, topic, verdict } for every checked item,
// new or back for review; `at` is when it was checked. The saved list itself is never changed.
export function afterCheck(reviews, checked, done, at) {
  const next = (Array.isArray(reviews) ? reviews : []).map((review) => ({ ...review }));
  for (const item of checked) {
    let entry = next.find((review) => sameItem(review, item));
    if (!entry) {
      entry = { question: item.question, answer: item.answer, topic: item.topic, box: 0, due: 0, last: null, lastAt: null, kept: false };
      next.push(entry);
    }
    if (item.verdict === "got" && entry.box === 2) {
      entry.kept = true;
    } else if (item.verdict === "got") {
      entry.box = 2;
      entry.due = done + REVIEW_GAP.later;
    } else {
      entry.box = 1;
      entry.due = done + REVIEW_GAP.again;
    }
    entry.last = item.verdict;
    entry.lastAt = at;
  }
  return next;
}

export function keptCount(reviews) {
  return (Array.isArray(reviews) ? reviews : []).filter((review) => review.kept).length;
}

// The line above a question that is back: why it is back, and when it was last asked.
export function backAgainLabel(review) {
  const day = new Date(review.lastAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (review.box === 2) return `Back again: you had this on ${day}. Get it once more to keep it.`;
  return review.last === "partly" ? `Back again: you partly had this on ${day}.` : `Back again: you missed this on ${day}.`;
}

// --- Home ---

// Running totals for the counters: they only ever grow, so there is no streak to lose.
export function totals(history, reviews) {
  const rows = Array.isArray(history) ? history : [];
  const recalls = rows.map((row) => row.recall).filter(Boolean);
  const sum = (list, read) => list.reduce((total, item) => total + (Number(read(item)) || 0), 0);
  return {
    sessions: rows.length,
    seconds: sum(rows, (row) => row.secondsDone),
    returns: sum(rows, (row) => row.taps),
    kept: keptCount(reviews),
    recall: {
      got: sum(recalls, (r) => r.got),
      partly: sum(recalls, (r) => r.partly),
      asked: sum(recalls, (r) => r.got + r.partly + r.missed),
    },
  };
}

// How many of these notes name one of the rule's notes ("team chat" also counts "team chat again").
export function notesMatching(notes, ruleNotes) {
  const words = (Array.isArray(ruleNotes) ? ruleNotes : []).map((w) => w.toLowerCase().trim()).filter(Boolean);
  return (Array.isArray(notes) ? notes : []).filter((note) => {
    const lowered = typeof note === "string" ? note.toLowerCase() : "";
    return lowered && words.some((word) => lowered.includes(word));
  }).length;
}

// Rule at work: how often the notes behind the rule came up in your last few sessions, oldest first,
// so you can see whether that pull is shrinking. The coach rewrites the rule after most sessions, so this
// follows its notes across sessions rather than counting from when the rule was written.
// Only sessions saved with their notes count; older rows only know how many taps they had.
export function ruleAtWork(rule, history, limit = 5) {
  const fromNotes = rule?.fromNotes ?? [];
  if (fromNotes.length === 0) return null;
  const rows = (Array.isArray(history) ? history : []).filter((row) => Array.isArray(row.notes)).slice(0, limit).reverse();
  if (rows.length === 0) return null;
  const counts = rows.map((row) => notesMatching(row.notes, fromNotes));
  const [first, last] = [counts[0], counts[counts.length - 1]];
  const trend = counts.length < 2 ? null : last < first ? "less" : last > first ? "more" : "same";
  return { counts, trend };
}

// The notes that pull you away most, across every session saved with its notes.
export function topNotes(history, limit = 3) {
  const counts = new Map();
  for (const row of Array.isArray(history) ? history : []) {
    for (const note of Array.isArray(row.notes) ? row.notes : []) {
      const key = typeof note === "string" ? note.trim().toLowerCase() : "";
      if (!key) continue;
      const entry = counts.get(key) ?? { note: note.trim(), count: 0 };
      entry.count += 1;
      counts.set(key, entry);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}
