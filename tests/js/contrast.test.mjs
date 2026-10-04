// Every text/background pair the spec lists meets WCAG AA, computed from the tokens in styles.css.
// Run with: node --test "tests/js/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../../static/css/styles.css", import.meta.url), "utf8");
const root = css.match(/:root\s*\{([^}]*)\}/)[1];
const tokens = Object.fromEntries(
  [...root.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
);

function parse(value) {
  const hex = value.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (hex) return { r: parseInt(hex[1], 16), g: parseInt(hex[2], 16), b: parseInt(hex[3], 16), a: 1 };
  const rgb = value.match(/^rgb\((\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([\d.]+))?\)$/);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]), a: rgb[4] === undefined ? 1 : Number(rgb[4]) };
  throw new Error(`Not a color: ${value}`);
}

function token(name) {
  assert.ok(name in tokens, `styles.css has no --${name}`);
  return parse(tokens[name]);
}

// A translucent color painted over an opaque one.
function over(top, bottom) {
  const mix = (key) => top[key] * top.a + bottom[key] * (1 - top.a);
  return { r: mix("r"), g: mix("g"), b: mix("b"), a: 1 };
}

function luminance({ r, g, b }) {
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// The lightest place text can sit: hover glass where the teal and blue aurora glows overlap at full strength.
const sky2 = token("sky-2");
const auroraPeak = over(token("aurora-teal"), over(token("aurora-blue"), sky2));
const glass = over(token("glass"), auroraPeak);
const glassStrong = over(token("glass-strong"), auroraPeak);

const night = {
  "sky-0": token("sky-0"),
  "sky-1": token("sky-1"),
  "sky-2": sky2,
  surface: token("surface"),
  "surface-2": token("surface-2"),
  "glass over the aurora": glass,
  "hover glass over the aurora": glassStrong,
};

const TEXT = 4.5;
const UI = 3; // borders and focus rings

const checks = [
  // Text on the night, on every background it can sit on
  ...["ink", "muted", "teal", "star"].flatMap((fg) =>
    Object.entries(night).map(([bg, color]) => [fg, token(fg), bg, color, TEXT]),
  ),
  // Text on tinted chips and boxes (totals, coach work, "up", "got it", chip hover)
  ["ink", token("ink"), "teal tint", over(token("tint-teal"), glass), TEXT],
  ["teal-hi", token("teal-hi"), "teal tint", over(token("tint-teal"), glass), TEXT],
  ["star", token("star"), "star tint", over(token("tint-star"), glass), TEXT],
  // Teal buttons
  ["on-teal", token("on-teal"), "teal", token("teal"), TEXT],
  ["on-teal", token("on-teal"), "teal-hi", token("teal-hi"), TEXT],
  ["on-teal", token("on-teal"), "cyan", token("cyan"), TEXT],
  // The lamp-lit page
  ["page-ink", token("page-ink"), "page", token("page"), TEXT],
  ["page-ink", token("page-ink"), "page-dim", token("page-dim"), TEXT],
  ["page-ink", token("page-ink"), "marker", token("marker"), TEXT],
  ["page-ink", token("page-ink"), "marker-star", token("marker-star"), TEXT],
  ["page-muted", token("page-muted"), "page", token("page"), TEXT],
  ["teal-ink", token("teal-ink"), "page", token("page"), TEXT],
  ["amber-ink", token("amber-ink"), "page", token("page"), TEXT],
  // Borders of text boxes and switches, and the keyboard focus ring
  ["field-edge on its box", over(token("field-edge"), token("surface-2")), "glass over the aurora", glass, UI],
  ["teal-hi focus ring", token("teal-hi"), "glass over the aurora", glass, UI],
  ["teal-hi focus ring", token("teal-hi"), "sky-0", token("sky-0"), UI],
  ["page-edge", token("page-edge"), "page", token("page"), UI],
];

for (const [fgName, fg, bgName, bg, min] of checks) {
  test(`${fgName} on ${bgName} reaches ${min}:1`, () => {
    const ratio = contrast(fg, bg);
    assert.ok(ratio >= min, `${fgName} on ${bgName} is only ${ratio.toFixed(2)}:1`);
  });
}

test("the aurora never gets brighter than the contrast checks above were tuned for", () => {
  assert.ok(token("aurora-teal").a <= 0.12 && token("aurora-blue").a <= 0.09 && token("aurora-star").a <= 0.08);
});
