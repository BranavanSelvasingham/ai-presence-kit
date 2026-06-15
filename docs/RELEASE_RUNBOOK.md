# Release Runbook

Use this gate after each major improvement and before every npm publish.

## Milestone Closeout

Every meaningful milestone should end with a durable handoff, not only local edits:

1. Review `git status --short --branch`.
2. Run the narrow validation for the touched area.
3. Run the Fresh-Eyes Gate when README, docs, examples, screenshots, public package behavior, or collaborator-facing language changed.
4. Run `npm run release:preflight` before broad readiness claims.
5. Commit the intended files and push the branch.
6. If package source, package README, package metadata, examples, release media, or public package behavior changed, bump the lockstep package version and publish all four packages.
7. After npm publish, verify npm metadata and the consumer smoke, then push the release tag.

Do not publish a package when only private orchestration notes changed. Do publish when the milestone changes the public release surface or package-facing evidence.

## Major-Improvement Gate

Run this when a change is not being published immediately but touches package surface, runtime behavior, controller behavior, browser evidence, or docs that claim release readiness:

```bash
npm run validate
git diff --check
```

Also run the package-level latency gates when core/adapters/face behavior changed:

```bash
npm run perf:core
npm run perf:face
```

Browser-smoke visual, browser-facing, or release-gate changes with:

```bash
npm run browser:smoke
```

This local gate starts `server.mjs` on a temporary port with OpenAI disabled, drives local headless Chrome through the Chrome DevTools Protocol, fails on browser console exceptions or errors, checks the documented DOM evidence, prints one concise evidence line per route class, and stops the server. It is not part of CI or the default `npm run validate` gate.

The command covers:

```text
http://127.0.0.1:8058/
http://127.0.0.1:8058/?metrics=1&presence=expressive
http://127.0.0.1:8058/?controllerGallery=1
http://127.0.0.1:8058/?compare=1&autorunCompare=1
http://127.0.0.1:8058/examples/react-browser.html?autorun=1
http://127.0.0.1:8058/examples/react-browser-composer-lane.html?autorun=1
http://127.0.0.1:8058/examples/vanilla-status-surface.html?autorun=1
```

Record the command output for the attributes listed in `docs/RELEASE_READINESS.md`, especially before-output timing, complete trace summaries, six-channel controller reads, renderer-safe decision traces, and face-free renderer-agnostic browser adoption evidence.

To refresh the README release screenshot after visual changes, start the local server and run:

```bash
npm run release:capture-media
```

The capture command writes:

```text
docs/media/main-app-release.png
```

## Fresh-Eyes Gate

Run this whenever a milestone changes what a first-time visitor or potential collaborator will see:

```bash
npm run release:public-gate
```

This checks that `README.md`, `CONTRIBUTING.md`, `docs/PUBLIC_RELEASE_GATE.md`, the release runbook, and the lead screenshot stay aligned around the public story:

- AI interfaces should not feel frozen until text appears.
- AI Presence Kit is a presence state layer, not emotion detection.
- The SVG face is the proof surface for parallel gaze, blink, brows, mouth, posture, and motion controllers.
- The repo offers concrete collaboration paths.
- Release/security instructions do not encourage pasting API keys, npm tokens, or OTP values.

See `docs/PUBLIC_RELEASE_GATE.md` for the full collaborator-readiness checklist.

## Pre-Publish Gate

Before publishing a new version, confirm the worktree contains only intended changes:

```bash
git status --short --branch
```

Then run the reusable release preflight:

```bash
npm run release:preflight
```

This runs:

- `npm run validate`
- `npm run perf:core`
- `npm run perf:face`
- `npm run release:public-gate`
- `npm run release:security`
- `git diff --check`
- `npm run release:check-scope`

`npm run release:security` verifies `.env` and npm config files are ignored and untracked, scans tracked files for OpenAI/npm-token-shaped secrets without printing secret values, and confirms package dry-run tarballs do not include forbidden files.

`npm run release:check-scope` can use either an active npm login or `NPM_TOKEN` from the ignored `.env.release.local` file. It writes only a temporary npm config and removes it before exiting. If a granular token cannot list org packages, the check falls back to per-package registry metadata.

Do not paste API keys, npm tokens, or npm OTP values into chat, docs, commit messages, or logs.

## Version And Changelog

For a release:

1. Bump the root and all workspace package versions.
2. Bump internal `@ai-presence/*` dependency versions to the same version.
3. Update `CHANGELOG.md`.
4. Re-run `npm run release:preflight`.
5. Commit the intended release files.
6. Tag the commit as `vX.Y.Z`.

## Publish

Preferred publish path:

```bash
npm run release:publish -- X.Y.Z
```

This command:

- requires a clean worktree unless `--allow-dirty` is supplied
- requires local tag `vX.Y.Z` to point at `HEAD`
- verifies root and workspace package versions
- reads `NPM_TOKEN` from the environment or `.env.release.local`
- writes a temporary npm config that references `${NPM_TOKEN}`
- publishes in dependency order
- waits for exact npm metadata after each accepted publish so npm registry propagation delays do not require manual reruns
- verifies exact npm metadata and `latest` metadata with the same bounded propagation retry
- runs `npm run release:consumer-smoke -- X.Y.Z`
- deletes the temporary npm config on exit

