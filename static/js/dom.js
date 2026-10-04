// Screen switching and safe element building. All user and AI text goes in through
// textContent (never innerHTML), so nothing typed or generated can run as code.

export function $(selector, root = document) {
  return root.querySelector(selector);
}

// View Transitions glide between screens where the browser has them and the user hasn't asked
// for reduced motion; elsewhere the CSS fade runs. html.vt turns that fade off.
const canTransition = typeof document.startViewTransition === "function";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
document.documentElement.classList.toggle("vt", canTransition);

function swap(name) {
  for (const screen of document.querySelectorAll(".screen")) {
    screen.hidden = screen.id !== `screen-${name}`;
  }
  document.body.dataset.screen = name; // the focus screen turns the whole page dark
  window.scrollTo(0, 0);
  const headings = document.querySelectorAll(`#screen-${name} [tabindex="-1"]`);
  [...headings].find((heading) => heading.offsetParent !== null)?.focus({ preventScroll: true });
  // With a view transition the swap runs a frame later, so layout work waits for this event.
  document.dispatchEvent(new CustomEvent("refrain:shown", { detail: name }));
}

export function show(name) {
  const from = document.body.dataset.screen;
  if (canTransition && !reducedMotion.matches && from && from !== name) {
    document.startViewTransition(() => swap(name));
  } else {
    swap(name);
  }
}

// el("p", { className: "tag", text: "Default plan" }, [child, "more text"])
export function el(tag, { className, text, attrs } = {}, children = []) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  for (const [name, value] of Object.entries(attrs ?? {})) node.setAttribute(name, value);
  for (const child of children) {
    if (child != null) node.append(child); // strings become text nodes
  }
  return node;
}

// "What the coach is doing" while a request runs: the lines describe what the request asks for.
export function showWork(box, lines) {
  box.replaceChildren(
    el("p", { className: "work-title", text: "What the coach is doing" }),
    el("ul", { className: "work-list" }, lines.map((line) => el("li", { text: line }))),
  );
  box.hidden = false;
}

export function hideWork(box) {
  box.hidden = true;
  box.replaceChildren();
}
