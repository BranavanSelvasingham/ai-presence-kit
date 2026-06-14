import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const root = resolve(new URL("..", import.meta.url).pathname);
const app = readFileSync(resolve(root, "app.js"), "utf8");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const server = readFileSync(resolve(root, "server.mjs"), "utf8");
const {
  PresenceEvent,
  PresenceState,
  createPresenceRuntime,
  createPresenceTrace,
  summarizePresenceTrace,
} = require("../packages/core/src/presence-core.js");

assert.match(html, /id="faceShell"/);
assert.match(html, /id="metricsPanel"/);
assert.match(app, /LIVE_RESPONSE_STREAM_STATES = new Set\(\["idle", "opened", "token", "done", "error", "aborted"\]\)/);
assert.match(app, /liveResponseTrace: null/);
assert.match(app, /runtime\.liveResponseTrace = createPresenceTrace\(\{ limit: 16 \}\)/);
assert.match(app, /summarizePresenceTrace\(runtime\.liveResponseTrace\)/);
assert.match(app, /liveResponseEvidenceTargets\(\)/);
assert.match(app, /document\.documentElement, faceShell, metricsPanel/);

for (const datasetName of [
  "liveResponseConfigured",
  "liveResponseStream",
  "liveTraceSummary",
  "liveTraceEntryCount",
  "liveTraceStates",
  "liveTraceEvents",
  "liveTraceFirstStateMs",
  "liveTraceFirstTokenMs",
  "liveTraceFirstOutputMs",
  "liveTraceFirstOutputEvent",
  "liveTraceLeadMs",
  "liveTraceFinalState",
  "liveTraceHasOutput",
  "liveTraceComplete",
]) {
  assert.match(app, new RegExp(`dataset\\.${datasetName}`));
}

assert.match(app, /runtime\.liveResponseEvidence\.configured = Boolean\(health\.openaiConfigured\)/);
assert.match(server, /openaiConfigured: Boolean\(OPENAI_API_KEY\)/);
assert.doesNotMatch(server, /openaiConfigured:\s*OPENAI_API_KEY[,}]/);

assert.match(app, /fetch\("\/api\/health", \{ cache: "no-store" \}\)/);
assert.match(app, /fetch\("\/api\/respond"/);
assert.match(app, /beginLiveResponseEvidence\(turnId, runtime\.presenceSnapshot\)/);
assert.match(app, /recordLiveResponseSnapshot\(turnId, "opened", streamOpenSnapshot\)/);
assert.match(app, /recordLiveResponseSnapshot\(turnId, "token", tokenSnapshot\)/);
assert.match(app, /endLiveResponseEvidence\("done", completeSnapshot\)/);
assert.match(app, /endLiveResponseEvidence\("error"\)/);
assert.match(app, /endLiveResponseEvidence\("aborted"/);

const liveDatasetAssignments = [...app.matchAll(/element\.dataset\.(live[A-Za-z0-9]+)\s*=\s*([^;\n]+)/g)];
assert.ok(liveDatasetAssignments.length >= 12, "live evidence dataset assignments are present");
for (const [, datasetName, assignedValue] of liveDatasetAssignments) {
  assert.doesNotMatch(
    assignedValue,
    /payload|delta|event\.data|responseText|cleanText|features|prepared|OPENAI_API_KEY|Authorization|health\.model|apiLabel|realtimeVoice/,
    `${datasetName} must not expose prompt, output, model, or secret-bearing fields`,
  );
}

assert.doesNotMatch(app, /dataset\.live[A-Za-z0-9]+\s*=\s*payload/);
assert.doesNotMatch(app, /dataset\.live[A-Za-z0-9]+\s*=.*delta/);
assert.doesNotMatch(app, /dataset\.live[A-Za-z0-9]+\s*=.*OPENAI/);
assert.doesNotMatch(app, /dataset\.live[A-Za-z0-9]+\s*=.*Authorization/);
assert.doesNotMatch(`${html}\n${app}`, /sk-[A-Za-z0-9_-]{20,}|npm_[A-Za-z0-9_-]{20,}/);

let now = 0;
const runtime = createPresenceRuntime({
  initialState: PresenceState.IDLE,
  now: () => now,
});
const liveTrace = createPresenceTrace({ limit: 16 });

function sendAt(timeMs, event, detail = {}) {
  now = timeMs;
  const snapshot = runtime.send(event, detail);
  liveTrace.record(snapshot);
  return snapshot;
}

const submitted = sendAt(0, PresenceEvent.SUBMIT, { source: "live-test" });
const opened = sendAt(320, PresenceEvent.STREAM_OPEN, { source: "openai" });
const token = sendAt(880, PresenceEvent.TOKEN, { source: "openai" });
const complete = sendAt(1240, PresenceEvent.RESPONSE_COMPLETE, { source: "openai-text" });

assert.equal(submitted.state, PresenceState.THINKING);
assert.equal(opened.state, PresenceState.WAITING);
assert.equal(token.state, PresenceState.STREAMING);
assert.equal(complete.state, PresenceState.READY);

const summary = summarizePresenceTrace(liveTrace);
assert.deepEqual(summary.states, [
  PresenceState.THINKING,
  PresenceState.WAITING,
  PresenceState.STREAMING,
  PresenceState.READY,
]);
assert.deepEqual(summary.events, [
  PresenceEvent.SUBMIT,
  PresenceEvent.STREAM_OPEN,
  PresenceEvent.TOKEN,
  PresenceEvent.RESPONSE_COMPLETE,
]);
assert.equal(summary.entryCount, 4);
assert.equal(summary.firstStateMs, 0);
assert.equal(summary.streamOpenMs, 320);
assert.equal(summary.firstTokenMs, 880);
assert.equal(summary.firstOutputMs, 880);
assert.equal(summary.firstOutputEvent, PresenceEvent.TOKEN);
assert.equal(summary.presenceBeforeOutputMs, 880);
assert.equal(summary.finalState, PresenceState.READY);
assert.equal(summary.hasOutput, true);
assert.equal(summary.complete, true);

const liveEvidence = {
  summary: summary.complete && summary.hasOutput && summary.finalState ? "complete" : "incomplete",
  entryCount: String(summary.entryCount),
  firstOutputEvent: summary.firstOutputEvent || "none",
  leadMs: String(summary.presenceBeforeOutputMs),
  finalState: summary.finalState || "none",
  hasOutput: String(summary.hasOutput),
  complete: String(summary.complete),
};

assert.deepEqual(liveEvidence, {
  summary: "complete",
  entryCount: "4",
  firstOutputEvent: "token",
  leadMs: "880",
  finalState: "ready",
  hasOutput: "true",
  complete: "true",
});

assert.doesNotMatch(`${html}\n${app}`, /emotion[- ]detection|private emotion/i);

console.log("live-response-evidence ok");
