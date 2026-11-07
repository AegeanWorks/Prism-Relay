# Prism Relay Improvement Cycles

Append-only record of continuous improvement cycles. Each entry states the area, the evidence found,
what was killed, the exact fix, the before/after proof, the played run, and the gate results.
Screenshots and generated reports live in the local, git-ignored `.review/cycles/<cycle>/` folder.

## Area rotation

| Cycle | Area | Status |
|---|---|---|
| 01 | Levels / tall-chamber presentation | done |
| 02 | Audio cues | done |
| 03 | Graphics and effects / portal legibility | done |
| 04 | UI readability / compact HUD | done |
| 05 | Progression and saves / future-version preservation | done |
| 06 | Game feel / post-victory flow | done |
| 07 | Progression UX / honest save status | done |
| 08 | Game feel / live star pace | done |
| 09 | Accessibility / star state without color | done |
| 10 | Game feel / receiver charge impact | done |
| 11 | Levels / prism onboarding | done |
| 12 | UI readability / mobile modal actions | done |
| 13 | Progression UX / rank progress | done |
| 14 | Game feel / last-move marker | done |
| 15 | UI readability / endgame CTA | done |
| 16 | Audio / victory music ducking | done |
| 17 | Audio / menu interaction cue | next |

---

## Cycle 01 - Tall chambers fit the desktop viewport

**Date**: 2026-11-07

### FIND

Defect: the chamber index and game screen cap board width (`--board-max: 640px`) but never consider
viewport height, so tall levels turn into page scroll. The 11x23 finale, The Confluence, rendered a
1297px-tall board frame starting at y=187 in a 900px viewport. Only 55% of the relay was visible and
the player could not see both ends of a beam while rotating pieces. At 1280x720 only 37% was visible.

Evidence (fresh headless Edge, `/?level=the-confluence`, 1440x900): frame `[228, 187, 640, 1297]`,
board `[247, 206, 602, 1259]`, `scrollHeight=1617`; 1280x720: frame height 1297, viewport 720.
Baseline report: `.review/cycles/cycle-01/before-fit-report.json`.

### ANALYZE

- Survivor: fit the board to the visible game area using the chamber's aspect ratio. It is measurable
  in a screenshot pair and in the scripted playthrough, and it changes only layout.
- Survivor: keep the 24px dense-cell floor. The widest tall chamber has 11 columns, so the floor is
  `11 * 24 + 36 padding + 2 border = 302px`; 304px leaves rounding slack.
- Killed: changing level data or adding a new camera/zoom control. Neither is needed; the content is
  correct and the board is the only overflow.
- Killed: shrinking mobile layouts. Compact screens already use the full column width and scroll
  vertically; the desktop-only fit avoids making phone cells smaller.

### IMPLEMENT

Failing-first: `tests/layout.test.js` added six cases for a new pure module; the test failed with
`ERR_MODULE_NOT_FOUND` before implementation.

Files:
- `src/ui/layout.js` (new): `fitBoardWidth({columns, rows, availableHeight, paddingX, paddingY,
  minWidth, maxWidth})`; solves `width = (availableHeight - paddingY) * columns / rows + paddingX`,
  clamps to `[minWidth, maxWidth]`, and returns `minWidth` for invalid geometry.
- `src/ui/app.js`: on layouts wider than 900px, reset the frame width, measure its CSS allowance and
  its accumulated document `offsetTop` (not `getBoundingClientRect().top`, because the screen-in
  transform adds 14px on the first frame), then apply the fitted width. Recompute on `resize` through
  one coalesced `requestAnimationFrame`. Compact layouts keep 100% width.
- `tests/layout.test.js` (new): tall 11x23 fit, square full allowance, wide cap, short-viewport floor,
  narrow-column override, invalid geometry.
- `README.md`: tree entries and the "Tall chambers fit the screen" design decision.
- `.aikit/decisions.md`: ADR-009.

No engine, level, save-format or UI-inventory handle changed.

### PROOF

Same setup for every pair: headless Microsoft Edge 157.0.4341.42 via Playwright, fresh browser
context and empty `localStorage`, URL `/?level=the-confluence`, viewport exactly as named.

| Pair | Before | After |
|---|---|---|
| 1440x900 | `.review/cycles/cycle-01/before-confluence-1440x900.png` | `.review/cycles/cycle-01/after-confluence-1440x900.png` |
| 1280x720 | `.review/cycles/cycle-01/before-confluence-1280x720.png` | `.review/cycles/cycle-01/after-confluence-1280x720.png` |

Measured geometry (same report, `.review/cycles/cycle-01/after-fit-report.json`):

- 1440x900 Confluence: frame width 640 to 334, frame height 1297 to 657, frame bottom 1484 to 844
  (inside the 900px viewport), cell size 54.7px to 26.9px (above the 24px floor). Whole relay visible.
- 1280x720 Confluence: frame width 640 to 304, height 1297 to 594, bottom 1479 to 777, cells 24.2px.
  Board overflow below the fold drops from 759px to 57px, the minimum possible with the 24px cell
  floor; the page still scrolls 438px because the right-hand objective panel is taller than the viewport.
- 1440x900 controls unchanged: first-light 640px/86px cells, wormhole 640px/66.9px cells,
  crosscurrent 640px/28.7px cells. Only the tall chamber changes.

Played run (scripted real browser, DOM clicks through actual board buttons, not engine calls):
`python scratch/prism_play.py scratch/prism-play-after` solved all 18 chambers at 3 stars with exact
par, 0 console errors. The Confluence: 13 clicks, 13 moves, 6/6 receivers, 3 stars, victory modal.
Report: `.review/cycles/cycle-01/play-report-1440x900.json`. A second run at 1280x720 solved The
Confluence with the same 13 clicks/13 moves/3 stars and 0 console errors:
`.review/cycles/cycle-01/play-report-confluence-1280x720.json`.

Responsive probe: in-game 1440x900 (334px) to 1280x720 (304px) refits on resize; resizing while the
profile screen hides the game (stays 304px) and returning at 1920x1080 refits to 419px with the frame
bottom at 1024 inside the 1080px viewport.

### GATES

- `npm test` -> 62 tests, 62 pass, 0 fail (was 56; six new layout cases). Duration ~1.7s.
- `python aikit.py check prism-relay` -> 5/5 gates passed:
  test PASS (1.2s), mechanics PASS (0.9s), hygiene PASS (0.5s), guidelines PASS (0.9s), secrets PASS (0.7s).
- `npm run ui:snapshot` -> marker list unchanged; no new `data-ui`, `data-panel` or `data-cue` entries.
- `node --check src/ui/app.js`, `node --check src/ui/layout.js` -> syntax ok.
- Playwright reports: 18/18 levels ok, 0 page errors, 0 console errors.

Commit: `feat(levels): fit tall chambers to the desktop viewport` (code, tests, README, ADR, ledger).

---

## Cycle 02 - Audio cues for beam-state changes

**Date**: 2026-11-07

### FIND

Defect: the two most important consequences of a rotation were silent. An instrumented real click on
Split Decision (rotate mirror 4,2; receivers 0/2 to 1/2) produced only the 660Hz rotate tone; a real
click on Detour (flip splitter 2,3, which routes the beam through portal 2) produced only the
520/780Hz splitter pair. `audio.js` already exported `playPortal()` and `audio.test.js` covered it,
but no application code ever called it. The player hears the action, not what it did.

Baseline report: `.review/cycles/cycle-02/before-audio-report.json`; tones were counted by wrapping
`AudioContext.prototype.createOscillator` in the page and logging each oscillator's scheduled
frequency during a real Playwright click.

### ANALYZE

- Survivor: derive cues from the beam state before and after the rotation, so the cue always matches
  what actually changed and no engine rewrite is needed.
- Survivor: layer consequence cues over the existing action sound; replacing the rotate/split click
  would lose the tactile response.
- Survivor: reuse the already-shipped portal sweep instead of adding another sound.
- Killed: playing a cue per portal segment per frame. That would machine-gun on every render and is
  not tied to user action.