`.env.release.local` is ignored by git. Do not paste its contents into chat, docs, commit messages, shell history, or logs.

Manual fallback, still in dependency order:

```bash
npm publish ./packages/core --access public
npm publish ./packages/face --access public
npm publish ./packages/adapters --access public
npm publish ./packages/react --access public
```

If npm asks for a one-time password or passkey confirmation, complete it outside the repo and do not paste the value anywhere in the project. Prefer an npm automation or granular access token with package-scoped publish permission for repeatable releases.

## Post-Publish Gate

`npm run release:publish -- X.Y.Z` performs this gate automatically, including a bounded wait for npm registry metadata propagation. If publishing manually, after npm accepts all packages, wait for registry metadata to propagate, then verify a fresh consumer can install all four packages, execute both ESM and CommonJS entrypoints, and prove renderer-agnostic before-output trace evidence through installed `@ai-presence/core` and `@ai-presence/adapters`:

```bash
npm run release:consumer-smoke -- X.Y.Z
```

The consumer smoke should cover the generic chat quickstart trace, the OpenAI Responses adapter path, the assistant lifecycle adapter path, the assistant-ui ExternalStoreRuntime route, the vanilla status-surface adoption path, and the composer-lane adoption path. The Responses proof must import only installed `@ai-presence/core` and `@ai-presence/adapters`, simulate typed `response.created`, `response.output_item.added`, `response.output_text.delta`, and `response.completed` events, and print `responses consumer smoke ok`, before-output `streamOpenMs`, `firstOutputMs`, `leadMs`, `finalState=ready`, `hasOutput=true`, `complete=true`, and `interrupted=false`. The assistant lifecycle proof must also import only installed `@ai-presence/core` and `@ai-presence/adapters`, simulate `composer-input`, `composer-pause`, `run-created`, `message-created`, `text-delta`, and `run-completed` events, and print `surface=assistant-lifecycle`, `frameworkEventPath`, before-output `waiting`, `assistantOutputEmpty=true`, `streamOpenMs`, `firstOutputMs`, `leadMs`, `finalState=ready`, `hasOutput=true`, `complete=true`, and `interrupted=false`. The assistant-ui proof must also import only installed `@ai-presence/core` and `@ai-presence/adapters`, simulate documented `onNew`, `isRunning=true`, empty assistant message `status.type="running"`, first assistant text chunk, and `status.type="complete"` events into `createAssistantLifecycleAdapter`, and print `surface=assistant-ui-external-store`, `framework=assistant-ui`, `route=ExternalStoreRuntime`, `frameworkEventPath`, `frameworkStatusPath`, before-output `waiting`, `isRunning=true`, `assistantOutputEmpty=true`, `streamOpenMs`, `firstOutputMs`, `leadMs`, `presenceBeforeOutputMs`, `finalState=ready`, `hasOutput=true`, `complete=true`, and `interrupted=false`. The vanilla status-surface proof must also import only installed `@ai-presence/core` and `@ai-presence/adapters`, simulate generic chat `input`, `pause`, `submit`, `stream-open`, `token`, and `done` events, and print `vanilla status-surface consumer smoke ok`, `renderer=status-surface`, before-output `waiting`, `surfacePhase=before-output`, `surfaceAttention=response`, `surfaceEvent=stream-open`, `assistantTextEmpty=true`, `surfaceFirstOutputMs=none`, positive `surfaceLeadMs`, `streamOpenMs`, `firstOutputMs`, `leadMs`, `presenceBeforeOutputMs`, `finalState=ready`, `hasOutput=true`, `complete=true`, and `interrupted=false`. This is installed-package Node smoke evidence, not browser or visual evidence. The composer-lane proof must also import only installed `@ai-presence/core` and `@ai-presence/adapters`, simulate Vercel AI SDK-style `submitted`, `streaming`, and `ready` updates, and print `renderer=composer-lane`, before-output `waiting`, `streamOpenMs`, `firstOutputMs`, `leadMs`, `finalState=ready`, `hasOutput=true`, `complete=true`, and `interrupted=false`.

Confirm registry metadata for all packages:

```bash
npm view @ai-presence/core@X.Y.Z version
npm view @ai-presence/face@X.Y.Z version
npm view @ai-presence/adapters@X.Y.Z version
npm view @ai-presence/react@X.Y.Z version
```

Only push `main` and the release tag after npm visibility and the consumer smoke pass:

```bash
git push origin main
git push origin vX.Y.Z
```

## Stop Conditions

Stop and fix before publishing or pushing if any of these are true:

- unexpected dirty worktree files
- failing `npm run validate`, performance gates, or `git diff --check`
- browser smoke failures or uninspected visual changes
- README release screenshots are stale after visual changes
- tracked secret scan matches
- `.env`, `.env.local`, `.env.production`, or `.npmrc` is tracked
- package dry-run tarballs include env files, npm config, app/server files, lockfiles, `.git`, or `node_modules`
- npm scope access fails
- post-publish metadata is not visible
- consumer smoke cannot install all four packages, execute all four package entrypoints, or prove the installed generic chat quickstart trace, OpenAI Responses adapter path, assistant lifecycle adapter path, assistant-ui ExternalStoreRuntime route, vanilla status-surface adoption path, and composer-lane adoption path
