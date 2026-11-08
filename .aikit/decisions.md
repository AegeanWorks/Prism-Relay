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

### ADR-016: The moves HUD shows live star pace
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The HUD showed moves against par but not the rating those moves would earn. A player who crossed par by one learned that three stars were gone only from the victory card, even though `starsFor` already defines the boundaries at par and par+2.
- **Decision**: Add `#hud-stars` (`data-cue="hud-stars"`) to the moves metric. On every `updateGameView`, render `starsMarkup(starsFor(moves, par))` and set the accessible label "On pace for N stars". Reuse the existing `.stars`/`.star` styling with a compact `.metric .metric__stars` row. The value is derived from the session, so reset and start restore three stars automatically.
- **Consequences**: On Double Down (par 4) the HUD shows three earned stars at moves 0, two at moves 5, and one at moves 8, with matching aria labels. The row adds no horizontal overflow at 320, 360, 390 or 414px widths (metrics height 62-63px). The UI inventory gains one cue marker; no engine, level, save or interaction change. `npm test` stays at 87 with the HUD-cue contract assertion added to the existing UI test.

### ADR-017: Star state is carried by shape, not only color
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: In forced-colors emulation at Double Down moves 5, the HUD reported `earned: [true, true, false]` but all three stars used the filled `★` glyph and computed to the same `rgb(0, 0, 0)`. The HUD, chamber cards and victory card all share that markup, so star state disappeared for Windows High Contrast and was weak for color-impaired players. A reduced-motion audit found the existing guard already collapses the beam animation from 1.35s to 0.001s, so no motion change was needed.
- **Decision**: Move `starsMarkup` and `starLabel` into `src/ui/stars.js`. Earned stars keep the filled `★`; unearned stars render the outlined `☆` while retaining the same `is-earned` class and aria-hidden glyphs. The outer row keeps its count label. Pin the markup with four pure tests for 0, 2 and 3 stars plus labels.
- **Consequences**: Forced-colors now reads `★★☆` with all three glyphs black, and normal mode reads two gold filled plus one grey outlined star. The change automatically reaches the HUD pace, chamber cards and victory cards because they share `starsMarkup`. No score, save, engine, level or inventory change; `npm test` moves 87 to 91 with four star-markup cases.

### ADR-018: A receiver gets a one-shot ring burst when it first charges
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: Charging a receiver played the charge cue and started the persistent pulse, but the visual connection itself was only a border/glow swap. A probe on Split Decision 120ms after the charging click found no transient class or ring (`charging: 0`, `ringAnimation: none`) while the receiver was already 1/2 lit.
- **Decision**: Add `newlyLitKeys(before, after)` to `cues.js` and an optional previous-lit set to `updateBoard`. `markChargedReceivers` adds `is-charging` only to receivers added by that rotation, uses a per-node `WeakMap` timer to clear it after 600ms, and restarts the animation with a reflow if the same receiver charges again. `clearChargeBursts` handles start/reset. CSS draws a white `::after` ring with a 600ms linear `charge-burst` scale/fade, gets a Highlight border in forced colors, and collapses under the existing reduced-motion rule.
- **Consequences**: 120ms after a real Split Decision click, exactly one receiver has `is-charging` and the `charge-burst` animation; the class is gone by 820ms. Charging then resetting within the burst window clears the class at once and leaves moves 0 and receivers 0/1. The persistent lit state is unchanged. No engine, level, save or inventory change; `npm test` moves 91 to 93 with newly-lit key cases.

### ADR-019: Prism-only chambers teach the prism in the side panel
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: Split Decision and The Vault contain fixed prisms, but their mechanic note was hidden. Splitter and portal chambers already show an in-game note; the detailed prism behavior (pass through plus two perpendicular forks) lived only in the how-to dialog and the one-line legend, so the first Episode I mechanic was the only one without in-place teaching.
- **Decision**: Add `mechanicNotes(board)` in `src/ui/mechanics.js` returning the existing splitter and portal notes and, only when the board has prisms and neither splitters nor portals, a Prism note: "The prism passes the beam through and splits copies to both perpendicular sides." `updateGameView` renders the returned objects. Combo chambers keep their two notes without a third to avoid panel growth.
- **Consequences**: Split Decision and The Vault now show a pink Prism note above the legend; Double Down, Wormhole and The Confluence render exactly as before. Split Decision still clears in 2 moves at 3 stars. The side panel grows one note box on prism-only chambers and still fits 1440x900. No engine, level, save or inventory change; `npm test` moves 93 to 99 with six mechanic-note cases.

