# Release Readiness

AI Presence Kit is a public `0.x` package family. `v0.1.4` is published, and the repository now has repeatable gates for major improvements and future releases.

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
- `@ai-presence/adapters` owns plain-object bridges for generic runtime signals, assistant lifecycle events, Vercel AI SDK status, OpenAI Responses streaming events, OpenAI Realtime events, and generic chat events.
- `@ai-presence/react` owns provider/runtime/snapshot hooks, renderer slots, shared control-input access, and the renderer-agnostic `usePresenceFrameTime()` hook.

## Demo Surfaces

```text
http://127.0.0.1:8058/
http://127.0.0.1:8058/?metrics=1&presence=expressive
http://127.0.0.1:8058/?compare=1&autorunCompare=1
http://127.0.0.1:8058/examples/react-browser.html
http://127.0.0.1:8058/examples/react-browser-composer-lane.html
http://127.0.0.1:8058/examples/vanilla-status-surface.html
```

Command-line demos:

```bash
npm run demo:adapters
npm run demo:quickstart
npm run demo:status-surface
npm run demo:composer-lane
npm run demo:vercel-ai-sdk
npm run demo:assistant-lifecycle
npm run demo:assistant-ui-external-store
npm run demo:react
```

`npm run demo:quickstart` runs a no-network adoption proof that maps generic chat lifecycle events through the package APIs and prints `statePath`, `eventPath`, `firstOutputMs`, `leadMs`, `finalState`, `hasOutput`, `complete`, and `interrupted`.

`npm run demo:status-surface` runs a framework-free non-face consumer proof that maps the same adapter-driven lifecycle into a plain status surface. It prints `renderer=status-surface`, `statePath`, `eventPath`, `phasePath`, `beforeOutput=true`, `firstOutputMs`, `leadMs`, `finalState`, `hasOutput`, `complete`, and `interrupted`, while the surface model exposes `data-renderer="status-surface"`, `data-presence-state="waiting"`, `data-presence-phase="before-output"`, `data-presence-attention="response"`, `data-presence-event="stream-open"`, and `data-presence-before-output="true"` before the first output.

`npm run demo:composer-lane` runs a real-app-style composer lane proof that uses the Vercel AI SDK adapter path for `submitted`, `streaming`, and `ready` updates without a framework dependency. It prints `renderer=composer-lane`, `statePath`, `eventPath`, `phasePath`, `streamOpenMs`, `firstOutputMs`, `leadMs`, `finalState`, `hasOutput`, `complete`, and `interrupted`, while the lane model exposes `data-renderer="composer-lane"`, `data-presence-state="waiting"`, `data-presence-phase="before-output"`, `data-composer-lock="true"`, `data-assistant-text-empty="true"`, and `data-progress-step="stream-open"` before the first output.

`npm run demo:vercel-ai-sdk` runs a named Vercel AI SDK proof without importing Vercel packages. It maps primary-doc-backed `useChat` `status`, `messages`, assistant text `parts`, `onFinish.isAbort`, and `onError` shapes into `createVercelAISDKAdapter`, then prints `framework=vercel-ai-sdk`, `statusPath`, `frameworkEventPath`, `streamOpenMs`, `firstOutputMs`, `leadMs`, `presenceBeforeOutputMs`, `finalState=ready`, `hasOutput=true`, `complete=true`, `interrupted=false`, `abortState=interrupted`, and `errorState=error`.

`npm run demo:assistant-lifecycle` runs an assistant app lifecycle proof that simulates a thread, run, assistant message shell, first text delta, and completion without a framework dependency. It prints `surface=assistant-lifecycle`, `statePath`, `eventPath`, `frameworkEventPath`, `streamOpenMs`, `firstOutputMs`, `leadMs`, `presenceBeforeOutputMs`, `finalState`, `hasOutput`, `complete`, and `interrupted`, while the surface model exposes `data-presence-state="waiting"`, `data-presence-phase="before-output"`, `data-assistant-output-empty="true"`, and `data-presence-before-output="true"` before the first output.

`npm run demo:assistant-ui-external-store` runs a named assistant-ui ExternalStoreRuntime proof without importing assistant-ui. It maps documented `onNew`, `isRunning`, empty assistant message `status.type="running"`, first text delta, and `status.type="complete"` into `createAssistantLifecycleAdapter`, then prints `surface=assistant-ui-external-store`, `framework=assistant-ui`, `route=ExternalStoreRuntime`, `frameworkEventPath`, `frameworkStatusPath`, `streamOpenMs`, `firstOutputMs`, `leadMs`, `presenceBeforeOutputMs`, `finalState`, `hasOutput`, `complete`, and `interrupted`.

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
npm run demo:vercel-ai-sdk
npm run demo:assistant-lifecycle
npm run demo:assistant-ui-external-store
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

For publish readiness, `npm run release:preflight` includes the local browser-smoke gate. You can also run it directly while iterating on browser evidence:

```bash
npm run browser:smoke
```

