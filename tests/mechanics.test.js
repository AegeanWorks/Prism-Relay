import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLevel } from "../src/game/engine.js";
import { levelById } from "../src/game/levels.js";
import { mechanicNotes } from "../src/ui/mechanics.js";

function notesFor(id) {
  return mechanicNotes(parseLevel(levelById(id)));
}

test("a prism-only chamber teaches the pass-through fan", () => {
  const notes = notesFor("split-decision");
  assert.equal(notes.length, 1);
  assert.equal(notes[0].name, "Prism");
  assert.match(notes[0].text, /passes the beam through/);
  assert.match(notes[0].text, /both perpendicular sides/);
});

test("the vault keeps the prism lesson", () => {
  assert.deepEqual(notesFor("the-vault").map((note) => note.name), ["Prism"]);
});

test("a splitter chamber teaches the fork instead of the prism", () => {
  const notes = notesFor("double-down");
  assert.deepEqual(notes.map((note) => note.name), ["Splitter"]);
});

test("a portal chamber keeps the splitter and portal notes", () => {
  assert.deepEqual(notesFor("wormhole").map((note) => note.name), ["Splitter", "Portal"]);
});

test("combo chambers do not add a third prism note", () => {
  assert.deepEqual(notesFor("the-confluence").map((note) => note.name), ["Splitter", "Portal"]);
});

test("a plain chamber has no mechanic note", () => {
  assert.deepEqual(notesFor("first-light"), []);
});
