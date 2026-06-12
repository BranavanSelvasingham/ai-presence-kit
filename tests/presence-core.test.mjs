import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  PresenceEvent,
  PresenceState,
  createPresenceTrace,
  createPresenceRuntime,
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

console.log("presence-core ok");
