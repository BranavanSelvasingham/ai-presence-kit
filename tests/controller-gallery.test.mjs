import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const root = resolve(new URL("..", import.meta.url).pathname);
const html = readFileSync(resolve(root, "index.html"), "utf8");
const app = readFileSync(resolve(root, "app.js"), "utf8");
const css = readFileSync(resolve(root, "styles.css"), "utf8");
const { PresenceEvent, PresenceState } = require("../packages/core/src/presence-core.js");
const {
  FACE_CONTROL_CHANNELS,
  faceControllerDecisionTraceForFrame,
  faceControllerDecisionsForPresence,
  faceControllerFrameForPresence,
} = require("../packages/face/src/presence-face.js");

assert.match(html, /id="controllerGallery"/);
assert.match(html, /id="controllerGalleryGrid"/);
assert.match(app, /params\.get\("controls"\)/);
assert.match(app, /params\.get\("controllerGallery"\)/);
assert.match(app, /createFaceControllerRuntime\(\)/);
assert.match(app, /FACE_CONTROL_CHANNELS/);
assert.match(app, /faceControllerDecisionsForPresence/);
assert.match(app, /faceControllerFrameForPresence/);
assert.match(app, /runtime\.faceDecisionReport/);
assert.match(app, /runtime\.faceFrameReport/);
assert.match(app, /activeFaceFrameReport/);
assert.match(app, /frameSummary/);
assert.match(app, /controllerCoherenceForFrame/);
assert.match(app, /controllerCoherenceEvidence/);
assert.match(app, /applyControllerCoherenceDataset/);
assert.match(app, /faceControllerCoherenceForFrame/);
assert.match(app, /controllerDecisionTraceForFrame/);
assert.match(app, /controllerDecisionTraceEvidence/);
assert.match(app, /applyControllerDecisionTraceDataset/);
assert.match(app, /faceControllerDecisionTraceForFrame/);
assert.match(app, /controllerGalleryTransitionCues/);
assert.match(app, /CONTROLLER_TRANSITION_CUE_AGE_MS/);
assert.match(app, /controllerTransitionCueEvidence/);
assert.match(app, /applyControllerTransitionCueDataset/);
assert.match(app, /applyControllerGalleryTransitionDataset/);
assert.match(app, /createControllerTransitionCueCard/);
assert.match(app, /dataset\.controller/);
assert.match(app, /dataset\.reads/);
assert.match(app, /dataset\.controllerComposition/);
assert.match(app, /dataset\.controllerEvidence/);
assert.match(app, /dataset\.controllerFrame/);
assert.match(app, /dataset\.controllerCoherence/);
assert.match(app, /dataset\.controllerCoherenceChannels/);
assert.match(app, /dataset\.controllerCoherenceWarnings/);
assert.match(app, /dataset\.controllerCoherenceRendererSafe/);
assert.match(app, /dataset\.controllerCoherenceWarningFree/);
assert.match(app, /dataset\.controllerDecisionTrace/);
assert.match(app, /dataset\.controllerDecisionTraceChannels/);
assert.match(app, /dataset\.controllerDecisionTraceDecisions/);
assert.match(app, /dataset\.controllerDecisionTraceWarnings/);
assert.match(app, /dataset\.controllerDecisionTraceRendererSafe/);
assert.match(app, /dataset\.controllerDecisionTraceController/);
assert.match(app, /dataset\.controllerDecisionTraceReads/);
assert.match(app, /dataset\.transitionEvent/);
assert.match(app, /dataset\.transitionAgeMs/);
assert.match(app, /dataset\.transitionContext/);
assert.match(app, /dataset\.transitionDecisionTrace/);
assert.match(app, /dataset\.transitionDecisionTraceChannels/);
assert.match(app, /dataset\.transitionDecisionTraceDecisions/);
assert.match(app, /dataset\.transitionDecisionTraceWarnings/);
assert.match(app, /dataset\.transitionDecisionTraceRendererSafe/);
assert.match(app, /dataset\.transitionControllerReads/);
assert.match(app, /dataset\.transitionControllerReadsEvent/);
assert.match(app, /dataset\.transitionControllerReadsAge/);
assert.match(app, /dataset\.transitionEvents/);
assert.match(app, /CONTROLLER_FRAME_SAMPLE_OFFSETS/);
assert.match(app, /createControllerFrameSequence/);
assert.match(app, /createControllerFrameStrip/);
assert.match(app, /dataset\.frameSequence/);
assert.match(app, /dataset\.frameSamples/);
assert.match(app, /dataset\.frameChannels/);
assert.match(app, /faceDecisionReport/);
assert.match(app, /metricControls\.dataset\.controllerComposition/);
assert.match(app, /metricControls\.dataset\.controllerEvidence/);
assert.match(app, /metricControls\.dataset\.controllerFrame/);
assert.match(app, /applyControllerCoherenceDataset\(faceShell/);
assert.match(app, /applyControllerCoherenceDataset\(metricControls/);
assert.match(app, /applyControllerCoherenceDataset\(card/);
assert.match(app, /applyControllerCoherenceDataset\(item/);
assert.match(app, /applyControllerDecisionTraceDataset\(faceShell/);
assert.match(app, /applyControllerDecisionTraceDataset\(faceSvg/);
assert.match(app, /applyControllerDecisionTraceDataset\(metricControls/);
assert.match(app, /applyControllerDecisionTraceDataset\(card/);
assert.match(app, /applyControllerDecisionTraceDataset\(item/);
assert.match(app, /applyControllerTransitionCueDataset\(card/);
assert.match(app, /applyControllerGalleryTransitionDataset\(controllerGallery/);
assert.match(app, /applyControllerGalleryTransitionDataset\(controllerGalleryGrid/);
assert.match(css, /body\.controller-gallery-mode/);
assert.match(css, /--face-offset-x/);
assert.match(css, /--face-offset-y/);
assert.match(css, /\.controller-frame-strip/);
assert.match(css, /\.controller-frame-sample/);

for (const constantName of [
  "IDLE",
  "USER_TYPING",
  "READING",
  "THINKING",
  "WAITING",
  "STREAMING",
  "SPEAKING",
  "READY",
  "INTERRUPTED",
  "ERROR",
]) {
  assert.match(app, new RegExp(`PresenceState\\.${constantName}`), `${constantName} missing from gallery state list`);
}

assert.deepEqual(FACE_CONTROL_CHANNELS, ["gaze", "blink", "brows", "mouth", "posture", "motion"]);

for (const channel of FACE_CONTROL_CHANNELS) {
  assert.match(app, new RegExp(`"${channel}"`), `${channel} channel missing from gallery renderer`);
  assert.match(app, new RegExp(`${channel}:`), `${channel} channel missing from frame evidence`);
}

const transitionCueCases = [
  {
    event: PresenceEvent.SUBMIT,
    state: PresenceState.THINKING,
    previousState: PresenceState.READY,
    previousEvent: PresenceEvent.RESPONSE_COMPLETE,
  },
  {
    event: PresenceEvent.STREAM_OPEN,
    state: PresenceState.WAITING,
    previousState: PresenceState.THINKING,
    previousEvent: PresenceEvent.SUBMIT,
  },
  {
    event: PresenceEvent.TOKEN,
    state: PresenceState.STREAMING,
    previousState: PresenceState.WAITING,
    previousEvent: PresenceEvent.STREAM_OPEN,
  },
  {
    event: PresenceEvent.INTERRUPT,
    state: PresenceState.INTERRUPTED,
    previousState: PresenceState.STREAMING,
    previousEvent: PresenceEvent.TOKEN,
  },
];

for (const [index, cue] of transitionCueCases.entries()) {
  const updatedAt = 3200 + index * 220;
  const now = updatedAt + 80;
  const snapshot = {
    state: cue.state,
    previousState: cue.previousState,
    event: cue.event,
    detail: { source: "controller-gallery", transitionCue: cue.event },
    changed: true,
    updatedAt,
    version: 100 + index,
  };
  const cueHistory = [{
    state: cue.previousState,
    previousState: null,
    event: cue.previousEvent,
    detail: { source: "controller-gallery", transitionCueHistory: cue.event },
    changed: true,
    updatedAt: updatedAt - 180,
    version: 99 + index,
  }];
  const report = faceControllerDecisionsForPresence(snapshot, { history: cueHistory, now });
  const frameReport = faceControllerFrameForPresence(snapshot, {
    history: cueHistory,
    now,
    timeMs: updatedAt,
  });
  const trace = faceControllerDecisionTraceForFrame(frameReport);

  assert.equal(report.state, cue.state, `${cue.event} decision report state`);
  assert.deepEqual(frameReport.decisions, report.decisions, `${cue.event} frame decisions match decision report`);
  assert.deepEqual(trace.transitionContext, {
    previousState: cue.previousState,
    transitionEvent: cue.event,
    transitionAgeMs: 80,
  }, `${cue.event} transition context`);
  assert.equal(trace.complete, true, `${cue.event} decision trace complete`);
  assert.equal(trace.rendererSafe, true, `${cue.event} decision trace renderer safe`);
  assert.equal(trace.warningCount, 0, `${cue.event} decision trace warning count`);
  assert.deepEqual(trace.channels, FACE_CONTROL_CHANNELS, `${cue.event} decision trace channel order`);
  assert.equal(trace.decisionCount, FACE_CONTROL_CHANNELS.length, `${cue.event} decision trace count`);
  assert.equal(trace.complete ? "complete" : "incomplete", "complete", `${cue.event} DOM transition decision trace`);
  assert.equal(trace.channels.join(" "), "gaze blink brows mouth posture motion", `${cue.event} DOM transition channels`);
  assert.equal(String(trace.decisionCount), "6", `${cue.event} DOM transition decisions`);
  assert.equal(String(trace.warningCount), "0", `${cue.event} DOM transition warnings`);
  assert.equal(String(trace.rendererSafe), "true", `${cue.event} DOM transition renderer safe`);
  assert.equal(`${cue.previousState} ${cue.event} ${trace.transitionContext.transitionAgeMs}`, `${cue.previousState} ${cue.event} 80`, `${cue.event} DOM transition context`);

  for (const channel of FACE_CONTROL_CHANNELS) {
    const decision = report.decisions[channel];
    const channelTrace = trace.decisions[channel];
    assert.ok(decision.reads.includes("transitionEvent"), `${cue.event} ${channel} decision reads transitionEvent`);
    assert.ok(decision.reads.includes("transitionAgeMs"), `${cue.event} ${channel} decision reads transitionAgeMs`);
    assert.ok(channelTrace.reads.includes("transitionEvent"), `${cue.event} ${channel} trace reads transitionEvent`);
    assert.ok(channelTrace.reads.includes("transitionAgeMs"), `${cue.event} ${channel} trace reads transitionAgeMs`);
    assert.equal(channelTrace.rendererSafe, true, `${cue.event} ${channel} trace renderer safe`);
    assert.equal(channelTrace.warningCount, 0, `${cue.event} ${channel} trace warning count`);
  }
}

const history = [];
for (const state of [
  PresenceState.USER_TYPING,
  PresenceState.READING,
  PresenceState.THINKING,
  PresenceState.WAITING,
  PresenceState.STREAMING,
  PresenceState.SPEAKING,
  PresenceState.READY,
  PresenceState.INTERRUPTED,
  PresenceState.ERROR,
]) {
  const snapshot = {
    state,
    previousState: history.at(-1)?.state || null,
    event: "controller-gallery",
    detail: { source: "controller-gallery" },
    changed: true,
    updatedAt: 1000 + history.length * 180,
    version: history.length + 1,
  };
  const report = faceControllerDecisionsForPresence(snapshot, { history, now: snapshot.updatedAt + 120 });
  const controls = Object.fromEntries(
    FACE_CONTROL_CHANNELS.map((channel) => [channel, report.decisions[channel].control]),
  );

  assert.equal(report.state, state, `${state} decision report state`);
  assert.equal(typeof report.expression, "string", `${state} decision report expression`);
  assert.deepEqual(Object.keys(report.decisions), FACE_CONTROL_CHANNELS, `${state} decision channel order`);
  assert.equal(typeof controls.gaze.target, "string", `${state} gaze target`);
  assert.equal(typeof controls.mouth.shape, "string", `${state} mouth shape`);
  assert.ok(Number.isFinite(controls.blink.cadenceMs), `${state} blink cadence`);
  assert.ok(Number.isFinite(controls.brows.pinch), `${state} brow pinch`);
  assert.ok(Number.isFinite(controls.posture.lean), `${state} posture lean`);
  assert.ok(Number.isFinite(controls.motion.energy), `${state} motion energy`);

  for (const channel of FACE_CONTROL_CHANNELS) {
    const decision = report.decisions[channel];
    assert.equal(decision.channel, channel, `${state} ${channel} decision channel`);
    assert.equal(decision.controller, `${channel}-controller`, `${state} ${channel} controller name`);
    assert.ok(decision.reads.includes("state"), `${state} ${channel} reads state`);
    assert.deepEqual(decision.control, controls[channel], `${state} ${channel} decision control`);
  }

  const frameSamples = [0, 240, 480, 720].map((offsetMs) => faceControllerFrameForPresence(snapshot, {
    history,
    now: snapshot.updatedAt + 120,
    timeMs: snapshot.updatedAt + offsetMs,
  }));

  assert.equal(frameSamples.length, 4, `${state} frame sample count`);
  for (const frameReport of frameSamples) {
    assert.equal(frameReport.state, state, `${state} frame report state`);
    assert.deepEqual(Object.keys(frameReport.frame), FACE_CONTROL_CHANNELS, `${state} frame channel order`);
    assert.deepEqual(frameReport.coherence.channels, FACE_CONTROL_CHANNELS, `${state} coherence channel order`);
    assert.equal(frameReport.coherence.rendererSafe, true, `${state} coherence renderer safe`);
    assert.deepEqual(frameReport.coherence.warnings, [], `${state} coherence warnings`);
    assert.equal(frameReport.coherence.summary.presentChannelCount, FACE_CONTROL_CHANNELS.length, `${state} coherence present channels`);
    assert.equal(frameReport.coherence.summary.boundedChannelCount, FACE_CONTROL_CHANNELS.length, `${state} coherence bounded channels`);
    assert.equal(
      frameReport.coherence.rendererSafe && frameReport.coherence.warnings.length === 0 ? "safe" : "unsafe",
      "safe",
      `${state} DOM coherence status`,
    );
    assert.equal(frameReport.coherence.channels.join(" "), "gaze blink brows mouth posture motion", `${state} DOM coherence channels`);
    assert.equal(String(frameReport.coherence.warnings.length), "0", `${state} DOM coherence warnings`);
    const decisionTrace = faceControllerDecisionTraceForFrame(frameReport);
    assert.deepEqual(decisionTrace.channels, FACE_CONTROL_CHANNELS, `${state} decision trace channel order`);
    assert.equal(decisionTrace.decisionCount, FACE_CONTROL_CHANNELS.length, `${state} decision trace count`);
    assert.equal(decisionTrace.complete, true, `${state} decision trace complete`);
    assert.equal(decisionTrace.rendererSafe, true, `${state} decision trace renderer safe`);
    assert.equal(decisionTrace.warningCount, 0, `${state} decision trace warning count`);
    assert.deepEqual(decisionTrace.warnings, [], `${state} decision trace warnings`);
    assert.equal(decisionTrace.complete ? "complete" : "incomplete", "complete", `${state} DOM decision trace status`);
    assert.equal(decisionTrace.channels.join(" "), "gaze blink brows mouth posture motion", `${state} DOM decision trace channels`);
    assert.equal(String(decisionTrace.decisionCount), "6", `${state} DOM decision trace decisions`);
    assert.equal(String(decisionTrace.warningCount), "0", `${state} DOM decision trace warnings`);
    assert.equal(String(decisionTrace.rendererSafe), "true", `${state} DOM decision trace renderer safe`);
    assert.deepEqual(frameReport.decisions, report.decisions, `${state} frame decisions stay fixed across samples`);
    for (const channel of FACE_CONTROL_CHANNELS) {
      assert.ok(frameReport.frame[channel], `${state} frame has ${channel}`);
      const channelTrace = decisionTrace.decisions[channel];
      assert.equal(channelTrace.channel, channel, `${state} ${channel} decision trace channel`);
      assert.equal(channelTrace.controller, `${channel}-controller`, `${state} ${channel} trace controller`);
      assert.ok(channelTrace.reads.includes("state"), `${state} ${channel} trace reads state`);
      assert.equal(channelTrace.present, true, `${state} ${channel} trace present`);
      assert.equal(channelTrace.bounded, true, `${state} ${channel} trace bounded`);
      assert.equal(channelTrace.rendererSafe, true, `${state} ${channel} trace renderer safe`);
      assert.equal(channelTrace.warningCount, 0, `${state} ${channel} trace warning count`);
      assert.deepEqual(channelTrace.frame, frameReport.coherence.channelReports[channel].summary, `${state} ${channel} trace frame summary`);
    }
  }

  if (state === PresenceState.THINKING || state === PresenceState.WAITING) {
    assert.notDeepEqual(frameSamples[0].frame, frameSamples.at(-1).frame, `${state} frame sequence varies over time`);
    assert.notEqual(
      frameSamples[0].frame.motion.offsetX,
      frameSamples.at(-1).frame.motion.offsetX,
      `${state} motion offset changes over samples`,
    );
  }
  history.push(snapshot);
}

assert.doesNotMatch(`${html}\n${app}\n${css}`, /emotion[- ]detection|private emotion/i);

console.log("controller-gallery ok");
