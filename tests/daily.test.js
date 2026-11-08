import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DAILY_KEY,
  DAILY_VERSION,
  dailyDateLabel,
  dailyHistory,
  dailyLevelId,
  dailyLevelIdForKey,
  dailyStats,
  dailySummary,
  loadDaily,
  normalizeDaily,
  previousDateKey,
  recordDailyResult,
  saveDaily,
} from "../src/ui/daily.js";

function day(year, monthIndex, date) {
  return new Date(year, monthIndex, date, 12, 0, 0);
}

function fakeStorage(initial = null) {
  const data = new Map();
  if (initial !== null) {
    data.set(DAILY_KEY, initial);
  }
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
  };
}

test("the daily chamber follows local calendar days from the launch epoch", () => {
  assert.equal(dailyLevelId(day(2026, 0, 1)), "first-light");
  assert.equal(dailyLevelId(day(2026, 0, 2)), "split-decision");
  assert.equal(dailyLevelId(day(2026, 0, 19)), "first-light");
  assert.equal(dailyDateLabel(day(2026, 10, 8)), "08 NOV");
});

test("invalid dates fall back to the first chamber instead of throwing", () => {
  assert.equal(dailyLevelId(new Date(Number.NaN)), "first-light");
  assert.equal(dailyLevelIdForKey(""), "first-light");
  assert.equal(dailyLevelIdForKey("2026-02-31"), "first-light");
  assert.equal(previousDateKey("not-a-date"), "");
});

test("a first daily clear starts a one-day streak and stores the result", () => {
  const daily = recordDailyResult(normalizeDaily(null), "2026-01-01", "first-light", 1, 3);
  assert.deepEqual(daily.days["2026-01-01"], { moves: 1, stars: 3 });
  assert.deepEqual(daily.streak, { count: 1, last: "2026-01-01", best: 1 });
});

test("replaying a day keeps the better result but does not grow the streak", () => {
  let daily = recordDailyResult(normalizeDaily(null), "2026-01-01", "first-light", 2, 2);
  daily = recordDailyResult(daily, "2026-01-01", "first-light", 1, 3);
  daily = recordDailyResult(daily, "2026-01-01", "first-light", 4, 1);
  assert.deepEqual(daily.days["2026-01-01"], { moves: 1, stars: 3 });
  assert.deepEqual(daily.streak, { count: 1, last: "2026-01-01", best: 1 });
});

test("consecutive daily clears grow the streak", () => {
  let daily = recordDailyResult(normalizeDaily(null), "2026-01-01", "first-light", 1, 3);
  daily = recordDailyResult(daily, "2026-01-02", "split-decision", 2, 3);
  assert.deepEqual(daily.streak, { count: 2, last: "2026-01-02", best: 2 });
});

test("a missed day resets the streak to one", () => {
  let daily = recordDailyResult(normalizeDaily(null), "2026-01-01", "first-light", 1, 3);
  daily = recordDailyResult(daily, "2026-01-03", "mirror-maze", 3, 3);
  assert.deepEqual(daily.streak, { count: 1, last: "2026-01-03", best: 1 });
});

test("the all-time best streak survives a gap and a reset", () => {
  let daily = recordDailyResult(normalizeDaily(null), "2026-01-01", "first-light", 1, 3);
  daily = recordDailyResult(daily, "2026-01-02", "split-decision", 2, 3);
  daily = recordDailyResult(daily, "2026-01-03", "mirror-maze", 3, 3);
  daily = recordDailyResult(daily, "2026-01-05", "crossfire", 4, 3);
  assert.equal(daily.streak.count, 1);
  assert.equal(daily.streak.best, 3);
  assert.equal(dailyStats(daily).bestStreak, 3);
});

test("a streak stays alive until the end of the following day", () => {
  let daily = recordDailyResult(normalizeDaily(null), "2026-01-01", "first-light", 1, 3);
  daily = recordDailyResult(daily, "2026-01-02", "split-decision", 2, 3);
  assert.equal(dailySummary(daily, day(2026, 0, 2)).streak, 2);
  assert.equal(dailySummary(daily, day(2026, 0, 3)).streak, 2);
  assert.equal(dailySummary(daily, day(2026, 0, 4)).streak, 0);
});

