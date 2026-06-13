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
  "tests/adapter-demo.test.mjs",
  "examples/react-browser.css",
  "examples/react-browser-demo.js",
  "examples/react-browser.html",
  "examples/react-presence-demo.js",
  "package-lock.json",
  "scripts/check-package-names.mjs",
  "scripts/check-npm-scope.mjs",
  "scripts/pack-dry-run.mjs",
  "scripts/benchmark-face-pipeline.mjs",
  "VALIDATION.md",
]) {
  assert.ok(existsSync(resolve(root, requiredFile)), `${requiredFile} missing`);
}

const rootManifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
assert.equal(rootManifest.description, "Low-latency facial presence engine for AI interfaces.");
assert.match(rootManifest.scripts.check, /scripts\/pack-dry-run\.mjs/);
assert.match(rootManifest.scripts.check, /scripts\/check-package-names\.mjs/);
assert.match(rootManifest.scripts.check, /scripts\/check-npm-scope\.mjs/);
assert.match(rootManifest.scripts.check, /scripts\/benchmark-face-pipeline\.mjs/);
assert.equal(rootManifest.scripts["pack:dry-run"], "node scripts/pack-dry-run.mjs");
assert.equal(rootManifest.scripts["perf:face"], "node scripts/benchmark-face-pipeline.mjs");
assert.equal(rootManifest.scripts["release:check-names"], "node scripts/check-package-names.mjs");
assert.equal(rootManifest.scripts["release:check-scope"], "node scripts/check-npm-scope.mjs");
assert.match(rootManifest.scripts.validate, /npm run check/);
assert.match(rootManifest.scripts.validate, /npm test/);
assert.match(rootManifest.scripts.validate, /npm run demo:adapters/);
assert.match(rootManifest.scripts.validate, /npm run demo:react/);
assert.match(rootManifest.scripts.validate, /npm run pack:dry-run/);
assert.match(rootManifest.scripts.test, /tests\/adapter-demo\.test\.mjs/);

const workflow = readFileSync(resolve(root, ".github/workflows/ci.yml"), "utf8");
assert.match(workflow, /npm ci/);
assert.match(workflow, /npm run validate/);

const server = readFileSync(resolve(root, "server.mjs"), "utf8");
assert.doesNotMatch(server, /features\.emotion/);
assert.match(server, /Return interaction posture, not emotion detection/);

const releasePolicy = readFileSync(resolve(root, "docs/RELEASE_POLICY.md"), "utf8");
assert.match(releasePolicy, /0\.1\.0/);
assert.match(releasePolicy, /npm run release:check-names/);
assert.match(releasePolicy, /npm run release:check-scope/);
assert.match(releasePolicy, /@ai-presence\/core -> npm E404/);
assert.match(releasePolicy, /2026-06-12/);
assert.match(releasePolicy, /scope/);

const releaseReadiness = readFileSync(resolve(root, "docs/RELEASE_READINESS.md"), "utf8");
assert.match(releaseReadiness, /faceControllerFrameForPresence|temporal frame reports/);
assert.match(releaseReadiness, /faceControllerDecisionTraceForFrame/);
assert.match(releaseReadiness, /faceControllerCoherenceForFrame|coherence evidence/);
assert.match(releaseReadiness, /motionScale/);
assert.match(releaseReadiness, /renderPresenceFaceSvg/);
assert.match(releaseReadiness, /data-controller-decision-trace/);
assert.match(releaseReadiness, /data-transition-events="submit stream-open token interrupt"/);
assert.match(releaseReadiness, /data-transition-decision-trace="complete"/);
assert.match(releaseReadiness, /data-transition-controller-reads="gaze blink brows mouth posture motion"/);
assert.match(releaseReadiness, /data-transition-controller-reads-event="true"/);
assert.match(releaseReadiness, /data-transition-controller-reads-age="true"/);
assert.match(releaseReadiness, /data-generic-first-token-ms/);
assert.match(releaseReadiness, /data-presence-first-token-ms/);
assert.match(releaseReadiness, /data-presence-first-state-ms/);
assert.match(releaseReadiness, /data-presence-frame-before-token-ms/);
assert.match(releaseReadiness, /data-presence-decision-trace-before-token-ms/);
assert.match(releaseReadiness, /data-presence-decision-trace-lead-ms/);
assert.match(releaseReadiness, /data-face-decision-trace="complete"/);
assert.match(releaseReadiness, /data-face-decision-trace-channels="gaze blink brows mouth posture motion"/);
assert.match(releaseReadiness, /data-face-decision-trace-decisions="6"/);
assert.match(releaseReadiness, /data-face-decision-trace-warnings="0"/);
assert.match(releaseReadiness, /data-face-decision-trace-renderer-safe="true"/);
assert.match(releaseReadiness, /data-face-latency-phase="before-output"/);
assert.match(releaseReadiness, /usePresenceFrameTime/);
assert.match(releaseReadiness, /before the first visible token/);
assert.match(releaseReadiness, /npm run perf:face/);
assert.match(releaseReadiness, /package-level latency evidence/);
assert.match(releaseReadiness, /2026-06-12/);
assert.match(releaseReadiness, /npm run release:check-scope/);

