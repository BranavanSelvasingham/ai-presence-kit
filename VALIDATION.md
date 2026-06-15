# Validation

Run the smallest command that can prove the change, then run broader validation before release or commit handoff.

## Default Gates

```bash
npm run check
npm test
npm run demo:adapters
npm run demo:assistant-lifecycle
npm run demo:react
npm run pack:dry-run
git diff --check
```

The combined repository gate is:

```bash
npm run validate
```

## Milestone Closeout

After every meaningful milestone, close the loop with a pushed git commit. When README, screenshots, docs, examples, or collaborator-facing language changed, run:

```bash
npm run release:public-gate
```

When package source, package README, package metadata, examples, release media, or public package behavior changed, also bump and publish the lockstep package family with:

```bash
npm run release:publish -- X.Y.Z
```

## When To Run What

- Core state, runtime, package exports, TypeScript declarations: `npm test`, then `npm run validate`.
- Core runtime, adapters, trace recording, and trace-summary latency evidence: `npm run perf:core`, then `npm run check`.
- Face controller or SVG renderer latency and decision-trace performance evidence: `npm run perf:face`, then `npm run check`.
- Adapter mappings: `npm run demo:adapters`, `npm run demo:assistant-lifecycle`, `node tests/runtime-adapter.test.mjs`, then `npm run validate`.
- React bindings or React examples: `npm run demo:react`, React tests, then `npm run validate`.
- Browser or visual behavior: run the relevant browser route and inspect the output directly.
- Major improvement work: `npm run validate`, `npm run release:public-gate` for public-facing changes, `git diff --check`, and browser smoke when visual or browser-facing behavior changed.
- Packaging or release work: `npm run release:preflight`, browser smoke, `npm run release:publish -- X.Y.Z`, then push the release tag after npm verification passes.

## Package-Level Performance Smoke

```bash
npm run perf:core
```

This local benchmark covers the renderer-agnostic runtime path before the SVG face renderer. It drives `createPresenceRuntime().send(...)`, Vercel AI SDK and generic chat adapters, `createPresenceTrace().record(...)`, and `summarizePresenceTrace(...)` through completed traces with before-output `thinking` and `waiting`, first output timing, final `ready`, `hasOutput=true`, and `complete=true`. It enforces a conservative `0.35ms` average completed-trace budget. It is not a browser route, network probe, OpenAI latency probe, face-renderer benchmark, or part of the default `npm run validate` gate.

```bash
npm run perf:face
```

This local benchmark covers shared presence snapshots across all canonical presence states through both `faceControllerFrameForPresence` -> `faceControllerDecisionTraceForFrame` and the full `renderPresenceFaceSvg` reference renderer path. It validates complete six-channel, renderer-safe, warning-free trace evidence and enforces conservative average budgets: `0.25ms` for frame+trace and `0.75ms` for SVG renderer evidence. It is not a browser route, network probe, OpenAI latency probe, or part of the default `npm run validate` gate.

## Framework-Free Non-Face Smoke

```bash
npm run demo:status-surface
```

This local no-browser smoke drives `@ai-presence/core` and `@ai-presence/adapters` through a generic chat lifecycle, then maps each snapshot and control-input handoff into a plain status surface. It should print `renderer=status-surface`, `data-presence-state` evidence for `waiting`, `data-presence-phase` evidence for `before-output`, `beforeOutput=true`, `firstOutputMs`, `leadMs`, `finalState=ready`, `hasOutput=true`, `complete=true`, and `interrupted=false`.

## Real-App Composer Lane Smoke

```bash
npm run demo:composer-lane
```

This local no-browser smoke drives a Vercel AI SDK-style lifecycle through `@ai-presence/core` and `@ai-presence/adapters`, then maps each snapshot and trace summary into a non-face status bar, message composer, progress lane, and trace timeline. It should print `renderer=composer-lane`, `data-renderer="composer-lane"`, `data-presence-state="waiting"`, `data-presence-phase="before-output"`, `data-composer-lock="true"`, `data-assistant-text-empty="true"`, `data-progress-step="stream-open"`, `streamOpenMs`, `firstOutputMs`, `leadMs`, `finalState=ready`, `hasOutput=true`, `complete=true`, and `interrupted=false`.

