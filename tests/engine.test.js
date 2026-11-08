import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EAST,
  NORTH,
  SOUTH,
  WEST,
  cellNear,
  createSession,
  parseLevel,
  refreshSession,
  resetSession,
  rotateSessionCell,
  starsFor,
  traceBeams,
  undoSession,
} from "../src/game/engine.js";
import {
  EPISODES,
  LEVELS,
  TOTAL_LEVELS,
  TOTAL_STARS,
  episodeForLevel,
  levelById,
  levelsForEpisode,
  nextLevel,
} from "../src/game/levels.js";
import { applySolution, solveLevel } from "../src/game/solver.js";

function level(rows, par = 0) {
  return {
    id: "test",
    name: "Test",
    rows,
    par,
  };
}

test("a straight beam lights a receiver", () => {
  const board = parseLevel(level([">..T"]));
  const trace = traceBeams(board);
  assert.equal(trace.complete, true);
  assert.equal(trace.litCount, 1);
});

test("a slash mirror reflects east to north", () => {
  const board = parseLevel(level(["..T", ">./"]));
  const trace = traceBeams(board);
  assert.equal(trace.complete, true);
});

test("a backslash mirror reflects east to south", () => {
  const board = parseLevel(level([">.\\", "...", "..T"]));
  const trace = traceBeams(board);
  assert.equal(trace.complete, true);
});

test("rotating flips a mirror between both diagonals", () => {
  const session = createSession(level([">.\\", "...", "..T"]));
  assert.equal(session.board.mirrors[0].orientation, 1);
  assert.equal(rotateSessionCell(session, 2, 0), true);
  assert.equal(session.board.mirrors[0].orientation, 0);
  assert.equal(session.moves, 1);
});

test("cells without a rotatable piece cannot rotate", () => {
  const session = createSession(level([">..T"]));
  assert.equal(rotateSessionCell(session, 0, 0), false);
  assert.equal(rotateSessionCell(session, 3, 0), false);
  assert.equal(session.moves, 0);
});

test("undo restores the last rotation, refunds the move and clears completion", () => {
  const session = createSession(level(["..T", ">.\\", "..."], 1));
  refreshSession(session);
  assert.equal(session.complete, false);
  assert.equal(rotateSessionCell(session, 2, 1), true);
  assert.equal(session.board.mirrors[0].orientation, 0);
  assert.equal(session.moves, 1);
  assert.equal(session.complete, true);
  assert.equal(undoSession(session), true);
  assert.equal(session.board.mirrors[0].orientation, 1);
  assert.equal(session.moves, 0);
  assert.equal(session.complete, false);
  assert.equal(session.stars, 0);
});

test("undo on an empty history is a no-op", () => {
  const session = createSession(level([">..T"]));
  assert.equal(undoSession(session), false);
  assert.equal(session.moves, 0);
});

test("reset clears the undo history", () => {
  const session = createSession(level([">.\\", "...", "..T"]));
  rotateSessionCell(session, 2, 0);
  assert.equal(session.history.length, 1);
  resetSession(session);
  assert.equal(session.history.length, 0);
  assert.equal(undoSession(session), false);
});

test("cellNear resolves a beam endpoint to its tile and rejects open space", () => {
  const board = parseLevel(level([">.T", "..."]));
  assert.equal(cellNear(board, { x: 1.5, y: 0.5 }), board.cells[0][1]);
  assert.equal(cellNear(board, { x: 3.5, y: 0.5 }), null);
});

test("walls stop a beam", () => {
  const board = parseLevel(level([">.#T"]));
  const trace = traceBeams(board);
  assert.equal(trace.complete, false);
});

test("a prism splits a beam into perpendicular branches", () => {
  const board = parseLevel(level([".T.", ">*.", ".T."]));
  const trace = traceBeams(board);
  assert.equal(trace.complete, true);
  assert.ok(trace.paths.length >= 2);
});

test("a splitter passes the beam and forks a copy to the selected side", () => {
  const board = parseLevel(level([">ST", ".T."]));
  assert.equal(board.splitters.length, 1);
  assert.equal(board.rotatables.length, 1);
  const trace = traceBeams(board);
  assert.equal(trace.complete, true);
  assert.equal(trace.litCount, 2);
});

test("flipping a splitter changes which side receives the fork", () => {
  const session = createSession(level([">ZT", ".T."]));
  assert.equal(session.complete, false);
  assert.equal(rotateSessionCell(session, 1, 0), true);
  assert.equal(session.board.splitters[0].orientation, 0);
  assert.equal(session.complete, true);
  assert.equal(session.moves, 1);
});

test("paired portals carry a beam across the grid in the same direction", () => {
  const board = parseLevel(level([">1.1T"]));
  assert.equal(board.portals.length, 2);
  const trace = traceBeams(board);
  assert.equal(trace.complete, true);
  assert.equal(trace.paths.length, 2);
});

