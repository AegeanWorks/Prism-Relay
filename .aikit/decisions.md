# Decisions

Why this project is built the way it is, oldest first. One entry per decision that changes a
contract, a dependency, a data format or the architecture; IDs are consecutive and never reused.

<!-- Entry format:
### ADR-NNN: <decision in one line>
- **Date**: YYYY-MM-DD
- **Status**: Accepted
- **Context**: <what forced the decision>
- **Decision**: <what was decided>
- **Consequences**: <what follows, including what it costs>
-->

### ADR-001: Static zero-dependency ESM game with a pure beam engine and solver-backed pars
- **Date**: 2026-10-24
- **Status**: Accepted
- **Context**: The game must run instantly in a browser, be testable without a bundler, and support screenshot-based UI review by several independent model providers.
- **Decision**: Ship plain HTML, CSS and ES modules served by a Node standard-library server. Keep beam physics, level parsing and scoring in pure modules; render the board with DOM cells and an SVG beam overlay; store progress in a versioned localStorage envelope. Prove every shipped chamber with a brute-force solver test whose minimum move count equals the advertised par.
- **Consequences**: No install or network is needed to play. The board is fully keyboard-accessible. Levels are capped at 20 mirrors so the solver stays instant. Visual polish lives in CSS tokens, which the AIKit UI guard can enforce.

### ADR-002: Episodes introduce rotatable splitters and paired portals; profile and music stay local
- **Date**: 2026-10-24
- **Status**: Accepted
- **Context**: The original six chambers form a complete arc but leave no long-term progression. The user asked for a profile, more episodes that get harder, mechanics that appear later, and music.
- **Decision**: Group chambers into three ordered episodes: Ignition (mirrors and fixed prisms), Refraction (rotatable splitters), Crossing (paired teleport portals). Generalize the solver to enumerate every two-state rotatable, so splitters are covered by the same par proof as mirrors. Keep the progress envelope version at 1 and add optional `music` and `profile` fields with normalized defaults, plus sequential-unlock repair so saves made before the new episodes still open the first new chamber. Profile callsign, sigil, rank and audio settings live in localStorage; background music is synthesized with WebAudio after a user gesture, with no audio assets.
- **Consequences**: Old saves are preserved without a destructive migration. Episode content adds 7 chambers and 2 mechanics; the final chamber carries 13 rotatables, so the solver still runs in milliseconds. Portal paths are emitted as separate segments to avoid drawing a false line across the grid. Music is intentionally simple and stops when the tab is hidden.

### ADR-003: Landing keeper at HEAD; gameplay view waits for click control
- **Date**: 2026-11-03
- **Status**: Accepted
- **Context**: The 10-28 landing keeper predates the victory-modal fix and the playable contract; the game has no deep links or demo mode, and click control was unavailable, so a chamber view could not be captured honestly.
- **Decision**: Register `2026-11-03-home.png` (served landing via headless Edge, commit `5d7fcbe`, viewport 1440x900) in `.aikit/media.json` and the README `aegean:screenshots` block; capture a real chamber view once click control returns.
- **Consequences**: README proves the current landing; gameplay coverage stays open. Reproduce with: `npm start`, headless `--screenshot` the root URL.
## Licensing migration (v0.2.0-agpl)

- New versions use Aegean Game License 1.1 (AGL-1.1); versions at or before `v0.2.0-agpl` remain AGPL-3.0.
- Rights holder: AegeanWorks; internal AI commit identity `assistant@local`.
- Counsel review of the 1.1 texts remains pending.

## License notice cleanup (2026-10-26)

- The license-history notes were removed from README.md and COMMERCIAL.md: the project is offered only under the Aegean Game License 1.1 (AGL-1.1), with commercial use under ACL-1.0.

