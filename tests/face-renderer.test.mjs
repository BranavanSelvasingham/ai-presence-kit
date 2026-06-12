import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  PresenceEvent,
  PresenceState,
  createPresenceRuntime,
  createPresenceTrace,
  presenceControlInputsForSnapshot,
} = require("../packages/core/src/presence-core.js");
const {
  FaceExpression,
  createFaceControllerRuntime,
  createFaceRenderer,
  faceControlsForPresence,
  faceExpressionForPresence,
} = require("../packages/face/src/presence-face.js");

assert.equal(
  faceExpressionForPresence({ state: PresenceState.IDLE }),
  FaceExpression.IDLE,
);

assert.equal(
  faceExpressionForPresence({ state: PresenceState.READING, detail: { question: true } }),
  FaceExpression.CURIOUS,
);

assert.equal(
  faceExpressionForPresence({ state: PresenceState.INTERRUPTED }),
  FaceExpression.UNCERTAIN,
);

const readingControls = faceControlsForPresence({
  state: PresenceState.READING,
  detail: { question: true },
});
assert.equal(readingControls.expression, FaceExpression.CURIOUS);
assert.equal(readingControls.gaze.target, "question");
assert.equal(readingControls.mouth.shape, "curious");
assert.ok(readingControls.brows.asymmetry > 0);

const thinkingControls = faceControlsForPresence({ state: PresenceState.THINKING });
assert.equal(thinkingControls.expression, FaceExpression.THINKING);
assert.equal(thinkingControls.gaze.target, "middle-distance");
assert.equal(thinkingControls.mouth.shape, "pressed");
assert.ok(thinkingControls.brows.pinch > readingControls.brows.pinch);

const waitingControls = faceControlsForPresence({ state: PresenceState.WAITING });
const waitingInputs = presenceControlInputsForSnapshot({ state: PresenceState.WAITING });
assert.equal(waitingControls.expression, FaceExpression.LISTENING);
assert.equal(waitingControls.gaze.target, "response-origin");
assert.equal(waitingInputs.attentionTarget, "response");
assert.equal(waitingControls.gaze.x, waitingInputs.attentionX);
assert.ok(waitingControls.motion.anticipation > thinkingControls.motion.anticipation);
assert.ok(waitingControls.blink.cadenceMs < readingControls.blink.cadenceMs);

const streamingControls = faceControlsForPresence({ state: PresenceState.STREAMING });
const streamingInputs = presenceControlInputsForSnapshot({ state: PresenceState.STREAMING });
assert.equal(streamingControls.expression, FaceExpression.SPEAKING);
assert.equal(streamingControls.mouth.shape, "speaking");
assert.equal(streamingControls.mouth.activity, streamingInputs.speechActivity);
assert.ok(streamingControls.mouth.activity > waitingControls.mouth.activity);
assert.ok(streamingControls.motion.energy > waitingControls.motion.energy);

const speakingControls = faceControlsForPresence({ state: PresenceState.SPEAKING });
assert.equal(speakingControls.expression, FaceExpression.SPEAKING);
assert.equal(speakingControls.gaze.target, "audience");
assert.ok(speakingControls.mouth.activity > streamingControls.mouth.activity);
assert.ok(speakingControls.blink.cadenceMs > streamingControls.blink.cadenceMs);

const interruptedControls = faceControlsForPresence({ state: PresenceState.INTERRUPTED });
assert.equal(interruptedControls.expression, FaceExpression.UNCERTAIN);
assert.equal(interruptedControls.blink.pulse, true);
assert.ok(interruptedControls.posture.lean < 0);
assert.ok(interruptedControls.motion.recovery > speakingControls.motion.recovery);

const readyControls = faceControlsForPresence({
  state: PresenceState.READY,
  updatedAt: 1000,
}, {
  now: 2600,
});
assert.equal(readyControls.expression, FaceExpression.READY);
assert.equal(readyControls.mouth.shape, "soft-smile");
assert.ok(readyControls.gaze.focus < 0.68);
assert.ok(readyControls.motion.energy < 0.24);

const readyAfterInterrupt = faceControlsForPresence({
  state: PresenceState.READY,
  previousState: PresenceState.INTERRUPTED,
  updatedAt: 2000,
}, {
  history: [
    { state: PresenceState.INTERRUPTED, updatedAt: 1800 },
    { state: PresenceState.READY, updatedAt: 2000 },
  ],
  now: 2100,
});
assert.equal(readyAfterInterrupt.mouth.shape, "soft-smile");
assert.ok(readyAfterInterrupt.posture.recovery > readyControls.posture.recovery);
assert.ok(readyAfterInterrupt.motion.recovery > readyControls.motion.recovery);

const traceRuntime = createPresenceRuntime({
  initialState: PresenceState.IDLE,
  now: (() => {
    let next = 0;
    return () => {
      next += 100;
      return next;
    };
  })(),
});
const trace = createPresenceTrace({ limit: 8 });
trace.attach(traceRuntime);
traceRuntime.send(PresenceEvent.TOKEN);
traceRuntime.send(PresenceEvent.RESPONSE_COMPLETE);
const readyAfterStreaming = faceControlsForPresence(traceRuntime.getSnapshot(), { trace, now: 350 });
const readyAfterStreamingInputs = presenceControlInputsForSnapshot(traceRuntime.getSnapshot(), { trace, now: 350 });
assert.equal(readyAfterStreaming.mouth.shape, "release");
assert.equal(readyAfterStreamingInputs.latencyPhase, "recovery");
assert.ok(readyAfterStreaming.motion.settleMs >= 210);

const controllerRuntime = createFaceControllerRuntime();
assert.equal(controllerRuntime.getControls(), null);
const controllerControls = controllerRuntime.update({ state: PresenceState.SPEAKING });
assert.equal(controllerControls.mouth.activity, 1);
assert.equal(controllerRuntime.getControls(), controllerControls);

const rendered = [];
const runtime = createPresenceRuntime({ initialState: PresenceState.IDLE });
const renderer = createFaceRenderer({
  render: (expression, snapshot) => rendered.push({ expression, state: snapshot.state }),
});

renderer.render(runtime.send(PresenceEvent.SUBMIT));
renderer.render(runtime.send(PresenceEvent.TOKEN));

assert.equal(renderer.getExpression(), FaceExpression.SPEAKING);
assert.deepEqual(rendered, [
  { expression: FaceExpression.THINKING, state: PresenceState.THINKING },
  { expression: FaceExpression.SPEAKING, state: PresenceState.STREAMING },
]);

console.log("face-renderer ok");
