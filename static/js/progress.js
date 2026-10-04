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
