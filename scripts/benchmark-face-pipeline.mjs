import { createRequire } from "node:module";
import { performance } from "node:perf_hooks";

const require = createRequire(import.meta.url);

const {
  PRESENCE_STATES,
} = require("../packages/core");
const {
  FACE_CONTROL_CHANNELS,
  faceControllerDecisionTraceForFrame,
  faceControllerFrameForPresence,
  renderPresenceFaceSvg,
} = require("../packages/face");

const ITERATIONS = 10_000;
const BUDGET_MS = 0.25;
const SVG_BUDGET_MS = 0.75;
const BASE_TIME_MS = 1_200;

const expectedChannels = ["gaze", "blink", "brows", "mouth", "posture", "motion"];

function fail(message) {
  console.error(`face-pipeline result=fail ${message}`);
  process.exit(1);
}

function detailForState(state) {
  if (state === "user-typing") {
    return Object.freeze({ text: "Drafting a concise prompt", completion: 0.35 });
  }
  if (state === "reading") {
    return Object.freeze({ text: "Drafting a concise prompt", completion: 0.5, question: true });
  }
  if (state === "thinking") {
    return Object.freeze({ text: "Drafting a concise prompt", completion: 0.82, ready: true });
  }
  if (state === "streaming" || state === "speaking") {
    return Object.freeze({ text: "Here is the response so far." });
  }
  if (state === "error") {
    return Object.freeze({ error: true });
  }
  return Object.freeze({});
}

function createBenchmarkSnapshots(states) {
  return states.map((state, index) => Object.freeze({
    state,
    previousState: index > 0 ? states[index - 1] : null,
    event: "benchmark",
    detail: detailForState(state),
    changed: index > 0,
    updatedAt: BASE_TIME_MS + index * 80,
    version: index + 1,
  }));
}

function createHistories(snapshots) {
  return snapshots.map((_, index) => Object.freeze(
    snapshots.slice(0, index + 1).map((snapshot, historyIndex) => Object.freeze({
      index: historyIndex,
      state: snapshot.state,
      previousState: snapshot.previousState,
      event: snapshot.event,
      detail: snapshot.detail,
      changed: snapshot.changed,
      updatedAt: snapshot.updatedAt,
      version: snapshot.version,
      elapsedMs: snapshot.updatedAt - snapshots[0].updatedAt,
      sincePreviousMs: historyIndex === 0
        ? 0
        : snapshot.updatedAt - snapshots[historyIndex - 1].updatedAt,
    })),
  ));
}

function validateSetup(states) {
  if (!Array.isArray(states) || states.length === 0) {
    fail("states=0 canonical presence states missing");
  }
  if (FACE_CONTROL_CHANNELS.length !== expectedChannels.length) {
    fail(`channels=${FACE_CONTROL_CHANNELS.length} expected=${expectedChannels.length}`);
  }
  for (const channel of expectedChannels) {
    if (!FACE_CONTROL_CHANNELS.includes(channel)) {
      fail(`missing-channel=${channel}`);
    }
  }
}

function validateFrameTrace(state, frameReport, trace) {
  if (!frameReport || typeof frameReport !== "object") {
    fail(`state=${state} frame=missing`);
  }
  if (frameReport.state !== state) {
    fail(`state=${state} frameState=${frameReport.state}`);
  }
  if (!frameReport.sharedInputs || frameReport.sharedInputs.state !== state) {
    fail(`state=${state} sharedInputs=missing`);
  }
  if (!frameReport.coherence?.complete) {
    fail(`state=${state} coherence=incomplete`);
  }
  if (!frameReport.coherence?.rendererSafe) {
    fail(`state=${state} safe=false`);
  }
  if ((frameReport.coherence?.warnings || []).length !== 0) {
    fail(`state=${state} warnings=${frameReport.coherence.warnings.length}`);
  }
  if (!trace?.complete) {
    fail(`state=${state} trace=incomplete`);
  }
  if (!trace.rendererSafe) {
    fail(`state=${state} traceSafe=false`);
  }
  if (trace.warningCount !== 0) {
    fail(`state=${state} traceWarnings=${trace.warningCount}`);
  }
  if (trace.decisionCount !== expectedChannels.length) {
    fail(`state=${state} decisions=${trace.decisionCount}`);
  }
  for (const channel of expectedChannels) {
    const channelTrace = trace.decisions?.[channel];
    if (!channelTrace?.present || !channelTrace?.bounded || !channelTrace?.rendererSafe) {
      fail(`state=${state} channel=${channel} rendererSafe=false`);
    }
  }
}