### ADR-004: Beam endpoints get SVG terminus markers; portal transits stay unbridged
- **Date**: 2026-11-03
- **Status**: Accepted
- **Context**: Dead-end beams rendered as blunt-cut dashes with no terminus, while portal jumps correctly emit separate SVG segments per ADR-002. A mobile-HUD overflow report from headless Edge screenshots turned out to be a minimum-window crop artifact: a true-390px iframe probe shows no overflow (body scrollW equals viewport, both HUD buttons visible) before and after, so no HUD change ships.
- **Decision**: Append one SVG circle per beam-path end in `renderBeams` (bright dot on lit receivers, softer dot on dead ends, path color per source), skipping paths that end on a portal cell so the transit gap is never bridged; stash the lit set on the session (`litKeys`) instead of changing the engine. Lift locked-episode legibility tokens only (chamber card opacity 0.62 to 0.85, saturate 0.35 to 0.6; episode grid 0.55 to 0.8), keeping lock semantics and footers.
- **Consequences**: No engine, contract, or test change; 50/50 tests and 5/5 AIKit gates still pass. Forced-colors maps markers to Highlight; no new animation is added, so reduced-motion behavior is unchanged. Before/after pairs: first-light, double-down, wormhole (terminus dots; no portal dots), chambers (locked legibility), victory/howto regressions, true-390 probe (no overflow either side).

### ADR-005: Episode IV Confluence teaches only combo-mechanics with embedded solutions plus solver proof
- **Date**: 2026-11-03
- **Status**: Accepted
- **Context**: Three episodes end at Crossing with portals taught in isolation; new chambers must be more game without a new simulation, and every level must ship solvable with its par equal to the true minimum.
- **Decision**: Add five chambers (14 Detour M1 splitter-to-portal par 4; 15 Overpass M2 prism-fan-to-portal par 5; 16 Relay Chain M3 portal-mirror-portal series par 6; 17 Crosscurrent M1+M2 par 9; 18 The Confluence M1+M2+M3 par 13) as DATA in `src/game/levels.js` with frozen rows plus an embedded `solution` vector; keep `engine.js` and `solver.js` unchanged (all combos use mirror/splitter/prism/portal primitives, solver cap stays 20, new max 15 rotatables). Tests assert solver minimum equals par, embedded solution completes, and double-trace `lit` equality for portal determinism; rank thresholds rescale proportionally for 54 stars (Operator 8, Weaver 19, Architect 32, Lumen 44, Master 54).
- **Consequences**: Solver proof for all 18 levels runs ~1.4s in `npm test` (finale 2^15 traces); gameplay cost unchanged (single `traceBeams` per move). Saves stay additive (`progress.v1`, sequential-unlock repair appends Confluence after Crossing). Counts move 13/39 to 18/54 across `index.html`, README, and all three test files.

### ADR-006: Polish pass stays token-only with no new UI handles
- **Date**: 2026-11-03
- **Status**: Accepted
- **Context**: New episode needs a visual pass on every screen without drifting the AIKit UI contract or breaking coarse-pointer, forced-colors, and reduced-motion guarantees.
- **Decision**: Change only `src/theme.css` tokens (stronger `--shadow-glow`, brighter line tokens) and value-level `src/styles.css` rules (beam halo opacity 0.42 to 0.55 with 8px glow, core width 0.062 to 0.075, complete-frame glow reuse); add no `data-ui/panel/cue` handles so `npm run ui:snapshot` baseline is byte-identical.
- **Consequences**: `npm test` 50/50 and snapshot unchanged; screenshots (title, chambers with Episode IV, detour gameplay) prove the pass. Larger combined chambers (Crosscurrent 21x7, Confluence 11x23) render within the existing board grid; no layout change ships.

### ADR-007: Static server refuses dotfile and dot-directory paths
- **Date**: 2026-11-04
- **Status**: Accepted
- **Context**: `safePath` confined reads to the project root but still served `.git/HEAD`, `.aikit/reforge.json`, and any dotfile, leaking repo metadata through the game server. Reproduced with `safePath('/.git/HEAD')` returning a path instead of null.
- **Decision**: Reject any request whose relative path contains a segment starting with `.` before the containment check; add a failing-first `server.test.js` case for `.git`, `.aikit`, `.gitignore`, nested dotfiles, and encoded `%2Egit`.
- **Consequences**: Game files (`index.html`, `src/**`, assets) serve unchanged; dot paths return 403. No engine, level, or contract change.

