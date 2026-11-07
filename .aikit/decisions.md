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

### ADR-011: Portal pairs get identity colors and a live-state emphasis
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: Every portal gate rendered at full brightness whether or not the beam used it, and pairs 1, 2 and 4 all used lime. In Long Way Home the live pair 1 and the idle pair 3 looked identical; in The Confluence the live pair 2 looked like idle pairs 1 and 4. With four pairs in one chamber, the gate numbers were the only way to tell them apart.
- **Decision**: Give pair 1 lime, pair 2 cyan, pair 3 magenta and pair 4 gold by setting `color`/border/shadow per `data-pair`. Dim non-live pieces to 0.55 opacity and 0.6 saturation; live pairs return to full opacity, add a current-color drop shadow and a breathing `::after` ring. `livePortalPairs(board, paths)` expands each beam-entry gate to its whole pair, and `updateBoard` toggles `is-live` on both gate cells and appends "The beam is passing through this pair." to their accessible labels. The forced-colors block maps a live border to Highlight, and the global reduced-motion rule collapses the ring animation.
- **Consequences**: Long Way Home shows live lime pair 1 against dim magenta pair 3; The Confluence shows live cyan pair 2 against dim lime, magenta and gold pairs. The live set moved from `[2,2]` to `[1,1,2,2]` on a real splitter flip and reached all four pairs on the 13-move clear. No engine, level, save, interaction or UI-inventory change; `npm test` moves 73 to 76 with three live-pair cases.

### ADR-012: The par target survives compact HUDs
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: The `max-width: 520px` block hid `.metric em`, which is the only place the game screen prints the par target. On a 390px phone, Double Down rendered `MOVES 0 RECEIVERS 0/2`; par appeared only in the chamber card before entry, and splitter/portal levels do not show it in the hint box. First Light also read "Par is 1 moves." on desktop.
- **Decision**: Remove the compact `display: none` rule and let the existing `.metric` wrap handle narrow widths. Extract `parHint(par)` in `src/ui/hints.js` to emit singular or plural copy and use it for the mirror-level hint. Add a stylesheet guard test that fails if `.metric em` is hidden again.
- **Consequences**: Par stays visible at 320, 360, 390 and 414px widths; the metrics bar is 62px at 360+ and 65px at 320 with no horizontal overflow (`scrollWidth` equals `innerWidth`). A touch play of Double Down completed in 4 taps at 4 moves/2 receivers/3 stars with `/4 par` visible throughout. First Light reads "Par is 1 move. Every rotation counts." No engine, level, save or UI-inventory change; `npm test` moves 76 to 80 with three hint cases and one stylesheet guard.

### ADR-013: An older build never overwrites a newer save version
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: G-001 requires a loader to refuse an unsupported state version without modifying or quarantining it. `loadProgress` already returned blank defaults for `version: 2`, but `saveProgress` normalized whatever it was given and wrote version 1. A played probe seeded a version-2 record with a FUTURE profile, `music: false`, a stored best and a `futureOnly` field; completing First Light replaced the record with version 1, reset the profile to OPERATOR and deleted `futureOnly`. A future save could be destroyed by an older cached page.
- **Decision**: Before writing, parse the existing record. If it is an object with an integer `version` greater than `PROGRESS_VERSION`, return `false` and write nothing; the record stays byte-for-byte intact. Corrupt or unparseable JSON remains replaceable as before, and supported version-1 records keep their existing round-trip behavior. Loading still yields blank in-memory defaults for an unsupported version, so the game remains playable read-only.
- **Consequences**: The same played probe now ends with version 2, the FUTURE profile, `music: false`, the stored best and `futureOnly` all unchanged, while the First Light victory still triggers with 3 stars. Version-1 saves and the corrupt-record recovery path are unchanged. No visual or inventory change; `npm test` moves 80 to 82 with newer-version and corrupt-recovery cases.

### ADR-014: A dismissed victory dialog leaves a forward action in the game foot
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: The victory dialog is dismissible with Escape or the X button. After First Light was cleared and Escape pressed, the game screen showed 1 move, 1/1 receivers and "Relay closed. Chamber complete."; the next chamber was unlocked but there was no forward control, and clicking the completed board left the move count unchanged. The only route onward was the back arrow to the episode index.
- **Decision**: Add `postVictoryAction(result)` in `src/ui/hints.js`: `{label: "Next chamber →", levelId}` when a next chamber exists, otherwise `{label: "Episode index", screen: "chambers"}`. Add a hidden `data-ui="next-step"` button to the game foot; `updateGameView` reveals it whenever the chamber is complete and a result exists, `finishLevel` and `previewVictory` refresh it after the result is stored, and restart/start hide it. The click starts the next level or opens the chamber index.
- **Consequences**: Pressing Escape after First Light now leaves a "Next chamber →" button in the game foot; clicking it loads Split Decision at 0 moves, par 2 and 0/2 receivers. The finale similarly offers "Episode index". The UI inventory gains one control (`next-step`), and the required-control contract covers it; no engine, level or save change. `npm test` moves 82 to 85 with three post-victory action cases.

### ADR-015: Refused saves are reported instead of claiming success
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: Cycle 05 made a newer-version record read-only, but the profile still always printed "Callsign saved." and "Sigil updated." and the victory card printed a normal result. A played probe with a version-2 record showed `storedCallsign: FUTURE` after a NOVA save and `storedSigil: helix` after choosing Orbit, while the UI said both succeeded; First Light showed 3 stars and no warning while the result was not stored.
- **Decision**: Add `saveStatusMessage(saved, success)` in `src/ui/hints.js` and use the actual `saveProgress` return in the callsign, sigil and audio-toggle handlers; a refused write shows "Changes are not being stored." `finishLevel` records `saveFailed: !saved` in the victory result and `openVictoryModal` appends "Progress for this run is not being stored." to the card. Normal success copy is unchanged, and preview results omit the flag.
- **Consequences**: With a version-2 save, the callsign and sigil actions now report "Changes are not being stored." while the stored record stays FUTURE/helix, and the First Light victory card carries the warning. A normal version-1 save still reports "Callsign saved." and stores NOVA. No save-format, engine, level or inventory change; `npm test` moves 85 to 87 with two status-copy cases.

