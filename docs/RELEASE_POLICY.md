# Release Policy

AI Presence Kit is a public `0.x` npm package family. The first public npm release was `v0.1.0` on 2026-06-14.

Use `docs/RELEASE_RUNBOOK.md` as the repeatable release gate for every major improvement and every new publish.

## Package Names

Intended public package names:

```text
@ai-presence/core
@ai-presence/face
@ai-presence/adapters
@ai-presence/react
```

Historical registry check on 2026-05-30 before the first public release:

```text
@ai-presence/core -> npm E404, not published
@ai-presence/face -> npm E404, not published
@ai-presence/adapters -> npm E404, not published
@ai-presence/react -> npm E404, not published
```

Historical registry recheck on 2026-06-12 before the first public release:

```text
@ai-presence/core -> npm E404, not published
@ai-presence/face -> npm E404, not published
@ai-presence/adapters -> npm E404, not published
@ai-presence/react -> npm E404, not published
```

`release:check-names` was a first-public-release name-availability check:

```bash
npm run release:check-names
```

An npm `404` proved a package name was not published in the registry. It does not prove that the publisher controls the `@ai-presence` scope. Now that `v0.1.0` is published, this command is no longer an ongoing release blocker for existing package names.

For every ongoing release, authenticate with npm and verify scope access:

```bash
npm run release:check-scope
```

This check intentionally is not part of CI because it requires npm credentials. It is included in the local `npm run release:preflight` gate.

## Versioning

Use lockstep package versions for the initial public phase. The four packages depend on the same core state contract, so publishing them together keeps adapters, renderers, and React bindings easier to reason about.

First public release:

```text
0.1.0
```

Use `0.0.0` only for unpublished local development before the first public release.

For `0.x` releases:

- Patch bumps fix bugs without changing the public state/event contract.
- Minor bumps may add states, events, adapter helpers, renderer mappings, or React binding APIs.
- Avoid removing or renaming canonical presence states until a future `1.0.0`.
- If a state/event contract must change, update all package versions together and document the migration.

## Changelog Format

Keep one changelog section per release version.

Use these headings when useful:

```text
Added
Changed
Fixed
Validation
```

Before a public release:

1. Bump the root package and all workspace package versions to the release version.
2. Bump internal workspace dependency versions to the same release version.
3. Update `CHANGELOG.md`.
4. Run `npm run release:public-gate` when first-time visitor or collaborator-facing surfaces changed.
5. Run `npm run release:preflight`.
6. Run `npm run browser:smoke` to verify the reference, metrics/controller, controller gallery, comparison, React browser, face-free composer-lane, and vanilla status-surface routes.
7. Commit and tag the release.
8. Publish with `npm run release:publish -- X.Y.Z`.
9. Verify npm metadata, then push `main` and `vX.Y.Z`.

See `docs/RELEASE_RUNBOOK.md` for the exact commands and stop conditions.
