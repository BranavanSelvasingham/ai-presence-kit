import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PresenceEvent, PresenceState, createPresenceRuntime } = require("../packages/core/src/presence-core.js");
const { createPresenceReactBindings } = require("../packages/react/src/presence-react.js");

let contextValue = null;
let latestStateValue = null;
let latestEffectCleanup = null;
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
    latestEffectCleanup = effect();
  },
  useState(initialState) {
    latestStateValue = typeof initialState === "function" ? initialState() : initialState;
    return [
      latestStateValue,
      (value) => {
        latestStateValue = value;
      },
    ];
  },
  useSyncExternalStore(subscribe, getSnapshot) {
    const unsubscribe = subscribe(() => {});
    unsubscribe();
    return getSnapshot();
  },
};

const runtime = createPresenceRuntime({ initialState: PresenceState.IDLE });
const bindings = createPresenceReactBindings(fakeReact, { runtime });

assert.equal(bindings.usePresenceState(), PresenceState.IDLE);
assert.equal(typeof bindings.usePresenceControlInputs, "function");
assert.equal(typeof bindings.usePresenceFrameTime, "function");
assert.equal(typeof bindings.PresenceRendererSlot, "function");
runtime.send(PresenceEvent.USER_INPUT, { text: "Hello" });
assert.equal(bindings.usePresenceSnapshot().state, PresenceState.USER_TYPING);

runtime.send(PresenceEvent.SUBMIT);
const thinkingSnapshot = bindings.usePresenceSnapshot();
const thinkingInputs = bindings.usePresenceControlInputs(null, { now: thinkingSnapshot.updatedAt });
assert.equal(thinkingSnapshot.state, PresenceState.THINKING);
assert.equal(thinkingInputs.state, PresenceState.THINKING);
assert.equal(thinkingInputs.latencyPhase, "before-output");
assert.equal(thinkingInputs.attentionTarget, "response");

runtime.send(PresenceEvent.STREAM_OPEN);
const waitingInputs = bindings.usePresenceControlInputs(runtime, {
  now: runtime.getSnapshot().updatedAt,
});
assert.equal(waitingInputs.state, PresenceState.WAITING);
assert.equal(waitingInputs.latencyPhase, "before-output");
assert.equal(waitingInputs.attentionTarget, "response");

const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
let queuedFrame = null;
let cancelledFrame = null;
globalThis.requestAnimationFrame = (callback) => {
  queuedFrame = callback;
  return 42;
};
globalThis.cancelAnimationFrame = (frameId) => {
  cancelledFrame = frameId;
};
let frameNow = 1000;
const frameTime = bindings.usePresenceFrameTime({
  now: () => {
    frameNow += 16;
    return frameNow;
  },
});
assert.equal(frameTime, 1016);
assert.equal(typeof queuedFrame, "function");
queuedFrame();
assert.equal(latestStateValue, 1032);
latestEffectCleanup();
assert.equal(cancelledFrame, 42);
globalThis.requestAnimationFrame = originalRequestAnimationFrame;
globalThis.cancelAnimationFrame = originalCancelAnimationFrame;

const providerElement = bindings.PresenceProvider({
  runtime,
  children: "child",
});

assert.equal(providerElement.type, "PresenceProvider");
assert.equal(providerElement.props.value, runtime);

const rendered = bindings.PresenceRenderer({
  children: (snapshot) => snapshot.state,
});

assert.equal(rendered, PresenceState.WAITING);

let slotRuntimeNow = 1000;
const slotRuntime = createPresenceRuntime({
  initialState: PresenceState.IDLE,
  now: () => slotRuntimeNow,
});
slotRuntimeNow = 1100;
slotRuntime.send(PresenceEvent.SUBMIT);
let slotQueuedFrame = null;
let slotCancelledFrame = null;
globalThis.requestAnimationFrame = (callback) => {
  slotQueuedFrame = callback;
  return 84;
};
globalThis.cancelAnimationFrame = (frameId) => {
  slotCancelledFrame = frameId;
};
const slot = bindings.PresenceRendererSlot({
  runtime: slotRuntime,
  frameOptions: { now: () => 1300 },
  children: (slotValue) => slotValue,
});
assert.equal(slot.snapshot.state, PresenceState.THINKING);
assert.equal(slot.controlInputs.latencyPhase, "before-output");
assert.equal(slot.controlInputs.attentionTarget, "response");
assert.equal(slot.controlInputs.ageMs, 200);
assert.equal(slot.frameTimeMs, 1300);
assert.equal(slot.runtime, slotRuntime);
assert.equal(typeof slotQueuedFrame, "function");
latestEffectCleanup();
assert.equal(slotCancelledFrame, 84);
globalThis.requestAnimationFrame = originalRequestAnimationFrame;
globalThis.cancelAnimationFrame = originalCancelAnimationFrame;

assert.throws(
  () => createPresenceReactBindings({}),
  /requires React/,
);

console.log("react-bindings ok");
