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
assert.match(app, /dataset\.controller/);
assert.match(app, /dataset\.reads/);
assert.match(app, /dataset\.controllerComposition/);
assert.match(app, /dataset\.controllerEvidence/);
assert.match(app, /dataset\.controllerFrame/);
assert.match(app, /faceDecisionReport/);
assert.match(app, /metricControls\.dataset\.controllerComposition/);
assert.match(app, /metricControls\.dataset\.controllerEvidence/);
assert.match(app, /metricControls\.dataset\.controllerFrame/);
assert.match(css, /body\.controller-gallery-mode/);
assert.match(css, /--face-offset-x/);
assert.match(css, /--face-offset-y/);

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
  history.push(snapshot);
}

assert.doesNotMatch(`${html}\n${app}\n${css}`, /emotion[- ]detection|private emotion/i);

console.log("controller-gallery ok");
