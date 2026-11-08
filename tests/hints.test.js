import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parHint,
  postVictoryAction,
  relayCtaLabel,
  restartPrompt,
  saveStatusMessage,
} from "../src/ui/hints.js";

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

test("a daily victory returns to the title instead of the campaign", () => {
  assert.deepEqual(postVictoryAction({ daily: true }), {
    label: "Back to title",
    screen: "title",
  });
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

test("a completed save reports the action's success copy", () => {
  assert.equal(saveStatusMessage(true, "Callsign saved."), "Callsign saved.");
});

test("a refused save reports that changes are not stored", () => {
  assert.equal(saveStatusMessage(false, "Callsign saved."), "Changes are not being stored.");
});

test("the title CTA invites a first run until every chamber is cleared", () => {
  assert.equal(relayCtaLabel(0, 18), "Enter the relay");
  assert.equal(relayCtaLabel(17, 18), "Enter the relay");
});

test("the title CTA becomes a replay at eighteen of eighteen", () => {
  assert.equal(relayCtaLabel(18, 18), "Replay the relay");
  assert.equal(relayCtaLabel(19, 18), "Replay the relay");
});

test("a zero total does not claim a replay", () => {
  assert.equal(relayCtaLabel(0, 0), "Enter the relay");
});

test("a one-move restart names the singular move and the chamber", () => {
  assert.deepEqual(restartPrompt("Split Decision", 1), {
    title: "Discard this run?",
    body: "You have made 1 move in Split Decision. Restarting returns every piece to its opening position.",
  });
});

test("a longer restart keeps the plural move count", () => {
  assert.equal(
    restartPrompt("The Confluence", 13).body,
    "You have made 13 moves in The Confluence. Restarting returns every piece to its opening position.",
  );
});

test("a restart prompt falls back for missing copy and invalid counts", () => {
  assert.deepEqual(restartPrompt("", -2), {
    title: "Discard this run?",
    body: "You have made 0 moves in this chamber. Restarting returns every piece to its opening position.",
  });
});
