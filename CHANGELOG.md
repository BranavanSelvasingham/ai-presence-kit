# Changelog

## Unreleased

### Added

- Added root orchestration artifacts: `AGENTS.md`, `CORE_PILLARS.md`, `OPERATING_MANUAL.md`, `VALIDATION.md`, and `docs/ORCHESTRATION_LOOP.md`.
- Added `createPresenceTrace` to `@ai-presence/core` for bounded transition timelines with elapsed timing.
- Reframed the main objective around a low-latency facial presence engine driven by parallel micro-decisions.

### Validation

- Added package-surface and ESM tests for the core trace export.

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
