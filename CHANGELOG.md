# Changelog

## Unreleased

## 0.1.4 - 2026-06-15

### Added

- Added a docs-verified, no-network assistant-ui `ExternalStoreRuntime` adoption proof that maps documented `onNew`, `isRunning`, and assistant message `status.type` signals into the existing assistant lifecycle adapter.
- Added validation, package-surface guardrails, and public docs for the assistant-ui route, including before-output trace evidence before assistant text exists.

## 0.1.3 - 2026-06-15

### Added

- Added `createAssistantLifecycleAdapter`, `assistantLifecycleEventToRuntimeSignal`, `AssistantLifecycleStatus`, and `textFromAssistantLifecycleEvent` to `@ai-presence/adapters`.
- Added framework-package-free assistant lifecycle proof coverage for thread, run, assistant message shell, text delta, and completion events, including before-output surface evidence while assistant text is still empty.
- Added published-package consumer smoke coverage for the assistant lifecycle adapter path so npm releases verify the new adapter from installed `@ai-presence/core` and `@ai-presence/adapters`.

### Changed

- Strengthened `npm run release:consumer-smoke` so installed-package release verification covers the OpenAI Responses adapter path, including before-output lead evidence from typed Responses streaming events.
- Aligned public release/readiness docs with the published `0.1.2` OpenAI Responses adapter surface and four-path adapter demo.
- Added a root README OpenAI Responses adapter snippet so first-time package usage matches the current primary adapter proof.

## 0.1.2 - 2026-06-15

### Added

- Added `createOpenAIResponsesAdapter`, `openAIResponsesEventToRuntimeSignal`, `OPENAI_RESPONSES_EVENT_MAP`, and `textFromOpenAIResponsesEvent` to `@ai-presence/adapters`.
- Added renderer-agnostic OpenAI Responses streaming trace evidence to the adapter demo, including `thinking` and `waiting` before the first `response.output_text.delta`.
- Added package docs and integration quickstart coverage for mapping typed OpenAI Responses streaming events into presence runtime signals without importing the OpenAI SDK or reading environment config.
- Added `CONTRIBUTING.md` with collaborator paths for AI interface, expressive system, SVG/rendering, adapter, React proof, and release-gate work.
- Added `docs/PUBLIC_RELEASE_GATE.md` and `npm run release:public-gate` for first-time visitor and collaborator-readiness checks.
- Added `npm run release:publish -- X.Y.Z` for token-safe npm publishing, registry verification, and published-package consumer smoke.

### Changed

- Updated README, release policy, release runbook, operating manual, validation docs, and package-surface tests so public-facing milestones include a fresh-eyes gate before broad release claims.
- Sharpened `CORE_PILLARS.md`, `docs/ORCHESTRATION_LOOP.md`, and `docs/GOAL_LOOP.md` around the renderer-agnostic presence-layer objective, product wedge, non-goals, and automation steering rubric.
- Updated `npm run release:check-scope` to support the same ignored `.env.release.local` `NPM_TOKEN` path as the publish script, including a per-package metadata fallback for granular tokens that cannot list org packages.

### Validation

- Passed `npm run validate`.
- Passed `npm run release:public-gate`.
- Passed `npm run release:security`.
- Passed CI for PR #73.

## 0.1.1 - 2026-06-14

### Added

- Added a repeatable release runbook covering major-improvement gates, pre-publish gates, security checks, publish order, post-publish consumer smoke, and stop conditions.
- Added `npm run release:preflight` for the local release gate across validation, core and face latency smokes, security/tarball checks, `git diff --check`, and authenticated npm scope verification.
- Added `npm run release:security` to verify env/npm config files are ignored and untracked, scan tracked files for token-shaped secret material without printing values, and audit package dry-run tarballs for forbidden files.
- Added `npm run release:consumer-smoke -- X.Y.Z` to verify fresh consumer installs can execute all four published package entrypoints through both ESM and CommonJS.
- Added `npm run release:capture-media` to refresh the README release screenshot from the actual default app start screen.
- Added deterministic React browser autorun support with `examples/react-browser.html?autorun=1` for before-output smoke evidence.

### Changed

- Replaced the README lead media with the actual default app surface instead of the comparison harness.
- Clarified that the comparison route is validation evidence, not the primary product visual.
- Updated release, validation, operating, and readiness docs so meaningful milestones close with validation, git commit/push, and package publish when package-facing content changes.
- Hardened git ignore rules for `.env.*` and `.npmrc` while keeping `.env.example` trackable.

### Validation

- Passed `npm run release:capture-media`.
- Passed `npm run validate`.
- Passed `npm run release:security`.
- Passed `npm run release:preflight`.

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