### ADR-020: Modal bodies scroll above a pinned action row
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: At 390x844 the Field Manual dialog was 760px tall and the whole dialog scrolled. The action row sat at y=832 with a 876px bottom, so the primary "Return to chamber" button was below the fold and the probe reported `primaryVisible: false`; a phone player had to discover scrolling before leaving the dialog. Desktop kept the button visible.
- **Decision**: Move `.modal__actions` out of `.modal__content`, make `.modal[open]` a flex column, give the content `min-height: 0; overflow-y: auto`, and pin the actions with a solid glass background and a one-pixel top rule. Content keeps its own scrollbar; the close button stays absolute at the top. Compact padding keeps full-width action buttons.
- **Consequences**: At 390x844 the content area is 673px with 765px of content, the action row is fixed at y=716-801, and the primary button is fully visible at y=733-777; tapping it closes the dialog and returns to `screen-game`. Scrolling the content to the bottom leaves the action rect unchanged. At 1440x900 the content fits exactly (658/658), the action row is 91px, and the keyboard line is no longer clipped. No engine, level, save or inventory change; `npm test` moves 99 to 100 with a modal-structure contract.

### ADR-021: The profile shows the next rank and remaining stars
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The profile named the current rank but not the next threshold. A player at 10 stars (Operator) and one at 18 stars both saw only "OPERATOR"; the next rank was visible only in the code. A seeded 10-star before capture shows no next line.
- **Decision**: Move the rank thresholds into a frozen `RANKS` table in `progress.js`, keep `rankFor` reading that table, and add `rankProgress(stars)` returning `{current, next, remaining, target, stars}`. Add a `profile-rank-next` line under the rank that reads "9 stars to Weaver", "1 star to Weaver" or "All 54 stars collected". The line is derived from `statsFor` on every profile render and has no save field.
- **Consequences**: A seeded 10-star profile now reads "OPERATOR / 9 STARS TO WEAVER"; a fresh save after one 3-star First Light clear reads "CADET / 5 STARS TO OPERATOR"; the cap reports all 54 collected. `rankFor` returns the same values for every threshold and the existing rank test still passes. No engine, level, save or inventory change; `npm test` moves 100 to 103 with three rank-progress cases, and the UI inventory gains one cue.

### ADR-022: The last rotated cell stays marked and the turn class clears
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: After the 280ms `is-turning` bump, nothing on the board recorded which rotatable was last changed. A probe on The Confluence after a real splitter click and a 450ms wait found `lastMoved: []`; the stale `is-turning` class never cleared (`turning: ["2,3"]`, then `["2,3","4,3"]`). On a 15-rotatable finale the player had to infer the last move from the beam alone.
- **Decision**: Add `is-last-moved` to the clicked cell and remove it from every other rotatable on each successful rotation; reset clears it too. Use a per-node `WeakMap` timer to remove `is-turning` after 320ms, clearing any prior timer first so rapid clicks restart both the animation and the cleanup. CSS draws a thin current-cyan outline inside the cell gutter, mapped to Highlight in forced colors.
- **Consequences**: A real splitter click leaves `lastMoved: ["2,3"]` and `turning: []` after 450ms; clicking the mirror moves the marker to `["4,3"]`; reset leaves both empty. The board crop shows the outline moving to the clicked cell. No engine, level, save or inventory change; `npm test` stays at 103 because the interaction is covered by the played probe.

### ADR-023: The title action becomes a replay after all eighteen chambers
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: A played 54-star save showed "Enter the relay" on the title action, and clicking it started First Light. The completion state was visible in the 54/54 stat but the primary label still described a first entry, so the endgame action lied about what it did.
- **Decision**: Add `relayCtaLabel(completed, total)` in `src/ui/hints.js`; it returns "Replay the relay" only when `total > 0` and every chamber is complete, otherwise "Enter the relay". Wrap the title button text in `#start-label` and update it from `updateTitleStats` on every title render. The click behavior is unchanged: it still starts the first uncleared chamber, which is First Light after a full clear.
- **Consequences**: A played 18/18 save with 54 stars and 111 best moves reads "Replay the relay"; clicking it starts First Light at 0 moves. A save at 0 or 17 cleared chambers still reads "Enter the relay". No engine, level, save or UI-inventory change; `npm test` moves 103 to 106 with three CTA-label cases and one label-span contract.

