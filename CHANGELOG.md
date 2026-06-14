# Changelog

## Unreleased

No changes yet.

## 0.1.0 - 2026-06-14

### Added

- Added root orchestration artifacts: `AGENTS.md`, `CORE_PILLARS.md`, `OPERATING_MANUAL.md`, `VALIDATION.md`, and `docs/ORCHESTRATION_LOOP.md`.
- Added `createPresenceTrace` to `@ai-presence/core` for bounded transition timelines with elapsed timing.
- Added `summarizePresenceTrace` to `@ai-presence/core` for renderer-agnostic integration timing evidence over trace timelines.
- Added shared renderer-agnostic control inputs for attention, tension, energy, anticipation, recovery, speech activity, interruption, latency phase, and recent state history.
- Added parallel face controller decisions for gaze, blink, brows, mouth, posture, and motion in `@ai-presence/face`.
- Added deterministic temporal frame APIs in `@ai-presence/face`, including `faceControllerFrameForPresence` and `createFaceControllerFrameRuntime`.
- Added `faceControllerDecisionTraceForFrame` in `@ai-presence/face` for bounded six-channel decision-trace evidence from temporal frame reports.
- Added the no-DOM `renderPresenceFaceSvg` reference renderer API with inspectable six-channel frame evidence.
- Added `motionScale` to `@ai-presence/face` frame and SVG renderer APIs for reduced-motion/still output without removing controller evidence.
- Added `usePresenceControlInputs()` and `usePresenceFrameTime()` to the React binding factory.
- Added browser demo evidence for controller composition, temporal frame sequences, decision traces, before-first-token presence, and React-to-SVG renderer wiring.
- Added browser DOM decision-trace evidence via `data-controller-decision-trace*` on the live metrics/controller-gallery proof surfaces.
- Added comparison-route DOM lead-time evidence for equal first-token timing plus pre-token presence state, frame, and decision-trace timing.
- Added comparison-route DOM trace-summary evidence from `summarizePresenceTrace` through `data-presence-trace-*` on the comparison root and SVG face.
- Added React browser DOM trace-summary evidence from `summarizePresenceTrace` through `data-react-trace-*` on the actual React + adapter + SVG proof route.
- Added renderer-agnostic interruption evidence to `summarizePresenceTrace` and adapter demo output through `interruptMs` and `interrupted`.
- Added React browser renderer-slot DOM evidence for complete six-channel face decision traces and `data-face-latency-phase="before-output"` during the simulated pre-output turn.
- Added React browser renderer-slot transition-context DOM evidence for adapter-driven pre-output `stream-open` cues, including all-six-controller `transitionEvent` and `transitionAgeMs` reads.
- Added controller-gallery transition-cue DOM evidence for fresh `submit`, `stream-open`, `token`, and `interrupt` cues across all six face controllers.
- Added adapter demo decision-trace evidence for complete six-channel controller proof across Vercel AI SDK, OpenAI Realtime, and generic chat transitions.
- Added adapter demo transition-read evidence showing adapter-driven transitions reach all six face controllers through `transitionEvent` and `transitionAgeMs`.
- Added `npm run perf:core` for local package-level renderer-agnostic runtime, adapter, trace-recording, and trace-summary performance smoke evidence before the face renderer.
- Added `npm run perf:face` for local package-level face-pipeline performance smoke evidence across all canonical presence states, including the full SVG reference renderer path.
- Added `release:check-scope` to verify authenticated npm access to the `@ai-presence` scope before publishing.
- Reframed the main objective around a low-latency facial presence engine driven by parallel micro-decisions.

### Validation

- Added package-surface and ESM tests for the core trace export.
- Added adapter demo coverage for reference face frame evidence and complete six-channel decision-trace evidence produced from adapter-driven transitions.
- Added face-pipeline benchmark validation for complete, renderer-safe, warning-free six-channel decision traces within conservative average frame+trace and SVG renderer budgets.
- Added core-runtime benchmark validation for completed before-output traces through core runtime sends, Vercel AI SDK and generic chat adapters, trace recording, and `summarizePresenceTrace`.
- Added controller-gallery, face-renderer, comparison-before-token, React binding, React browser, package-surface, and ESM coverage for the current package surface.
- Added package-surface release-doc checks for the decision-trace API and browser DOM evidence.
- Added package-surface release-doc checks for browser trace-summary DOM evidence.
- Added package-surface release-doc checks for React browser trace-summary DOM evidence.
- Added package-surface checks for renderer-agnostic interruption trace-summary evidence.
- Added README media validation for the comparison and React browser demo screenshots.
- Expanded release readiness docs around browser smoke routes, package dry-runs, and package-name checks.

## 0.0.0

Initial pre-release package shape.

- Added `@ai-presence/core` for canonical states, events, snapshots, reducer, runtime, and subscriptions.
- Added `@ai-presence/face` for the reference face expression mapping.
- Added `@ai-presence/adapters` for generic runtime signals, Vercel AI SDK status mapping, OpenAI Realtime event mapping, and generic chat events.
- Added `@ai-presence/react` for provider, runtime hook, snapshot hook, state hook, and renderer-slot helpers.
- Preserved the no-build SVG face prototype as the reference renderer demo.
- Added a spinner-vs-presence comparison harness with equal simulated first-token latency.
- Added a browser React demo that runs the React bindings with actual React and ReactDOM.
- Added README media for the A/B comparison harness and React browser demo.
- Added package manifests, CommonJS/browser-global entries, ESM import entries, TypeScript declarations, tests, and package dry-run validation.
- Added a consolidated `npm run validate` gate and GitHub Actions CI workflow.
- Added release policy docs and a repeatable npm package-name availability checker.