- Killed: a visual change. This cycle is audio-only; no screenshot pair is claimed for it.
- Killed: charging the cue on receiver loss. A charge cue means progress; disconnects stay silent.

### IMPLEMENT

Failing-first: `tests/cues.test.js` failed with `ERR_MODULE_NOT_FOUND` before `src/ui/cues.js` existed.

Files:
- `src/game/engine.js`: export the existing geometry helper `cellNear(board, point)` so the cue layer
  can resolve a beam endpoint without duplicating tile math; `app.js` now imports it.
- `src/ui/cues.js` (new): `portalTransitKey(board, paths)` returns the sorted portal cells where beam
  segments end; `feedbackFor(before, after)` reports `{charge, portal}` from the lit-receiver count and
  the transit key.
- `src/ui/audio.js`: new `playCharge()` at 880Hz then 1318.5Hz, low gain, layered after the action.
- `src/ui/app.js`: capture `{lit, portalKey}` before rotating; after rotating, play `playCharge()` on a
  receiver rise and `playPortal()` when the transit signature changes.
- `tests/cues.test.js` (new, 10 cases), `tests/engine.test.js` (cellNear), `tests/audio.test.js`
  (playCharge no-throw).
- `README.md`, `.aikit/decisions.md` ADR-010.

### PROOF

Played runs with the same setup: headless Edge 157, 1440x900, music disabled in the seeded save so the
pad oscillators cannot pollute the count, one real pointer click on the named board button.

| Played click | State change | Before tones | After tones |
|---|---|---|---|
| Split Decision mirror (4,2) | receivers 0/2 to 1/2 | `[660]` | `[660, 880, 1318.5]` |
| Detour splitter (2,3) | portal transit `""` to `2,5` | `[520, 780]` | `[520, 780, 330, 660]` |
| Wormhole mirror (7,1) | receivers 0/3 to 1/3, no gate change | `[660]` | `[660, 880, 1318.5]` |

The third case proves the charge cue is tied to receiver progress and does not fire a portal sweep
when the transit signature did not change. Reports: `.review/cycles/cycle-02/before-audio-report.json`
and `.review/cycles/cycle-02/after-audio-report.json`.

State screenshots (audio-only, so these are not a visual-change claim; they show the identical board
state on both builds): `.review/cycles/cycle-02/before-receiver-charge-after-click.png` and
`receiver-charge-after-click.png` (1/2 receivers), `before-portal-transit-after-click.png` and
`portal-transit-after-click.png` (0/2 receivers, beam through gate 2), plus the Wormhole plain case.

Full regression play: all 18 chambers solved through real DOM clicks at exact par with 3 stars, 0
console errors and 0 page errors. The Confluence 13 moves, Crosscurrent 9, Long Way Home 13. Report:
`.review/cycles/cycle-02/play-report-1440x900.json`.

### GATES

- `npm test` -> 73 tests, 73 pass, 0 fail (was 62; +10 cue cases, +1 cellNear case).
- `python aikit.py check prism-relay` -> 5/5 gates passed: test, mechanics, hygiene, guidelines, secrets.
- `npm run ui:snapshot` -> inventory unchanged; no new UI handle.
- `node --check src/ui/app.js`, `src/ui/cues.js`, `src/game/engine.js` -> syntax ok.
- Playwright root run: 18/18 levels ok, 0 page errors, 0 console errors.

Commit: `feat(audio): report receiver charges and portal transits`.

---

## Cycle 03 - Graphics and effects: live portal pair legibility

**Date**: 2026-11-07

### FIND

Defect: portal gates all rendered at full brightness whether or not the beam used them, and pairs 1,
2 and 4 all used lime. In Long Way Home the live pair 1 and the idle pair 3 were visually identical;
in The Confluence the live pair 2 looked exactly like idle pairs 1 and 4. With four pairs in the
finale, the gate number was the only clue.

Evidence: `.review/cycles/cycle-03/before-long-way-home-board.png` (pairs 1 and 3 both bright) and
`.review/cycles/cycle-03/before-the-confluence-board.png` (pair 2 live but same lime as idle 1/4).
Captured on the cycle-02 build, 1440x900, device scale 2, `?level=<id>`, fresh storage.

### ANALYZE

- Survivor: derive the live pair set from the existing trace (entry gate to pair), then style both
  gates of that pair. It is tied to the actual beam and needs no engine change.
- Survivor: give all four pairs distinct colors. This fixes the 1/2/4 collision independent of the
  live state.
- Survivor: dim idle gates and keep live gates at full glow with a ring. The difference survives a
  still screenshot and a reduced-motion setting.
- Killed: a per-frame particle burst. It would not survive a still pair and would add animation cost
  to every re-render.
- Killed: adding a new panel or legend row. The legend already explains portals; the board itself is
  the right place to read liveness.
- Killed: changing the pair numbers or level data. Both are correct; only the presentation was flat.

### IMPLEMENT

Failing-first: `tests/cues.test.js` imported `livePortalPairs` before it existed (module import failed).

Files:
- `src/ui/cues.js`: new `livePortalPairs(board, paths)` that expands each entry gate from
  `portalTransitKey` to its pair label.
- `src/ui/app.js`: `updateBoard` computes the live set from the trace, toggles `is-live` on both gate
  cells and appends "The beam is passing through this pair." to the accessible label.
- `src/styles.css`: pair colors (1 lime, 2 cyan, 3 magenta, 4 gold), idle dim (0.55 opacity, 0.6
  saturation), live drop shadow, breathing `::after` ring, `portal-ring` keyframes, forced-colors
  Highlight border.
- `tests/cues.test.js`: three live-pair cases (pair expansion, added pair, no transit).
- `README.md`, `.aikit/decisions.md` ADR-011.

No engine, level, save, interaction or UI-inventory handle changed.

### PROOF

Same setup for both pairs: headless Edge 157, 1440x900, device scale 2 for board crops, fresh browser
context and storage, URL `/?level=<id>`.

| Pair | Before | After |
|---|---|---|
| Long Way Home, initial (pair 1 live, pair 3 idle) | `.review/cycles/cycle-03/before-long-way-home-board.png` | `.review/cycles/cycle-03/after-long-way-home-board.png` |
| The Confluence, initial (pair 2 live, 1/3/4 idle) | `.review/cycles/cycle-03/before-the-confluence-board.png` | `.review/cycles/cycle-03/after-the-confluence-board.png` |

The after crops show live pair 1 in full lime with a ring against dim magenta pair 3, and live pair 2
in cyan against dim lime pair 1, magenta pair 3 and gold pair 4. Full-screen pairs are also stored as
`before/after-long-way-home-screen.png` and `before/after-the-confluence-screen.png`.

Played run, The Confluence, real pointer clicks:
`.review/cycles/cycle-03/portal-play-report.json`.

- Initial: live `[2,2]`, idle `[1,1,3,3,4,4]`; only the two pair-2 labels mention the beam.
- After one real splitter click at (2,3): live `[1,1,2,2]`, idle `[3,3,4,4]`; pair 1 labels changed.
- Full clear: 13 moves, 6/6 receivers, 3 stars, all four pairs live (`allLiveAtEnd: true`), 0 page
  and console errors. Completion board: `.review/cycles/cycle-03/confluence-complete-board.png`.

Full regression play: all 18 chambers solved through real DOM clicks at exact par with 3 stars, 0
console errors. Report: `.review/cycles/cycle-03/play-report-1440x900.json`.

### GATES

- `npm test` -> 76 tests, 76 pass, 0 fail (was 73; +3 live-pair cases).
- `python aikit.py check prism-relay` -> 5/5 gates passed: test, mechanics, hygiene, guidelines, secrets.
- `npm run ui:snapshot` -> inventory unchanged; no new UI handle.
- `node --check src/ui/app.js`, `src/ui/cues.js` -> syntax ok.
- Playwright root run: 18/18 levels ok, 0 page errors, 0 console errors.

Commit: `feat(ui): highlight live portal pairs and color all four gates`.

---

## Cycle 04 - UI readability: the par target on compact HUDs

