# Release Readiness

AI Presence Kit is a public `0.x` package family. `v0.1.0` was published on 2026-06-14, and the repository now has repeatable gates for major improvements and future releases.

## Public Package Surface

```text
@ai-presence/core
@ai-presence/face
@ai-presence/adapters
@ai-presence/react
```

Each package has:

- `package.json`
- CommonJS/browser-global source entrypoint
- ESM import entrypoint at `dist/index.mjs`
- TypeScript declaration file
- README
- `files` allowlist

Current public API proof points:

- `@ai-presence/core` owns canonical states, events, runtimes, traces, renderer-agnostic trace summaries through `summarizePresenceTrace` including `interruptMs` and `interrupted`, and shared control inputs.
- `@ai-presence/face` owns expression mapping, parallel controller decisions, temporal frame reports, decision-trace evidence through `faceControllerDecisionTraceForFrame`, coherence audits through `faceControllerCoherenceForFrame`, the `motionScale` reduced-motion option, and SVG rendering through `renderPresenceFaceSvg`.
- `@ai-presence/adapters` owns plain-object bridges for generic runtime signals, Vercel AI SDK status, OpenAI Realtime events, and generic chat events.
- `@ai-presence/react` owns provider/runtime/snapshot hooks, renderer slots, shared control-input access, and the renderer-agnostic `usePresenceFrameTime()` hook.

## Demo Surfaces

```text
http://127.0.0.1:8058/
http://127.0.0.1:8058/?metrics=1&presence=expressive
http://127.0.0.1:8058/?compare=1&autorunCompare=1
http://127.0.0.1:8058/examples/react-browser.html
```

Command-line demos:

```bash
npm run demo:adapters
npm run demo:quickstart
npm run demo:status-surface
npm run demo:composer-lane
npm run demo:react
```

`npm run demo:quickstart` runs a no-network adoption proof that maps generic chat lifecycle events through the package APIs and prints `statePath`, `eventPath`, `firstOutputMs`, `leadMs`, `finalState`, `hasOutput`, `complete`, and `interrupted`.

`npm run demo:status-surface` runs a framework-free non-face consumer proof that maps the same adapter-driven lifecycle into a plain status surface. It prints `renderer=status-surface`, `statePath`, `eventPath`, `phasePath`, `beforeOutput=true`, `firstOutputMs`, `leadMs`, `finalState`, `hasOutput`, `complete`, and `interrupted`, while the surface model exposes `data-renderer="status-surface"`, `data-presence-state="waiting"`, `data-presence-phase="before-output"`, `data-presence-attention="response"`, `data-presence-event="stream-open"`, and `data-presence-before-output="true"` before the first output.

`npm run demo:composer-lane` runs a real-app-style composer lane proof that simulates Vercel AI SDK-style `submitted`, `streaming`, and `ready` updates without a framework dependency. It prints `renderer=composer-lane`, `statePath`, `eventPath`, `phasePath`, `streamOpenMs`, `firstOutputMs`, `leadMs`, `finalState`, `hasOutput`, `complete`, and `interrupted`, while the lane model exposes `data-renderer="composer-lane"`, `data-presence-state="waiting"`, `data-presence-phase="before-output"`, `data-composer-lock="true"`, `data-assistant-text-empty="true"`, and `data-progress-step="stream-open"` before the first output.

`npm run demo:adapters` reports compact trace summaries for adapter-driven turns, including `interruptMs` and `interrupted` so interruption posture is observable without importing the face renderer into core.

README media:

```text
docs/media/presence-comparison.jpg
docs/media/react-browser-demo.jpg
```

## Validation Gates

Run before packaging or publishing:

```bash
npm run validate
```

That command expands to:

```bash
npm run check
npm test
npm run demo:adapters
npm run demo:quickstart
npm run demo:status-surface
npm run demo:composer-lane
npm run demo:react
npm run pack:dry-run
```

Recommended local package-level performance smokes:

```bash
npm run perf:core
```

`npm run perf:core` measures the renderer-agnostic package path before the face renderer: core runtime sends, Vercel AI SDK and generic chat adapters, trace recording, and `summarizePresenceTrace` over completed traces. It is local package-level core/adapters/trace-summary latency evidence, not a browser smoke route, OpenAI/network probe, or authenticated release check.

```bash
npm run perf:face
```

It measures shared presence snapshots across all canonical states through `faceControllerFrameForPresence` -> `faceControllerDecisionTraceForFrame` and full `renderPresenceFaceSvg` output, then fails on incomplete, renderer-unsafe, warning-bearing, missing SVG trace attributes, or over-budget six-channel trace evidence. This is package-level latency evidence and is not currently part of the release-blocking `npm run validate` gate, browser smoke, or remote model latency probes.

Also run `git diff --check` before committing.

Then browser-smoke:

