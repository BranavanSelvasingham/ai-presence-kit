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
  summarizePresenceTrace,
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

const boundedTraceSummary = summarizePresenceTrace(trace);
assert.equal(Object.isFrozen(boundedTraceSummary), true);
assert.equal(Object.isFrozen(boundedTraceSummary.states), true);
assert.equal(Object.isFrozen(boundedTraceSummary.events), true);
assert.equal(boundedTraceSummary.entryCount, 3);
assert.deepEqual(boundedTraceSummary.states, [
  PresenceState.WAITING,
  PresenceState.STREAMING,
  PresenceState.READY,
]);
assert.deepEqual(boundedTraceSummary.events, [
  PresenceEvent.STREAM_OPEN,
  PresenceEvent.TOKEN,
  PresenceEvent.RESPONSE_COMPLETE,
]);
assert.equal(boundedTraceSummary.firstStateMs, 50);
assert.equal(boundedTraceSummary.streamOpenMs, 50);
assert.equal(boundedTraceSummary.firstTokenMs, 75);
assert.equal(boundedTraceSummary.speechStartMs, null);
assert.equal(boundedTraceSummary.firstOutputMs, 75);
assert.equal(boundedTraceSummary.firstOutputEvent, PresenceEvent.TOKEN);
assert.equal(boundedTraceSummary.presenceBeforeOutputMs, 25);
assert.equal(boundedTraceSummary.finalState, PresenceState.READY);
assert.equal(boundedTraceSummary.hasOutput, true);
assert.equal(boundedTraceSummary.complete, true);

trace.clear();
assert.deepEqual(trace.getEntries(), []);

const emptyTraceSummary = summarizePresenceTrace(trace);
assert.deepEqual(emptyTraceSummary, {
  entryCount: 0,
  states: [],
  events: [],
  firstStateMs: null,
  streamOpenMs: null,
  firstTokenMs: null,
  speechStartMs: null,
  firstOutputMs: null,
  firstOutputEvent: null,
  presenceBeforeOutputMs: null,
  finalState: null,
  hasOutput: false,
  complete: false,
});

const missingOutputSummary = summarizePresenceTrace([
  { state: PresenceState.THINKING, event: PresenceEvent.SUBMIT, elapsedMs: 0 },
  { state: PresenceState.WAITING, event: PresenceEvent.STREAM_OPEN, elapsedMs: 32 },
]);
assert.deepEqual(missingOutputSummary.states, [PresenceState.THINKING, PresenceState.WAITING]);
assert.deepEqual(missingOutputSummary.events, [PresenceEvent.SUBMIT, PresenceEvent.STREAM_OPEN]);
assert.equal(missingOutputSummary.firstStateMs, 0);
assert.equal(missingOutputSummary.streamOpenMs, 32);
assert.equal(missingOutputSummary.firstTokenMs, null);
assert.equal(missingOutputSummary.firstOutputMs, null);
assert.equal(missingOutputSummary.firstOutputEvent, null);
assert.equal(missingOutputSummary.presenceBeforeOutputMs, null);
assert.equal(missingOutputSummary.finalState, PresenceState.WAITING);
assert.equal(missingOutputSummary.hasOutput, false);
assert.equal(missingOutputSummary.complete, false);

const speechOutputSummary = summarizePresenceTrace([
  { state: PresenceState.WAITING, event: PresenceEvent.VOICE_WAITING, elapsedMs: 0 },
  { state: PresenceState.SPEAKING, event: PresenceEvent.SPEECH_START, elapsedMs: 40 },
  { state: PresenceState.READY, event: PresenceEvent.SPEECH_END, elapsedMs: 96 },
]);
assert.deepEqual(speechOutputSummary.states, [
  PresenceState.WAITING,
  PresenceState.SPEAKING,
  PresenceState.READY,
]);
assert.equal(speechOutputSummary.streamOpenMs, null);
assert.equal(speechOutputSummary.firstTokenMs, null);
assert.equal(speechOutputSummary.speechStartMs, 40);
assert.equal(speechOutputSummary.firstOutputMs, 40);
assert.equal(speechOutputSummary.firstOutputEvent, PresenceEvent.SPEECH_START);
assert.equal(speechOutputSummary.presenceBeforeOutputMs, 40);
assert.equal(speechOutputSummary.finalState, PresenceState.READY);
assert.equal(speechOutputSummary.hasOutput, true);
assert.equal(speechOutputSummary.complete, true);

