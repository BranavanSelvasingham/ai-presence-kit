import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  PresenceEvent,
  createPresenceRuntime,
  createPresenceTrace,
  presenceControlInputsForSnapshot,
  summarizePresenceTrace,
} = require("../packages/core/src/presence-core.js");
const { createChatEventAdapter } = require("../packages/adapters/src/runtime-adapter.js");

// Published package shape:
// import {
//   PresenceEvent,
//   createPresenceRuntime,
//   createPresenceTrace,
//   presenceControlInputsForSnapshot,
//   summarizePresenceTrace,
// } from "@ai-presence/core";
// import { createChatEventAdapter } from "@ai-presence/adapters";

let nowMs = 0;
const presence = createPresenceRuntime({ now: () => nowMs });
const trace = createPresenceTrace({ limit: 16 });
const detachTrace = trace.attach(presence, { includeInitial: false });
const chatPresence = createChatEventAdapter(presence);
const timeline = [];

function sendAt(atMs, event) {
  nowMs = atMs;
  const snapshot = chatPresence.handleEvent(event);
  const controlInputs = presenceControlInputsForSnapshot(snapshot, {
    trace,
    now: atMs,
  });

  timeline.push({
    event: snapshot.event,
    state: snapshot.state,
    phase: controlInputs.latencyPhase,
    atMs,
  });
}

sendAt(0, { type: "input", text: "What should I build next?" });
sendAt(140, { type: "pause", text: "What should I build next?", completion: 0.42 });
sendAt(260, { type: "submit", text: "What should I build next?" });
sendAt(520, { type: "stream-open" });
sendAt(900, { type: "token", text: "Start with a narrow adoption proof." });
sendAt(1240, { type: "done" });

detachTrace();

const entries = trace.getEntries();
const summary = summarizePresenceTrace(trace);
const firstOutputMs = Number(summary.firstOutputMs);
const beforeOutputStates = entries
  .filter((entry) => Number(entry.elapsedMs) < firstOutputMs)
  .map((entry) => entry.state);

function formatMs(value) {
  return Number.isFinite(Number(value)) ? `${Math.round(Number(value))}ms` : "none";
}

if (
  summary.firstOutputEvent !== PresenceEvent.TOKEN
  || summary.presenceBeforeOutputMs <= 0
  || summary.finalState !== "ready"
  || !summary.hasOutput
  || !summary.complete
) {
  throw new Error("Quickstart trace did not produce completed before-output evidence.");
}

console.log([
  "quickstart:summary",
  `statePath=${entries.map((entry) => entry.state).join(">")}`,
  `eventPath=${entries.map((entry) => entry.event).join(">")}`,
  `beforeOutputStates=${beforeOutputStates.join(">")}`,
  `phasePath=${timeline.map((entry) => entry.phase).join(">")}`,
  `streamOpenMs=${formatMs(summary.streamOpenMs)}`,
  `firstOutputMs=${formatMs(summary.firstOutputMs)}`,
  `leadMs=${formatMs(summary.presenceBeforeOutputMs)}`,
  `finalState=${summary.finalState || "none"}`,
  `hasOutput=${summary.hasOutput}`,
  `complete=${summary.complete}`,
  `interrupted=${summary.interrupted}`,
].join(" "));
