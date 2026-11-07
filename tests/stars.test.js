import { test } from "node:test";
import assert from "node:assert/strict";
import { starLabel, starsMarkup } from "../src/ui/stars.js";

function count(markup, pattern) {
  return (markup.match(pattern) ?? []).length;
}

test("earned stars are filled and unearned stars are outlined", () => {
  const markup = starsMarkup(2);
  assert.equal(count(markup, /is-earned/g), 2);
  assert.equal(count(markup, /★/g), 2);
  assert.equal(count(markup, /☆/g), 1);
});

test("three stars fills every glyph", () => {
  const markup = starsMarkup(3);
  assert.equal(count(markup, /★/g), 3);
  assert.equal(count(markup, /☆/g), 0);
});

test("zero stars outlines every glyph", () => {
  const markup = starsMarkup(0);
  assert.equal(count(markup, /is-earned/g), 0);
  assert.equal(count(markup, /★/g), 0);
  assert.equal(count(markup, /☆/g), 3);
});

test("star labels describe the count", () => {
  assert.equal(starLabel(0), "No stars yet");
  assert.equal(starLabel(1), "1 of 3 stars");
  assert.equal(starLabel(2), "2 of 3 stars");
  assert.equal(starLabel(3), "3 of 3 stars");
});