**Date**: 2026-11-07

### FIND

Defect: at `max-width: 520px` the stylesheet hid `.metric em`, the only par target printed
on the game screen. A real 390x844 touch viewport rendered `MOVES 0 | RECEIVERS 0/2` with no par;
splitter and portal levels do not mention par in the side hint, so a phone player had to leave the
chamber to rediscover it. First Light also read "Par is 1 moves." on desktop.

Evidence: `.review/cycles/cycle-04/before-double-down-390x844.png` (no par) and the baseline
`before-first-light-1440x900.png` (hint says "1 moves"). Playwright computed
`getComputedStyle(.metric em).display === "none"` at 390, 320 and 360 widths on the cycle-03 build.

### ANALYZE

- Survivor: keep the par element and let the existing wrapping metric absorb it. Removing the rule
  costs 0px height at 360+ and 3px at 320, with no horizontal overflow.
- Survivor: pluralize the one-move hint through a pure helper so "1 move" cannot regress.
- Killed: adding a new HUD row or a second par label. The element already exists and is styled; only
  the visibility rule is wrong.
- Killed: hiding the receivers metric instead. Par is the scoring target; receiver count is also
  needed, and both fit at 320 when the metric wraps.
- Killed: changing the chamber-card par or the victory grid. Both already read correctly.

### IMPLEMENT

Failing-first: `tests/hints.test.js` failed with `ERR_MODULE_NOT_FOUND`; the new stylesheet guard in
`tests/ui.test.js` failed on `.metric em { display: none; }`.

Files:
- `src/styles.css`: remove the compact `display: none` for `.metric em`; the existing `.metric`
  `flex-wrap: wrap` handles 320px.
- `src/ui/hints.js` (new): `parHint(par)` returns "Par is 1 move." or "Par is N moves." and falls
  back to 0 for invalid input.
- `src/ui/app.js`: use `parHint()` for the mirror-level hint.
- `tests/hints.test.js` (new): singular, plural, invalid.
- `tests/ui.test.js`: guard that no rule hides `.metric em`.
- `README.md`, `.aikit/decisions.md` ADR-012.

### PROOF

Same setup for every mobile pair: headless Edge 157, 390x844 viewport, device scale 2, mobile and
touch emulation, fresh browser context and storage, URL `/?level=double-down`.

| Pair | Before | After |
|---|---|---|
| Double Down 390x844, initial | `.review/cycles/cycle-04/before-double-down-390x844.png` | `.review/cycles/cycle-04/after-double-down-390x844.png` |

Before: `MOVES 0 | RECEIVERS 0/2`, par absent. After: `MOVES 0 / 4 par | RECEIVERS 0/2`, par
visible, HUD height 62px, `scrollWidth 390 = innerWidth 390`.

Additional pairs:
- First Light 390x844: `before-first-light-390x844.png` / `after-first-light-390x844.png` (par 1 now
  visible; First Light is unaffected by cycles 01-03, still a 640px/86px-cell board at desktop).
- First Light 1440x900: `before-first-light-1440x900.png` / `after-first-light-1440x900.png`; the
  hint changes from "Par is 1 moves." to "Par is 1 move. Every rotation counts."
- 320x568 after: `after-the-confluence-320x568.png` shows `/ 13 par` wrapping below `MOVES 0`, HUD
  65px, `scrollWidth 320 = innerWidth 320`.

Played run: touch viewport 390x844, Double Down solved with 4 real `tap()` gestures in 4 moves,
receivers 2/2, 3 stars, `/4 par` in the HUD at every step, 0 page and console errors. Victory
screenshot: `.review/cycles/cycle-04/double-down-victory-390x844.png`. Report:
`.review/cycles/cycle-04/mobile-report.json`.

Full regression play: all 18 chambers solved through real DOM clicks at exact par with 3 stars, 0
console errors. Report: `.review/cycles/cycle-04/play-report-1440x900.json`.

### GATES

- `npm test` -> 80 tests, 80 pass, 0 fail (was 76; +3 hint cases, +1 stylesheet guard).
- `python aikit.py check prism-relay` -> 5/5 gates passed: test, mechanics, hygiene, guidelines, secrets.
- `npm run ui:snapshot` -> inventory unchanged; no new UI handle.
- `node --check src/ui/app.js`, `src/ui/hints.js` -> syntax ok.
- Playwright root run: 18/18 levels ok, 0 page errors, 0 console errors.

Commit: `fix(ui): keep the par target visible on compact HUDs`.

---

## Cycle 05 - Progression and saves: never overwrite a newer save version

**Date**: 2026-11-07

### FIND

Defect (G-001 contract violation): a record with a future `version` was loaded as blank defaults,
then the next save normalized and wrote version 1 over it. A played probe seeded a version-2 record
with a FUTURE profile, `music: false`, a first-light best and `futureOnly`; completing First Light
replaced it with version 1, reset the profile to OPERATOR and deleted `futureOnly`.

Baseline: `.review/cycles/cycle-05/before-save-probe-report.json` — `storedVersionAfterPlay: 1`,
`futureOnlySurvived: false`, `recordUnchanged: false`, victory 3 stars.

### ANALYZE

- Survivor: refuse the write in `saveProgress` when the stored record is a newer integer version.
  This satisfies G-001 without changing the load-time blank fallback or adding a migration.
- Survivor: keep corrupt JSON replaceable. Existing tests promise a corrupt record resets safely;
  treating every parse failure as read-only would strand players with a broken record.
- Survivor: leave the version-1 round-trip path untouched; only `version > PROGRESS_VERSION` blocks.
- Killed: migrating version 2 in an older build. The older build cannot know the new semantics, and
  G-001 explicitly forbids modifying or quarantining it.
- Killed: rewriting the save key or adding a backup copy. Both would change the storage contract for
  no gain; the original bytes are already the backup.
- Killed: a UI banner. This cycle's contract is data preservation; the record is intentionally
  read-only and the existing profile status copy is unchanged (known follow-up).

### IMPLEMENT

Failing-first: the new `progress.test.js` case asserted `saveProgress` returns `false` and the stored
string is unchanged; it failed with `true !== false` before the guard.

Files:
- `src/ui/progress.js`: `saveProgress` parses the existing record and returns `false` without writing
  when `version > PROGRESS_VERSION`; parse failures remain replaceable.
- `tests/progress.test.js`: newer-version preservation and corrupt-record recovery cases.
- `README.md`: save paragraph and additive-saves design bullet.
- `.aikit/decisions.md`: ADR-013.

No engine, level, UI markup or inventory change.

### PROOF

Played run, identical setup: headless Edge 157, 1440x900, fresh context, `localStorage` seeded with
the same version-2 record, `/?level=first-light`, one real mirror click, victory modal.

| Measurement | Before | After |
|---|---|---|
| `storedVersionAfterPlay` | 1 | 2 |
| `storedProfile` | `OPERATOR / prism` | `FUTURE / helix` |
| `futureOnlySurvived` | false | true |
| `recordUnchanged` (byte-for-byte) | false | true |
| First Light victory stars | 3 | 3 |

Reports: `.review/cycles/cycle-05/before-save-probe-report.json` and
`.review/cycles/cycle-05/after-save-probe-report.json`. State screenshots (no visual claim; both show
the same victory state): `.review/cycles/cycle-05/before-future-save-after-play.png` and
`after-future-save-after-play.png`.

Full regression play: all 18 chambers solved through real DOM clicks at exact par with 3 stars, 0
console errors. Report: `.review/cycles/cycle-05/play-report-1440x900.json`.

### GATES

- `npm test` -> 82 tests, 82 pass, 0 fail (was 80; +2 save cases).
- `python aikit.py check prism-relay` -> 5/5 gates passed: test, mechanics, hygiene, guidelines, secrets.
- `npm run ui:snapshot` -> inventory unchanged; no new UI handle.
- `node --check src/ui/progress.js` -> syntax ok.
- Playwright root run: 18/18 levels ok, 0 page errors, 0 console errors.

Commit: `fix(save): preserve records from newer save versions`.

---