const validation = readFileSync(resolve(root, "VALIDATION.md"), "utf8");
assert.match(validation, /npm run perf:face/);
assert.match(validation, /0\.25ms/);

const operatingManual = readFileSync(resolve(root, "OPERATING_MANUAL.md"), "utf8");
assert.match(operatingManual, /npm run release:check-names/);
assert.match(operatingManual, /npm run release:check-scope/);
assert.match(operatingManual, /Browser-smoke the reference, metrics, comparison, and React browser routes/);

const goalLoop = readFileSync(resolve(root, "docs/GOAL_LOOP.md"), "utf8");
assert.match(goalLoop, /2026-06-12/);
assert.match(goalLoop, /npm run release:check-scope/);

const changelog = readFileSync(resolve(root, "CHANGELOG.md"), "utf8");
assert.match(changelog, /parallel face controller decisions/);
assert.match(changelog, /faceControllerDecisionTraceForFrame/);
assert.match(changelog, /renderPresenceFaceSvg/);
assert.match(changelog, /motionScale/);
assert.match(changelog, /data-controller-decision-trace/);
assert.match(changelog, /adapter demo decision-trace evidence/);
assert.match(changelog, /npm run perf:face/);
assert.match(changelog, /face-pipeline benchmark validation/);
assert.match(changelog, /release:check-scope/);
assert.match(changelog, /adapter demo coverage/);
assert.match(changelog, /usePresenceFrameTime/);
assert.match(changelog, /before-first-token presence/);
assert.match(changelog, /comparison-route DOM lead-time evidence/);
assert.match(changelog, /React browser renderer-slot DOM evidence/);
assert.match(changelog, /controller-gallery transition-cue DOM evidence/);
assert.match(changelog, /data-face-latency-phase="before-output"/);

const adapterDemo = readFileSync(resolve(root, "examples/adapter-demo.mjs"), "utf8");
assert.match(adapterDemo, /faceControllerFrameForPresence/);
assert.match(adapterDemo, /faceControllerDecisionTraceForFrame/);
assert.match(adapterDemo, /FACE_CONTROL_CHANNELS/);
assert.match(adapterDemo, /channels=/);
assert.match(adapterDemo, /trace=/);
assert.match(adapterDemo, /decisions=/);
assert.match(adapterDemo, /safe=/);
assert.match(adapterDemo, /warnings=/);

const adaptersReadme = readFileSync(resolve(root, "packages/adapters/README.md"), "utf8");
assert.match(adaptersReadme, /reference face frame evidence/);
assert.match(adaptersReadme, /decision-trace evidence/);
assert.match(adaptersReadme, /channels=gaze,blink,brows,mouth,posture,motion/);
assert.match(adaptersReadme, /trace=complete/);

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
    description: "Renderer-agnostic presence state runtime for AI interfaces.",
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
    description: "SVG reference face renderer with parallel presence controllers.",
    types: "src/presence-face.d.ts",
    exports: [
      "FACE_CONTROL_CHANNELS",
      "createFaceControllerFrameRuntime",
      "FaceExpression",
      "createFaceControllerRuntime",
      "createFaceRenderer",
      "faceControllerCoherenceForFrame",
      "faceControllerDecisionTraceForFrame",
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
    description: "Runtime signal adapters for AI Presence Kit.",
    types: "src/runtime-adapter.d.ts",
    exports: ["createVercelAISDKAdapter", "createOpenAIRealtimeAdapter", "createChatEventAdapter"],
  },
  {
    dir: "packages/react",
    name: "@ai-presence/react",
    description: "React bindings for AI Presence Kit presence runtimes.",
    types: "src/presence-react.d.ts",
    exports: ["createPresenceReactBindings"],
  },
];

