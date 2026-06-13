# Changelog

## Unreleased

### Added

- Added root orchestration artifacts: `AGENTS.md`, `CORE_PILLARS.md`, `OPERATING_MANUAL.md`, `VALIDATION.md`, and `docs/ORCHESTRATION_LOOP.md`.
- Added `createPresenceTrace` to `@ai-presence/core` for bounded transition timelines with elapsed timing.
- Added shared renderer-agnostic control inputs for attention, tension, energy, anticipation, recovery, speech activity, interruption, latency phase, and recent state history.
- Added parallel face controller decisions for gaze, blink, brows, mouth, posture, and motion in `@ai-presence/face`.
- Added deterministic temporal frame APIs in `@ai-presence/face`, including `faceControllerFrameForPresence` and `createFaceControllerFrameRuntime`.
- Added the no-DOM `renderPresenceFaceSvg` reference renderer API with inspectable six-channel frame evidence.
- Added `motionScale` to `@ai-presence/face` frame and SVG renderer APIs for reduced-motion/still output without removing controller evidence.
- Added `usePresenceControlInputs()` and `usePresenceFrameTime()` to the React binding factory.
- Added browser demo evidence for controller composition, temporal frame sequences, before-first-token presence, and React-to-SVG renderer wiring.
- Added `release:check-scope` to verify authenticated npm access to the `@ai-presence` scope before publishing.
- Reframed the main objective around a low-latency facial presence engine driven by parallel micro-decisions.

### Validation

- Added package-surface and ESM tests for the core trace export.
- Added adapter demo coverage for reference face frame evidence produced from adapter-driven transitions.
- Added controller-gallery, face-renderer, comparison-before-token, React binding, React browser, package-surface, and ESM coverage for the current package surface.
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