## Cycle 06 - Game feel: a dismissed victory is not a dead end

**Date**: 2026-11-07

### FIND

Defect: the victory dialog can be dismissed with Escape or the X button, but after dismissal the
completed game screen has no forward control. The probe cleared First Light, pressed Escape and
measured: screen `screen-game`, modal closed, 1 move, 1/1 receivers, status "Relay closed. Chamber
complete.", `nextButton: false`; clicking the completed mirror left moves at 1. The next chamber was
unlocked but reachable only through the back arrow and episode index.

Baseline: `.review/cycles/cycle-06/before-postvictory-report.json` and
`.review/cycles/cycle-06/before-first-light-victory-dismissed.png`.

### ANALYZE

- Survivor: keep the existing dismissal behavior and add a persistent forward action in the game
  foot. It fixes the dead end without changing the dialog or trapping the player.
- Survivor: derive the action from the existing victory result, so the next level and the finale's
  index fallback stay consistent with the modal.
- Killed: making the victory dialog non-dismissible. Escape and the X button are standard and the
  player may want to inspect the solved board.
- Killed: rerouting the X button to "Next". The icon means dismiss, and it would make Escape advance
  without confirmation.
- Killed: a fixed "Next" label on the finale. The finale has no next level, so the pure helper returns
  "Episode index" instead.
- Killed: changing engine completion state. `state.completed` already blocks rotation; only the
  missing forward affordance was wrong.

### IMPLEMENT

Failing-first: `tests/hints.test.js` could not import `postVictoryAction`, and `tests/ui.test.js`
failed because `data-ui="next-step"` was absent.

Files:
- `src/ui/hints.js`: `postVictoryAction(result)` returns the next-chamber or episode-index action.
- `index.html`: hidden `data-ui="next-step"` button in the game foot.
- `src/ui/app.js`: `updateGameView` reveals the button when completed with a result; `finishLevel`
  and `previewVictory` refresh after storing the result; the click starts the next level or opens the
  index; start/restart hide it.
- `src/styles.css`: compact `.game-foot__next` sizing.
- `tests/hints.test.js` (+3 cases), `tests/ui.test.js` (required control).
- `README.md`, `.aikit/decisions.md` ADR-014.

The UI inventory gains one control (`next-step`).

### PROOF

Same setup: headless Edge 157, 1440x900, fresh storage, First Light solved in one real click, then
Escape to dismiss the victory dialog.

| Pair | Before | After |
|---|---|---|
| First Light after Escape | `.review/cycles/cycle-06/before-first-light-victory-dismissed.png` | `.review/cycles/cycle-06/after-first-light-victory-dismissed.png` |

Before: status only, no forward control. After: centered "Next chamber →" button in the game foot.
The after report records `nextButton: true`; clicking it loads Split Decision with moves 0, par 2,
receivers 0/2 and the button hidden again:
`.review/cycles/cycle-06/after-next-chamber-split-decision.png`.

Mobile layout check: at 390x844 the button is 128x44px, `scrollWidth 390 = innerWidth 390`, full-page
height 1387; screenshot `.review/cycles/cycle-06/after-first-light-dismissed-390x844.png`.

Reports: `.review/cycles/cycle-06/before-postvictory-report.json` and
`after-postvictory-report.json`.

Full regression play: all 18 chambers solved through real DOM clicks at exact par with 3 stars, 0
console errors. Report: `.review/cycles/cycle-06/play-report-1440x900.json`.

### GATES

- `npm test` -> 85 tests, 85 pass, 0 fail (was 82; +3 post-victory action cases).
- `python aikit.py check prism-relay` -> 5/5 gates passed: test, mechanics, hygiene, guidelines, secrets.
- `npm run ui:snapshot` -> adds `control: next-step`; no other inventory drift.
- `node --check src/ui/app.js`, `src/ui/hints.js` -> syntax ok.
- Playwright root run: 18/18 levels ok, 0 page errors, 0 console errors.

Commit: `feat(ux): keep a next chamber action after dismissing victory`.

---

## Cycle 07 - Progression UX: honest save status

**Date**: 2026-11-07

### FIND

Defect: after cycle 05 made a newer-version record read-only, the UI still claimed success. With a
version-2 record seeded, a real callsign save printed "Callsign saved." while localStorage still held
`FUTURE`; choosing the Orbit sigil printed "Sigil updated." while the stored sigil remained `helix`;
clearing First Light showed a normal 3-star victory with no warning while the result was not stored.

Baseline: `.review/cycles/cycle-07/before-save-status-report.json`, plus
`before-callsign-status.png`, `before-sigil-status.png` and `before-victory-status.png`.

### ANALYZE

- Survivor: check the actual `saveProgress` return in every profile write and report the real state.
  The refusal path already exists; only the message ignores it.
- Survivor: put the same warning on the victory card, where the player expects the result to be
  stored.
- Survivor: keep normal success copy unchanged so version-1 players see no new noise.
- Killed: disabling profile inputs when the save is read-only. The player can still change the
  session and see the immediate state; honest feedback is enough for this cycle.
- Killed: a modal blocking every play when storage is unavailable. It would interrupt the game for a
  condition that only affects persistence.
- Killed: changing the save format or adding a quarantine path. Cycle 05 already keeps the record
  intact; this is feedback only.

### IMPLEMENT

Failing-first: `tests/hints.test.js` could not import `saveStatusMessage`; the probe recorded the
false success messages before the change.

Files:
- `src/ui/hints.js`: `saveStatusMessage(saved, success)` returns the success copy or "Changes are not
  being stored."
- `src/ui/app.js`: `saveCallsign`, `chooseSigil`, `toggleAllAudio`, `toggleMusic` and `toggleEffects`
  use the real save result; `finishLevel` records `saveFailed`; `openVictoryModal` appends "Progress
  for this run is not being stored." when it is set.
- `tests/hints.test.js`: two status-copy cases.
- `README.md`, `.aikit/decisions.md` ADR-015.

No save-format, engine, level or inventory change.

### PROOF

Same setup: headless Edge 157, 1440x900, version-2 record seeded in `localStorage`, profile opened at
`?screen=profile`, callsign set to NOVA and saved, then Orbit selected; separate First Light clear.

| Pair | Before | After |
|---|---|---|
| Callsign on a read-only save | `.review/cycles/cycle-07/before-callsign-status.png` ("Callsign saved.") | `.review/cycles/cycle-07/after-callsign-status.png` ("Changes are not being stored.") |
| Sigil on a read-only save | `.review/cycles/cycle-07/before-sigil-status.png` ("Sigil updated.") | `.review/cycles/cycle-07/after-sigil-status.png` ("Changes are not being stored.") |
| Victory on a read-only save | `.review/cycles/cycle-07/before-victory-status.png` (no warning) | `.review/cycles/cycle-07/after-victory-status.png` ("Progress for this run is not being stored.") |

The after report still shows `storedVersion: 2`, `storedCallsign: FUTURE`, `storedSigil: helix` and
`futureOnlySurvived: true`; the messages now match the storage. Normal control: a fresh version-1 save
reports "Callsign saved." and stores NOVA (`after-normal-callsign-status.png`). Reports:
`.review/cycles/cycle-07/before-save-status-report.json` and `after-save-status-report.json`.

Full regression play: all 18 chambers solved through real DOM clicks at exact par with 3 stars, 0
console errors. Report: `.review/cycles/cycle-07/play-report-1440x900.json`.

### GATES

- `npm test` -> 87 tests, 87 pass, 0 fail (was 85; +2 status-copy cases).
- `python aikit.py check prism-relay` -> 5/5 gates passed: test, mechanics, hygiene, guidelines, secrets.
- `npm run ui:snapshot` -> inventory unchanged from cycle 06; no new handle.
- `node --check src/ui/app.js`, `src/ui/hints.js` -> syntax ok.
- Playwright root run: 18/18 levels ok, 0 page errors, 0 console errors.

Commit: `fix(ux): report refused saves instead of claiming success`.

---

## Cycle 08 - Game feel: live star pace in the moves HUD

