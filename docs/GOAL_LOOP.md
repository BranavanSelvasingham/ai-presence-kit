# AI Presence Kit Goal Loop

## Objective

Build AI Presence Kit into a small, renderer-agnostic presence state layer and reference facial controller system for AI interfaces.

The face is not a fixed avatar or pose switcher. It is the reference proof surface for parallel micro-decision systems: gaze, blink, brows, mouth, posture, and motion reacting to runtime state.

The product is the reusable state model, runtime, adapters, trace evidence, and controller contracts that let existing AI interfaces replace generic loading indicators with visible interaction posture.

## Wedge

AI apps already know whether the user is typing, pausing, interrupting, or waiting; whether the model is opening a stream, thinking, streaming, speaking, ready, or errored. Most UIs flatten those states into spinners, typing dots, disabled buttons, or static avatars.

AI Presence Kit exposes that state through a facial control pipeline:

```text
runtime signal -> presence state -> parallel facial controllers -> coherent expressive motion
```

It is not:

- Static avatar identity.
- Lip-sync or character rendering.
- A full chat framework.
- Emotion recognition.

It is:

- A state layer for interaction posture.
- A facial presence runtime where independent controllers make local movement decisions from a shared state snapshot.
- Upstream of renderers like SVG faces, Rive, Live2D, 3D avatars, or Audio2Face.
- Designed to plug into existing AI UI frameworks.

The automation should steer toward work that improves this wedge, not toward decorative animation alone.

## Loop Cadence

Each loop should finish with:

1. A package/API improvement.
2. A demo improvement that proves the API is usable.
3. A docs update that sharpens the wedge.
4. A validation pass with tests and browser checks.

## Loop 1: Package Surface

Status: completed in the current prototype.

Build:

- `@ai-presence/core`: canonical states, events, reducer, runtime snapshot.
- `@ai-presence/face`: reference mapping from presence snapshots to face expressions.
- `@ai-presence/adapters`: generic runtime-signal adapter.
- Static-demo compatibility without a build step.

Validate:

- Core state transitions.
- Face expression mapping.
- Adapter normalization.
- Browser demo loading and interaction.

## Loop 2: A/B Demo Harness

Status: completed in the current prototype.

Build:

- Split-screen spinner-vs-presence comparison.
- Same model latency on both sides.
- Before-first-token presence cues on the presence side.
- Simple perception prompt: which side feels more responsive?

Validate:

- Desktop and mobile layout.
- No state leak between A/B panes.
- Equal simulated latency.

Current route:

```text
http://127.0.0.1:8058/?compare=1&autorunCompare=1
```

## Loop 3: Framework Adapters

Status: completed in the current prototype.

Build:

- Vercel AI SDK stream adapter.
- OpenAI Responses event adapter.
- OpenAI Realtime event adapter.
- Generic chat adapter.
- Minimal assistant-ui or adjacent app-framework adapter as the next adoption check.

Validate:

- Event traces map cleanly to canonical presence states.
- Adapters remain renderer-agnostic.

Current package surface:

```text
packages/adapters/src/runtime-adapter.js
```

Current exports:

- `createVercelAISDKAdapter`
- `createOpenAIRealtimeAdapter`
- `createChatEventAdapter`
- `createRuntimeSignalAdapter`

## Loop 4: React Package

Status: completed in the current prototype.

Build:

- `usePresenceRuntime`.
- `PresenceProvider`.
- `usePresenceSnapshot`.
- Renderer slot/component pattern.

Validate:

- React binding unit test with a fake React surface.
- Browser smoke test for the static demo after loading package additions.
- React demo. Current command-line example: `npm run demo:react`.
- StrictMode-safe subscription behavior.

## Loop 5: Public Readiness

Status: completed for the initial public release; ongoing as a recurring gate.

Build:

