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
  FACE_CONTROL_CHANNELS,
  FaceExpression,
  createFaceControllerFrameRuntime,
  createFaceControllerRuntime,
  createFaceRenderer,
  faceControllerCoherenceForFrame,
  faceControllerDecisionTraceForFrame,
  faceControllerDecisionsForPresence,
  faceControllerFrameForPresence,
  faceControlsForPresence,
  faceExpressionForPresence,
  renderPresenceFaceSvg,
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

function assertFiniteFrameValue(value, path) {
  if (typeof value === "number") {
    assert.ok(Number.isFinite(value), `${path} is finite`);
    assert.ok(value >= -1 && value <= 20000, `${path} is bounded`);
  }
}

function assertFrameChannel(frame, channel) {
  assert.ok(Object.isFrozen(frame[channel]), `${channel} frame is frozen`);
  for (const [key, value] of Object.entries(frame[channel])) {
    assertFiniteFrameValue(value, `${channel}.${key}`);
  }
}

function assertControllerDecisionTrace(frameReport) {
  const trace = faceControllerDecisionTraceForFrame(frameReport);
  const repeatedTrace = faceControllerDecisionTraceForFrame(frameReport);

  assert.ok(Object.isFrozen(trace), "decision trace is frozen");
  assert.ok(Object.isFrozen(trace.decisions), "decision trace decisions are frozen");
  assert.deepEqual(trace, repeatedTrace);
  assert.deepEqual(trace.channels, FACE_CONTROL_CHANNELS);
  assert.deepEqual(Object.keys(trace.decisions), FACE_CONTROL_CHANNELS);
  assert.equal(trace.decisionCount, 6);
  assert.equal(trace.complete, true);
  assert.equal(trace.rendererSafe, true);
  assert.equal(trace.warningCount, 0);
  assert.deepEqual(trace.warnings, []);

  for (const channel of FACE_CONTROL_CHANNELS) {
    const decisionTrace = trace.decisions[channel];
    assert.ok(Object.isFrozen(decisionTrace), `${channel} decision trace is frozen`);
    assert.ok(Object.isFrozen(decisionTrace.control), `${channel} control summary is frozen`);
    assert.ok(Object.isFrozen(decisionTrace.frame), `${channel} frame summary is frozen`);
    assert.equal(decisionTrace.channel, channel);
    assert.equal(decisionTrace.controller, `${channel}-controller`);
    assert.deepEqual(decisionTrace.reads, frameReport.decisions[channel].reads);
    assert.ok(decisionTrace.reads.includes("state"), `${channel} trace reads shared state`);
    assert.deepEqual(decisionTrace.frame, frameReport.coherence.channelReports[channel].summary);
    assert.equal(decisionTrace.present, true);
    assert.equal(decisionTrace.bounded, true);
    assert.equal(decisionTrace.rendererSafe, true);
    assert.equal(decisionTrace.warningCount, 0);
    assert.deepEqual(decisionTrace.warnings, []);
  }

  assert.deepEqual(trace.decisions.gaze.control, {
    target: frameReport.decisions.gaze.control.target,
    x: Math.round(frameReport.decisions.gaze.control.x * 1000) / 1000,
    y: Math.round(frameReport.decisions.gaze.control.y * 1000) / 1000,
    focus: Math.round(frameReport.decisions.gaze.control.focus * 1000) / 1000,
  });
  assert.deepEqual(trace.decisions.motion.control, {
    energy: Math.round(frameReport.decisions.motion.control.energy * 1000) / 1000,
    drift: Math.round(frameReport.decisions.motion.control.drift * 1000) / 1000,
    anticipation: Math.round(frameReport.decisions.motion.control.anticipation * 1000) / 1000,
    recovery: Math.round(frameReport.decisions.motion.control.recovery * 1000) / 1000,
    settleMs: Math.round(frameReport.decisions.motion.control.settleMs * 1000) / 1000,
  });

  return trace;
}