**Date**: 2026-11-08

### FIND

Defect/opportunity: the HUD showed moves and par but not the rating those moves would earn. A player
one move over par saw only "MOVES 5 / 4 par" and learned that three stars were gone from the victory
card. `starsFor` already defines the boundaries at par and par+2, but nothing in the live HUD used it.

Baseline: `.review/cycles/cycle-08/before-star-pace-report.json` (no `#hud-stars`, `earnedStars: 0`
at moves 0/5/8) and `before-moves-5.png`.

### ANALYZE

- Survivor: derive the pace from `starsFor(moves, par)` on every HUD update. It is the same rule the
  victory card uses, so the preview cannot disagree with the result.
- Survivor: reuse the existing gold star markup and add a compact row to the moves metric. No new
  panel, modal or interaction.
- Survivor: expose the pace in the aria label for screen readers while keeping the glyphs aria-hidden.
- Killed: a separate "pace" card in the side panel. It would be off-screen on mobile and larger than
  the information warrants.
- Killed: a new scoring function. `starsFor` is already tested at par, par+1, par+2 and beyond.
- Killed: changing the victory card to show pace. It already shows the final stars; this cycle is the
  live preview only.

### IMPLEMENT

Failing-first: `tests/ui.test.js` asserted `data-cue="hud-stars"` before the marker existed.

Files:
- `index.html`: `#hud-stars` (`data-cue="hud-stars"`, initial aria "On pace for 3 stars") in the moves
  metric.
- `src/ui/app.js`: `hudStars` element lookup; `updateGameView` renders `starsMarkup(starsFor(...))` and
  sets the aria label.
- `src/styles.css`: compact `.metric .metric__stars` row.
- `tests/ui.test.js`: HUD-cue contract assertion.
- `README.md`, `.aikit/decisions.md` ADR-016.

No engine, level, save or interaction change.

### PROOF

Same setup: headless Edge 157, 1440x900, fresh storage, `/?level=double-down`, five real splitter
clicks, then three more.

| Pair | Before | After |
|---|---|---|
| Moves 0 | `.review/cycles/cycle-08/before-moves-0.png` | `.review/cycles/cycle-08/after-moves-0.png` |
| Moves 5 (par 4) | `.review/cycles/cycle-08/before-moves-5.png` | `.review/cycles/cycle-08/after-moves-5.png` |
| Moves 8 (par 4) | `.review/cycles/cycle-08/before-moves-8.png` | `.review/cycles/cycle-08/after-moves-8.png` |

After: moves 0 -> 3 earned stars / "On pace for 3 stars"; moves 5 -> 2 / "On pace for 2 stars";
moves 8 -> 1 / "On pace for 1 star". The board orientation and receiver count are identical across
each pair. Report: `.review/cycles/cycle-08/after-star-pace-report.json`.

Mobile: at 320/360/390/414px the HUD stays within the viewport (`scrollWidth == innerWidth`), height
62-63px, three stars and the aria label present. Screenshot:
`.review/cycles/cycle-08/after-mobile-390x844.png`.

Full regression play: all 18 chambers solved through real DOM clicks at exact par with 3 stars, 0
console errors. Report: `.review/cycles/cycle-08/play-report-1440x900.json`.

### GATES

- `npm test` -> 87 tests, 87 pass, 0 fail (same count; the HUD contract assertion joined the UI test).
- `python aikit.py check prism-relay` -> 5/5 gates passed: test, mechanics, hygiene, guidelines, secrets.
- `npm run ui:snapshot` -> adds `cue: hud-stars`; no other inventory drift.
- `node --check src/ui/app.js` -> syntax ok.
- Playwright root run: 18/18 levels ok, 0 page errors, 0 console errors.

Commit: `feat(ui): show live star pace in the moves HUD`.

---

## Cycle 09 - Accessibility: star state without color

**Date**: 2026-11-08

### FIND

Defect: in forced-colors emulation the three HUD stars all rendered the filled `★` glyph and the
same computed `rgb(0, 0, 0)`, while the state was actually `earned: [true, true, false]`. The same
markup feeds the chamber cards and victory card, so star state vanished in Windows High Contrast and
was weak for color-impaired players. Reduced motion was audited too: the beam animation already
collapses from 1.35s to 0.001s, so no motion defect survives.

Baseline: `.review/cycles/cycle-09/before-forced-colors-report.json` and
`before-hud-forced-colors.png` (three identical filled glyphs).

### ANALYZE

- Survivor: encode star state in shape: filled `★` for earned, outlined `☆` for unearned. Shape
  survives any color override and is readable at the 12px HUD size.
- Survivor: move the shared markup into a pure module so the HUD, cards and modal all get the same
  behavior and the glyph contract is testable.
- Survivor: keep the existing color and aria labels; the glyph is an additional channel, not a
  replacement.
- Killed: a forced-colors-only CSS rule. The same glyph problem exists in normal mode for anyone who
  cannot separate gold from grey; shape is the better fix.
- Killed: reducing motion further. The audit shows the global 1ms rule already disables the beam,
  portal ring and screen transitions; changing it would churn a correct guard.
- Killed: changing the star count or scoring. `starsFor` and all totals are correct.

### IMPLEMENT

Failing-first: `tests/stars.test.js` failed with `ERR_MODULE_NOT_FOUND` before `src/ui/stars.js`.

Files:
- `src/ui/stars.js` (new): `starsMarkup(count)` emits filled earned glyphs and outlined unearned
  glyphs with the existing classes; `starLabel(count)` keeps the count copy.
- `src/ui/app.js`: imports the two helpers and drops the local copies.
- `tests/stars.test.js` (new, 4 cases): two earned, three earned, zero earned, labels.
- `README.md`, `.aikit/decisions.md` ADR-017.

No CSS, engine, level, save or UI-inventory change.

### PROOF

Same setup: headless Edge 157, 1440x900, Double Down at moves 5 (five real splitter clicks), then
`emulate_media(forced_colors="active")` with no other state change.

| Pair | Before | After |
|---|---|---|
| HUD, forced colors | `.review/cycles/cycle-09/before-hud-forced-colors.png` (★★★ all black) | `.review/cycles/cycle-09/after-hud-forced-colors.png` (★★☆ all black) |
| Whole game, normal colors | `.review/cycles/cycle-09/before-double-down-normal.png` | `.review/cycles/cycle-09/after-double-down-normal.png` |

After forced-colors report: glyphs `["★","★","☆"]`, earned `[true,true,false]`, all colors
`rgb(0,0,0)`; shape alone carries the state. Normal report: two gold `rgb(255,211,110)` filled stars
and one grey `rgb(127,139,174)` outline. Reduce mode: beam animation `0.001s`. Reports:
`.review/cycles/cycle-09/before-forced-colors-report.json` and `after-forced-colors-report.json`.

Full regression play: all 18 chambers solved through real DOM clicks at exact par with 3 stars, 0
console errors. Report: `.review/cycles/cycle-09/play-report-1440x900.json`.

### GATES

- `npm test` -> 91 tests, 91 pass, 0 fail (was 87; +4 star-markup cases).
- `python aikit.py check prism-relay` -> 5/5 gates passed: test, mechanics, hygiene, guidelines, secrets.
- `npm run ui:snapshot` -> inventory unchanged; no new handle or cue.
- `node --check src/ui/app.js`, `src/ui/stars.js` -> syntax ok.
- Playwright root run: 18/18 levels ok, 0 page errors, 0 console errors.

Commit: `fix(a11y): outline unearned stars so state survives forced colors`.

---

## Cycle 10 - Game feel: receiver charge impact

**Date**: 2026-11-08

### FIND

Opportunity: a receiver that first charges played the two-note cue and started the persistent pulse,
but the visual connection itself was only a border/glow swap. A real Split Decision click, captured
120ms later, measured `charging: 0`, `ringAnimation: none`, receivers 1/2 and moves 1. There was no
transient impact at the cell where the beam arrived.

Baseline: `.review/cycles/cycle-10/before-charge-burst-report.json` and `before-receiver-zoom.png`.

