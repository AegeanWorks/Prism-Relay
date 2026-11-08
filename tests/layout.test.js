import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BOARD_MIN_WIDTH,
  fitBoardWidth,
  wideBoardNeedsPan,
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

test("a wide board pans when 28px cells exceed the viewport", () => {
  assert.equal(
    wideBoardNeedsPan({ columns: 21, rows: 7, viewportWidth: 340 }),
    true,
  );
  assert.equal(
    wideBoardNeedsPan({ columns: 21, rows: 7, viewportWidth: 611 }),
    false,
  );
});

test("tall and square boards never need horizontal panning", () => {
  assert.equal(
    wideBoardNeedsPan({ columns: 11, rows: 23, viewportWidth: 340 }),
    false,
  );
  assert.equal(
    wideBoardNeedsPan({ columns: 9, rows: 9, viewportWidth: 340 }),
    false,
  );
});

test("invalid pan geometry stays unpanned", () => {
  assert.equal(
    wideBoardNeedsPan({ columns: 21, rows: 7, viewportWidth: Number.NaN }),
    false,
  );
  assert.equal(wideBoardNeedsPan({ columns: 0, rows: 7, viewportWidth: 340 }), false);
});

test("a 23-row phone board fits at the 24px cell floor", () => {
  const frameX = 18;
  const frameY = 18;
  const available = 581;
  const width = fitBoardWidth({
    columns: 11,
    rows: 23,
    availableHeight: available,
    paddingX: frameX,
    paddingY: frameY,
    minWidth: 11 * 24 + frameX,
    maxWidth: 358,
  });
  assert.equal(width, 287);
  assert.ok((width - frameX) / 11 >= 24);
  assert.ok(((width - frameX) * 23) / 11 + frameY <= available);
});

test("the 24px floor is kept when the height cannot fit", () => {
  const frameX = 18;
  const frameY = 18;
  const available = 267;
  const width = fitBoardWidth({
    columns: 11,
    rows: 23,
    availableHeight: available,
    paddingX: frameX,
    paddingY: frameY,
    minWidth: 11 * 24 + frameX,
    maxWidth: 288,
  });
  assert.equal(width, 282);
  assert.equal((width - frameX) / 11, 24);
  assert.ok(((width - frameX) * 23) / 11 + frameY > available);
});
