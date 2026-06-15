# Public Release Gate

Use this gate after every meaningful milestone that changes the public project surface: README, screenshots, package APIs, examples, docs, release process, or the story a first-time collaborator will see.

## Fresh-Eyes Gate

Ask whether a first-time visitor can understand the project in under two minutes:

- What problem exists: AI interfaces should not feel frozen until text appears.
- What this project is: a presence state layer for AI interfaces.
- What it is not: emotion detection or private emotion inference.
- What the proof surface is: the SVG reference face driven by parallel gaze, blink, brows, mouth, posture, and motion controllers.
- How to try it: npm packages, local demo, React/browser example, and visible screenshot.
- How to inspect it: DOM trace evidence, controller decision traces, and package smoke tests.

Run:

```bash
npm run release:public-gate
```

## Collaborator-Readiness Gate

Before a public push, check that the repo invites useful collaboration:

- `README.md` explains why the project exists before deep implementation detail.
- `CONTRIBUTING.md` lists concrete ways to help.
- Current screenshots match the default app or the changed visual surface.
- Public language uses interaction-posture terms: reading, waiting, thinking, streaming, speaking, interrupted, ready, and error.
- Docs avoid positioning the project as emotion recognition.
- The next few useful arcs are visible through docs, README language, or issues.
- Release/security instructions tell contributors not to paste keys, npm tokens, or OTP values.

## Release Automation Gate

For a package release, use the full sequence:

```bash
npm run release:preflight
git diff --check
npm run release:publish -- X.Y.Z
```

`npm run release:preflight` includes the local browser-smoke gate, so publish readiness requires browser-rendered DOM evidence without adding Chrome to CI or `npm run validate`.

`npm run release:publish -- X.Y.Z` publishes in dependency order, verifies npm metadata for all four packages, and runs the published-package consumer smoke. It reads `NPM_TOKEN` from the environment or `.env.release.local` through a temporary npm config that is deleted after the command exits.

Do not paste npm tokens into chat, docs, commit messages, shell history, or logs.

Only push the release tag after the publish script succeeds and npm metadata is visible.

## Stop Conditions

Stop before announcing, tagging, or publishing if any of these are true:

- the README screenshot is stale or misleading
- a first-time install/demo path has not been checked after package-facing changes
- the package versions, Git tag, and npm metadata do not match
- `CONTRIBUTING.md` no longer describes realistic next collaboration areas
- browser/visual changes were not inspected directly
- release logs include token, key, OTP, or npm config values
- public copy implies emotion detection or private emotion inference