function assertControllerFrame(snapshot, options = {}) {
  const frameReport = faceControllerFrameForPresence(snapshot, options);
  const decisionReport = faceControllerDecisionsForPresence(snapshot, options);

  assert.ok(Object.isFrozen(frameReport), "frame report is frozen");
  assert.ok(Object.isFrozen(frameReport.frame), "frame object is frozen");
  assert.ok(Object.isFrozen(frameReport.coherence), "coherence report is frozen");
  assert.equal(frameReport.state, decisionReport.state);
  assert.equal(frameReport.expression, decisionReport.expression);
  assert.deepEqual(frameReport.sharedInputs, decisionReport.sharedInputs);
  assert.deepEqual(frameReport.decisions, decisionReport.decisions);
  assert.deepEqual(Object.keys(frameReport.frame), FACE_CONTROL_CHANNELS);
  assert.deepEqual(frameReport.coherence.channels, FACE_CONTROL_CHANNELS);
  assert.equal(frameReport.coherence.complete, true);
  assert.equal(frameReport.coherence.bounded, true);
  assert.equal(frameReport.coherence.rendererSafe, true);
  assert.deepEqual(frameReport.coherence.warnings, []);
  assert.equal(frameReport.coherence.summary.channelCount, 6);
  assert.equal(frameReport.coherence.summary.presentChannelCount, 6);
  assert.equal(frameReport.coherence.summary.boundedChannelCount, 6);
  assert.equal(frameReport.coherence.summary.gazeTarget, frameReport.frame.gaze.target);
  assert.equal(frameReport.coherence.summary.mouthShape, frameReport.frame.mouth.shape);
  assert.equal(frameReport.coherence.summary.motionEnergy, Math.round(frameReport.frame.motion.energy * 1000) / 1000);
  assert.deepEqual(faceControllerCoherenceForFrame(frameReport), frameReport.coherence);

  for (const channel of FACE_CONTROL_CHANNELS) {
    assertFrameChannel(frameReport.frame, channel);
    assert.equal(frameReport.coherence.channelReports[channel].channel, channel);
    assert.equal(frameReport.coherence.channelReports[channel].present, true);
    assert.equal(frameReport.coherence.channelReports[channel].bounded, true);
    assert.deepEqual(frameReport.coherence.channelReports[channel].warnings, []);
  }

  assert.equal(frameReport.frame.gaze.target, frameReport.decisions.gaze.control.target);
  assert.equal(frameReport.frame.mouth.shape, frameReport.decisions.mouth.control.shape);
  assert.ok(frameReport.frame.blink.phase >= 0 && frameReport.frame.blink.phase < 1);
  assert.ok(frameReport.frame.blink.openness >= 0 && frameReport.frame.blink.openness <= 1);
  assert.ok(frameReport.frame.mouth.beat >= 0 && frameReport.frame.mouth.beat <= 1);
  assert.ok(frameReport.frame.posture.breath >= 0 && frameReport.frame.posture.breath <= 1);
  assert.ok(frameReport.frame.motion.offsetX >= -1 && frameReport.frame.motion.offsetX <= 1);
  assert.ok(frameReport.frame.motion.offsetY >= -1 && frameReport.frame.motion.offsetY <= 1);
  assertControllerDecisionTrace(frameReport);

  return frameReport;
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

const freshSubmitSnapshot = {
  state: PresenceState.THINKING,
  previousState: PresenceState.READY,
  event: PresenceEvent.SUBMIT,
  updatedAt: 1000,
};
const freshSubmitReport = faceControllerDecisionsForPresence(freshSubmitSnapshot, {
  now: 1080,
});
assert.equal(freshSubmitReport.sharedInputs.previousState, PresenceState.READY);
assert.equal(freshSubmitReport.sharedInputs.transitionEvent, PresenceEvent.SUBMIT);
assert.equal(freshSubmitReport.sharedInputs.transitionAgeMs, 80);
assert.ok(freshSubmitReport.decisions.blink.reads.includes("transitionEvent"));
assert.ok(freshSubmitReport.decisions.blink.reads.includes("transitionAgeMs"));
assert.equal(freshSubmitReport.decisions.blink.control.pulse, true);
const freshSubmitFrame = faceControllerFrameForPresence(freshSubmitSnapshot, {
  now: 1080,
  timeMs: 1080,
});
assert.equal(freshSubmitFrame.frame.blink.pulse, true);
assert.ok(freshSubmitFrame.frame.blink.openness < 0.4);
const staleSubmitControls = faceControlsForPresence(freshSubmitSnapshot, {
  now: 1300,
});
assert.equal(staleSubmitControls.blink.pulse, false);
const staleSubmitFrame = faceControllerFrameForPresence(freshSubmitSnapshot, {
  now: 1300,
  timeMs: 1300,
});
assert.ok(staleSubmitFrame.frame.blink.openness > freshSubmitFrame.frame.blink.openness);

const waitingSnapshot = { state: PresenceState.WAITING };
const waitingControls = faceControlsForPresence(waitingSnapshot);
const waitingInputs = presenceControlInputsForSnapshot({ state: PresenceState.WAITING });
const waitingReport = assertParallelDecisionReport(waitingSnapshot, waitingControls);
const waitingFrame = assertControllerFrame(waitingSnapshot, { now: 1200 });
assert.equal(waitingControls.expression, FaceExpression.LISTENING);
assert.equal(waitingControls.gaze.target, "response-origin");
assert.equal(waitingReport.sharedInputs.latencyPhase, "before-output");
assert.equal(waitingFrame.frame.mouth.shape, "preparing");
assert.ok(waitingFrame.frame.motion.anticipation > 0);
assert.equal(waitingFrame.coherence.summary.mouthShape, "preparing");
assert.ok(waitingFrame.coherence.summary.motionEnergy > 0);
assert.equal(waitingInputs.attentionTarget, "response");
assert.equal(waitingControls.gaze.x, waitingInputs.attentionX);
assert.ok(waitingControls.motion.anticipation > thinkingControls.motion.anticipation);
assert.ok(waitingControls.blink.cadenceMs < readingControls.blink.cadenceMs);

const streamingSnapshot = { state: PresenceState.STREAMING };
const streamingControls = faceControlsForPresence(streamingSnapshot);
const streamingInputs = presenceControlInputsForSnapshot({ state: PresenceState.STREAMING });
assertParallelDecisionReport(streamingSnapshot, streamingControls);
const streamingFrame = assertControllerFrame(streamingSnapshot, { now: 1400 });
assert.equal(streamingControls.expression, FaceExpression.SPEAKING);
assert.equal(streamingControls.mouth.shape, "speaking");
assert.ok(streamingFrame.frame.mouth.beat > 0);
assert.equal(streamingFrame.coherence.summary.mouthShape, "speaking");
assert.ok(streamingFrame.coherence.summary.mouthActivity > waitingFrame.coherence.summary.mouthActivity);
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
const interruptedFrame = assertControllerFrame(interruptedSnapshot, { now: 1800 });
assert.equal(interruptedControls.expression, FaceExpression.UNCERTAIN);
assert.equal(interruptedControls.blink.pulse, true);
assert.equal(interruptedFrame.frame.blink.pulse, true);
assert.ok(interruptedFrame.frame.motion.recovery > 0);
assert.ok(interruptedFrame.coherence.summary.motionRecovery > 0);
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
const readyFrame = assertControllerFrame(readySnapshot, { ...readyOptions, timeMs: 2700 });
assert.equal(readyControls.expression, FaceExpression.READY);
assert.equal(readyControls.mouth.shape, "soft-smile");
assert.equal(readyFrame.frame.mouth.shape, "soft-smile");
assert.equal(readyFrame.coherence.summary.mouthShape, "soft-smile");
assert.ok(readyControls.gaze.focus < 0.68);
assert.ok(readyControls.motion.energy < 0.24);

const errorFrame = assertControllerFrame({ state: PresenceState.ERROR }, { now: 3000 });
assert.equal(errorFrame.expression, FaceExpression.CONCERNED);
assert.equal(errorFrame.frame.gaze.target, "status");
assert.equal(errorFrame.frame.mouth.shape, "downturned");
assert.equal(errorFrame.coherence.summary.mouthShape, "downturned");
assert.equal(errorFrame.coherence.rendererSafe, true);

const invalidFrameReport = {
  decisions: {
    gaze: { channel: "gaze", controller: "gaze-controller", reads: ["state"] },
    blink: { channel: "blink", controller: "blink-controller", reads: ["state"] },
    brows: { channel: "brows", controller: "brows-controller", reads: ["state"] },
    mouth: { channel: "mouth", controller: "mouth-controller", reads: ["state"] },
    posture: { channel: "posture", controller: "posture-controller", reads: ["state"] },
  },
  frame: {
    gaze: { target: "elsewhere", x: 2, y: 0, focus: 0.5, driftX: 0, driftY: 0 },
    blink: { openness: 1.4, cadenceMs: 100, pulse: false, phase: 0.2 },
    brows: { lift: 0, pinch: 0, asymmetry: 0 },
    mouth: { shape: "speaking", openness: 0.4, activity: 0.8, tension: 0.1, beat: 0.2 },
    posture: { lean: 0, turn: 0, energy: 0.4, recovery: 0, breath: 0.5 },
  },
};
const invalidCoherence = faceControllerCoherenceForFrame(invalidFrameReport);
assert.ok(Object.isFrozen(invalidCoherence));
assert.equal(invalidCoherence.complete, false);
assert.equal(invalidCoherence.bounded, false);
assert.equal(invalidCoherence.rendererSafe, false);
assert.equal(invalidCoherence.summary.presentChannelCount, 5);
assert.equal(invalidCoherence.summary.boundedChannelCount, 3);
assert.equal(invalidCoherence.channelReports.motion.present, false);
assert.equal(invalidCoherence.channelReports.gaze.bounded, false);
assert.equal(invalidCoherence.channelReports.blink.bounded, false);
assert.ok(invalidCoherence.warnings.includes("motion frame is missing"));
assert.ok(invalidCoherence.warnings.includes("motion decision is missing"));
assert.ok(invalidCoherence.warnings.includes("gaze.x must be finite -1..1"));
assert.ok(invalidCoherence.warnings.includes("blink.cadenceMs must be finite 300..20000"));

const invalidTrace = faceControllerDecisionTraceForFrame({
  ...invalidFrameReport,
  coherence: invalidCoherence,
});
assert.ok(Object.isFrozen(invalidTrace));
assert.deepEqual(Object.keys(invalidTrace.decisions), FACE_CONTROL_CHANNELS);
assert.equal(invalidTrace.decisionCount, 5);
assert.equal(invalidTrace.complete, false);
assert.equal(invalidTrace.rendererSafe, false);
assert.equal(invalidTrace.warningCount, invalidCoherence.warnings.length);
assert.deepEqual(invalidTrace.warnings, invalidCoherence.warnings);
assert.equal(invalidTrace.decisions.gaze.present, true);
assert.equal(invalidTrace.decisions.gaze.bounded, false);
assert.equal(invalidTrace.decisions.gaze.rendererSafe, false);
assert.equal(invalidTrace.decisions.gaze.control.x, null);
assert.equal(invalidTrace.decisions.gaze.frame.x, null);
assert.ok(invalidTrace.decisions.gaze.warnings.includes("gaze.x must be finite -1..1"));
assert.equal(invalidTrace.decisions.motion.controller, null);
assert.deepEqual(invalidTrace.decisions.motion.reads, []);
assert.equal(invalidTrace.decisions.motion.present, false);
assert.equal(invalidTrace.decisions.motion.rendererSafe, false);
assert.ok(invalidTrace.decisions.motion.warnings.includes("motion frame is missing"));
assert.ok(invalidTrace.decisions.motion.warnings.includes("motion decision is missing"));

const missingTrace = faceControllerDecisionTraceForFrame();
assert.deepEqual(missingTrace.channels, FACE_CONTROL_CHANNELS);
assert.deepEqual(Object.keys(missingTrace.decisions), FACE_CONTROL_CHANNELS);
assert.equal(missingTrace.decisionCount, 0);
assert.equal(missingTrace.complete, false);
assert.equal(missingTrace.rendererSafe, false);
assert.ok(missingTrace.warningCount > 0);
assert.equal(missingTrace.decisions.gaze.controller, null);
assert.deepEqual(missingTrace.decisions.gaze.reads, []);
assert.deepEqual(missingTrace.decisions.gaze.control, {
  target: null,
  x: null,
  y: null,
  focus: null,
});
assert.equal(missingTrace.decisions.gaze.present, false);

const earlyFrame = faceControllerFrameForPresence({
  state: PresenceState.WAITING,
  updatedAt: 1000,
}, {
  now: 1100,
  timeMs: 1100,
});
const laterFrame = faceControllerFrameForPresence({
  state: PresenceState.WAITING,
  updatedAt: 1000,
}, {
  now: 1100,
  timeMs: 1900,
});
assert.deepEqual(earlyFrame.decisions, laterFrame.decisions);
assert.deepEqual(earlyFrame.sharedInputs, laterFrame.sharedInputs);
assert.notDeepEqual(earlyFrame.frame, laterFrame.frame);
assert.notEqual(earlyFrame.frame.blink.phase, laterFrame.frame.blink.phase);
assert.notDeepEqual(
  faceControllerDecisionTraceForFrame(earlyFrame).decisions.blink.frame,
  faceControllerDecisionTraceForFrame(laterFrame).decisions.blink.frame,
);

const stillEarlyFrame = faceControllerFrameForPresence({
  state: PresenceState.WAITING,
  updatedAt: 1000,
}, {
  now: 1100,
  timeMs: 1100,
  motionScale: 0,
});
const stillLaterFrame = faceControllerFrameForPresence({
  state: PresenceState.WAITING,
  updatedAt: 1000,
}, {
  now: 1100,
  timeMs: 1900,
  motionScale: 0,
});
assert.deepEqual(stillEarlyFrame.decisions, stillLaterFrame.decisions);
assert.deepEqual(stillEarlyFrame.sharedInputs, stillLaterFrame.sharedInputs);
assert.deepEqual(stillEarlyFrame.frame, stillLaterFrame.frame);
assert.deepEqual(
  faceControllerDecisionTraceForFrame(stillEarlyFrame),
  faceControllerDecisionTraceForFrame(stillLaterFrame),
);
assert.equal(stillEarlyFrame.frame.gaze.driftX, 0);
assert.equal(stillEarlyFrame.frame.gaze.driftY, 0);
assert.equal(stillEarlyFrame.frame.mouth.beat, 0);
assert.equal(stillEarlyFrame.frame.posture.breath, 0);
assert.equal(stillEarlyFrame.frame.motion.offsetX, 0);
assert.equal(stillEarlyFrame.frame.motion.offsetY, 0);
assert.ok(stillEarlyFrame.frame.motion.anticipation > 0);

const earlySvg = renderPresenceFaceSvg({
  state: PresenceState.WAITING,
  updatedAt: 1000,
}, {
  now: 1100,
  timeMs: 1100,
  title: 'waiting "before-output" face',
});
const laterSvg = renderPresenceFaceSvg({
  state: PresenceState.WAITING,
  updatedAt: 1000,
}, {
  now: 1100,
  timeMs: 1900,
  title: 'waiting "before-output" face',
});
assert.equal(earlySvg.state, PresenceState.WAITING);
assert.equal(earlySvg.expression, FaceExpression.LISTENING);
assert.equal(earlySvg.attributes.channels, FACE_CONTROL_CHANNELS.join(" "));
assert.equal(earlySvg.attributes.decisionTrace, "complete");
assert.equal(earlySvg.attributes.decisionTraceChannels, FACE_CONTROL_CHANNELS.join(" "));
assert.equal(earlySvg.attributes.decisionTraceDecisions, "6");
assert.equal(earlySvg.attributes.decisionTraceWarnings, "0");
assert.equal(earlySvg.attributes.decisionTraceRendererSafe, "true");
assert.equal(earlySvg.attributes.latencyPhase, "before-output");
assert.match(earlySvg.svg, /^<svg/);
assert.match(earlySvg.svg, /data-presence-state="waiting"/);
assert.match(earlySvg.svg, /data-face-channels="gaze blink brows mouth posture motion"/);
assert.match(earlySvg.svg, /data-gaze-target="response-origin"/);
assert.match(earlySvg.svg, /data-face-decision-trace="complete"/);
assert.match(earlySvg.svg, /data-face-decision-trace-channels="gaze blink brows mouth posture motion"/);
assert.match(earlySvg.svg, /data-face-decision-trace-decisions="6"/);
assert.match(earlySvg.svg, /data-face-decision-trace-warnings="0"/);
assert.match(earlySvg.svg, /data-face-decision-trace-renderer-safe="true"/);
assert.match(earlySvg.svg, /data-face-latency-phase="before-output"/);
assert.match(earlySvg.svg, /waiting &quot;before-output&quot; face/);
assert.equal(earlySvg.attributes.motionScale, "1");
assert.match(earlySvg.svg, /data-motion-scale="1"/);
assert.ok(Object.isFrozen(earlySvg.decisionTrace), "rendered SVG decision trace is frozen");
assert.deepEqual(earlySvg.decisionTrace, faceControllerDecisionTraceForFrame(earlySvg.frameReport));
assert.equal(earlySvg.decisionTrace.complete, true);
assert.equal(earlySvg.decisionTrace.decisionCount, 6);
assert.equal(earlySvg.decisionTrace.warningCount, 0);
assert.equal(earlySvg.decisionTrace.rendererSafe, true);
assert.deepEqual(Object.keys(earlySvg.channelEvidence), FACE_CONTROL_CHANNELS);
for (const channel of FACE_CONTROL_CHANNELS) {
  assert.equal(earlySvg.channelEvidence[channel].controller, `${channel}-controller`);
  assert.equal(earlySvg.channelEvidence[channel].frame, earlySvg.frame[channel]);
  assert.ok(earlySvg.channelEvidence[channel].reads.includes("state"));
}
assert.deepEqual(earlySvg.frameReport.decisions, earlyFrame.decisions);
assert.notEqual(earlySvg.svg, laterSvg.svg);
assert.notDeepEqual(earlySvg.frame, laterSvg.frame);

const stillEarlySvg = renderPresenceFaceSvg({
  state: PresenceState.WAITING,
  updatedAt: 1000,
}, {
  now: 1100,
  timeMs: 1100,
  motionScale: 0,
});
const stillLaterSvg = renderPresenceFaceSvg({
  state: PresenceState.WAITING,
  updatedAt: 1000,
}, {
  now: 1100,
  timeMs: 1900,
  motionScale: 0,
});
assert.equal(stillEarlySvg.attributes.motionScale, "0");
assert.match(stillEarlySvg.svg, /data-motion-scale="0"/);
assert.equal(stillEarlySvg.attributes.decisionTrace, "complete");
assert.match(stillEarlySvg.svg, /data-face-decision-trace="complete"/);
assert.match(stillEarlySvg.svg, /data-face-channels="gaze blink brows mouth posture motion"/);
assert.deepEqual(Object.keys(stillEarlySvg.channelEvidence), FACE_CONTROL_CHANNELS);
assert.deepEqual(stillEarlySvg.decisionTrace, faceControllerDecisionTraceForFrame(stillEarlySvg.frameReport));
assert.equal(stillEarlySvg.svg, stillLaterSvg.svg);
assert.deepEqual(stillEarlySvg.frame, stillLaterSvg.frame);

let frameNowCalls = 0;
const singleNowFrame = faceControllerFrameForPresence({ state: PresenceState.WAITING }, {
  now: () => {
    frameNowCalls += 1;
    return 2200 + frameNowCalls;
  },
});
assert.equal(frameNowCalls, 1);
assert.equal(singleNowFrame.state, PresenceState.WAITING);
assert.ok(singleNowFrame.frame.blink.phase > 0);

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

const frameRuntime = createFaceControllerFrameRuntime({ timeMs: 2400 });
assert.equal(frameRuntime.getFrame(), null);
const runtimeFrame = frameRuntime.update({ state: PresenceState.STREAMING });
assert.equal(runtimeFrame.frame.mouth.shape, "speaking");
assert.equal(frameRuntime.getFrame(), runtimeFrame);

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