### ADR-024: The victory fanfare ducks the ambient music
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The ambient pad sits at gain 0.05 while the four victory tones play at 0.035-0.04, so the fanfare competed with the music it should sit above. A played Double Down run with a gain-node probe tracked the 0.05 pad and found it unchanged at 150ms, at the modal, and 1.7s after victory.
- **Decision**: Add `MUSIC_LEVEL = 0.05`, `duckMusic(level = 0.014, hold = 1.0, restore = 1.8)` and a `musicLevel()` probe in `audio.js`. `duckMusic` cancels pending automation, ramps from the current value to 0.014 in 120ms, holds for 1s, then ramps back to 0.05 by 1.8s; it no-ops when there is no context, no music gain, or the pad is below half level. `playVictory` returns early when effects are disabled and otherwise ducks before the tones.
- **Consequences**: The same played run reads 0.050 before victory, 0.014 at 150ms after the winning click, and 0.050 at 1.7s after the modal; the before run stayed at 0.050 at every sample. The music and effects toggles, start/stop paths and no-context behavior are unchanged. Audio only, no screenshot claim; `npm test` moves 106 to 107 with a duck no-context case.

### ADR-025: Every navigation and dialog control plays the UI cue
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: With music disabled, a played probe found `openChambers` played the 440Hz UI tone while How to play, the dialog X, Back to title, brand home, profile back, pause and game back produced no tone. The same class of navigation action sounded inconsistent depending on the screen.
- **Decision**: Add `audio.playUi()` to the silent handlers: How to play, modal close, back-to-title/brand-home, game back, profile back, the pause button and the Escape pause path. Keep the calls in click/key handlers rather than the modal-opening functions, so `?preview=howto` and `?preview=pause` screenshot loads stay silent.
- **Consequences**: A played run with music off now logs `[440]` for How to play, dialog close, Episode index, Back, brand home, profile back, pause and game back; the before run logged `[]` for all except Episode index. No new audio asset, volume or save change; the no-context audio tests still pass, and `npm test` stays at 107 because the interaction is covered by the played probe.

### ADR-026: Forced-colors mode uses the native audio checkboxes
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The cycle-18 accessibility audit passed keyboard-only play (Tab to start, Enter, Tab to the mirror, Space to clear, Enter to next), reduced motion (beam/screen/mirror 0.001s) and 320px widths (no horizontal overflow), but the forced-colors profile showed the Music and Effects switches as empty pills. The custom toggle hides the checkbox at opacity 0 and draws a 16px knob; forced colors mapped the knob and pill to the same Canvas, so on/off was invisible.
- **Decision**: In the forced-colors block, hide `.toggle` and show the real `input[type="checkbox"]` at 24x24 with opacity 1. A plain `.toggle-row input` override was beaten by the later base rule, so the forced selector uses `input[type="checkbox"]` for specificity. The system checkbox supplies the check mark, focus ring and state semantics.
- **Consequences**: The forced-colors profile now shows two native checked boxes with Music/Effects labels; clicking Music leaves it visibly unchecked while Effects stays checked. The before probe measured `inputOpacity: 0`, `inputWidth: 1px`, the custom toggle visible and a white knob; the after probe measures `inputOpacity: 1`, `inputWidth: 24px`, `toggleDisplay: none`. Normal-color mode is unchanged. No engine, level, save or inventory change; `npm test` stays at 107 because the fix is CSS and the played probe is the reproducer.

