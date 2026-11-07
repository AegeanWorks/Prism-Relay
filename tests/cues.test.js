import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createSession,
  parseLevel,
  refreshSession,
  rotateSessionCell,
  traceBeams,
} from "../src/game/engine.js";
import { levelById } from "../src/game/levels.js";
import { feedbackFor, livePortalPairs, newlyLitKeys, portalTransitKey } from "../src/ui/cues.js";

test("a segment that ends on a portal identifies the transit gate", () => {
  const board = parseLevel({ id: "portal", rows: [">.1T", "..1."] });
  assert.equal(portalTransitKey(board, traceBeams(board).paths), "2,0");
});

test("a beam that never reaches a gate has no portal transit", () => {
  const board = parseLevel({ id: "straight", rows: [">..T"] });
  assert.equal(portalTransitKey(board, traceBeams(board).paths), "");
});

test("two clearing gates report both portal cells", () => {
  const session = createSession(levelById("crosscurrent"));
  rotateSessionCell(session, 2, 3);
  assert.equal(portalTransitKey(session.board, session.paths), "13,5|2,5");
});

test("detour's splitter flip routes the beam through gate 2", () => {
  const session = createSession(levelById("detour"));
  assert.equal(portalTransitKey(session.board, session.paths), "");
  rotateSessionCell(session, 2, 3);
  assert.equal(portalTransitKey(session.board, session.paths), "2,5");
});

test("a live entry gate marks its whole pair, not just the entry", () => {
  const session = createSession(levelById("long-way-home"));
  refreshSession(session);
  assert.deepEqual(livePortalPairs(session.board, session.paths), ["1"]);
});

test("a new transit adds its pair without dropping the existing one", () => {
  const session = createSession(levelById("the-confluence"));
  refreshSession(session);
  assert.deepEqual(livePortalPairs(session.board, session.paths), ["2"]);
  rotateSessionCell(session, 2, 3);
  assert.deepEqual(livePortalPairs(session.board, session.paths), ["1", "2"]);
});

test("a gate pair with no beam is not live", () => {
  const session = createSession(levelById("relay-chain"));
  refreshSession(session);
  assert.deepEqual(livePortalPairs(session.board, session.paths), []);
});

test("a rise in charged receivers is a charge event", () => {
  assert.deepEqual(
    feedbackFor({ lit: 0, portalKey: "" }, { lit: 1, portalKey: "" }),
    { charge: true, portal: false },
  );
});

test("a changed portal transit is a portal event even without a receiver", () => {
  assert.deepEqual(
    feedbackFor({ lit: 0, portalKey: "" }, { lit: 0, portalKey: "2,5" }),
    { charge: false, portal: true },
  );
});

test("losing a portal transit is still a portal event", () => {
  assert.deepEqual(
    feedbackFor({ lit: 0, portalKey: "2,5" }, { lit: 0, portalKey: "" }),
    { charge: false, portal: true },
  );
});

test("one rotation can report both consequences", () => {
  assert.deepEqual(
    feedbackFor({ lit: 1, portalKey: "2,5" }, { lit: 2, portalKey: "3,5" }),
    { charge: true, portal: true },
  );
});

test("no change produces no cue", () => {
  assert.deepEqual(
    feedbackFor({ lit: 1, portalKey: "2,5" }, { lit: 1, portalKey: "2,5" }),
    { charge: false, portal: false },
  );
});

test("newly lit receivers are the keys added since the previous trace", () => {
  assert.deepEqual(newlyLitKeys(new Set(), new Set(["1,1", "2,2"])), ["1,1", "2,2"]);
  assert.deepEqual(newlyLitKeys(new Set(["1,1"]), new Set(["1,1", "2,2"])), ["2,2"]);
});

test("removed receivers are not newly lit", () => {
  assert.deepEqual(newlyLitKeys(new Set(["1,1", "2,2"]), new Set(["2,2"])), []);
  assert.deepEqual(newlyLitKeys(new Set(["1,1"]), new Set(["1,1"])), []);
});

test("missing state is treated as empty instead of throwing", () => {
  assert.deepEqual(feedbackFor(undefined, { lit: 1 }), { charge: true, portal: false });
  assert.deepEqual(feedbackFor({ lit: 1 }, undefined), { charge: false, portal: false });
});
