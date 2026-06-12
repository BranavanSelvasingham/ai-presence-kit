import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  PresenceEvent,
  PresenceState,
  createPresenceControlInputRuntime,
  createPresenceTrace,
  createPresenceRuntime,
  presenceControlInputsForSnapshot,
  reducePresenceState,
} = require("../packages/core/src/presence-core.js");

assert.equal(
  reducePresenceState(PresenceState.IDLE, PresenceEvent.USER_INPUT, { text: "Hello" }),
  PresenceState.USER_TYPING,
);

assert.equal(
  reducePresenceState(PresenceState.USER_TYPING, PresenceEvent.LOCAL_READ, {
    text: "Hello?",
    completion: 0.86,
  }),
  PresenceState.READY,
);

assert.equal(
  reducePresenceState(PresenceState.READY, PresenceEvent.SUBMIT),
  PresenceState.THINKING,
);

assert.equal(
  reducePresenceState(PresenceState.THINKING, PresenceEvent.STREAM_OPEN),
  PresenceState.WAITING,
);

assert.equal(
  reducePresenceState(PresenceState.WAITING, PresenceEvent.TOKEN),
  PresenceState.STREAMING,
);

assert.equal(
  reducePresenceState(PresenceState.STREAMING, PresenceEvent.SPEECH_START),
  PresenceState.SPEAKING,
);

const transitions = [];
const subscribed = [];
const runtime = createPresenceRuntime({
  initialState: PresenceState.IDLE,
  now: () => 123,
  onTransition: (snapshot) => transitions.push(snapshot),
});

const unsubscribe = runtime.subscribe((snapshot) => subscribed.push(snapshot.state));
runtime.send(PresenceEvent.USER_INPUT, { text: "Draft" });
runtime.send(PresenceEvent.INTERRUPT);
unsubscribe();
runtime.send(PresenceEvent.ERROR);

assert.equal(runtime.getSnapshot().state, PresenceState.ERROR);
assert.equal(transitions.length, 3);
assert.deepEqual(subscribed, [PresenceState.USER_TYPING, PresenceState.INTERRUPTED]);
assert.deepEqual(
  transitions.map((transition) => transition.state),
  [PresenceState.USER_TYPING, PresenceState.INTERRUPTED, PresenceState.ERROR],
);

let clock = 1_000;
const tracedRuntime = createPresenceRuntime({
  now: () => {
    clock += 25;
    return clock;
  },
});
const trace = createPresenceTrace({ limit: 3 });
const detachTrace = trace.attach(tracedRuntime);

tracedRuntime.send(PresenceEvent.SUBMIT);
tracedRuntime.send(PresenceEvent.STREAM_OPEN);
tracedRuntime.send(PresenceEvent.TOKEN, { delta: "Hello" });
tracedRuntime.send(PresenceEvent.RESPONSE_COMPLETE);
detachTrace();
tracedRuntime.send(PresenceEvent.ERROR);

assert.deepEqual(
  trace.getEntries().map((entry) => entry.state),
  [PresenceState.WAITING, PresenceState.STREAMING, PresenceState.READY],
);
assert.deepEqual(
  trace.getEntries().map((entry) => entry.index),
  [2, 3, 4],
);
assert.deepEqual(
  trace.getEntries().map((entry) => entry.sincePreviousMs),
  [25, 25, 25],
);
assert.equal(trace.getEntries()[1].detail.delta, "Hello");

trace.clear();
assert.deepEqual(trace.getEntries(), []);

const controlExpectations = [
  [PresenceState.USER_TYPING, "input", "input", 0],
  [PresenceState.READING, "content", "input", 0],
  [PresenceState.THINKING, "response", "before-output", 0],
  [PresenceState.WAITING, "response", "before-output", 0],
  [PresenceState.STREAMING, "audience", "output", 0.82],
  [PresenceState.SPEAKING, "audience", "output", 1],
  [PresenceState.INTERRUPTED, "user", "interrupted", 0],
  [PresenceState.READY, "user", "settled", 0],
  [PresenceState.ERROR, "status", "error", 0],
];

for (const [state, attentionTarget, latencyPhase, speechActivity] of controlExpectations) {
  const inputs = presenceControlInputsForSnapshot({ state, updatedAt: 1_000 }, { now: 1_000 });
  assert.equal(inputs.state, state);
  assert.equal(inputs.attentionTarget, attentionTarget);
  assert.equal(inputs.latencyPhase, latencyPhase);
  assert.equal(inputs.speechActivity, speechActivity);
  assert.equal(Object.isFrozen(inputs), true);
  assert.equal(Object.isFrozen(inputs.recentStates), true);
}

const beforeOutputInputs = presenceControlInputsForSnapshot({ state: PresenceState.WAITING, updatedAt: 1_000 }, { now: 1_200 });
assert.equal(beforeOutputInputs.ageMs, 200);
assert.ok(beforeOutputInputs.anticipation > 0.5);
assert.ok(beforeOutputInputs.tension > 0.3);

const outputInputs = presenceControlInputsForSnapshot(PresenceState.STREAMING);
assert.equal(outputInputs.attentionTarget, "audience");
assert.ok(outputInputs.energy > beforeOutputInputs.energy);

let controlClock = 0;
const controlRuntimeSource = createPresenceRuntime({
  now: () => {
    controlClock += 100;
    return controlClock;
  },
});
const controlTrace = createPresenceTrace({ limit: 8 });
controlTrace.attach(controlRuntimeSource);
controlRuntimeSource.send(PresenceEvent.SUBMIT);
controlRuntimeSource.send(PresenceEvent.STREAM_OPEN);
controlRuntimeSource.send(PresenceEvent.TOKEN);
controlRuntimeSource.send(PresenceEvent.RESPONSE_COMPLETE);
const recoveredFromOutput = presenceControlInputsForSnapshot(controlRuntimeSource.getSnapshot(), {
  trace: controlTrace,
  now: 450,
});
assert.equal(recoveredFromOutput.latencyPhase, "recovery");
assert.deepEqual(recoveredFromOutput.recentStates, [
  PresenceState.THINKING,
  PresenceState.WAITING,
  PresenceState.STREAMING,
  PresenceState.READY,
]);
assert.ok(recoveredFromOutput.recovery > 0);
assert.ok(recoveredFromOutput.speechActivity > 0);

const recoveredFromInterrupt = presenceControlInputsForSnapshot({
  state: PresenceState.READY,
  previousState: PresenceState.INTERRUPTED,
  updatedAt: 2_000,
}, {
  history: [
    { state: PresenceState.INTERRUPTED, updatedAt: 1_800 },
    { state: PresenceState.READY, updatedAt: 2_000 },
  ],
  now: 2_100,
});
assert.equal(recoveredFromInterrupt.latencyPhase, "recovery");
assert.ok(recoveredFromInterrupt.recovery > recoveredFromOutput.recovery);
assert.ok(recoveredFromInterrupt.tension > 0);

const controlRuntime = createPresenceControlInputRuntime();
assert.equal(controlRuntime.getInputs(), null);
const runtimeInputs = controlRuntime.update({ state: PresenceState.THINKING });
assert.equal(runtimeInputs.latencyPhase, "before-output");
assert.equal(controlRuntime.getInputs(), runtimeInputs);

console.log("presence-core ok");
