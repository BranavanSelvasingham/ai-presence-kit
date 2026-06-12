import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const root = resolve(new URL("..", import.meta.url).pathname);
const app = readFileSync(resolve(root, "app.js"), "utf8");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const {
  PresenceState,
  createPresenceRuntime,
} = require("../packages/core/src/presence-core.js");
const {
  RuntimeSignal,
  createRuntimeSignalAdapter,
} = require("../packages/adapters/src/runtime-adapter.js");
const {
  FACE_CONTROL_CHANNELS,
  faceControllerFrameForPresence,
  faceExpressionForPresence,
} = require("../packages/face/src/presence-face.js");

assert.match(html, /id="comparisonDemo"/);
assert.match(html, /id="compareFace"/);
assert.match(app, /dataset\.equalLatency/);
assert.match(app, /dataset\.spinnerFirstTokenMs/);
assert.match(app, /dataset\.presenceFirstTokenMs/);
assert.match(app, /dataset\.presenceBeforeToken/);
assert.match(app, /dataset\.presenceBeforeTokenStates/);
assert.match(app, /dataset\.presenceRendererBeforeToken/);
assert.match(app, /dataset\.presenceFrameBeforeToken/);
assert.match(app, /dataset\.presenceFrameBeforeTokenChannels/);
assert.match(app, /dataset\.presenceFrameBeforeTokenSummary/);
assert.match(app, /dataset\.genericBeforeToken/);
assert.match(app, /dataset\.genericBeforeTokenState/);
assert.match(app, /dataset\.genericBeforeTokenLoading/);
assert.match(app, /recordComparisonBeforeTokenEvidence\(\);/);
assert.match(app, /compareSpinnerResponse\.textContent/);
assert.match(app, /comparisonTiming\.firstToken/);

let now = 0;
const runtime = createPresenceRuntime({
  initialState: PresenceState.IDLE,
  now: () => now,
});
const adapter = createRuntimeSignalAdapter(runtime);
const history = [];

function sendAt(timeMs, signal) {
  now = timeMs;
  const snapshot = adapter.send(signal);
  history.push(snapshot);
  return snapshot;
}

sendAt(0, {
  type: RuntimeSignal.USER_INPUT,
  text: "Why does this feel faster?",
  source: "comparison-test",
});
const reading = sendAt(0, {
  type: RuntimeSignal.LOCAL_READ,
  text: "Why does this feel faster?",
  completion: 0.28,
  source: "comparison-test",
});
const thinking = sendAt(360, {
  type: RuntimeSignal.USER_PAUSE,
  text: "Why does this feel faster?",
  completion: 0.46,
  source: "comparison-test",
});
const waiting = sendAt(900, {
  type: RuntimeSignal.STREAM_OPEN,
  source: "comparison-test",
});

const beforeTokenStates = [reading.state, thinking.state, waiting.state];
assert.deepEqual(beforeTokenStates, [
  PresenceState.READING,
  PresenceState.THINKING,
  PresenceState.WAITING,
]);
assert.deepEqual(beforeTokenStates.filter((state) => state === PresenceState.STREAMING), []);
assert.deepEqual(beforeTokenStates.map((state) => faceExpressionForPresence(state)), [
  "reading",
  "thinking",
  "listening",
]);

const frameReport = faceControllerFrameForPresence(waiting, {
  history,
  now: 900,
  timeMs: 900,
});
assert.equal(frameReport.state, PresenceState.WAITING);
assert.deepEqual(Object.keys(frameReport.frame), FACE_CONTROL_CHANNELS);
for (const channel of FACE_CONTROL_CHANNELS) {
  assert.ok(frameReport.frame[channel], `pre-token frame has ${channel}`);
}

const token = sendAt(1400, {
  type: RuntimeSignal.TOKEN,
  source: "comparison-test",
});
assert.equal(token.state, PresenceState.STREAMING);

assert.doesNotMatch(`${html}\n${app}`, /emotion[- ]detection|private emotion/i);

console.log("comparison-before-token ok");