for (const packageInfo of packages) {
  const packagePath = resolve(root, packageInfo.dir);
  const manifest = JSON.parse(readFileSync(resolve(packagePath, "package.json"), "utf8"));
  assert.equal(manifest.name, packageInfo.name);
  assert.equal(manifest.description, packageInfo.description);
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

const coreTypes = readFileSync(resolve(root, "packages/core/src/presence-core.d.ts"), "utf8");
assert.match(coreTypes, /PresenceTransitionEvent = PresenceEventValue \| "set-state"/);
assert.match(coreTypes, /previousState: PresenceStateValue \| null/);
assert.match(coreTypes, /transitionEvent: PresenceTransitionEvent \| null/);
assert.match(coreTypes, /transitionAgeMs: number/);

const faceGlobal = globalThis.AIPresenceFace;
assert.equal(typeof faceGlobal.faceControllerDecisionsForPresence, "function");
assert.equal(typeof faceGlobal.faceControllerCoherenceForFrame, "function");
assert.equal(typeof faceGlobal.faceControllerDecisionTraceForFrame, "function");
assert.equal(typeof faceGlobal.faceControllerFrameForPresence, "function");
assert.equal(typeof faceGlobal.createFaceControllerFrameRuntime, "function");
assert.equal(typeof faceGlobal.renderPresenceFaceSvg, "function");
assert.deepEqual(faceGlobal.FACE_CONTROL_CHANNELS, ["gaze", "blink", "brows", "mouth", "posture", "motion"]);
assert.match(faceGlobal.renderPresenceFaceSvg("thinking", { timeMs: 1200 }).svg, /data-presence-state="thinking"/);
assert.match(faceGlobal.renderPresenceFaceSvg("thinking", { timeMs: 1200 }).svg, /data-face-decision-trace="complete"/);
assert.equal(faceGlobal.renderPresenceFaceSvg("thinking", { timeMs: 1200 }).attributes.decisionTrace, "complete");
assert.equal(faceGlobal.renderPresenceFaceSvg("thinking", { timeMs: 1200 }).decisionTrace.decisionCount, 6);
const transitionGlobalSvg = faceGlobal.renderPresenceFaceSvg({
  state: "thinking",
  previousState: "ready",
  event: "submit",
  updatedAt: 1000,
}, {
  now: 1080,
  timeMs: 1080,
});
assert.deepEqual(transitionGlobalSvg.decisionTrace.transitionContext, {
  previousState: "ready",
  transitionEvent: "submit",
  transitionAgeMs: 80,
});
assert.equal(transitionGlobalSvg.attributes.previousState, "ready");
assert.equal(transitionGlobalSvg.attributes.transitionEvent, "submit");
assert.equal(transitionGlobalSvg.attributes.transitionAgeMs, "80");
assert.match(transitionGlobalSvg.svg, /data-face-previous-state="ready"/);
assert.match(transitionGlobalSvg.svg, /data-face-transition-event="submit"/);
assert.match(transitionGlobalSvg.svg, /data-face-transition-age-ms="80"/);
assert.equal(faceGlobal.faceControllerFrameForPresence("waiting", { timeMs: 1200 }).coherence.rendererSafe, true);
assert.equal(faceGlobal.faceControllerDecisionTraceForFrame(
  faceGlobal.faceControllerFrameForPresence("waiting", { timeMs: 1200 }),
).decisionCount, 6);

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
  useEffect(effect) {
    const cleanup = effect();
    if (typeof cleanup === "function") cleanup();
    return cleanup;
  },
  useState(initialState) {
    const state = typeof initialState === "function" ? initialState() : initialState;
    return [state, () => {}];
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
assert.equal(typeof reactBindings.usePresenceFrameTime, "function");
assert.equal(typeof reactBindings.PresenceRendererSlot, "function");
reactBindings.defaultRuntime.send(coreApi.PresenceEvent.SUBMIT);
assert.equal(reactBindings.usePresenceControlInputs().latencyPhase, "before-output");
const reactSlot = reactBindings.PresenceRendererSlot({
  frameOptions: { now: () => 1200 },
  children: (slot) => slot,
});
assert.equal(reactSlot.snapshot.state, coreApi.PresenceState.THINKING);
assert.equal(reactSlot.controlInputs.latencyPhase, "before-output");
assert.equal(reactSlot.controlInputs.attentionTarget, "response");
assert.equal(reactSlot.frameTimeMs, 1200);
assert.equal(reactSlot.runtime, reactBindings.defaultRuntime);

const reactEsmApi = await import(pathToFileURL(resolve(root, "packages/react/dist/index.mjs")).href);
const reactEsmBindings = reactEsmApi.createPresenceReactBindings(fakeReact);
assert.equal(typeof reactEsmBindings.usePresenceFrameTime, "function");
assert.equal(typeof reactEsmBindings.PresenceRendererSlot, "function");
assert.equal(reactEsmBindings.usePresenceFrameTime({ now: () => 1200 }), 1200);

const reactTypes = readFileSync(resolve(root, "packages/react/src/presence-react.d.ts"), "utf8");
assert.match(reactTypes, /PresenceControlInputOptions/);
assert.match(reactTypes, /PresenceControlInputs/);
assert.match(reactTypes, /usePresenceControlInputs/);
assert.match(reactTypes, /PresenceFrameTimeOptions/);
assert.match(reactTypes, /usePresenceFrameTime/);
assert.match(reactTypes, /PresenceRendererSlotValue/);
assert.match(reactTypes, /PresenceRendererSlotProps/);
assert.match(reactTypes, /PresenceRendererSlot/);

const faceTypes = readFileSync(resolve(root, "packages/face/src/presence-face.d.ts"), "utf8");
assert.match(faceTypes, /motionScale\?: number/);
assert.match(faceTypes, /motionScale: string/);
assert.match(faceTypes, /PresenceTransitionEvent/);
assert.match(faceTypes, /FaceControllerTransitionContext/);
assert.match(faceTypes, /transitionContext: FaceControllerTransitionContext/);
assert.match(faceTypes, /transitionAgeMs: number \| null/);
assert.match(faceTypes, /decisionTrace: "complete" \| "incomplete"/);
assert.match(faceTypes, /decisionTraceChannels: string/);
assert.match(faceTypes, /decisionTraceRendererSafe: "true" \| "false"/);
assert.match(faceTypes, /latencyPhase\?: PresenceLatencyPhase/);
assert.match(faceTypes, /previousState\?: PresenceStateValue/);
assert.match(faceTypes, /transitionEvent\?: PresenceTransitionEvent/);
assert.match(faceTypes, /transitionAgeMs\?: string/);
assert.match(faceTypes, /decisionTrace: FaceControllerDecisionTrace/);
assert.match(faceTypes, /FaceControllerCoherence/);
assert.match(faceTypes, /faceControllerCoherenceForFrame/);
assert.match(faceTypes, /FaceControllerDecisionTrace/);
assert.match(faceTypes, /faceControllerDecisionTraceForFrame/);

const rootReadme = readFileSync(resolve(root, "README.md"), "utf8");
assert.match(rootReadme, /PresenceRendererSlot/);
assert.match(rootReadme, /usePresenceFrameTime/);
assert.match(rootReadme, /renderPresenceFaceSvg/);
assert.match(rootReadme, /npm run demo:adapters/);
assert.match(rootReadme, /npm run perf:face/);
assert.match(rootReadme, /0\.25ms/);
assert.match(rootReadme, /reference face frame evidence/);
assert.match(rootReadme, /decision-trace evidence/);
assert.match(rootReadme, /data-generic-first-token-ms/);
assert.match(rootReadme, /data-presence-first-state-ms/);
assert.match(rootReadme, /data-presence-frame-before-token-ms/);
assert.match(rootReadme, /data-presence-decision-trace-lead-ms/);
assert.match(rootReadme, /data-face-decision-trace="complete"/);
assert.match(rootReadme, /data-face-decision-trace-channels="gaze blink brows mouth posture motion"/);
assert.match(rootReadme, /data-face-decision-trace-decisions="6"/);
assert.match(rootReadme, /data-face-decision-trace-warnings="0"/);
assert.match(rootReadme, /data-face-decision-trace-renderer-safe="true"/);
assert.match(rootReadme, /data-face-latency-phase="before-output"/);
assert.match(rootReadme, /data-transition-events="submit stream-open token interrupt"/);
assert.match(rootReadme, /data-transition-decision-trace="complete"/);
assert.match(rootReadme, /data-transition-controller-reads="gaze blink brows mouth posture motion"/);

const faceReadme = readFileSync(resolve(root, "packages/face/README.md"), "utf8");
assert.match(faceReadme, /motionScale/);
assert.match(faceReadme, /reduced motion/);
assert.match(faceReadme, /renderer-owned decision-trace evidence/);
assert.match(faceReadme, /transitionContext/);
assert.match(faceReadme, /data-face-transition-event/);
assert.match(faceReadme, /data-face-decision-trace\*/);
assert.doesNotMatch(faceReadme, /emotion[- ]detection|private emotion/i);

const reactReadme = readFileSync(resolve(root, "packages/react/README.md"), "utf8");
assert.match(reactReadme, /PresenceRendererSlot/);
assert.match(reactReadme, /controlInputs/);
assert.match(reactReadme, /usePresenceFrameTime/);
assert.match(reactReadme, /Date\.now/);
assert.doesNotMatch(reactReadme, /emotion[- ]detection|private emotion/i);

console.log("package-surface ok");
