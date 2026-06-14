import { createRequire } from "node:module";
import { performance } from "node:perf_hooks";

const require = createRequire(import.meta.url);

const {
  PresenceEvent,
  PresenceState,
  createPresenceRuntime,
  createPresenceTrace,
  summarizePresenceTrace,
} = require("../packages/core");
const {
  VercelAIStatus,
  createChatEventAdapter,
  createVercelAISDKAdapter,
} = require("../packages/adapters");

const ITERATIONS = 10_000;
const BUDGET_MS = 0.35;
const BASE_TIME_MS = 1_200;

function fail(message) {
  console.error(`core-runtime result=fail ${message}`);
  process.exit(1);
}

function createScenarioContext(iteration, scenarioIndex) {
  const baseTimeMs = BASE_TIME_MS + iteration * 10_000 + scenarioIndex * 1_000;
  let nowMs = baseTimeMs;
  const runtime = createPresenceRuntime({ now: () => nowMs });
  const trace = createPresenceTrace({ limit: 64 });

  return {
    runtime,
    trace,
    at(offsetMs, action) {
      nowMs = baseTimeMs + offsetMs;
      const snapshot = action();
      return trace.record(snapshot);
    },
  };
}

function finishScenario(name, trace) {
  const summary = summarizePresenceTrace(trace);
  return {
    name,
    summary,
    entries: trace.getEntries(),
  };
}

function runCoreScenario(iteration) {
  const context = createScenarioContext(iteration, 0);
  const { runtime } = context;
  const prompt = "Draft a concise presence state note";

  context.at(0, () => runtime.send(PresenceEvent.USER_INPUT, { text: prompt, completion: 0.18 }));
  context.at(48, () => runtime.send(PresenceEvent.LOCAL_READ, { text: prompt, completion: 0.34 }));
  context.at(96, () => runtime.send(PresenceEvent.USER_PAUSE, { text: prompt, completion: 0.54 }));
  context.at(144, () => runtime.send(PresenceEvent.SUBMIT, { text: prompt }));
  context.at(224, () => runtime.send(PresenceEvent.STREAM_OPEN));
  context.at(304, () => runtime.send(PresenceEvent.TOKEN, { text: "Here" }));
  context.at(384, () => runtime.send(PresenceEvent.RESPONSE_COMPLETE, { text: "Here is the note." }));

  return finishScenario("core", context.trace);
}

function runVercelScenario(iteration) {
  const context = createScenarioContext(iteration, 1);
  const adapter = createVercelAISDKAdapter(context.runtime);
  const prompt = "Show the package flow";

  context.at(0, () => adapter.onInput(prompt, { completion: 0.2 }));
  context.at(72, () => adapter.update({ status: VercelAIStatus.SUBMITTED, text: prompt }));
  context.at(152, () => adapter.update({ status: VercelAIStatus.STREAMING, messages: [] }));
  context.at(248, () => adapter.update({
    status: VercelAIStatus.STREAMING,
    messages: [{ role: "assistant", parts: [{ type: "text", text: "Flow" }] }],
  }));
  context.at(328, () => adapter.onFinish({ finishReason: "stop" }));

  return finishScenario("vercel-ai-sdk", context.trace);
}

function runChatScenario(iteration) {
  const context = createScenarioContext(iteration, 2);
  const adapter = createChatEventAdapter(context.runtime);
  const prompt = "Map generic chat events";

  context.at(0, () => adapter.handleEvent({ type: "input", text: prompt, completion: 0.16 }));
  context.at(52, () => adapter.handleEvent({ type: "pause", text: prompt, completion: 0.44 }));
  context.at(104, () => adapter.handleEvent({ type: "submit", text: prompt }));
  context.at(184, () => adapter.handleEvent({ type: "stream-open" }));
  context.at(264, () => adapter.handleEvent({ type: "message-delta", delta: "Mapped" }));
  context.at(344, () => adapter.handleEvent({ type: "finish", text: "Mapped generic chat events." }));

  return finishScenario("generic-chat", context.trace);
}

const scenarios = Object.freeze([
  {
    name: "core",
    run: runCoreScenario,
    states: [
      PresenceState.USER_TYPING,
      PresenceState.READING,
      PresenceState.THINKING,
      PresenceState.THINKING,
      PresenceState.WAITING,
      PresenceState.STREAMING,
      PresenceState.READY,
    ],
  },
  {
    name: "vercel-ai-sdk",
    run: runVercelScenario,
    states: [
      PresenceState.USER_TYPING,
      PresenceState.THINKING,
      PresenceState.WAITING,
      PresenceState.STREAMING,
      PresenceState.READY,
    ],
  },
  {
    name: "generic-chat",
    run: runChatScenario,
    states: [
      PresenceState.USER_TYPING,
      PresenceState.THINKING,
      PresenceState.THINKING,
      PresenceState.WAITING,
      PresenceState.STREAMING,
      PresenceState.READY,
    ],
  },
]);