## Assistant Lifecycle Smoke

```bash
npm run demo:assistant-lifecycle
```

This local no-browser smoke drives a framework-package-free thread/run/message lifecycle through `@ai-presence/core` and `@ai-presence/adapters`. It should print `surface=assistant-lifecycle`, `statePath`, `eventPath`, `frameworkEventPath`, before-output `waiting`, assistant output empty, `streamOpenMs`, `firstOutputMs`, `leadMs`, `presenceBeforeOutputMs`, `finalState=ready`, `hasOutput=true`, `complete=true`, and `interrupted=false`.

## Browser Smoke Routes

```text
http://127.0.0.1:8058/
http://127.0.0.1:8058/?metrics=1&presence=expressive
http://127.0.0.1:8058/?controllerGallery=1
http://127.0.0.1:8058/?compare=1&autorunCompare=1
http://127.0.0.1:8058/examples/react-browser.html?autorun=1
http://127.0.0.1:8058/examples/react-browser-composer-lane.html?autorun=1
```

Browser checks should confirm:

- reference demo loads without console errors
- metrics route shows canonical `Presence state`
- controller gallery exposes transition-cue evidence for `submit`, `stream-open`, `token`, and `interrupt`
- comparison route uses equal simulated latency on both sides
- presence side exposes state before first token
- React browser demo runs a simulated AI SDK turn and returns to `ready`
- React browser demo exposes a non-face status surface through `data-nonface-renderer="status-surface"`, `data-nonface-state="waiting"`, `data-nonface-phase="before-output"`, and `data-nonface-before-output="true"` before response text appears
- React browser composer-lane route omits the face package and exposes `data-renderer="composer-lane"`, `data-presence-state="waiting"`, `data-presence-phase="before-output"`, `data-composer-lock="true"`, `data-assistant-text-empty="true"`, `data-progress-step="stream-open"`, `data-stream-open-ms="420ms"`, `data-first-output-ms="none"`, and positive `data-lead-ms` before response text appears

After visual changes that affect README evidence, refresh release screenshots while the local server is running:

```bash
npm run release:capture-media
```

## Release Preflight

Run before publishing a new package version:

```bash
npm run release:preflight
```

This includes `npm run validate`, `npm run perf:core`, `npm run perf:face`, `npm run release:public-gate`, `npm run release:security`, `git diff --check`, and `npm run release:check-scope`.

`npm run release:security` confirms local env/npm config files are ignored and untracked, scans tracked files for token-shaped secret material without printing values, and checks package dry-run tarballs for forbidden files.

## Release Name And Scope Checks

`npm run release:check-names` is retained for historical or new-package name availability checks. An npm `404` only proves a package name is unpublished. It does not prove control of the `@ai-presence` npm scope.

Scope control requires npm authentication and is not part of CI. `npm run release:check-scope` runs inside `npm run release:preflight`; it can also be run directly after `npm login`:

```bash
npm run release:check-scope
```

## Post-Publish Consumer Smoke

`npm run release:publish -- X.Y.Z` performs this automatically. After a manual npm publish, verify fresh consumer install, both ESM/CommonJS entrypoints, and installed `@ai-presence/core` plus `@ai-presence/adapters` evidence for the generic chat quickstart trace, OpenAI Responses adapter path, and composer-lane adoption path:

```bash
npm run release:consumer-smoke -- X.Y.Z
```

The composer-lane portion must print `renderer=composer-lane`, before-output `waiting`, `streamOpenMs`, `firstOutputMs`, `leadMs`, `finalState=ready`, `hasOutput=true`, `complete=true`, and `interrupted=false` from installed package APIs only.

See `docs/RELEASE_RUNBOOK.md` for the full repeatable process.
