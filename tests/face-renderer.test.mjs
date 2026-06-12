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
  faceControllerDecisionsForPresence,
  faceControlsForPresence,
  faceExpressionForPresence,
} = require("../packages/face/src/presence-face.js");

function assertChannelDecision(report, channel, controls) {
  const decision = report.decisions[channel];
  assert.equal(decision.channel, channel);
  assert.equal(decision.controller, `${channel}-controller`);
  assert.deepEqual(decision.control, controls[channel]);
  assert.ok(decision.reads.includes("state"), `${channel} reads shared state`);
  assert.ok(Object.isFrozen(decision.control), `${channel} control is frozen`);
}

function assertParallelDecisionReport(snapshot, controls, options = {}) {
  const report = faceControllerDecisionsForPresence(snapshot, options);
  assert.equal(report.state, snapshot.state);
  assert.equal(report.expression, controls.expression);
  assert.equal(report.sharedInputs.state, snapshot.state);
  assert.deepEqual(Object.keys(report.decisions), ["gaze", "blink", "brows", "mouth", "posture", "motion"]);

  for (const channel of Object.keys(report.decisions)) {
    assertChannelDecision(report, channel, controls);
  }

  assert.notDeepEqual(report.decisions.gaze.reads, report.decisions.mouth.reads);
  assert.notDeepEqual(report.decisions.blink.reads, report.decisions.motion.reads);

  return report;
}

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
const readingReport = assertParallelDecisionReport(
  { state: PresenceState.READING, detail: { question: true } },
  readingControls,
);
assert.equal(readingControls.expression, FaceExpression.CURIOUS);
assert.equal(readingControls.gaze.target, "question");
assert.equal(readingControls.mouth.shape, "curious");
assert.ok(readingControls.brows.asymmetry > 0);
assert.ok(readingReport.decisions.gaze.reads.includes("attentionTarget"));
assert.ok(readingReport.decisions.mouth.reads.includes("speechActivity"));

const thinkingSnapshot = { state: PresenceState.THINKING };
const thinkingControls = faceControlsForPresence(thinkingSnapshot);
assertParallelDecisionReport(thinkingSnapshot, thinkingControls);
assert.equal(thinkingControls.expression, FaceExpression.THINKING);
assert.equal(thinkingControls.gaze.target, "middle-distance");
assert.equal(thinkingControls.mouth.shape, "pressed");
assert.ok(thinkingControls.brows.pinch > readingControls.brows.pinch);

const waitingSnapshot = { state: PresenceState.WAITING };
const waitingControls = faceControlsForPresence(waitingSnapshot);
const waitingInputs = presenceControlInputsForSnapshot({ state: PresenceState.WAITING });
const waitingReport = assertParallelDecisionReport(waitingSnapshot, waitingControls);
assert.equal(waitingControls.expression, FaceExpression.LISTENING);
assert.equal(waitingControls.gaze.target, "response-origin");
assert.equal(waitingReport.sharedInputs.latencyPhase, "before-output");
assert.equal(waitingInputs.attentionTarget, "response");
assert.equal(waitingControls.gaze.x, waitingInputs.attentionX);
assert.ok(waitingControls.motion.anticipation > thinkingControls.motion.anticipation);
assert.ok(waitingControls.blink.cadenceMs < readingControls.blink.cadenceMs);

const streamingSnapshot = { state: PresenceState.STREAMING };
const streamingControls = faceControlsForPresence(streamingSnapshot);
const streamingInputs = presenceControlInputsForSnapshot({ state: PresenceState.STREAMING });
assertParallelDecisionReport(streamingSnapshot, streamingControls);
assert.equal(streamingControls.expression, FaceExpression.SPEAKING);
assert.equal(streamingControls.mouth.shape, "speaking");
assert.equal(streamingControls.mouth.activity, streamingInputs.speechActivity);
assert.ok(streamingControls.mouth.activity > waitingControls.mouth.activity);
assert.ok(streamingControls.motion.energy > waitingControls.motion.energy);

const speakingSnapshot = { state: PresenceState.SPEAKING };
const speakingControls = faceControlsForPresence(speakingSnapshot);
assertParallelDecisionReport(speakingSnapshot, speakingControls);
assert.equal(speakingControls.expression, FaceExpression.SPEAKING);
assert.equal(speakingControls.gaze.target, "audience");
assert.ok(speakingControls.mouth.activity > streamingControls.mouth.activity);
assert.ok(speakingControls.blink.cadenceMs > streamingControls.blink.cadenceMs);

const interruptedSnapshot = { state: PresenceState.INTERRUPTED };
const interruptedControls = faceControlsForPresence(interruptedSnapshot);
const interruptedReport = assertParallelDecisionReport(interruptedSnapshot, interruptedControls);
assert.equal(interruptedControls.expression, FaceExpression.UNCERTAIN);
assert.equal(interruptedControls.blink.pulse, true);
assert.equal(interruptedReport.sharedInputs.interruption, 1);
assert.ok(interruptedControls.posture.lean < 0);
assert.ok(interruptedControls.motion.recovery > speakingControls.motion.recovery);

const readySnapshot = {
  state: PresenceState.READY,
  updatedAt: 1000,
};
const readyOptions = {
  now: 2600,
};
const readyControls = faceControlsForPresence(readySnapshot, readyOptions);
assertParallelDecisionReport(readySnapshot, readyControls, readyOptions);
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
const readyAfterStreamingReport = faceControllerDecisionsForPresence(traceRuntime.getSnapshot(), { trace, now: 350 });
assert.equal(readyAfterStreaming.mouth.shape, "release");
assert.equal(readyAfterStreamingInputs.latencyPhase, "recovery");
assert.equal(readyAfterStreamingReport.sharedInputs.latencyPhase, "recovery");
assert.equal(readyAfterStreamingReport.decisions.mouth.control.shape, "release");
assert.ok(readyAfterStreamingReport.decisions.motion.control.settleMs >= 210);
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
