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
  faceControllerDecisionTraceForFrame,
  faceControllerFrameForPresence,
  faceExpressionForPresence,
} = require("../packages/face/src/presence-face.js");

assert.match(html, /id="comparisonDemo"/);
assert.match(html, /id="compareFace"/);
assert.match(app, /dataset\.equalLatency/);
assert.match(app, /dataset\.spinnerFirstTokenMs/);
assert.match(app, /dataset\.genericFirstTokenMs/);
assert.match(app, /dataset\.presenceFirstTokenMs/);
assert.match(app, /dataset\.presenceFirstStateMs/);
assert.match(app, /dataset\.presenceBeforeToken/);
assert.match(app, /dataset\.presenceBeforeTokenStates/);
assert.match(app, /dataset\.presenceRendererBeforeToken/);
assert.match(app, /dataset\.presenceFrameBeforeToken/);
assert.match(app, /dataset\.presenceFrameBeforeTokenMs/);
assert.match(app, /dataset\.presenceFrameBeforeTokenChannels/);
assert.match(app, /dataset\.presenceFrameBeforeTokenSummary/);
assert.match(app, /dataset\.presenceDecisionTraceBeforeToken/);
assert.match(app, /dataset\.presenceDecisionTraceBeforeTokenMs/);
assert.match(app, /dataset\.presenceDecisionTraceBeforeTokenChannels/);
assert.match(app, /dataset\.presenceDecisionTraceBeforeTokenDecisions/);
assert.match(app, /dataset\.presenceDecisionTraceBeforeTokenWarnings/);
assert.match(app, /dataset\.presenceDecisionTraceBeforeTokenRendererSafe/);
assert.match(app, /dataset\.presenceDecisionTraceLeadMs/);
assert.match(app, /dataset\.genericBeforeToken/);
assert.match(app, /dataset\.genericBeforeTokenState/);
assert.match(app, /dataset\.genericBeforeTokenLoading/);
assert.match(app, /beforeTokenFirstStateMs: null/);
assert.match(app, /beforeTokenFrameMs: null/);
assert.match(app, /beforeTokenDecisionTraceMs: null/);
assert.match(app, /comparisonTiming\.firstToken - value/);
assert.match(app, /recordComparisonBeforeTokenEvidence\(0\);/);
assert.match(app, /recordComparisonBeforeTokenEvidence\(comparisonTiming\.pause\);/);
assert.match(app, /recordComparisonBeforeTokenEvidence\(comparisonTiming\.streamOpen\);/);
assert.match(app, /recordComparisonBeforeTokenEvidence\(comparisonTiming\.firstToken\);/);
assert.match(app, /compareSpinnerResponse\.textContent/);
assert.match(app, /comparisonTiming\.firstToken/);
assert.match(app, /beforeTokenDecisionTraceStatus: "incomplete"/);

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

const firstTokenMs = 1400;
const preTokenEvidencePoints = [
  { ms: 0, snapshot: reading, history: history.slice(0, 2) },
  { ms: 360, snapshot: thinking, history: history.slice(0, 3) },
  { ms: 900, snapshot: waiting, history: history.slice(0, 4) },
];
let firstPresenceStateMs = null;
let firstCompleteFrameMs = null;
let firstCompleteDecisionTraceMs = null;
for (const point of preTokenEvidencePoints) {
  if (
    firstPresenceStateMs === null
    && [
      PresenceState.READING,
      PresenceState.THINKING,
      PresenceState.WAITING,
    ].includes(point.snapshot.state)
  ) {
    firstPresenceStateMs = point.ms;
  }

  const pointFrameReport = faceControllerFrameForPresence(point.snapshot, {
    history: point.history,
    now: point.ms,
    timeMs: point.ms,
  });
  const pointFrameChannels = Object.keys(pointFrameReport.frame || {});
  const completeFrame = FACE_CONTROL_CHANNELS.every((channel) => pointFrameChannels.includes(channel));
  if (firstCompleteFrameMs === null && completeFrame) {
    firstCompleteFrameMs = point.ms;
  }

  const pointDecisionTrace = faceControllerDecisionTraceForFrame(pointFrameReport);
  const completeTrace = pointDecisionTrace.complete
    && pointDecisionTrace.rendererSafe
    && pointDecisionTrace.warningCount === 0;
  if (firstCompleteDecisionTraceMs === null && completeTrace) {
    firstCompleteDecisionTraceMs = point.ms;
  }
}

assert.equal(firstPresenceStateMs, 0);
assert.equal(firstCompleteFrameMs, 0);
assert.equal(firstCompleteDecisionTraceMs, 0);
assert.equal(firstTokenMs - firstCompleteDecisionTraceMs, 1400);

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

const decisionTrace = faceControllerDecisionTraceForFrame(frameReport);
assert.deepEqual(decisionTrace.channels, FACE_CONTROL_CHANNELS);
assert.equal(decisionTrace.complete, true);
assert.equal(decisionTrace.decisionCount, FACE_CONTROL_CHANNELS.length);
assert.equal(decisionTrace.warningCount, 0);
assert.deepEqual(decisionTrace.warnings, []);
assert.equal(decisionTrace.rendererSafe, true);
assert.equal(decisionTrace.complete ? "complete" : "incomplete", "complete");
assert.equal(decisionTrace.channels.join(" "), "gaze blink brows mouth posture motion");
assert.equal(String(decisionTrace.decisionCount), "6");
assert.equal(String(decisionTrace.warningCount), "0");
assert.equal(String(decisionTrace.rendererSafe), "true");

const token = sendAt(1400, {
  type: RuntimeSignal.TOKEN,
  source: "comparison-test",
});
assert.equal(token.state, PresenceState.STREAMING);

assert.doesNotMatch(`${html}\n${app}`, /emotion[- ]detection|private emotion/i);

console.log("comparison-before-token ok");
