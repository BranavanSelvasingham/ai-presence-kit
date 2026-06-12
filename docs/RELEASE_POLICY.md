# Release Policy

AI Presence Kit is pre-release. The repository version and package versions remain `0.0.0` until the first public npm publish is intentional.

## Package Names

Intended public package names:

```text
@ai-presence/core
@ai-presence/face
@ai-presence/adapters
@ai-presence/react
```

Registry check on 2026-05-30:

```text
@ai-presence/core -> npm E404, not published
@ai-presence/face -> npm E404, not published
@ai-presence/adapters -> npm E404, not published
@ai-presence/react -> npm E404, not published
```

Registry recheck on 2026-06-12:

```text
@ai-presence/core -> npm E404, not published
@ai-presence/face -> npm E404, not published
@ai-presence/adapters -> npm E404, not published
@ai-presence/react -> npm E404, not published
```

Run this again immediately before publishing:

```bash
npm run release:check-names
```

An npm `404` proves the package name is not published in the registry. It does not prove that the publisher controls the `@ai-presence` scope. Before publishing, create or confirm control of the npm user/org scope.

## Versioning

Use lockstep package versions for the initial public phase. The four packages depend on the same core state contract, so publishing them together keeps adapters, renderers, and React bindings easier to reason about.

Initial public release target:

```text
0.1.0
```

Keep `0.0.0` only for unpublished local development.

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

1. Bump the root package and all workspace package versions from `0.0.0` to the release version.
2. Bump internal workspace dependency versions to the same release version.
3. Update `CHANGELOG.md`.
4. Run `npm run validate`.
5. Run `git diff --check`.
6. Browser-smoke the reference route, comparison route, and React browser demo.
7. Run `npm run release:check-names`.
8. Publish in dependency order: `core`, `face`, `adapters`, `react`.