### ANALYZE

- Survivor: derive the newly lit receiver keys from the previous and current traces and add a
  short-lived class only to those cells. The mechanic (which receivers changed) is already proven by
  the trace.
- Survivor: use a per-node timer so a rapid re-charge restarts the ring instead of being cleared by
  the previous timer.
- Survivor: a white ring with a short hold phase reads clearly against the persistent cyan lit ring
  and survives the screenshot latency; a purely fading ring was too easy to miss.
- Survivor: clear the class immediately when the board is reset or a fresh render replaces the
  previous-lit context.
- Killed: a particle system or canvas overlay. A single CSS ring is enough and adds no asset or
  render loop.
- Killed: a persistent extra glow. The lit receiver already has one; the value is the transient.
- Killed: changing the audio cue or star pace. Both already fire on the same event.

### IMPLEMENT

Failing-first: `tests/cues.test.js` imported `newlyLitKeys` before it existed.

Files:
- `src/ui/cues.js`: `newlyLitKeys(before, after)` returns the keys added since the previous trace.
- `src/ui/app.js`: `updateBoard(previousLit = null)`; `rotatePiece` captures the current lit set and
  passes it; `markChargedReceivers` adds `is-charging` and clears it after 600ms through a WeakMap of
  timers; `clearChargeBursts` handles start/reset.
- `src/styles.css`: white `::after` ring, 600ms linear `charge-burst` keyframes with a hold phase,
  forced-colors Highlight border.
- `tests/cues.test.js`: two newly-lit key cases.
- `README.md`, `.aikit/decisions.md` ADR-018.

No engine, level, save or inventory change.

### PROOF

Same setup: headless Edge 157, 1440x900, Split Decision fresh, one real click on mirror (4,2) to
charge the first of two receivers, capture 120ms later.

| Pair | Before | After |
|---|---|---|
| Board at 120ms | `.review/cycles/cycle-10/before-charge-board-120ms.png` | `.review/cycles/cycle-10/after-charge-board-120ms.png` |
| Receiver zoom | `.review/cycles/cycle-10/before-receiver-zoom.png` | `.review/cycles/cycle-10/after-receiver-zoom.png` |

Before: only the persistent cyan lit ring. After: a white shockwave ring expanding past the cell.
Report: `during120ms.charging = 1`, `ringAnimation = "charge-burst"`, moves 1, receivers 1/2; by
820ms `charging = 0` and the persistent lit ring remains. Charging then resetting within the burst
window yields `charging: 0`, `lit: 0`, `moves: 0`. Reports:
`.review/cycles/cycle-10/before-charge-burst-report.json` and `after-charge-burst-report.json`.

Full regression play: all 18 chambers solved through real DOM clicks at exact par with 3 stars, 0
console errors. Report: `.review/cycles/cycle-10/play-report-1440x900.json`.

### GATES

- `npm test` -> 93 tests, 93 pass, 0 fail (was 91; +2 newly-lit key cases).
- `python aikit.py check prism-relay` -> 5/5 gates passed: test, mechanics, hygiene, guidelines, secrets.
- `npm run ui:snapshot` -> inventory unchanged; no new handle or cue.
- `node --check src/ui/app.js`, `src/ui/cues.js` -> syntax ok.
- Playwright root run: 18/18 levels ok, 0 page errors, 0 console errors.

Commit: `feat(game): burst a ring when a receiver first charges`.

---

## Cycle 11 - Levels: teach the fixed prism in place

**Date**: 2026-11-08

### FIND

Defect: Split Decision and The Vault contain fixed prisms, but `#game-mechanic` was hidden on both
(`hidden: true`, empty text). Splitter chambers show "SPLITTER ..." and portal chambers show
"SPLITTER / PORTAL", so the first Episode I mechanic was the only one without an in-place note; the
detailed pass-through plus two-fork behavior lived only in the how-to dialog and the one-line legend.

Baseline: `.review/cycles/cycle-11/before-prism-note-report.json` and
`before-split-decision-side.png` (no note box).

### ANALYZE

- Survivor: show a detailed Prism note exactly on chambers whose special piece is the prism (prisms
  present, no splitters, no portals). That covers Split Decision, Mirror Maze, Crossfire and The
  Vault, which introduce the mechanic.
- Survivor: keep the existing splitter and portal copy and order untouched; extract the whole note
  list into a pure helper so the condition and strings are testable.
- Survivor: leave combo chambers alone. The Confluence already shows two notes; a third would grow
  an already tall side panel.
- Killed: adding a new panel or modal. The existing mechanic-note slot is exactly for this.
- Killed: changing the legend only. It already says "Prism splits light"; the missing part is the
  three-way behavior.
- Killed: changing level data or prism behavior. The engine is correct; only the lesson was absent.

### IMPLEMENT

Failing-first: `tests/mechanics.test.js` could not import `src/ui/mechanics.js`.

Files:
- `src/ui/mechanics.js` (new): `mechanicNotes(board)` returns splitter and portal notes and a
  prism-only note when the board has prisms and neither of the other special pieces.
- `src/ui/app.js`: `updateGameView` renders `mechanicNotes(board)` instead of inline strings.
- `tests/mechanics.test.js` (new, 6 cases): prism-only, The Vault, splitter, portal, combo, plain.
- `README.md`, `.aikit/decisions.md` ADR-019.

No engine, level, save or inventory change.

### PROOF

Same setup: headless Edge 157, 1440x900, `/?level=split-decision`, fresh storage, initial state.

| Pair | Before | After |
|---|---|---|
| Side panel | `.review/cycles/cycle-11/before-split-decision-side.png` | `.review/cycles/cycle-11/after-split-decision-side.png` |
| Whole game | `.review/cycles/cycle-11/before-split-decision.png` | `.review/cycles/cycle-11/after-split-decision.png` |

Before: no note box. After: a pink "PRISM — The prism passes the beam through and splits copies to
both perpendicular sides." box above the legend, with the same objective, legend, par hint and
Restart button. The after report also shows The Vault with the Prism note, while Double Down,
Wormhole and The Confluence keep exactly their previous note text.

Played run: Split Decision solved with 2 real clicks, 2 moves, 2/2 receivers, 3 stars, 0 errors.
Report: `.review/cycles/cycle-11/after-prism-note-report.json`.

Full regression play: all 18 chambers solved through real DOM clicks at exact par with 3 stars, 0
console errors. Report: `.review/cycles/cycle-11/play-report-1440x900.json`.

### GATES

- `npm test` -> 99 tests, 99 pass, 0 fail (was 93; +6 mechanic-note cases).
- `python aikit.py check prism-relay` -> 5/5 gates passed: test, mechanics, hygiene, guidelines, secrets.
- `npm run ui:snapshot` -> inventory unchanged; no new handle or cue.
- `node --check src/ui/app.js`, `src/ui/mechanics.js` -> syntax ok.
- Playwright root run: 18/18 levels ok, 0 page errors, 0 console errors.

Commit: `feat(levels): teach the prism in prism-only chambers`.

---

## Cycle 12 - UI readability: pinned modal actions on phones

**Date**: 2026-11-08

### FIND

Defect: at 390x844 the Field Manual dialog is 760px tall and the whole dialog scrolls. The action row
sat at y=832 with a 876px bottom, so the primary "Return to chamber" button was below the viewport;
the probe reported `primaryVisible: false` and the button could not be tapped without discovering
scrolling. Desktop kept the button visible, so the failure was phone-specific.

Baseline: `.review/cycles/cycle-12/before-modal-report.json` and `before-howto-390x844.png`.

### ANALYZE

- Survivor: separate the scrolling body from a fixed action row. The actions are the exit from every
  modal, so they should not depend on scroll position.
- Survivor: keep the close button anchored at the top; it remains an immediate escape for anyone who
  does not want an action.
- Survivor: pin the row with a solid glass background and a rule so scrolled text does not bleed
  through; a gradient fade still let the last line show through.
- Survivor: reduce desktop action padding by one step so the keyboard help line is not clipped by the
  new fixed row.
