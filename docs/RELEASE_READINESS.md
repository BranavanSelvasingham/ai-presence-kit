# Release Readiness

AI Presence Kit is still pre-release, but the repository now has the shape of a public package family.

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

- `@ai-presence/core` owns canonical states, events, runtimes, traces, and renderer-agnostic control inputs.
- `@ai-presence/face` owns expression mapping, parallel controller decisions, temporal frame reports, the `motionScale` reduced-motion option, and `renderPresenceFaceSvg`.
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
npm run demo:react
```

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
npm run demo:react
npm run pack:dry-run
```

Also run `git diff --check` before committing.

Then browser-smoke:

- Reference demo loads with no console warnings or errors.
- Metrics route exposes canonical `Presence state`, controller composition, controller evidence, and live controller frame evidence.
- Comparison route completes with equal first-token timing on both panes.
- Comparison route confirms the presence side exposes state and frame channels before the first visible token.
- Mobile comparison route has no horizontal overflow.
- React browser demo loads with actual React/ReactDOM, runs a simulated AI SDK turn, and returns to `ready`.
- React browser demo uses `@ai-presence/face` SVG output and proves frame time can advance while the presence state is stable.
- README media exists for the A/B comparison and React browser demo.

GitHub Actions runs `npm ci` and `npm run validate` on pushes to `main` and pull requests.

Release policy and package-name checks:

```bash
npm run release:check-names
```

The package names were rechecked against the npm registry on 2026-06-12 and all four intended names were still unpublished. See `docs/RELEASE_POLICY.md`.

## Remaining Before Public Release

- Create or confirm control of the npm `@ai-presence` scope before publishing.