function validateRenderedSvg(state, rendered) {
  if (!rendered || typeof rendered !== "object") {
    fail(`state=${state} svg=missing`);
  }
  if (rendered.state !== state) {
    fail(`state=${state} svgState=${rendered.state}`);
  }

  validateFrameTrace(state, rendered.frameReport, rendered.decisionTrace);

  const attributes = rendered.attributes || {};
  const expectedAttributes = {
    decisionTrace: "complete",
    decisionTraceDecisions: String(expectedChannels.length),
    decisionTraceWarnings: "0",
    decisionTraceRendererSafe: "true",
  };
  for (const [name, expected] of Object.entries(expectedAttributes)) {
    if (attributes[name] !== expected) {
      fail(`state=${state} attribute=${name} actual=${attributes[name]} expected=${expected}`);
    }
  }
  if (typeof rendered.svg !== "string" || rendered.svg.length === 0) {
    fail(`state=${state} svgString=missing`);
  }
  for (const expectedSnippet of [
    'data-face-decision-trace="complete"',
    `data-face-decision-trace-decisions="${expectedChannels.length}"`,
  ]) {
    if (!rendered.svg.includes(expectedSnippet)) {
      fail(`state=${state} svgMissing=${expectedSnippet}`);
    }
  }
}

validateSetup(PRESENCE_STATES);

const snapshots = createBenchmarkSnapshots(PRESENCE_STATES);
const histories = createHistories(snapshots);
let warningCount = 0;
let svgWarningCount = 0;

for (let stateIndex = 0; stateIndex < snapshots.length; stateIndex += 1) {
  const timeMs = BASE_TIME_MS + stateIndex * 80 + 40;
  const frameReport = faceControllerFrameForPresence(snapshots[stateIndex], {
    history: histories[stateIndex],
    now: timeMs,
    timeMs,
  });
  const trace = faceControllerDecisionTraceForFrame(frameReport);
  validateFrameTrace(snapshots[stateIndex].state, frameReport, trace);

  const rendered = renderPresenceFaceSvg(snapshots[stateIndex], {
    history: histories[stateIndex],
    now: timeMs,
    timeMs,
  });
  validateRenderedSvg(snapshots[stateIndex].state, rendered);
}

const start = performance.now();

for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
  const iterationOffsetMs = iteration % 997;
  for (let stateIndex = 0; stateIndex < snapshots.length; stateIndex += 1) {
    const snapshot = snapshots[stateIndex];
    const timeMs = BASE_TIME_MS + stateIndex * 80 + iterationOffsetMs;
    const frameReport = faceControllerFrameForPresence(snapshot, {
      history: histories[stateIndex],
      now: timeMs,
      timeMs,
    });
    const trace = faceControllerDecisionTraceForFrame(frameReport);

    warningCount += trace.warningCount;
    validateFrameTrace(snapshot.state, frameReport, trace);
  }
}

const elapsedMs = performance.now() - start;
const framePasses = ITERATIONS * snapshots.length;
const avgMs = elapsedMs / framePasses;

const svgStart = performance.now();

for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
  const iterationOffsetMs = iteration % 997;
  for (let stateIndex = 0; stateIndex < snapshots.length; stateIndex += 1) {
    const snapshot = snapshots[stateIndex];
    const timeMs = BASE_TIME_MS + stateIndex * 80 + iterationOffsetMs;
    const rendered = renderPresenceFaceSvg(snapshot, {
      history: histories[stateIndex],
      now: timeMs,
      timeMs,
    });

    validateRenderedSvg(snapshot.state, rendered);
    svgWarningCount += rendered.decisionTrace.warningCount;
  }
}

const svgElapsedMs = performance.now() - svgStart;
const svgAvgMs = svgElapsedMs / framePasses;
const result = avgMs <= BUDGET_MS && svgAvgMs <= SVG_BUDGET_MS ? "pass" : "fail";
const summary = [
  "face-pipeline",
  `iterations=${ITERATIONS}`,
  `states=${snapshots.length}`,
  `channels=${FACE_CONTROL_CHANNELS.length}`,
  "trace=complete",
  "safe=true",
  `warnings=${warningCount}`,
  `avgMs=${avgMs.toFixed(4)}`,
  `budgetMs=${BUDGET_MS}`,
  `svgAvgMs=${svgAvgMs.toFixed(4)}`,
  `svgBudgetMs=${SVG_BUDGET_MS}`,
  "svgTrace=complete",
  "svgSafe=true",
  `svgWarnings=${svgWarningCount}`,
  `result=${result}`,
].join(" ");

if (result === "pass") {
  console.log(summary);
} else {
  console.error(summary);
  process.exit(1);
}
