// Welcome: the promise, how it works, the data notice, and Start. Shown only when nothing is saved.

import { $ } from "../dom.js";

export function init(nav) {
  $("#welcome-start").addEventListener("click", () => nav.go("survey"));
}
