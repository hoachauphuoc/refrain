// Screen switching and safe element building. All user and AI text goes in through
// textContent (never innerHTML), so nothing typed or generated can run as code.

export function $(selector, root = document) {
  return root.querySelector(selector);
}

export function show(name) {
  for (const screen of document.querySelectorAll(".screen")) {
    screen.hidden = screen.id !== `screen-${name}`;
  }
  window.scrollTo(0, 0);
  document.querySelector(`#screen-${name} [tabindex="-1"]`)?.focus({ preventScroll: true });
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
