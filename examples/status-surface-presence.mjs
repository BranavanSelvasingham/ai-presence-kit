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
const surfaces = [];

function statusSurfaceForPresence(snapshot, controlInputs, summary) {
  const beforeOutput = controlInputs.latencyPhase === "before-output" && !summary.hasOutput;

  return Object.freeze({
    renderer: "status-surface",
    attributes: Object.freeze({
      "data-renderer": "status-surface",
      "data-presence-state": snapshot.state,
      "data-presence-phase": controlInputs.latencyPhase,
      "data-presence-attention": controlInputs.attentionTarget,
      "data-presence-event": snapshot.event,
      "data-presence-before-output": String(beforeOutput),
    }),
  });
}

function sendAt(atMs, event) {
  nowMs = atMs;
  const snapshot = chatPresence.handleEvent(event);
  const controlInputs = presenceControlInputsForSnapshot(snapshot, {
    trace,
    now: atMs,
  });
  const summary = summarizePresenceTrace(trace);
  const surface = statusSurfaceForPresence(snapshot, controlInputs, summary);

  surfaces.push({
    atMs,
    state: snapshot.state,
    event: snapshot.event,
    phase: controlInputs.latencyPhase,
    surface,
  });
}

sendAt(0, { type: "input", text: "What should my status surface show?" });
sendAt(140, { type: "pause", text: "What should my status surface show?", completion: 0.42 });
sendAt(260, { type: "submit", text: "What should my status surface show?" });
sendAt(520, { type: "stream-open" });
sendAt(900, { type: "token", text: "Show the waiting posture before text." });
sendAt(1240, { type: "done" });

detachTrace();

const entries = trace.getEntries();
const summary = summarizePresenceTrace(trace);
const firstOutputMs = Number(summary.firstOutputMs);
const beforeOutputSurface = surfaces.find((entry) => {
  const attributes = entry.surface.attributes;

  return entry.atMs < firstOutputMs
    && attributes["data-presence-state"] === "waiting"
    && attributes["data-presence-phase"] === "before-output"
    && attributes["data-presence-attention"] === "response"
    && attributes["data-presence-event"] === "stream-open"
    && attributes["data-presence-before-output"] === "true";
});

function formatMs(value) {
  return Number.isFinite(Number(value)) ? `${Math.round(Number(value))}ms` : "none";
}

if (
  summary.firstOutputEvent !== PresenceEvent.TOKEN
  || summary.presenceBeforeOutputMs <= 0
  || summary.finalState !== "ready"
  || !summary.hasOutput
  || !summary.complete
  || !beforeOutputSurface
) {
  throw new Error("Status surface did not produce before-output renderer evidence.");
}

console.log([
  "status-surface:summary",
  "renderer=status-surface",
  `statePath=${entries.map((entry) => entry.state).join(">")}`,
  `eventPath=${entries.map((entry) => entry.event).join(">")}`,
  `phasePath=${surfaces.map((entry) => entry.phase).join(">")}`,
  "beforeOutput=true",
  `surfaceState=${beforeOutputSurface.surface.attributes["data-presence-state"]}`,
  `surfacePhase=${beforeOutputSurface.surface.attributes["data-presence-phase"]}`,
  `surfaceAttention=${beforeOutputSurface.surface.attributes["data-presence-attention"]}`,
  `surfaceEvent=${beforeOutputSurface.surface.attributes["data-presence-event"]}`,
  `firstOutputMs=${formatMs(summary.firstOutputMs)}`,
  `leadMs=${formatMs(summary.presenceBeforeOutputMs)}`,
  `finalState=${summary.finalState || "none"}`,
  `hasOutput=${summary.hasOutput}`,
  `complete=${summary.complete}`,
  `interrupted=${summary.interrupted}`,
].join(" "));