### ADR-027: Wide chambers pan at a 28px cell floor on phones
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: Crosscurrent is 21x7 and filled the phone width, producing 16.2px cells at 390x844 and 12.8px at 320x568, below the 24px target floor. Landscape fits the whole board at 29.1px, but portrait could not both show every column and keep usable targets.
- **Decision**: Wrap the board and beam SVG in `.board-viewport`/`.board-stage`. On compact layouts, `wideBoardNeedsPan` asks whether `columns * 28px` exceeds the viewport; when true, the stage is widened to `columns * 28` and the viewport scrolls horizontally. The beam layer fills the stage (inset 0), so paths stay aligned. A `board-pan-hint` strip explains the swipe and the optional landscape view. The compact grid uses `minmax(0, 1fr)` with `min-width: 0` on grid children so the wide stage cannot widen the page.
- **Consequences**: At 390x844 Crosscurrent renders 28px cells in a 340px viewport with a 588px stage, page scroll width stays 390, and the hint shows; at 320x568 the cells stay 28px with a 270px viewport. Landscape renders the whole board at 29.1px with no hint. A real portrait run cleared Crosscurrent in 9 taps at 9 moves/5 receivers/3 stars. Desktop geometry is unchanged (640px Crosscurrent frame, beam aligned to the board). No engine, level or save change; `npm test` moves 107 to 110 with three pan-decision cases.

### ADR-028: Tall chambers height-fit on phones down to the 24px floor
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The 11x23 finale rendered a 340x711 board starting at y=264 and ending at 974 on 390x844, 130px below the fold; at 320x568 it ended at 867. The 320 case already had 24.5px cells and only needed page scroll, so shrinking it further would make targets worse.
- **Decision**: In the compact layout, after the wide-board branch, tall boards (`rows > columns`) whose current frame is taller than the space to the next 8px reserve get `fitBoardWidth` with `minWidth = columns * 24 + frameX`. Apply the fitted width only when the resulting frame height fits the available space or the fit is at least 24px narrower than the current frame; otherwise keep the 100% width and page-scroll fallback. Inputs are the measured frame padding/border and accumulated `offsetTop`.
- **Consequences**: At 390x844 the finale is 287px wide with a 269x562 board, 24.5px cells and a frame bottom at 835, fully visible. At 320x568 the width stays 288px, 24.5px cells, board bottom 867 with the existing page scroll. At 844x390 landscape the board shrinks from 1278px to 552px tall at 24px cells. Portrait finale runs at both 390 and 320 cleared in 13 taps at 13 moves/6 receivers/3 stars. Desktop geometry is unchanged; `npm test` moves 110 to 112 with two tall-phone cases.

