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
assert.equal(typeof core.summarizePresenceTrace, "function");

const runtime = core.createPresenceRuntime();
const trace = core.createPresenceTrace({ limit: 8 });
trace.attach(runtime);
runtime.send(core.PresenceEvent.SUBMIT);
assert.equal(runtime.getSnapshot().state, core.PresenceState.THINKING);
assert.equal(trace.getEntries().at(-1).state, core.PresenceState.THINKING);
assert.equal(core.presenceControlInputsForSnapshot(runtime.getSnapshot()).latencyPhase, "before-output");
const noOutputSummary = core.summarizePresenceTrace(trace);
assert.equal(noOutputSummary.hasOutput, false);
assert.equal(noOutputSummary.firstOutputMs, null);
const transitionInputs = core.presenceControlInputsForSnapshot(runtime.getSnapshot(), {
  trace,
  now: runtime.getSnapshot().updatedAt + 5,
});
assert.equal(transitionInputs.previousState, core.PresenceState.IDLE);
assert.equal(transitionInputs.transitionEvent, core.PresenceEvent.SUBMIT);
assert.equal(transitionInputs.transitionAgeMs, 5);
const transitionFrame = face.faceControllerFrameForPresence(runtime.getSnapshot(), {
  trace,
  now: runtime.getSnapshot().updatedAt + 5,
  timeMs: 1200,
});
assert.deepEqual(face.faceControllerDecisionTraceForFrame(transitionFrame).transitionContext, {
  previousState: core.PresenceState.IDLE,
  transitionEvent: core.PresenceEvent.SUBMIT,
  transitionAgeMs: 5,
});
const transitionSvg = face.renderPresenceFaceSvg(runtime.getSnapshot(), {
  trace,
  now: runtime.getSnapshot().updatedAt + 5,
  timeMs: 1200,
});
assert.equal(transitionSvg.attributes.previousState, core.PresenceState.IDLE);
assert.equal(transitionSvg.attributes.transitionEvent, core.PresenceEvent.SUBMIT);
assert.equal(transitionSvg.attributes.transitionAgeMs, "5");
assert.match(transitionSvg.svg, /data-face-transition-event="submit"/);
assert.equal(face.faceExpressionForPresence(runtime.getSnapshot()), face.FaceExpression.THINKING);
assert.equal(face.faceControlsForPresence(runtime.getSnapshot()).gaze.target, "middle-distance");
assert.equal(face.faceControllerDecisionsForPresence(runtime.getSnapshot()).decisions.gaze.controller, "gaze-controller");
assert.equal(face.faceControllerFrameForPresence(runtime.getSnapshot(), { timeMs: 1200 }).frame.mouth.shape, "pressed");
assert.equal(face.faceControllerFrameForPresence(runtime.getSnapshot(), { timeMs: 1200 }).coherence.rendererSafe, true);
assert.equal(face.faceControllerCoherenceForFrame(face.faceControllerFrameForPresence(runtime.getSnapshot(), { timeMs: 1200 })).complete, true);
assert.equal(face.faceControllerDecisionTraceForFrame(face.faceControllerFrameForPresence(runtime.getSnapshot(), { timeMs: 1200 })).decisionCount, 6);
assert.deepEqual(
  face.faceControllerFrameForPresence(runtime.getSnapshot(), { timeMs: 1200, motionScale: 0 }).frame,
  face.faceControllerFrameForPresence(runtime.getSnapshot(), { timeMs: 2400, motionScale: 0 }).frame,
);
assert.match(face.renderPresenceFaceSvg(runtime.getSnapshot(), { timeMs: 1200 }).svg, /data-presence-state="thinking"/);
assert.equal(face.renderPresenceFaceSvg(runtime.getSnapshot(), { timeMs: 1200 }).decisionTrace.decisionCount, 6);
assert.equal(face.renderPresenceFaceSvg(runtime.getSnapshot(), { timeMs: 1200 }).attributes.decisionTrace, "complete");
assert.match(face.renderPresenceFaceSvg(runtime.getSnapshot(), { timeMs: 1200 }).svg, /data-face-decision-trace="complete"/);
assert.match(face.renderPresenceFaceSvg(runtime.getSnapshot(), { timeMs: 1200 }).svg, /data-face-latency-phase="before-output"/);
assert.match(face.renderPresenceFaceSvg(runtime.getSnapshot(), { timeMs: 1200, motionScale: 0 }).svg, /data-motion-scale="0"/);
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
assert.equal(typeof reactBindings.PresenceRendererSlot, "function");
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
      'import { presenceControlInputsForSnapshot, summarizePresenceTrace } from "@ai-presence/core";',
      'import { RuntimeSignal, createRuntimeSignalAdapter } from "@ai-presence/adapters";',
      'import { FaceExpression, faceControllerCoherenceForFrame, faceControllerDecisionTraceForFrame, faceControllerDecisionsForPresence, faceControllerFrameForPresence, faceControlsForPresence, faceExpressionForPresence, renderPresenceFaceSvg } from "@ai-presence/face";',
      'import { createPresenceReactBindings } from "@ai-presence/react";',
      "const runtime = createPresenceRuntime();",
      "const trace = createPresenceTrace({ limit: 4 });",
      "trace.attach(runtime);",
      "runtime.send(PresenceEvent.SUBMIT);",
      "createRuntimeSignalAdapter(runtime).send({ type: RuntimeSignal.TOKEN });",
      "if (runtime.getSnapshot().state !== PresenceState.STREAMING) throw new Error('state mismatch');",
      "if (trace.getEntries().at(-1).state !== PresenceState.STREAMING) throw new Error('trace mismatch');",
      "const summary = summarizePresenceTrace(trace);",
      "if (summary.firstOutputEvent !== PresenceEvent.TOKEN) throw new Error('trace summary output mismatch');",
      "if (!summary.hasOutput) throw new Error('trace summary output flag mismatch');",
      "if (presenceControlInputsForSnapshot(runtime.getSnapshot()).speechActivity <= 0) throw new Error('control inputs mismatch');",
      "const inputs = presenceControlInputsForSnapshot(runtime.getSnapshot(), { trace, now: runtime.getSnapshot().updatedAt + 1 });",
      "if (inputs.previousState !== PresenceState.THINKING) throw new Error('transition previous mismatch');",
      "if (inputs.transitionEvent !== PresenceEvent.TOKEN) throw new Error('transition event mismatch');",
      "if (inputs.transitionAgeMs !== 1) throw new Error('transition age mismatch');",
      "const faceTrace = faceControllerDecisionTraceForFrame(faceControllerFrameForPresence(runtime.getSnapshot(), { trace, now: runtime.getSnapshot().updatedAt + 1, timeMs: 1600 }));",
      "if (faceTrace.transitionContext.transitionEvent !== PresenceEvent.TOKEN) throw new Error('face trace transition event mismatch');",
      "if (faceTrace.transitionContext.transitionAgeMs !== 1) throw new Error('face trace transition age mismatch');",
      "if (faceExpressionForPresence(runtime.getSnapshot()) !== FaceExpression.SPEAKING) throw new Error('face mismatch');",
      "if (faceControlsForPresence(runtime.getSnapshot()).mouth.shape !== 'speaking') throw new Error('face controls mismatch');",
      "if (faceControllerDecisionsForPresence(runtime.getSnapshot()).decisions.mouth.controller !== 'mouth-controller') throw new Error('face decision mismatch');",
      "if (faceControllerFrameForPresence(runtime.getSnapshot(), { timeMs: 1600 }).frame.mouth.beat <= 0) throw new Error('face frame mismatch');",
      "if (!faceControllerFrameForPresence(runtime.getSnapshot(), { timeMs: 1600 }).coherence.rendererSafe) throw new Error('face coherence mismatch');",
      "if (!faceControllerCoherenceForFrame(faceControllerFrameForPresence(runtime.getSnapshot(), { timeMs: 1600 })).complete) throw new Error('face coherence helper mismatch');",
      "if (faceControllerDecisionTraceForFrame(faceControllerFrameForPresence(runtime.getSnapshot(), { timeMs: 1600 })).decisions.mouth.controller !== 'mouth-controller') throw new Error('face decision trace mismatch');",
      "if (faceControllerFrameForPresence(runtime.getSnapshot(), { timeMs: 1600, motionScale: 0 }).frame.mouth.beat !== 0) throw new Error('face still frame mismatch');",
      "if (!renderPresenceFaceSvg(runtime.getSnapshot(), { timeMs: 1600 }).svg.includes('data-face-channels=\"gaze blink brows mouth posture motion\"')) throw new Error('face svg mismatch');",
      "if (renderPresenceFaceSvg(runtime.getSnapshot(), { timeMs: 1600 }).decisionTrace.decisionCount !== 6) throw new Error('face svg trace result mismatch');",
      "if (renderPresenceFaceSvg(runtime.getSnapshot(), { timeMs: 1600 }).attributes.decisionTrace !== 'complete') throw new Error('face svg trace attribute mismatch');",
      "if (!renderPresenceFaceSvg(runtime.getSnapshot(), { timeMs: 1600 }).svg.includes('data-face-decision-trace=\"complete\"')) throw new Error('face svg trace data mismatch');",
      "if (!renderPresenceFaceSvg(runtime.getSnapshot(), { trace, now: runtime.getSnapshot().updatedAt + 1, timeMs: 1600 }).svg.includes('data-face-transition-event=\"token\"')) throw new Error('face svg transition data mismatch');",
      "if (!renderPresenceFaceSvg(runtime.getSnapshot(), { timeMs: 1600, motionScale: 0 }).svg.includes('data-motion-scale=\"0\"')) throw new Error('face still svg mismatch');",
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
      "if (typeof bindings.PresenceRendererSlot !== 'function') throw new Error('react slot mismatch');",
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
