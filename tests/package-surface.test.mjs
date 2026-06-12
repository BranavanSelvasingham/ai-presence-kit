import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const root = resolve(new URL("..", import.meta.url).pathname);

for (const requiredFile of [
  ".github/workflows/ci.yml",
  "AGENTS.md",
  "CHANGELOG.md",
  "CORE_PILLARS.md",
  "docs/GOAL_LOOP.md",
  "docs/media/presence-comparison.jpg",
  "docs/media/react-browser-demo.jpg",
  "docs/ORCHESTRATION_LOOP.md",
  "docs/RELEASE_POLICY.md",
  "docs/RELEASE_READINESS.md",
  "OPERATING_MANUAL.md",
  "examples/adapter-demo.mjs",
  "examples/react-browser.css",
  "examples/react-browser-demo.js",
  "examples/react-browser.html",
  "examples/react-presence-demo.js",
  "package-lock.json",
  "scripts/check-package-names.mjs",
  "scripts/pack-dry-run.mjs",
  "VALIDATION.md",
]) {
  assert.ok(existsSync(resolve(root, requiredFile)), `${requiredFile} missing`);
}

const rootManifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
assert.match(rootManifest.scripts.check, /scripts\/pack-dry-run\.mjs/);
assert.match(rootManifest.scripts.check, /scripts\/check-package-names\.mjs/);
assert.equal(rootManifest.scripts["pack:dry-run"], "node scripts/pack-dry-run.mjs");
assert.equal(rootManifest.scripts["release:check-names"], "node scripts/check-package-names.mjs");
assert.match(rootManifest.scripts.validate, /npm run check/);
assert.match(rootManifest.scripts.validate, /npm test/);
assert.match(rootManifest.scripts.validate, /npm run demo:adapters/);
assert.match(rootManifest.scripts.validate, /npm run demo:react/);
assert.match(rootManifest.scripts.validate, /npm run pack:dry-run/);

const workflow = readFileSync(resolve(root, ".github/workflows/ci.yml"), "utf8");
assert.match(workflow, /npm ci/);
assert.match(workflow, /npm run validate/);

const releasePolicy = readFileSync(resolve(root, "docs/RELEASE_POLICY.md"), "utf8");
assert.match(releasePolicy, /0\.1\.0/);
assert.match(releasePolicy, /npm run release:check-names/);
assert.match(releasePolicy, /@ai-presence\/core -> npm E404/);
assert.match(releasePolicy, /scope/);

for (const mediaFile of [
  "docs/media/presence-comparison.jpg",
  "docs/media/react-browser-demo.jpg",
]) {
  const bytes = readFileSync(resolve(root, mediaFile));
  assert.ok(bytes.length > 10_000, `${mediaFile} is unexpectedly small`);
  assert.equal(bytes[0], 0xff, `${mediaFile} is not a JPEG`);
  assert.equal(bytes[1], 0xd8, `${mediaFile} is not a JPEG`);
}

const packages = [
  {
    dir: "packages/core",
    name: "@ai-presence/core",
    types: "src/presence-core.d.ts",
    exports: [
      "createPresenceControlInputRuntime",
      "createPresenceRuntime",
      "createPresenceTrace",
      "presenceControlInputsForSnapshot",
      "PresenceState",
      "PresenceEvent",
    ],
  },
  {
    dir: "packages/face",
    name: "@ai-presence/face",
    types: "src/presence-face.d.ts",
    exports: [
      "FACE_CONTROL_CHANNELS",
      "createFaceControllerFrameRuntime",
      "FaceExpression",
      "createFaceControllerRuntime",
      "createFaceRenderer",
      "faceControllerFrameForPresence",
      "faceControllerDecisionsForPresence",
      "faceControlsForPresence",
      "faceExpressionForPresence",
      "renderPresenceFaceSvg",
    ],
  },
  {
    dir: "packages/adapters",
    name: "@ai-presence/adapters",
    types: "src/runtime-adapter.d.ts",
    exports: ["createVercelAISDKAdapter", "createOpenAIRealtimeAdapter", "createChatEventAdapter"],
  },
  {
    dir: "packages/react",
    name: "@ai-presence/react",
    types: "src/presence-react.d.ts",
    exports: ["createPresenceReactBindings"],
  },
];

for (const packageInfo of packages) {
  const packagePath = resolve(root, packageInfo.dir);
  const manifest = JSON.parse(readFileSync(resolve(packagePath, "package.json"), "utf8"));
  assert.equal(manifest.name, packageInfo.name);
  assert.equal(manifest.types, `./${packageInfo.types}`);
  assert.equal(manifest.module, "./dist/index.mjs");
  assert.equal(manifest.exports["."].import, "./dist/index.mjs");
  assert.equal(manifest.exports["."].require, manifest.main);
  assert.ok(existsSync(resolve(packagePath, packageInfo.types)), `${packageInfo.name} types missing`);
  assert.ok(existsSync(resolve(packagePath, "dist/index.mjs")), `${packageInfo.name} ESM entry missing`);

  const api = require(packagePath);
  const esmApi = await import(pathToFileURL(resolve(packagePath, "dist/index.mjs")).href);
  for (const exportName of packageInfo.exports) {
    assert.ok(api[exportName], `${packageInfo.name} missing ${exportName}`);
    assert.ok(esmApi[exportName], `${packageInfo.name} ESM missing ${exportName}`);
  }
}

const faceGlobal = globalThis.AIPresenceFace;
assert.equal(typeof faceGlobal.faceControllerDecisionsForPresence, "function");
assert.equal(typeof faceGlobal.faceControllerFrameForPresence, "function");
assert.equal(typeof faceGlobal.createFaceControllerFrameRuntime, "function");
assert.equal(typeof faceGlobal.renderPresenceFaceSvg, "function");
assert.deepEqual(faceGlobal.FACE_CONTROL_CHANNELS, ["gaze", "blink", "brows", "mouth", "posture", "motion"]);
assert.match(faceGlobal.renderPresenceFaceSvg("thinking", { timeMs: 1200 }).svg, /data-presence-state="thinking"/);

const coreApi = require(resolve(root, "packages/core"));
let contextValue = null;
const fakeReact = {
  createContext(defaultValue) {
    contextValue = defaultValue;
    return {
      Provider: "PresenceProvider",
      defaultValue,
    };
  },
  createElement(type, props, children) {
    contextValue = props.value;
    return { type, props, children };
  },
  useContext(context) {
    return contextValue || context.defaultValue;
  },
  useSyncExternalStore(subscribe, getSnapshot) {
    const unsubscribe = subscribe(() => {});
    unsubscribe();
    return getSnapshot();
  },
};

const reactApi = require(resolve(root, "packages/react"));
const reactBindings = reactApi.createPresenceReactBindings(fakeReact);
assert.equal(typeof reactBindings.usePresenceControlInputs, "function");
reactBindings.defaultRuntime.send(coreApi.PresenceEvent.SUBMIT);
assert.equal(reactBindings.usePresenceControlInputs().latencyPhase, "before-output");

const reactTypes = readFileSync(resolve(root, "packages/react/src/presence-react.d.ts"), "utf8");
assert.match(reactTypes, /PresenceControlInputOptions/);
assert.match(reactTypes, /PresenceControlInputs/);
assert.match(reactTypes, /usePresenceControlInputs/);

console.log("package-surface ok");
