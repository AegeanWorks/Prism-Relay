# Prism Relay Improvement Cycles

Append-only record of continuous improvement cycles. Each entry states the area, the evidence found,
what was killed, the exact fix, the before/after proof, the played run, and the gate results.
Screenshots and generated reports live in the local, git-ignored `.review/cycles/<cycle>/` folder.

## Area rotation

| Cycle | Area | Status |
|---|---|---|
| 01 | Levels / tall-chamber presentation | done |
| 02 | Audio cues | next |
| 03 | Graphics and effects | planned |
| 04 | UI readability | planned |
| 05 | Progression and saves | planned |
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