This command starts `server.mjs` on a temporary local port with OpenAI disabled, drives the local Chrome executable through the Chrome DevTools Protocol, fails on browser console exceptions or errors, verifies real browser-rendered DOM evidence for the documented route classes, prints concise per-route evidence lines, and stops the server. It is a local release gate included in `npm run release:preflight`, not part of GitHub Actions or the default `npm run validate` gate.

The browser-smoke command verifies:

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
- React browser demo confirms the renderer slot mirrors adapter-driven transition context through `data-face-transition-context` beginning with `thinking stream-open`, `data-face-transition-controller-reads="gaze blink brows mouth posture motion"`, `data-face-transition-controller-reads-event="true"`, and `data-face-transition-controller-reads-age="true"`.
- React browser composer-lane route omits the face package while reusing `@ai-presence/core`, `@ai-presence/adapters`, and `@ai-presence/react`, then confirms `data-renderer="composer-lane"`, `data-presence-state="waiting"`, `data-presence-phase="before-output"`, `data-composer-lock="true"`, `data-assistant-text-empty="true"`, `data-progress-step="stream-open"`, `data-stream-open-ms="420ms"`, `data-first-output-ms="none"`, and positive `data-lead-ms` before response text appears.
- Vanilla status-surface route omits React and the face package while reusing `@ai-presence/core` and `@ai-presence/adapters`, then confirms `data-renderer="status-surface"`, `data-presence-state="waiting"`, `data-presence-phase="before-output"`, `data-presence-attention="response"`, `data-presence-event="stream-open"`, `data-assistant-text-empty="true"`, `data-stream-open-ms="420ms"`, `data-first-output-ms="none"`, and positive `data-lead-ms` before response text appears.
- README media exists for the A/B comparison and React browser demo.

GitHub Actions runs `npm ci` and `npm run validate` on pushes to `main` and pull requests.

Release policy and package-name checks:

```bash
npm run release:check-names
npm run release:check-scope
```

The package names were rechecked against the npm registry on 2026-06-12 and all four intended names were still unpublished before the first public release. Public npm metadata for all four packages was verified at `0.1.4` on 2026-06-15. `release:check-names` is now historical/first-release evidence for the existing package names; ongoing releases use `npm run release:preflight`.

Repeatable release gate:

```bash
npm run release:public-gate
npm run release:preflight
npm run release:publish -- X.Y.Z
npm run release:consumer-smoke -- X.Y.Z
```

`npm run release:public-gate` checks the first-time visitor and collaborator-readiness surface. `npm run release:preflight` combines package validation, core and face latency gates, public-readiness checks, security/tarball preflight, `git diff --check`, authenticated npm scope verification, and browser-smoke DOM evidence. `npm run release:publish -- X.Y.Z` publishes with token-safe npm config, verifies npm metadata, and runs `npm run release:consumer-smoke -- X.Y.Z`. The consumer smoke verifies a fresh consumer can install all four published packages, execute their ESM/CommonJS entrypoints, use installed `@ai-presence/core` plus `@ai-presence/adapters` to turn a generic chat lifecycle into `statePath`, `eventPath`, `firstOutputMs`, `leadMs`, `finalState`, `hasOutput`, `complete`, and `interrupted` before-output trace evidence, prove the OpenAI Responses adapter path with `response.created`, `response.output_item.added`, `response.output_text.delta`, and `response.completed` events, prove the assistant lifecycle adapter path with `composer-input`, `composer-pause`, `run-created`, `message-created`, `text-delta`, and `run-completed` events plus `surface=assistant-lifecycle`, `frameworkEventPath`, and `assistantOutputEmpty=true`, prove the assistant-ui ExternalStoreRuntime route with documented `onNew`, `isRunning=true`, empty assistant message `status.type="running"`, first assistant text chunk, and `status.type="complete"` events plus `surface=assistant-ui-external-store`, `framework=assistant-ui`, `route=ExternalStoreRuntime`, `frameworkStatusPath`, `isRunning=true`, `assistantOutputEmpty=true`, and `presenceBeforeOutputMs`, prove the vanilla status-surface adoption path from installed package APIs with `vanilla status-surface consumer smoke ok`, `renderer=status-surface`, before-output `waiting`, `surfacePhase=before-output`, `surfaceAttention=response`, `surfaceEvent=stream-open`, `assistantTextEmpty=true`, `surfaceFirstOutputMs=none`, positive `surfaceLeadMs`, `streamOpenMs`, `firstOutputMs`, `leadMs`, `presenceBeforeOutputMs`, `finalState=ready`, `hasOutput=true`, `complete=true`, and `interrupted=false`, and prove the composer-lane adoption path from installed package APIs with `renderer=composer-lane`, before-output `waiting`, `streamOpenMs`, `firstOutputMs`, `leadMs`, `finalState=ready`, `hasOutput=true`, `complete=true`, and `interrupted=false`. The vanilla consumer smoke is installed-package Node evidence, not a browser or visual proof.

See `docs/RELEASE_RUNBOOK.md` for the full recurring process, including browser-smoke routes, npm publish order, post-publish metadata checks, and stop conditions.
