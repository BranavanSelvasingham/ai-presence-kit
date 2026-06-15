# Contributing

AI Presence Kit is an early public project for people interested in AI interfaces, expressive systems, interaction design, SVG/rendering, and low-latency UI behavior.

The project is a presence state layer for AI interfaces. Keep contributions framed around interaction posture: reading, waiting, thinking, streaming, speaking, interrupted, ready, and error. It is not emotion detection or private emotion inference.

## Good First Collaboration Areas

- Improve the reference SVG face while keeping it driven by gaze, blink, brows, mouth, posture, and motion controllers.
- Add adapter examples for real AI runtime streams without making `@ai-presence/core` renderer-specific.
- Strengthen React/browser demos that prove presence before output.
- Improve documentation, screenshots, and first-time setup paths.
- Add narrow tests for controller coherence, trace evidence, package exports, and release gates.
- Explore non-face renderers that consume the same presence state layer.

## Development Loop

Use the narrowest relevant check first, then run the full validation gate before handoff:

```bash
npm run validate
git diff --check
```

For release-facing or public-readiness changes, also run:

```bash
npm run release:public-gate
```

For runtime/controller changes, include the latency gates:

```bash
npm run perf:core
npm run perf:face
```

Browser or visual changes need direct browser/screenshot inspection of the affected route before claiming readiness.
For the documented local browser routes, use the repeatable browser gate:

```bash
npm run browser:smoke
```

## Release And Security Notes

Do not paste API keys, npm tokens, or OTP values into issues, pull requests, docs, commits, logs, or chat.

The repeatable release process lives in:

```text
docs/RELEASE_RUNBOOK.md
docs/PUBLIC_RELEASE_GATE.md
```

`npm run release:publish -- X.Y.Z` can use `NPM_TOKEN` from the environment or `.env.release.local`, which is intentionally ignored by git.
