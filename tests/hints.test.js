import { test } from "node:test";
import assert from "node:assert/strict";
import { parHint, postVictoryAction } from "../src/ui/hints.js";

test("a one-move par reads as a singular move", () => {
  assert.equal(parHint(1), "Par is 1 move. Every rotation counts.");
});

test("a multi-move par keeps the plural", () => {
  assert.equal(parHint(4), "Par is 4 moves. Every rotation counts.");
  assert.equal(parHint(13), "Par is 13 moves. Every rotation counts.");
});

test("invalid pars fall back to a readable phrase instead of NaN", () => {
  assert.equal(parHint(undefined), "Par is 0 moves. Every rotation counts.");
  assert.equal(parHint(-2), "Par is 0 moves. Every rotation counts.");
});

test("a completed chamber with a next level offers the next chamber", () => {
  assert.deepEqual(postVictoryAction({ next: "split-decision" }), {
    label: "Next chamber →",
    levelId: "split-decision",
  });
});

test("the finale offers the episode index instead of a missing next level", () => {
  assert.deepEqual(postVictoryAction({ next: null }), {
    label: "Episode index",
    screen: "chambers",
  });
});

test("no victory result has no post-victory action", () => {
  assert.equal(postVictoryAction(null), null);
});
