import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BOARD_MIN_WIDTH,
  fitBoardWidth,
} from "../src/ui/layout.js";

const DEFAULTS = {
  availableHeight: 657,
  paddingX: 38,
  paddingY: 38,
  minWidth: BOARD_MIN_WIDTH,
  maxWidth: 640,
};

test("a tall 11x23 chamber shrinks to the slot instead of overflowing it", () => {
  const width = fitBoardWidth({ ...DEFAULTS, columns: 11, rows: 23 });
  assert.equal(width, 334);
  const boardHeight = ((width - DEFAULTS.paddingX) * 23) / 11;
  assert.ok(boardHeight + DEFAULTS.paddingY <= DEFAULTS.availableHeight);
});

test("a square chamber still uses the full board allowance", () => {
  const width = fitBoardWidth({ ...DEFAULTS, columns: 9, rows: 9 });
  assert.equal(width, 640);
});

test("a wide chamber is capped by the board allowance, not the height", () => {
  const width = fitBoardWidth({ ...DEFAULTS, columns: 21, rows: 7 });
  assert.equal(width, 640);
});

test("a short viewport keeps the minimum cell-friendly width", () => {
  const width = fitBoardWidth({
    ...DEFAULTS,
    columns: 11,
    rows: 23,
    availableHeight: 300,
  });
  assert.equal(width, BOARD_MIN_WIDTH);
});

test("the column width wins when it is narrower than the minimum", () => {
  const width = fitBoardWidth({
    ...DEFAULTS,
    columns: 11,
    rows: 23,
    maxWidth: 280,
  });
  assert.equal(width, 280);
});

test("invalid geometry falls back to the minimum width", () => {
  for (const patch of [
    { columns: 0 },
    { rows: 0 },
    { columns: Number.NaN },
    { availableHeight: Number.POSITIVE_INFINITY },
  ]) {
    assert.equal(fitBoardWidth({ ...DEFAULTS, columns: 11, rows: 23, ...patch }), BOARD_MIN_WIDTH);
  }
});
