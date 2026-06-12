import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(new URL("..", import.meta.url).pathname);

function distUrl(packageName) {
  return pathToFileURL(resolve(root, "packages", packageName, "dist/index.mjs")).href;
}

const core = await import(distUrl("core"));
const face = await import(distUrl("face"));
const adapters = await import(distUrl("adapters"));
const react = await import(distUrl("react"));

assert.equal(core.PresenceState.THINKING, "thinking");
assert.equal(core.default.PresenceEvent.SUBMIT, core.PresenceEvent.SUBMIT);
assert.equal(typeof core.presenceControlInputsForSnapshot, "function");

const runtime = core.createPresenceRuntime();
const trace = core.createPresenceTrace({ limit: 8 });
trace.attach(runtime);
runtime.send(core.PresenceEvent.SUBMIT);
assert.equal(runtime.getSnapshot().state, core.PresenceState.THINKING);
assert.equal(trace.getEntries().at(-1).state, core.PresenceState.THINKING);
assert.equal(core.presenceControlInputsForSnapshot(runtime.getSnapshot()).latencyPhase, "before-output");
assert.equal(face.faceExpressionForPresence(runtime.getSnapshot()), face.FaceExpression.THINKING);
assert.equal(face.faceControlsForPresence(runtime.getSnapshot()).gaze.target, "middle-distance");
assert.equal(face.faceControllerDecisionsForPresence(runtime.getSnapshot()).decisions.gaze.controller, "gaze-controller");
assert.equal(face.faceControllerFrameForPresence(runtime.getSnapshot(), { timeMs: 1200 }).frame.mouth.shape, "pressed");
assert.deepEqual(face.FACE_CONTROL_CHANNELS, ["gaze", "blink", "brows", "mouth", "posture", "motion"]);

const adapter = adapters.createRuntimeSignalAdapter(runtime);
adapter.send({ type: adapters.RuntimeSignal.STREAM_OPEN });
assert.equal(runtime.getSnapshot().state, core.PresenceState.WAITING);

assert.equal(typeof react.createPresenceReactBindings, "function");
assert.equal(react.default.createPresenceReactBindings, react.createPresenceReactBindings);

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
const reactBindings = react.createPresenceReactBindings(fakeReact);
assert.equal(typeof reactBindings.usePresenceControlInputs, "function");
reactBindings.defaultRuntime.send(core.PresenceEvent.SUBMIT);
assert.equal(reactBindings.usePresenceControlInputs().attentionTarget, "response");

const consumerRoot = mkdtempSync(resolve(tmpdir(), "ai-presence-esm-consumer-"));

try {
  const scopeDir = resolve(consumerRoot, "node_modules/@ai-presence");
  mkdirSync(scopeDir, { recursive: true });

  for (const packageName of ["core", "face", "adapters", "react"]) {
    symlinkSync(resolve(root, "packages", packageName), resolve(scopeDir, packageName), "dir");
  }

  const consumerScript = resolve(consumerRoot, "consumer.mjs");
  writeFileSync(
    consumerScript,
    [
      'import { PresenceEvent, PresenceState, createPresenceRuntime, createPresenceTrace } from "@ai-presence/core";',
      'import { presenceControlInputsForSnapshot } from "@ai-presence/core";',
      'import { RuntimeSignal, createRuntimeSignalAdapter } from "@ai-presence/adapters";',
      'import { FaceExpression, faceControllerDecisionsForPresence, faceControllerFrameForPresence, faceControlsForPresence, faceExpressionForPresence } from "@ai-presence/face";',
      'import { createPresenceReactBindings } from "@ai-presence/react";',
      "const runtime = createPresenceRuntime();",
      "const trace = createPresenceTrace({ limit: 4 });",
      "trace.attach(runtime);",
      "runtime.send(PresenceEvent.SUBMIT);",
      "createRuntimeSignalAdapter(runtime).send({ type: RuntimeSignal.TOKEN });",
      "if (runtime.getSnapshot().state !== PresenceState.STREAMING) throw new Error('state mismatch');",
      "if (trace.getEntries().at(-1).state !== PresenceState.STREAMING) throw new Error('trace mismatch');",
      "if (presenceControlInputsForSnapshot(runtime.getSnapshot()).speechActivity <= 0) throw new Error('control inputs mismatch');",
      "if (faceExpressionForPresence(runtime.getSnapshot()) !== FaceExpression.SPEAKING) throw new Error('face mismatch');",
      "if (faceControlsForPresence(runtime.getSnapshot()).mouth.shape !== 'speaking') throw new Error('face controls mismatch');",
      "if (faceControllerDecisionsForPresence(runtime.getSnapshot()).decisions.mouth.controller !== 'mouth-controller') throw new Error('face decision mismatch');",
      "if (faceControllerFrameForPresence(runtime.getSnapshot(), { timeMs: 1600 }).frame.mouth.beat <= 0) throw new Error('face frame mismatch');",
      "if (typeof createPresenceReactBindings !== 'function') throw new Error('react export mismatch');",
      "let contextValue = null;",
      "const React = {",
      "  createContext(defaultValue) { contextValue = defaultValue; return { Provider: 'PresenceProvider', defaultValue }; },",
      "  createElement(type, props, children) { contextValue = props.value; return { type, props, children }; },",
      "  useContext(context) { return contextValue || context.defaultValue; },",
      "  useSyncExternalStore(subscribe, getSnapshot) { const unsubscribe = subscribe(() => {}); unsubscribe(); return getSnapshot(); },",
      "};",
      "const bindings = createPresenceReactBindings(React, { runtime });",
      "if (bindings.usePresenceControlInputs().latencyPhase !== 'output') throw new Error('react hook mismatch');",
      "console.log('specifier import ok');",
      "",
    ].join("\n"),
  );

  const result = spawnSync(process.execPath, [consumerScript], {
    cwd: consumerRoot,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /specifier import ok/);
} finally {
  rmSync(consumerRoot, { recursive: true, force: true });
}

console.log("esm-package ok");