function validateScenario(scenario, result) {
  const { entries, summary } = result;
  const states = entries.map((entry) => entry.state);

  if (result.name !== scenario.name) {
    fail(`scenario=${scenario.name} actual=${result.name}`);
  }
  if (states.length !== scenario.states.length) {
    fail(`scenario=${scenario.name} entries=${states.length} expected=${scenario.states.length}`);
  }
  for (let index = 0; index < scenario.states.length; index += 1) {
    if (states[index] !== scenario.states[index]) {
      fail(`scenario=${scenario.name} stateIndex=${index} state=${states[index]} expected=${scenario.states[index]}`);
    }
  }

  const firstOutputIndex = entries.findIndex((entry) => (
    entry.event === PresenceEvent.TOKEN || entry.event === PresenceEvent.SPEECH_START
  ));
  if (firstOutputIndex <= 0) {
    fail(`scenario=${scenario.name} firstOutputIndex=${firstOutputIndex}`);
  }

  const beforeOutputStates = new Set(entries.slice(0, firstOutputIndex).map((entry) => entry.state));
  for (const state of [PresenceState.THINKING, PresenceState.WAITING]) {
    if (!beforeOutputStates.has(state)) {
      fail(`scenario=${scenario.name} beforeOutputMissing=${state}`);
    }
  }

  if (summary.entryCount !== entries.length) {
    fail(`scenario=${scenario.name} summaryEntries=${summary.entryCount} expected=${entries.length}`);
  }
  if (summary.firstOutputEvent !== PresenceEvent.TOKEN) {
    fail(`scenario=${scenario.name} firstOutput=${summary.firstOutputEvent}`);
  }
  if (!Number.isFinite(summary.firstOutputMs) || summary.firstOutputMs <= 0) {
    fail(`scenario=${scenario.name} firstOutputMs=${summary.firstOutputMs}`);
  }
  if (!Number.isFinite(summary.presenceBeforeOutputMs) || summary.presenceBeforeOutputMs <= 0) {
    fail(`scenario=${scenario.name} leadMs=${summary.presenceBeforeOutputMs}`);
  }
  if (summary.finalState !== PresenceState.READY) {
    fail(`scenario=${scenario.name} finalState=${summary.finalState}`);
  }
  if (!summary.hasOutput) {
    fail(`scenario=${scenario.name} hasOutput=false`);
  }
  if (!summary.complete) {
    fail(`scenario=${scenario.name} complete=false`);
  }
}

let eventsPerIteration = 0;
for (const scenario of scenarios) {
  const result = scenario.run(0);
  validateScenario(scenario, result);
  eventsPerIteration += result.entries.length;
}

let totalEvents = 0;
let completeSummaries = 0;
let outputSummaries = 0;
let firstOutputTotalMs = 0;
let leadTotalMs = 0;

const start = performance.now();

for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
  for (const scenario of scenarios) {
    const result = scenario.run(iteration + 1);
    totalEvents += result.entries.length;

    if (result.summary.complete) completeSummaries += 1;
    if (result.summary.hasOutput) outputSummaries += 1;
    firstOutputTotalMs += result.summary.firstOutputMs || 0;
    leadTotalMs += result.summary.presenceBeforeOutputMs || 0;
  }
}

const elapsedMs = performance.now() - start;
const scenarioPasses = ITERATIONS * scenarios.length;

if (totalEvents !== eventsPerIteration * ITERATIONS) {
  fail(`events=${totalEvents} expected=${eventsPerIteration * ITERATIONS}`);
}
if (completeSummaries !== scenarioPasses) {
  fail(`complete=${completeSummaries} expected=${scenarioPasses}`);
}
if (outputSummaries !== scenarioPasses) {
  fail(`hasOutput=${outputSummaries} expected=${scenarioPasses}`);
}
if (firstOutputTotalMs <= 0 || leadTotalMs <= 0) {
  fail(`firstOutputTotalMs=${firstOutputTotalMs} leadTotalMs=${leadTotalMs}`);
}

const avgMs = elapsedMs / scenarioPasses;
const eventAvgMs = elapsedMs / totalEvents;
const result = avgMs <= BUDGET_MS ? "pass" : "fail";
const summary = [
  "core-runtime",
  `iterations=${ITERATIONS}`,
  `scenarios=${scenarios.length}`,
  "adapters=vercel-ai-sdk,generic-chat",
  `events=${totalEvents}`,
  "summary=complete",
  "beforeOutput=thinking,waiting",
  "firstOutput=token",
  "finalState=ready",
  "hasOutput=true",
  "complete=true",
  `avgMs=${avgMs.toFixed(4)}`,
  `budgetMs=${BUDGET_MS}`,
  `eventAvgMs=${eventAvgMs.toFixed(4)}`,
  `result=${result}`,
].join(" ");

if (result === "pass") {
  console.log(summary);
} else {
  console.error(summary);
  process.exit(1);
}
