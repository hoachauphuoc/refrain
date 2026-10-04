// Saved progress: one JSON value under the localStorage key "refrain.v1", saved on every change.
// Nothing leaves this browser except what a screen sends to the coach.

const KEY = "refrain.v1";
const VERSION = 1;

export function emptyState() {
  return {
    version: VERSION,
    survey: null,
    roadmap: null,
    stageIndex: 0,
    rule: null,
    warmup: null,
    reviews: [], // warm-up questions brought back until they're kept (progress.js)
    resume: null,
    pending: null,
    history: [],
    settings: { demoLength: false },
  };
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && saved.version === VERSION) return { ...emptyState(), ...saved };
  } catch {
    // Unreadable: start fresh. There are no migrations in the proof of concept.
  }
  return emptyState();
}

export const store = {
  state: load(),

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch {
      // Storage blocked or full: keep working in memory for this visit.
    }
  },

  update(changes) {
    Object.assign(this.state, changes);
    this.save();
  },

  reset() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // Nothing saved to remove.
    }
    this.state = emptyState();
  },
};
