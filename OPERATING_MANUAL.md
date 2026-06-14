# Operating Manual

## Product Contract

AI Presence Kit is a low-latency facial presence engine for AI interfaces.

The face is not a fixed avatar or pose switcher. It is a set of parallel micro-decision systems reacting to runtime state.

The canonical flow is:

```text
AI/user runtime signals
-> presence state
-> parallel facial controllers
-> coherent expressive motion
```

The package architecture remains presence-state-driven and extensible, but the main proof surface is the reference face: gaze, blink, brows, mouth, posture, and motion responding before, during, and after model output.

## Canonical Presence States

```text
idle
user-typing
reading
waiting
thinking
streaming
speaking
interrupted
ready
error
```

State names are public contract surface. Do not rename or remove them casually during the `0.x` phase.

## Runtime Boundaries

- Core owns state, events, reducer behavior, runtime snapshots, debug/trace primitives, and shared controller inputs.
- Adapters translate external AI runtime signals into core events.
- React owns context, subscription hooks, and renderer-slot ergonomics.
- Face owns the reference SVG expression mapping and facial micro-controller proof.
- The demo app can combine all packages, but reusable packages should remain loosely coupled.

## State Sources

When auditing behavior, inspect the relevant source of truth:

- Core reducer: `packages/core/src/presence-core.js`
- Core declarations: `packages/core/src/presence-core.d.ts`
- ESM export surface: `packages/core/dist/index.mjs`
- Adapter mappings: `packages/adapters/src/runtime-adapter.js`
- React bindings: `packages/react/src/presence-react.js`
- Face mapping: `packages/face/src/presence-face.js`
- Browser prototype orchestration: `app.js`
- Server-backed OpenAI flow: `server.mjs`
- Package and CI gates: `package.json`, `.github/workflows/ci.yml`

## Validation Rules

Follow `VALIDATION.md`.

Minimum evidence before reporting completion:

- relevant targeted test or demo command
- `npm run validate` for package/API changes
- `git diff --check` before commit handoff
- direct browser/screenshot inspection for visual or browser-facing changes

If a visual, network, registry, or browser check cannot be performed, report it as a visibility gap.

## Release Gates

For every major improvement:

1. Run `npm run validate`.
2. Run `npm run perf:core` and `npm run perf:face` when core, adapters, face, or trace behavior changed.
3. Run `git diff --check`.
4. Browser-smoke the reference, metrics, comparison, and React browser routes for visual or browser-facing changes.

Before public npm release:

1. Log in to npm with an account that controls the `@ai-presence` scope.
2. Run `npm run release:preflight`.
3. Browser-smoke the reference, metrics, controller gallery, comparison, and React browser routes.
4. Bump root and workspace packages to the chosen release version.
5. Update `CHANGELOG.md`.
6. Re-run `npm run release:preflight`.
7. Commit and tag the release.
8. Publish in dependency order: core, face, adapters, react.
9. Run `npm run release:consumer-smoke -- X.Y.Z`.
10. Verify npm metadata, then push `main` and the release tag.

`npm run release:check-names` is retained as historical first-release name-availability evidence; ongoing releases rely on `npm run release:check-scope` through the preflight gate.

See `docs/RELEASE_POLICY.md` and `docs/RELEASE_RUNBOOK.md` for versioning details and exact commands.

## Orchestration Rules

Use this repo as a fast loop, but keep changes scoped:

- Check `git status --short` before delegating, consolidating, or committing.
- Prefer one package/API improvement, one demo or evidence improvement, one docs update, and validation evidence per loop.
- Choose idle opportunities by pillar alignment, impact, risk, validation cost, and release risk.
- Do not create duplicate implementation work for the same active scope.
- Stage only intended files when committing.
