# Validation

Run the smallest command that can prove the change, then run broader validation before release or commit handoff.

## Default Gates

```bash
npm run check
npm test
npm run demo:adapters
npm run demo:react
npm run pack:dry-run
git diff --check
```

The combined repository gate is:

```bash
npm run validate
```

## When To Run What

- Core state, runtime, package exports, TypeScript declarations: `npm test`, then `npm run validate`.
- Adapter mappings: `npm run demo:adapters`, `node tests/runtime-adapter.test.mjs`, then `npm run validate`.
- React bindings or React examples: `npm run demo:react`, React tests, then `npm run validate`.
- Browser or visual behavior: run the relevant browser route and inspect the output directly.
- Packaging or release work: `npm run validate`, `git diff --check`, browser smoke, then `npm run release:check-names`. Before publishing from an authenticated npm session, also run `npm run release:check-scope`.

## Browser Smoke Routes

```text
http://127.0.0.1:8058/
http://127.0.0.1:8058/?metrics=1&presence=expressive
http://127.0.0.1:8058/?compare=1&autorunCompare=1
http://127.0.0.1:8058/examples/react-browser.html
```

Browser checks should confirm:

- reference demo loads without console errors
- metrics route shows canonical `Presence state`
- comparison route uses equal simulated latency on both sides
- presence side exposes state before first token
- React browser demo runs a simulated AI SDK turn and returns to `ready`

## Release Name Check

Package-name availability is time-sensitive. Re-run immediately before publishing:

```bash
npm run release:check-names
```

An npm `404` only proves a package name is unpublished. It does not prove control of the `@ai-presence` npm scope.

## Release Scope Check

Scope control requires npm authentication and is not part of CI. Run after `npm login` and before publishing:

```bash
npm run release:check-scope
```