test("converging emitters keep independent portal continuations", () => {
  const board = parseLevel(level([">1T", ">.1"]));
  const trace = traceBeams(board);
  assert.equal(trace.complete, true);
  assert.equal(trace.litCount, 1);
  assert.equal(trace.paths.length, 4);
});

test("portal pairs must have exactly two endpoints", () => {
  assert.throws(() => parseLevel(level([">1.T"])), /exactly two portals/);
  assert.throws(() => parseLevel(level([">1.1.1T"])), /exactly two portals/);
});

test("a mirror loop terminates", () => {
  const board = parseLevel(level(["./\\", ">*/", "T.."]));
  const trace = traceBeams(board);
  assert.equal(trace.complete, false);
  assert.ok(trace.paths.length > 0);
});

test("session completion records stars and reset restores the level", () => {
  const source = level(["..T", ">.\\", "..."], 1);
  const session = createSession(source);
  refreshSession(session);
  assert.equal(session.complete, false);
  rotateSessionCell(session, 2, 1);
  assert.equal(session.complete, true);
  assert.equal(session.stars, 3);
  resetSession(session);
  assert.equal(session.moves, 0);
  assert.equal(session.complete, false);
  assert.equal(session.board.mirrors[0].orientation, 1);
  assert.equal(session.paths.length, 1);
});

test("stars award three at par, two within two moves, else one", () => {
  assert.equal(starsFor(3, 3), 3);
  assert.equal(starsFor(4, 3), 2);
  assert.equal(starsFor(5, 3), 2);
  assert.equal(starsFor(6, 3), 1);
});

test("every shipped level is rectangular, unique and solvable at its par", () => {
  assert.equal(LEVELS.length, 18);
  assert.equal(TOTAL_LEVELS, 18);
  assert.equal(TOTAL_STARS, 54);
  assert.equal(EPISODES.length, 4);
  assert.equal(new Set(LEVELS.map((entry) => entry.id)).size, LEVELS.length);
  for (const entry of LEVELS) {
    const board = parseLevel(entry);
    assert.ok(board.rotatables.length > 0, `${entry.id} has a move`);
    assert.ok(board.rotatables.length <= 20, `${entry.id} fits the solver cap`);
    const solution = solveLevel(entry);
    assert.ok(solution, `${entry.id} is solvable`);
    assert.equal(solution.moves, entry.par, `${entry.id} par is the shortest solution`);
    const trace = applySolution(entry, solution.orientations);
    assert.equal(trace.complete, true, `${entry.id} solution completes`);
    if (entry.solution) {
      assert.equal(entry.solution.length, board.rotatables.length, `${entry.id} embedded solution covers every rotatable`);
      const embedded = applySolution(entry, [...entry.solution]);
      assert.equal(embedded.complete, true, `${entry.id} embedded solution completes`);
      const initial = board.rotatables.map((piece) => piece.orientation);
      const embeddedMoves = entry.solution.filter((orientation, index) => orientation !== initial[index]).length;
      assert.equal(embeddedMoves, entry.par, `${entry.id} embedded solution is optimal`);
    }
    const twice = [traceBeams(parseLevel(entry)), traceBeams(parseLevel(entry))];
    assert.deepEqual([...twice[0].lit].sort(), [...twice[1].lit].sort(), `${entry.id} traces deterministically`);
  }
  assert.ok(EPISODES[1].levels.some((entry) => parseLevel(entry).splitters.length > 0));
  assert.ok(EPISODES[2].levels.every((entry) => parseLevel(entry).portals.length >= 2));
  assert.ok(EPISODES[2].levels.at(-1).par > EPISODES[1].levels.at(-1).par);
  assert.equal(EPISODES[3].id, "confluence");
  assert.equal(EPISODES[3].levels.length, 5);
  assert.ok(EPISODES[3].levels.every((entry) => parseLevel(entry).portals.length >= 2));
  const pars = EPISODES[3].levels.map((entry) => entry.par);
  assert.deepEqual(pars, [...pars].sort((a, b) => a - b), "confluence pars climb without cliffs");
});

test("episode helpers resolve levels and their order", () => {
  assert.equal(episodeForLevel("double-down").id, "refraction");
  assert.equal(levelsForEpisode("crossing").length, 3);
  assert.equal(levelsForEpisode("confluence").length, 5);
  assert.equal(levelsForEpisode("missing").length, 0);
  assert.equal(nextLevel("the-vault").id, "double-down");
  assert.equal(nextLevel("long-way-home").id, "detour");
  assert.equal(nextLevel("the-confluence"), null);
  assert.equal(episodeForLevel("detour").id, "confluence");
  assert.equal(episodeForLevel("the-confluence").id, "confluence");
  assert.equal(episodeForLevel("missing"), null);
});

test("levelById finds a level and returns null for unknown ids", () => {
  assert.equal(levelById("first-light").name, "First Light");
  assert.equal(levelById("missing"), null);
});

test("directions are stable for renderer and serializer", () => {
  assert.deepEqual([NORTH, EAST, SOUTH, WEST], [0, 1, 2, 3]);
});