- Killed: making the whole dialog shorter or moving the how-to content into a new panel. The content
  is useful and the existing modal is the right container.
- Killed: hiding content on mobile. The field manual is exactly what a new player needs.
- Killed: changing the modal action labels or behavior. Only the scroll owner changed.

### IMPLEMENT

Failing-first: `tests/ui.test.js` asserted the actions are a direct sibling after the content; the
old markup kept them inside `.modal__content`.

Files:
- `index.html`: `.modal__actions` moved out of `.modal__content` as a direct child of the dialog.
- `src/styles.css`: `.modal[open]` flex column; content `min-height: 0; overflow-y: auto` with no
  bottom padding; actions fixed with solid glass background, top rule and compact padding; mobile
  padding adjusted.
- `tests/ui.test.js`: modal-structure contract.
- `README.md`, `.aikit/decisions.md` ADR-020.

No engine, level, save or inventory change.

### PROOF

Same setup: headless Edge 157, `/?level=wormhole&preview=howto`, 390x844 mobile/touch and 1440x900
desktop.

| Pair | Before | After |
|---|---|---|
| Field Manual 390x844 | `.review/cycles/cycle-12/before-howto-390x844.png` | `.review/cycles/cycle-12/after-howto-390x844.png` |
| Field Manual 1440x900 | `.review/cycles/cycle-12/before-howto-1440x900.png` | `.review/cycles/cycle-12/after-howto-1440x900.png` |

Before mobile: actions y=832, bottom 876, `primaryVisible: false`. After mobile: content 673px client
vs 765px scroll, actions fixed at y=716-801, primary at y=733-777, `primaryVisible: true`. Scrolling
the content to the bottom leaves the action rect unchanged. A real tap on the primary closes the
dialog and leaves `screen-game` open. After desktop: content 658/658 (no hidden line), actions 91px,
primary visible. Scrolled mobile screenshot:
`.review/cycles/cycle-12/after-howto-390x844-scrolled.png`. Reports:
`.review/cycles/cycle-12/before-modal-report.json` and `after-modal-report.json`.

Full regression play: all 18 chambers solved through real DOM clicks at exact par with 3 stars, 0
console errors. Report: `.review/cycles/cycle-12/play-report-1440x900.json`.

### GATES

- `npm test` -> 100 tests, 100 pass, 0 fail (was 99; +1 modal-structure contract).
- `python aikit.py check prism-relay` -> 5/5 gates passed: test, mechanics, hygiene, guidelines, secrets.
- `npm run ui:snapshot` -> inventory unchanged; no new handle or cue.
- `node --check` not needed for HTML/CSS; the UI contract test parses the document.
- Playwright root run: 18/18 levels ok, 0 page errors, 0 console errors.

Commit: `fix(ui): pin modal actions above the phone fold`.

---

## Cycle 13 - Progression UX: next rank and stars remaining

**Date**: 2026-11-08

### FIND

Opportunity: the profile named the current rank but not the next threshold. A seeded profile at 10
stars and one at 18 stars both showed only "OPERATOR"; the distance to Weaver lived only in the code.
The profile had a natural empty line under the rank and no use for the next threshold.

Baseline (pre-cycle worktree at 75b386c): `.review/cycles/cycle-13/before-rank-report.json` and
`before-profile-10-stars.png` — rank Operator, `next: null`.

### ANALYZE

- Survivor: derive the next rank from a single shared threshold table and show the stars remaining in
  the profile. No save field is needed; `statsFor` already computes total stars.
- Survivor: keep `rankFor` as the authority by reading the same table, so the displayed rank and the
  progress line cannot disagree.
- Survivor: one short mono line under the rank, matching the existing profile typography.
- Killed: a rank progress bar. The line is clearer at this size and avoids new layout blocks.
- Killed: computing the next rank in the episode cards or title. The profile is where rank lives.
- Killed: changing thresholds or the 54-star cap. Existing rank tests already pin them.

### IMPLEMENT

Failing-first: `tests/progress.test.js` imported `rankProgress` before it existed, and `tests/ui.test.js`
failed on the missing `profile-rank-next` cue.

Files:
- `src/ui/progress.js`: frozen `RANKS` table, `rankFor` now reads it, new `rankProgress(stars)`.
- `index.html`: `profile-rank-next` line under the rank.
- `src/ui/app.js`: `renderProfile` sets the current rank and the next/remaining copy.
- `src/styles.css`: muted mono style for the line.
- `tests/progress.test.js` (+3 cases), `tests/ui.test.js` (cue contract).
- `README.md`, `.aikit/decisions.md` ADR-021.

No engine, level, save or interaction change.

### PROOF

Before capture came from a detached worktree at the cycle-12 commit (`75b386c`) served on a separate
port; after capture came from the working tree. Same save, URL, viewport and browser.

| Pair | Before | After |
|---|---|---|
| Profile with 10 stars (Operator) | `.review/cycles/cycle-13/before-profile-10-stars.png` | `.review/cycles/cycle-13/after-profile-10-stars.png` |
| Profile after a fresh First Light clear | `.review/cycles/cycle-13/before-profile-after-first-light.png` | `.review/cycles/cycle-13/after-profile-after-first-light.png` |

Before report: seeded rank Operator, `next: null`; played rank Cadet, `next: null`. After report:
seeded "OPERATOR / 9 STARS TO WEAVER" at 10/54 stars; played "CADET / 5 STARS TO OPERATOR" at 3/54
stars. Reports: `before-rank-report.json` and `after-rank-report.json`.

Full regression play: all 18 chambers solved through real DOM clicks at exact par with 3 stars, 0
console errors. Report: `.review/cycles/cycle-13/play-report-1440x900.json`.

### GATES

- `npm test` -> 103 tests, 103 pass, 0 fail (was 100; +3 rank-progress cases).
- `python aikit.py check prism-relay` -> 5/5 gates passed: test, mechanics, hygiene, guidelines, secrets.
- `npm run ui:snapshot` -> adds `cue: profile-rank-next`; no other inventory drift.
- `node --check src/ui/app.js`, `src/ui/progress.js` -> syntax ok.
- Playwright root run: 18/18 levels ok, 0 page errors, 0 console errors.

Commit: `feat(progression): show the next rank and remaining stars`.

---

## Cycle 14 - Game feel: the last rotated cell stays marked

**Date**: 2026-11-08

### FIND

Opportunity/defect: after the 280ms `is-turning` bump, nothing persisted to identify the last changed
piece. A probe on The Confluence after a real splitter click and a 450ms wait found `lastMoved: []`;
the `is-turning` class never cleared (`turning: ["2,3"]`, then `["2,3","4,3"]`). On a 15-rotatable
finale the player had to infer the last move from the beam alone, and the stale class was a state bug.

Baseline: `.review/cycles/cycle-14/before-last-move-report.json` and `before-after-splitter.png`.

### ANALYZE

- Survivor: a persistent `is-last-moved` class on exactly one rotatable cell, moved on each rotation
  and cleared on reset. It is a visual anchor without changing the beam or score.
- Survivor: a thin cyan outline inside the existing cell gutter, so it does not cover the beam or the
  piece and survives forced colors as Highlight.
- Survivor: fix the stale `is-turning` class with a per-node timer that restarts on rapid clicks, so
  the class reflects an active animation rather than every piece ever touched.
- Killed: a new floating tooltip or label. It would obscure the board and add layout.
- Killed: reusing `is-turning` as the persistent marker. It is an animation class and was already
  stale; separating the concerns keeps both meaningful.
- Killed: changing the audio or charge cue. This cycle is visual move memory only.

### IMPLEMENT

Files:
- `src/ui/app.js`: `turnTimers` WeakMap; `is-last-moved` toggled on the clicked rotatable; 320ms
  `is-turning` cleanup with timer reset; reset clears both classes and timers.
- `src/styles.css`: `.cell.is-last-moved` inset outline; forced-colors Highlight mapping.
- `README.md`, `.aikit/decisions.md` ADR-022.

No engine, level, save or inventory change. The played probe is the reproducer; no new unit test.

### PROOF

