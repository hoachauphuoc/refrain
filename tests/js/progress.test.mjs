// The pure helpers in static/js/progress.js.
// Run with: node --test "tests/js/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { planFrom, RING, RING_LENGTH, starPoint } from "../../static/js/progress.js";

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
