// Boot: load saved progress, choose the first screen, and give every screen a way to move on.

import { show } from "./dom.js";
import { store } from "./store.js";
import * as welcome from "./screens/welcome.js";
import * as survey from "./screens/survey.js";
import * as home from "./screens/home.js";
import * as focus from "./screens/focus.js";
import * as debrief from "./screens/debrief.js";

const screens = { welcome, survey, home, focus, debrief };

const nav = {
  go(name, data) {
    screens[name].enter?.(data);
    show(name);
  },
  resetAll() {
    for (const screen of Object.values(screens)) screen.reset?.();
  },
};

for (const screen of Object.values(screens)) screen.init(nav);

function firstScreen() {
  const { survey: answers, roadmap, pending } = store.state;
  if (!answers || !roadmap) return "welcome";
  // A finished session waiting for its debrief: Teach-back if not sent yet, otherwise the retry state.
  if (pending) return "debrief";
  return "home";
}

nav.go(firstScreen());