const updatedAtSummary = summarizePresenceTrace([
  { state: PresenceState.THINKING, event: PresenceEvent.SUBMIT, updatedAt: 1_000 },
  { state: PresenceState.WAITING, event: PresenceEvent.STREAM_OPEN, updatedAt: 1_024 },
  { state: PresenceState.STREAMING, event: PresenceEvent.TOKEN, updatedAt: 1_060 },
]);
assert.equal(updatedAtSummary.firstStateMs, 0);
assert.equal(updatedAtSummary.streamOpenMs, 24);
assert.equal(updatedAtSummary.firstTokenMs, 60);
assert.equal(updatedAtSummary.presenceBeforeOutputMs, 60);

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
  assert.equal(inputs.previousState, null);
  assert.equal(inputs.transitionEvent, null);
  assert.equal(inputs.transitionAgeMs, 0);
  assert.equal(Object.isFrozen(inputs), true);
  assert.equal(Object.isFrozen(inputs.recentStates), true);
}

const beforeOutputInputs = presenceControlInputsForSnapshot({
  state: PresenceState.WAITING,
  previousState: PresenceState.THINKING,
  event: PresenceEvent.STREAM_OPEN,
  updatedAt: 1_000,
}, { now: 1_200 });
assert.equal(beforeOutputInputs.ageMs, 200);
assert.equal(beforeOutputInputs.previousState, PresenceState.THINKING);
assert.equal(beforeOutputInputs.transitionEvent, PresenceEvent.STREAM_OPEN);
assert.equal(beforeOutputInputs.transitionAgeMs, 200);
assert.ok(beforeOutputInputs.anticipation > 0.5);
assert.ok(beforeOutputInputs.tension > 0.3);

const outputInputs = presenceControlInputsForSnapshot(PresenceState.STREAMING);
assert.equal(outputInputs.attentionTarget, "audience");
assert.ok(outputInputs.energy > beforeOutputInputs.energy);

const setStateTransitionInputs = presenceControlInputsForSnapshot({
  state: PresenceState.READY,
  previousState: PresenceState.IDLE,
  event: "set-state",
  updatedAt: 10,
}, { now: 24 });
assert.equal(setStateTransitionInputs.previousState, PresenceState.IDLE);
assert.equal(setStateTransitionInputs.transitionEvent, "set-state");
assert.equal(setStateTransitionInputs.transitionAgeMs, 14);

const beforeOutputFromHistory = presenceControlInputsForSnapshot({ state: PresenceState.WAITING }, {
  history: [
    { state: PresenceState.THINKING, event: PresenceEvent.SUBMIT, updatedAt: 1_000 },
    { state: PresenceState.WAITING, previousState: PresenceState.THINKING, event: PresenceEvent.STREAM_OPEN, updatedAt: 1_200 },
  ],
  now: 1_350,
});
assert.equal(beforeOutputFromHistory.latencyPhase, "before-output");
assert.equal(beforeOutputFromHistory.previousState, PresenceState.THINKING);
assert.equal(beforeOutputFromHistory.transitionEvent, PresenceEvent.STREAM_OPEN);
assert.equal(beforeOutputFromHistory.transitionAgeMs, 150);

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
  now: 550,
});
assert.equal(recoveredFromOutput.latencyPhase, "recovery");
assert.equal(recoveredFromOutput.previousState, PresenceState.STREAMING);
assert.equal(recoveredFromOutput.transitionEvent, PresenceEvent.RESPONSE_COMPLETE);
assert.equal(recoveredFromOutput.transitionAgeMs, 50);
assert.deepEqual(recoveredFromOutput.recentStates, [
  PresenceState.THINKING,
  PresenceState.WAITING,
  PresenceState.STREAMING,
  PresenceState.READY,
]);
assert.ok(recoveredFromOutput.recovery > 0);
assert.ok(recoveredFromOutput.speechActivity > 0);

const recoveredFromTraceHistory = presenceControlInputsForSnapshot({ state: PresenceState.READY }, {
  trace: controlTrace,
  now: 550,
});
assert.equal(recoveredFromTraceHistory.latencyPhase, "recovery");
assert.equal(recoveredFromTraceHistory.previousState, PresenceState.STREAMING);
assert.equal(recoveredFromTraceHistory.transitionEvent, PresenceEvent.RESPONSE_COMPLETE);
assert.equal(recoveredFromTraceHistory.transitionAgeMs, 50);

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
assert.equal(recoveredFromInterrupt.previousState, PresenceState.INTERRUPTED);
assert.equal(recoveredFromInterrupt.transitionEvent, null);
assert.equal(recoveredFromInterrupt.transitionAgeMs, 100);
assert.ok(recoveredFromInterrupt.recovery > recoveredFromOutput.recovery);
assert.ok(recoveredFromInterrupt.tension > 0);

const controlRuntime = createPresenceControlInputRuntime();
assert.equal(controlRuntime.getInputs(), null);
const runtimeInputs = controlRuntime.update({ state: PresenceState.THINKING });
assert.equal(runtimeInputs.latencyPhase, "before-output");
assert.equal(controlRuntime.getInputs(), runtimeInputs);

console.log("presence-core ok");
