# Release Runbook

Use this gate after each major improvement and before every npm publish.

## Milestone Closeout

Every meaningful milestone should end with a durable handoff, not only local edits:

1. Review `git status --short --branch`.
2. Run the narrow validation for the touched area.
3. Run `npm run release:preflight` before broad readiness claims.
4. Commit the intended files and push the branch.
5. If package source, package README, package metadata, examples, release media, or public package behavior changed, bump the lockstep package version and publish all four packages.
6. After npm publish, run `npm run release:consumer-smoke -- X.Y.Z`.
7. Verify npm metadata, then push the release tag.

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

Browser-smoke visual or runtime-facing changes on:

```text
http://127.0.0.1:8058/
http://127.0.0.1:8058/?metrics=1&presence=expressive
http://127.0.0.1:8058/?controllerGallery=1
http://127.0.0.1:8058/?compare=1&autorunCompare=1
http://127.0.0.1:8058/examples/react-browser.html?autorun=1
```

Record evidence for the attributes listed in `docs/RELEASE_READINESS.md`, especially before-output timing, complete trace summaries, six-channel controller reads, and renderer-safe decision traces.

To refresh the README release screenshot after visual changes, start the local server and run:

```bash
npm run release:capture-media
```

The capture command writes:

```text
docs/media/main-app-release.png
```

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
- `npm run release:security`
- `git diff --check`
- `npm run release:check-scope`

`npm run release:security` verifies `.env` and npm config files are ignored and untracked, scans tracked files for OpenAI/npm-token-shaped secrets without printing secret values, and confirms package dry-run tarballs do not include forbidden files.

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

Publish in dependency order:

```bash
npm publish ./packages/core --access public
npm publish ./packages/face --access public
npm publish ./packages/adapters --access public
npm publish ./packages/react --access public
```

If npm asks for a one-time password or passkey confirmation, complete it outside the repo and do not paste the value anywhere in the project.

## Post-Publish Gate

After npm accepts all packages, wait for registry metadata to propagate, then verify a fresh consumer can install and execute both ESM and CommonJS entrypoints:

```bash
npm run release:consumer-smoke -- X.Y.Z
```

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
- consumer smoke cannot install or execute all four package entrypoints