Same setup: headless Edge 157, 1440x900, `/?level=the-confluence`, fresh storage, real clicks followed
by a 450ms wait so the bump animation is over.

| Pair | Before | After |
|---|---|---|
| Board after splitter (2,3) | `.review/cycles/cycle-14/before-after-splitter.png` | `.review/cycles/cycle-14/after-after-splitter.png` |
| Board after mirror (4,3) | `.review/cycles/cycle-14/before-after-mirror.png` | `.review/cycles/cycle-14/after-after-mirror.png` |

After: `lastMoved: ["2,3"]`, `turning: []`; then the mirror click moves it to `["4,3"]`; reset leaves
both empty. The cyan outline is visible around the clicked cell in both board crops. Before: no
outline and stale `turning` entries. Report: `.review/cycles/cycle-14/after-last-move-report.json`.

Full regression play: all 18 chambers solved through real DOM clicks at exact par with 3 stars, 0
console errors. Report: `.review/cycles/cycle-14/play-report-1440x900.json`.

### GATES

- `npm test` -> 103 tests, 103 pass, 0 fail (interaction covered by the played probe).
- `python aikit.py check prism-relay` -> 5/5 gates passed: test, mechanics, hygiene, guidelines, secrets.
- `npm run ui:snapshot` -> inventory unchanged; no new handle or cue.
- `node --check src/ui/app.js` -> syntax ok.
- Playwright root run: 18/18 levels ok, 0 page errors, 0 console errors.

Commit: `feat(game): keep a marker on the last rotated cell`.

---

## Cycle 15 - UI readability: the title action after a full clear

**Date**: 2026-11-08

### FIND

Defect: a played 54-star save still showed "Enter the relay" on the title action, and clicking it
started First Light. The completion was visible in the 54/54 stat, but the primary label described a
first entry while the action was a replay, so the button lied about what it did.

Baseline (worktree at 6eaa25e): `.review/cycles/cycle-15/before-endgame-report.json` and
`before-title-54-stars.png` — 54 stars, `startLabel: null`, `startText: "Enter the relay →"`.

### ANALYZE

- Survivor: make the label reflect completion while leaving the click behavior unchanged. A replay
  from First Light is a valid endgame action; only the copy was wrong.
- Survivor: a pure helper that takes completed and total counts, so 0/17/18 and invalid totals are
  testable without the DOM.
- Survivor: wrap only the text in a span so the arrow and button layout stay intact.
- Killed: changing the click to open the episode index. The current behavior is a coherent "replay the
  relay from the start"; the label now says so.
- Killed: a separate endgame screen or badge. The title already carries 54/54 and best moves.
- Killed: changing the chamber count or title stats. They are correct.

### IMPLEMENT

Failing-first: `tests/hints.test.js` imported `relayCtaLabel` before it existed, and `tests/ui.test.js`
failed on the missing `start-label` span.

Files:
- `src/ui/hints.js`: `relayCtaLabel(completed, total)` returns "Replay the relay" only at a full,
  non-zero clear.
- `index.html`: title action text wrapped in `#start-label`.
- `src/ui/app.js`: `updateTitleStats` updates the label on every title render.
- `tests/hints.test.js` (+3 cases), `tests/ui.test.js` (label-span contract).
- `README.md`, `.aikit/decisions.md` ADR-023.

No engine, level, save or inventory change.

### PROOF

Same setup: the endgame probe clears all 18 chambers through real solver-guided clicks at par, then
loads `?screen=title` at 1440x900. The before run used a detached worktree at the cycle-14 commit
served on a separate port; the after run used the working tree.

| Pair | Before | After |
|---|---|---|
| Title at 54/54 stars | `.review/cycles/cycle-15/before-title-54-stars.png` | `.review/cycles/cycle-15/after-title-54-stars.png` |

Before: 54 stars, 111 best moves, action "Enter the relay →". After: same stats, action
"Replay the relay →". In both runs clicking the action opens First Light at 0 moves. Reports:
`.review/cycles/cycle-15/before-endgame-report.json` and `after-endgame-report.json`.

Full regression play: all 18 chambers solved through real DOM clicks at exact par with 3 stars, 0
console errors. Report: `.review/cycles/cycle-15/play-report-1440x900.json`.

### GATES

- `npm test` -> 106 tests, 106 pass, 0 fail (was 103; +3 CTA-label cases, +1 span contract).
- `python aikit.py check prism-relay` -> 5/5 gates passed: test, mechanics, hygiene, guidelines, secrets.
- `npm run ui:snapshot` -> inventory unchanged; no new handle or cue.
- `node --check src/ui/app.js`, `src/ui/hints.js` -> syntax ok.
- Playwright root run: 18/18 levels ok, 0 page errors, 0 console errors.

Commit: `fix(ui): label the title action as a replay after a full clear`.

---

## Cycle 16 - Audio: duck the ambient music under the victory fanfare

**Date**: 2026-11-08

### FIND

Defect: the ambient pad sits at gain 0.05 while the four victory tones play at 0.035-0.04, so the
fanfare competes with the music instead of sitting above it. A played Double Down run with a gain-node
probe tracked the 0.05 pad and measured 0.050 at 150ms after the winning click, at the modal, and
1.7s later; there was no duck path in the audio module.

Baseline: `.review/cycles/cycle-16/before-duck-report.json`.

### ANALYZE

- Survivor: duck the existing music gain for a short window when the fanfare starts, then restore it.
  This adds no asset and keeps the music/effects toggles independent.
- Survivor: hold the lowered gain for about a second so the fanfare is clear before the pad returns;
  an immediate ramp back is too shallow to notice.
- Survivor: no-op when effects are off (silent fanfare), when music is off, or while the pad is still
  fading in below half level.
- Survivor: expose `musicLevel()` for the played probe and a no-context test.
- Killed: stopping the music on victory. It would be abrupt and would need a manual restart.
- Killed: lowering the fanfare gains instead. The fanfare should stay prominent; the pad is the bed.
- Killed: changing the saved audio preferences. The duck is runtime-only.

### IMPLEMENT

Files:
- `src/ui/audio.js`: `MUSIC_LEVEL = 0.05`; `duckMusic(level = 0.014, hold = 1.0, restore = 1.8)`;
  `musicLevel()`; `playVictory` returns early when effects are off, otherwise ducks before the tones.
  The pad fade-in uses `MUSIC_LEVEL`.
- `tests/audio.test.js`: duck/musicLevel no-context case.
- `README.md`, `.aikit/decisions.md` ADR-024.

No engine, level, save or UI-inventory change.

### PROOF

Played run: headless Edge 157, 1440x900, Double Down with music on, one real click to unlock audio and
rotate, 3s for the pad to reach 0.05, then three more real clicks to win. A page-level wrapper records
every `createGain`; the probe pins the node at 0.05 before victory and samples it afterward.

| Sample | Before | After |
|---|---|---|
| Before victory | 0.0500 | 0.0500 |
| 150ms after winning click | 0.0500 | 0.0140 |
| 200ms after modal | 0.0500 | 0.0199 |
| 1.7s after modal | 0.0500 | 0.0500 |

The after run starts at 0.0447 immediately, reaches 0.0140 at 150ms, and is back to 0.0500 by the
1.7s sample. Reports: `.review/cycles/cycle-16/before-duck-report.json` and
`after-duck-report.json`. Audio only; no screenshot claim.

Full regression play: all 18 chambers solved through real DOM clicks at exact par with 3 stars, 0
console errors. Report: `.review/cycles/cycle-16/play-report-1440x900.json`.

### GATES

- `npm test` -> 107 tests, 107 pass, 0 fail (was 106; +1 duck no-context case).
- `python aikit.py check prism-relay` -> 5/5 gates passed: test, mechanics, hygiene, guidelines, secrets.
- `npm run ui:snapshot` -> inventory unchanged; no new handle or cue.
- `node --check src/ui/audio.js` -> syntax ok.
- Playwright root run: 18/18 levels ok, 0 page errors, 0 console errors.

Commit: `feat(audio): duck the music under the victory fanfare`.