### ADR-008: Relay verify wave 2 source-scoped beams, strict results, and fast preview
- **Date**: 2026-11-06
- **Status**: Accepted
- **Context**: The last-3-push window (dotfile refuse, audio coverage, episode-count sync on top of Episode IV) left four gaps: `traceBeams` shared one `visited` set across emitters so converging portal beams lost a path segment (`>1T` over `>.1` traced 3 paths, not 4); `resolvePort` ignored `--port=8000`; `recordResult` accepted negative moves, out-of-range stars, and unknown levels (an invalid write could drop the stored best on the next normalize); `previewVictory` brute-forced `solveLevel` even when the level ships an embedded optimal solution (2^15 traces for the finale).
- **Decision**: Scope `visited` and portal-exit keys by emitter `source`; accept `--port=` alongside `--port` with the same 1-65535 fallback; validate `recordResult` inputs and unknown unlocks before writing; prefer the embedded `solution` with `moves = par` in `previewVictory` and fall back to the solver only when no embedded vector matches. Pin with failing-first tests for 4-path portal convergence, `--port=` forms, invalid-result preservation, and embedded-moves-equals-par.
- **Consequences**: `npm test` 56/56 and `npm run ui:snapshot` unchanged (no new handles). Multi-emitter renders keep per-source colors past shared portals; invalid saves can no longer clobber bests; screenshot previews stay instant on large chambers.

### ADR-009: Tall chambers fit the desktop viewport through a tested width calculation
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: `--board-max: 640px` capped only width, so the 11x23 finale produced a 1297px-tall frame at 1440x900 (bottom 1484) and 45% of the relay sat below the fold; at 1280x720 only 37% was visible. The board is the puzzle, so scrolling away from half the beams breaks solving.
- **Decision**: Add pure `fitBoardWidth` in `src/ui/layout.js`. On layouts wider than 900px, set the frame width to the smaller of its CSS allowance and the width that fits the chamber between its measured document top and a 56px foot reserve, clamped to a 304px floor (24px cells for 11 columns). Include padding and border in the arithmetic, use accumulated `offsetTop` rather than `getBoundingClientRect().top` so the screen-in transform cannot bias the first measurement, and recompute on resize through one coalesced animation frame. Compact layouts keep the full column width.
- **Consequences**: The Confluence renders 334px wide and 657px tall at 1440x900 (26.9px cells) with the entire relay visible; 1280x720 keeps 24.2px cells with 57px of page scroll, the smallest possible with the 24px floor. Square boards also fit at 720p; other chambers are unchanged at 1440x900. Engine, levels, saves and the UI inventory are untouched; `npm test` moves 56 to 62 with six pure layout cases.

### ADR-010: Beam-state changes carry derived audio cues
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: A played run showed the two most important consequences of a rotation were silent: charging one of two receivers on Split Decision played only the 660Hz rotate click, and flipping the Detour splitter to route the beam through gate 2 played only the 520/780Hz splitter pair. `audio.js` already exported `playPortal`, but nothing called it.
- **Decision**: Move `cellNear` from `app.js` into the pure engine as an exported geometry helper. Add `src/ui/cues.js` with `portalTransitKey(board, paths)` (sorted portal cells where beam segments end) and `feedbackFor(before, after)`, which reports `charge` when the lit receiver count rises and `portal` when the transit signature changes. After the existing rotate/split action sound, the app layers a new two-note `playCharge()` (880Hz then 1318.5Hz) and/or the existing portal sweep (330Hz then 660Hz), at low gain so several cues can coexist.
- **Consequences**: Receiver progress and gate transits are audible on the same real click that changes them; no action sound is replaced and no audio asset is added. Missing or unchanged state stays silent, portal loss is reported like portal gain, and the charge cue only fires on a rise, never on a disconnect. No visual, save-format, level or inventory change; `npm test` moves 62 to 73 with cue, portal-key and cellNear cases.