### ADR-029: Phones filter the chamber index with episode tabs
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The index stacked all four episodes and eighteen cards, producing **5,224px** of scroll at 390x844 and **5,359px** at 320x568. A phone player had to scroll past locked episodes to reach the current one. Desktop already fits all episodes in a two-column grid.
- **Decision**: Add `nextEpisodeId(progress)` to `progress.js` (first unlocked incomplete chamber's episode, otherwise Ignition). Render four `EP I`–`EP IV` tabs in `#episode-tabs`, mark the active block `is-active`, and use a `max-width: 720px` rule to show only the active block and the tab bar. Tab labels are compact and carry the full episode name in `aria-label`; clicking sets UI-only `state.chamberEpisode` and focuses the new active tab. Desktop hides the tabs and shows all blocks. Base `.episode-tabs { display:none }` sits before the mobile media block so source order cannot hide the tabs.
- **Consequences**: At 390x844 the index is **1,997px** (from 5,224) with four tabs fitting, one episode visible and no page-width overflow; at 320x568 it is **2,080px** (from 5,359) with all four tabs fitting. Desktop remains 2,439px with all four blocks visible and tabs hidden. A seeded Ignition-complete save defaults to Refraction, switches to Ignition and back, opens Double Down, clears it in 4 taps at 4 moves/2 receivers/3 stars and returns with Refraction still active. No save change; `npm test` moves 112 to 115 with three next-episode cases.

### ADR-030: Undo reverts the last rotation from an in-memory history
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: A mistap on a 24–28px phone cell forced a full chamber restart or a worse star score, because the game only offered restart. Undo is a standard puzzle affordance and matters more on touch boards, but a persistent move history would change the save format and the deterministic par model.
- **Decision**: `createSession` owns a `history` array. `rotateSessionCell` pushes `{x, y, orientation}` before changing a piece, so `undoSession` can pop the last entry, restore the prior orientation, decrement moves, clear completion/star state and refresh the beam. `resetSession` clears the history; it is never serialized. The HUD gains an `undo-move` icon button with the `Z` shortcut. The button is disabled when history is empty and whenever the board is paused, complete or under a modal; undo also clears the last-moved marker and restores it to the reverted piece. Phone HUD controls are 44x44 regardless of the narrow-width metric wrapping.
- **Consequences**: On Split Decision, three rotations drop the pace to 2 stars; one button undo returns to 2 moves and “On pace for 3 stars”, two `Z` presses return to 0 moves with the button disabled, and a clean 2-tap solve still earns 3 stars. A desktop rotation followed by Z restores the piece and move count. At 390 and 320 the three HUD controls measure 44x44, stay inside the viewport, and the page has no horizontal overflow. No engine save format, level or inventory change; `npm test` moves 115 to 118 with three session-history cases.

### ADR-031: Restart asks once a run has a move
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The restart icon sits beside undo in the phone HUD and reset every piece on a single tap. Undo cannot recover a reset because reset clears the history, so a mistap could erase a 13-move run.
- **Decision**: Route the HUD reset and R through `requestReset`. With zero moves, or after completion, it resets immediately. With moves and no completion it opens the existing modal with `restartPrompt(levelName, moves)` copy, Keep playing as the primary action, and Restart chamber as the secondary action. The pause dialog's explicit restart stays direct. No board snapshot or save change is added.
- **Consequences**: At 390 and 320 the dialog shows the chamber name and move count with two 44px actions and no page-width overflow. Keep playing and Escape preserve the move, orientation and enabled undo; confirming returns to 0 moves, the opening orientation and a disabled undo. Zero-move reset stays immediate, the desktop R path matches, and the 18-level run is unchanged. `npm test` moves 118 to 121 with three restart-copy cases.

### ADR-032: Daily Relay lives in its own save and never touches campaign progress
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The campaign had no reason to return after 54 stars, and the store analysis flagged the missing retention loop. Reusing the campaign save for a daily challenge would unlock chambers out of order and blur the campaign star total.
- **Decision**: Add `src/ui/daily.js`, which maps each local calendar day from a 2026-01-01 epoch to one of the eighteen chambers and stores the last sixty results plus a `{count, last}` streak under `prism-relay.daily.v1`. The title card starts the daily directly; the game header names the daily date. `finishLevel` branches before `recordResult`, saving only the separate daily record, and the daily victory modal offers Back to title or Play again. Replaying keeps the better result and never extends the streak twice; a streak survives through the end of the following day. The campaign `prism-relay.progress.v1` schema and version are unchanged.
- **Consequences**: On 2026-11-08 a fresh profile shows The Vault as the daily, clears it in six taps at 3 stars, and still shows 00/54 campaign stars and no campaign best. The daily key holds the date result and a 1-day streak; replaying keeps both at 1. At 390 the card is a 367x66 row and at 320 a 301x112 stack, both without horizontal overflow. `npm test` moves 121 to 133 with eleven daily cases and one daily victory action.

### ADR-033: Episode tabs advance on a clear, and daily bests are explicit and durable
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The cumulative 1→3 and 1→6 reviews found three gaps: an explicitly selected episode tab stayed on a completed episode; a daily replay could show current-run stars beside the day's best moves without naming the best stars; and the profile had no lifetime daily totals while the best streak could disappear after the 60-day result window. The daily record also capped the streak count at 60, which could truncate a longer real streak.
- **Decision**: Add `episodeIdAfterLevel` and set `state.chamberEpisode` only when a campaign episode actually ends. Store `bestStars` in a daily result and label the modal cell **Best today** with moves and stars. Add `dailyStats` for total played days and best streak, and show both in the profile. Persist `best` in the daily `streak` object; normalize older records as `best = count`, preserve it across gaps, and cap it at 3,650 days instead of the 60-day history limit.
- **Consequences**: Clearing The Vault with the Ignition tab selected returns to EP II / Refraction. A worse daily replay shows the current 2 stars but **Best today 6 · 3 stars**, while the title keeps the 6-move, 3-star result and the 4-day streak. A current streak of 1 with stored best 4 shows **Best streak 4** in the profile at 390 and 320 without overflow. The campaign save is unchanged; `npm test` moves 133 to 139 with two episode-transition, three daily-streak, and one profile-contract case.
