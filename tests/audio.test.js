import { test } from "node:test";
import assert from "node:assert/strict";
import {
  duckMusic,
  isEnabled,
  isMusicEnabled,
  isMusicPlaying,
  musicLevel,
  playCharge,
  playError,
  playPortal,
  playRotate,
  playSplit,
  playUi,
  playVictory,
  setEnabled,
  setMusicEnabled,
  startMusic,
  stopMusic,
} from "../src/ui/audio.js";

test("audio toggles report state and silence cleanly without a browser context", () => {
  setEnabled(true);
  setMusicEnabled(true);
  assert.equal(isEnabled(), true);
  assert.equal(isMusicEnabled(), true);
  setEnabled(false);
  assert.equal(isEnabled(), false);
  setEnabled(true);
  setMusicEnabled(false);
  assert.equal(isMusicEnabled(), false);
  setMusicEnabled(true);
});

test("all synthesized cues no-throw without an AudioContext", () => {
  setEnabled(true);
  setMusicEnabled(true);
  assert.doesNotThrow(() => {
    playRotate();
    playSplit();
    playCharge();
    playPortal();
    playUi();
    playError();
    playVictory();
  });
  setEnabled(false);
  assert.doesNotThrow(() => {
    playRotate();
    playVictory();
  });
  setEnabled(true);
});

test("music start/stop is a safe no-op without an AudioContext", () => {
  setMusicEnabled(true);
  startMusic();
  assert.equal(isMusicPlaying(), false);
  assert.equal(musicLevel(), null);
  assert.doesNotThrow(() => stopMusic());
  assert.equal(isMusicPlaying(), false);
  setMusicEnabled(false);
  startMusic();
  assert.equal(isMusicPlaying(), false);
  setMusicEnabled(true);
});

test("duckMusic is a safe no-op without an AudioContext", () => {
  assert.equal(musicLevel(), null);
  assert.doesNotThrow(() => duckMusic());
  assert.doesNotThrow(() => duckMusic(0.01, 0.5));
});
