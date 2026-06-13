import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const root = resolve(new URL("..", import.meta.url).pathname);
const html = readFileSync(resolve(root, "index.html"), "utf8");
const app = readFileSync(resolve(root, "app.js"), "utf8");
const css = readFileSync(resolve(root, "styles.css"), "utf8");
const { PresenceState } = require("../packages/core/src/presence-core.js");
const {
  FACE_CONTROL_CHANNELS,
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
    assert.deepEqual(frameReport.decisions, report.decisions, `${state} frame decisions stay fixed across samples`);
    for (const channel of FACE_CONTROL_CHANNELS) {
      assert.ok(frameReport.frame[channel], `${state} frame has ${channel}`);
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