test("a daily summary names the day's chamber, result and streak", () => {
  const daily = recordDailyResult(normalizeDaily(null), "2026-01-02", "split-decision", 2, 3);
  assert.deepEqual(dailySummary(daily, day(2026, 0, 2)), {
    date: "2026-01-02",
    levelId: "split-decision",
    label: "02 JAN",
    result: { moves: 2, stars: 3 },
    streak: 1,
    totalDays: 1,
  });
});

test("a corrupt or future daily record falls back safely", () => {
  assert.deepEqual(normalizeDaily({ version: 99, days: {} }), normalizeDaily(null));
  assert.deepEqual(normalizeDaily("nope"), normalizeDaily(null));
  const cleaned = normalizeDaily({
    version: DAILY_VERSION,
    days: {
      "2026-01-01": { moves: 1, stars: 3 },
      "2026-02-31": { moves: 1, stars: 3 },
      "2026-01-02": { moves: -1, stars: 3 },
      "2026-01-03": { moves: 2, stars: 0 },
    },
    streak: { count: 400, last: "2026-01-03" },
  });
  assert.deepEqual(Object.keys(cleaned.days), ["2026-01-01"]);
  assert.equal(cleaned.streak.count, 400);
  assert.equal(cleaned.streak.best, 400);
});

test("the daily store keeps the most recent sixty days", () => {
  const days = {};
  for (let index = 0; index < 65; index += 1) {
    const date = new Date(Date.UTC(2026, 0, 1) + index * 86400000);
    const key = date.toISOString().slice(0, 10);
    days[key] = { moves: 1, stars: 3 };
  }
  const daily = normalizeDaily({ version: 1, days, streak: { count: 1, last: "2026-03-06" } });
  const keys = Object.keys(daily.days);
  assert.equal(keys.length, 60);
  assert.equal(keys[0], "2026-01-06");
  assert.equal(keys[59], "2026-03-06");
});

test("the daily store saves, loads and refuses a future version", () => {
  const storage = fakeStorage();
  const daily = recordDailyResult(normalizeDaily(null), "2026-01-01", "first-light", 1, 3);
  assert.equal(saveDaily(storage, daily), true);
  assert.deepEqual(loadDaily(storage), daily);
  assert.deepEqual(loadDaily(fakeStorage("not json")), normalizeDaily(null));
  assert.equal(saveDaily(fakeStorage(JSON.stringify({ version: 2 })), daily), false);
});

test("dailyStats counts played days and the longest consecutive run", () => {
  let daily = normalizeDaily(null);
  daily = recordDailyResult(daily, "2026-01-01", "first-light", 1, 3);
  daily = recordDailyResult(daily, "2026-01-02", "split-decision", 2, 3);
  daily = recordDailyResult(daily, "2026-01-03", "mirror-maze", 3, 3);
  daily = recordDailyResult(daily, "2026-01-05", "crossfire", 4, 3);
  assert.deepEqual(dailyStats(daily), { totalDays: 4, bestStreak: 3 });
});

test("a stored streak remains the best streak after old days are pruned", () => {
  const daily = normalizeDaily({
    version: 1,
    days: { "2026-01-01": { moves: 1, stars: 3 } },
    streak: { count: 12, last: "2026-01-01" },
  });
  assert.deepEqual(dailyStats(daily), { totalDays: 1, bestStreak: 12 });
});

test("the daily history shows seven chronological played flags", () => {
  let daily = normalizeDaily(null);
  daily = recordDailyResult(daily, "2026-01-01", "first-light", 1, 3);
  daily = recordDailyResult(daily, "2026-01-03", "mirror-maze", 3, 3);
  daily = recordDailyResult(daily, "2026-01-07", "double-down", 4, 3);
  const history = dailyHistory(daily, day(2026, 0, 7));
  assert.equal(history.length, 7);
  assert.deepEqual(
    history.map((entry) => [entry.key, entry.played, entry.today]),
    [
      ["2026-01-01", true, false],
      ["2026-01-02", false, false],
      ["2026-01-03", true, false],
      ["2026-01-04", false, false],
      ["2026-01-05", false, false],
      ["2026-01-06", false, false],
      ["2026-01-07", true, true],
    ],
  );
});

test("the daily history clamps an invalid length to one day", () => {
  const history = dailyHistory(normalizeDaily(null), day(2026, 0, 7), 0);
  assert.equal(history.length, 1);
  assert.equal(history[0].today, true);
  assert.equal(history[0].played, false);
});
