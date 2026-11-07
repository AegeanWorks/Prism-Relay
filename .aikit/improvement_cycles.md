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
| 05 | Progression and saves | next |
| 06 | Game feel | planned |

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