- Reference demo loads with no console warnings or errors.
- Default route exposes safe live server-backed response evidence on the document root, face shell, and metrics panel through `data-live-response-configured`, `data-live-response-stream`, `data-live-trace-summary`, `data-live-trace-entry-count`, `data-live-trace-first-output-ms`, `data-live-trace-first-output-event`, `data-live-trace-lead-ms`, `data-live-trace-final-state`, `data-live-trace-has-output`, and `data-live-trace-complete`.
- Metrics route exposes canonical `Presence state`, controller composition, controller evidence, live controller frame evidence, coherence evidence, and decision-trace evidence through `data-controller-decision-trace*`.
- Controller gallery route exposes fresh transition-cue evidence for `submit`, `stream-open`, `token`, and `interrupt` through `data-transition-events="submit stream-open token interrupt"`, `data-transition-decision-trace="complete"`, `data-transition-controller-reads="gaze blink brows mouth posture motion"`, `data-transition-controller-reads-event="true"`, and `data-transition-controller-reads-age="true"`.
- Comparison route completes with equal first-token timing on both panes through `data-generic-first-token-ms` and `data-presence-first-token-ms`.
- Comparison route confirms the presence side exposes state, frame channels, and complete decision-trace evidence before the first visible token through `data-presence-first-state-ms`, `data-presence-frame-before-token-ms`, `data-presence-decision-trace-before-token-ms`, and positive `data-presence-decision-trace-lead-ms`.
- Comparison route mirrors `summarizePresenceTrace` output onto the comparison root and SVG face through `data-presence-trace-summary="complete"`, `data-presence-trace-entry-count`, `data-presence-trace-first-output-ms`, `data-presence-trace-lead-ms`, `data-presence-trace-final-state`, `data-presence-trace-has-output`, and `data-presence-trace-complete`.
- Mobile comparison route has no horizontal overflow.
- React browser demo loads with actual React/ReactDOM, runs a simulated AI SDK turn, and returns to `ready`.
- React browser demo uses `@ai-presence/face` SVG output and proves frame time can advance while the presence state is stable.
- React browser demo proves the actual renderer slot carries complete six-channel decision-trace evidence through `data-face-decision-trace="complete"`, `data-face-decision-trace-channels="gaze blink brows mouth posture motion"`, `data-face-decision-trace-decisions="6"`, `data-face-decision-trace-warnings="0"`, and `data-face-decision-trace-renderer-safe="true"`.
- React browser demo mirrors `summarizePresenceTrace` output onto the presence panel through `data-react-trace-summary="complete"`, `data-react-trace-entry-count`, `data-react-trace-first-output-ms`, `data-react-trace-first-output-event`, `data-react-trace-lead-ms`, `data-react-trace-final-state`, `data-react-trace-has-output`, and `data-react-trace-complete`.
- React browser demo confirms the simulated pre-output turn reaches the renderer slot as `state=waiting` with `data-face-latency-phase="before-output"` before response text appears.
- React browser demo confirms the same renderer slot drives a non-face status surface through `data-nonface-renderer="status-surface"`, `data-nonface-state="waiting"`, `data-nonface-phase="before-output"`, `data-nonface-attention="response"`, `data-nonface-event="stream-open"`, `data-nonface-frame-time`, and `data-nonface-before-output="true"` before response text appears.
- React browser demo confirms the renderer slot mirrors adapter-driven transition context through `data-face-transition-context="thinking stream-open 0"`, `data-face-transition-controller-reads="gaze blink brows mouth posture motion"`, `data-face-transition-controller-reads-event="true"`, and `data-face-transition-controller-reads-age="true"`.
- README media exists for the A/B comparison and React browser demo.

GitHub Actions runs `npm ci` and `npm run validate` on pushes to `main` and pull requests.

Release policy and package-name checks:

```bash
npm run release:check-names
npm run release:check-scope
```

The package names were rechecked against the npm registry on 2026-06-12 and all four intended names were still unpublished before the first public release. Public npm metadata for all four packages was verified at `0.1.1` on 2026-06-15. `release:check-names` is now historical/first-release evidence for the existing package names; ongoing releases use `npm run release:preflight`.

Repeatable release gate:

```bash
npm run release:public-gate
npm run release:preflight
npm run release:publish -- X.Y.Z
npm run release:consumer-smoke -- X.Y.Z
```

`npm run release:public-gate` checks the first-time visitor and collaborator-readiness surface. `npm run release:preflight` combines package validation, core and face latency gates, public-readiness checks, security/tarball preflight, `git diff --check`, and authenticated npm scope verification. `npm run release:publish -- X.Y.Z` publishes with token-safe npm config, verifies npm metadata, and runs `npm run release:consumer-smoke -- X.Y.Z`. The consumer smoke verifies a fresh consumer can install all four published packages, execute their ESM/CommonJS entrypoints, use installed `@ai-presence/core` plus `@ai-presence/adapters` to turn a generic chat lifecycle into `statePath`, `eventPath`, `firstOutputMs`, `leadMs`, `finalState`, `hasOutput`, `complete`, and `interrupted` before-output trace evidence, and prove the composer-lane adoption path from installed package APIs with `renderer=composer-lane`, before-output `waiting`, `streamOpenMs`, `firstOutputMs`, `leadMs`, `finalState=ready`, `hasOutput=true`, `complete=true`, and `interrupted=false`.

See `docs/RELEASE_RUNBOOK.md` for the full recurring process, including browser-smoke routes, npm publish order, post-publish metadata checks, and stop conditions.