- Package manifests. Completed for the four local packages.
- CommonJS plus ESM import entrypoints. Completed for the four local packages.
- API docs. Current package READMEs plus TypeScript declarations cover the initial surface.
- Examples. Current examples cover adapter traces, the no-network quickstart adoption proof, command-line React bindings, and a real browser React runtime.
- Release notes. Current file: `CHANGELOG.md`.
- README demo media. Completed for the A/B comparison and React browser demo.
- Release policy. Completed for lockstep `0.x` package versioning, changelog headings, token-safe publish automation, public-readiness gates, and package-name/scope checks.

Validate:

- Fresh clone setup.
- Tests from clean checkout. Local scripts cover package surface and runtime behavior.
- Browser demo smoke test. Current comparison route still passes after package surface additions.
- Package dry-run checks. Completed for all four packages with a writable temp npm cache.
- ESM package-surface tests now import all four `dist/index.mjs` entrypoints.
- React browser demo smoke test now covers provider, snapshot hook, renderer slot, AI SDK adapter, and face expression mapping with actual React and ReactDOM.
- CI validation now runs `npm ci` and `npm run validate` through GitHub Actions.
- README media is generated from the validated browser routes and checked by package-surface tests.
- Package-name availability was rechecked on 2026-06-12 with npm registry `E404` results before the first public release. Public npm metadata for all four packages was verified at `0.1.1` on 2026-06-15; ongoing releases verify scope ownership with `npm run release:check-scope` through `npm run release:preflight`.

## Loop 6: Integration Evidence

Status: in progress.

Build:

- Core transition trace primitive for bounded runtime timelines. Current API: `createPresenceTrace`.
- Renderer-agnostic trace summary helper for before-output and first-output timing evidence. Current API: `summarizePresenceTrace`.
- Adapter/demo output that exposes event-to-state timing, first-output timing, presence-before-output lead time, and interruption evidence through `interruptMs` and `interrupted`.
- Browser comparison evidence that mirrors `summarizePresenceTrace` output onto the comparison root and SVG face through `data-presence-trace-*`.
- React browser evidence that mirrors `summarizePresenceTrace` output onto the actual React + adapter + SVG route through `data-react-trace-*`.
- Documentation that explains trace summaries as integration evidence, not renderer behavior.

Validate:

- Deterministic trace tests for elapsed timing, bounded history, detach behavior, and detail capture.
- Package-surface tests for CommonJS and ESM exports.
- Adapter demo output that shows pre-token state transitions and compact summary fields such as `firstOutputMs`, `leadMs`, `interruptMs`, `interrupted`, `finalState`, `hasOutput`, and `complete`.
- Comparison route smoke evidence now includes helper-derived `data-presence-trace-summary="complete"`, `data-presence-trace-first-output-ms`, `data-presence-trace-lead-ms`, `data-presence-trace-final-state`, `data-presence-trace-has-output`, and `data-presence-trace-complete` on the browser proof surface.
- React browser smoke evidence now includes helper-derived `data-react-trace-summary="complete"`, `data-react-trace-first-output-ms`, `data-react-trace-lead-ms`, `data-react-trace-final-state`, `data-react-trace-has-output`, and `data-react-trace-complete` on the actual React proof surface.

## Loop 7: Collaborator And Adoption Path

Status: active.

Build:

- Make first-time comprehension durable: why this exists, what the package does, what it is not, and where to help.
- Keep `CONTRIBUTING.md`, README, release docs, examples, and screenshots aligned after every public-facing milestone.
- Turn real AI-runtime integration gaps into narrow adapter or example arcs, prioritizing adoption surfaces that can prove before-output trace evidence without importing the reference face.
- Keep release and npm-token handling repeatable through `npm run release:publish -- X.Y.Z`.

Validate:

- `npm run release:public-gate` for first-time visitor and collaborator-readiness changes.
- `npm run release:preflight` before broad release claims.
- Browser/screenshot evidence when the default app or README visual surface changes.
- Published-package consumer smoke after any package release.
