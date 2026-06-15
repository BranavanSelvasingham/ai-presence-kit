import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  PresenceEvent,
  createPresenceRuntime,
  createPresenceTrace,
  presenceControlInputsForSnapshot,
  summarizePresenceTrace,
} = require("../packages/core/src/presence-core.js");
const { createAssistantLifecycleAdapter } = require("../packages/adapters/src/runtime-adapter.js");

// Published package shape:
// import {
//   PresenceEvent,
//   createPresenceRuntime,
//   createPresenceTrace,
//   presenceControlInputsForSnapshot,
//   summarizePresenceTrace,
// } from "@ai-presence/core";
// import { createAssistantLifecycleAdapter } from "@ai-presence/adapters";

const threadId = "thread_presence_1";
const runId = "run_presence_1";
const assistantMessageId = "msg_presence_1";
const draft = "Draft a before-output adoption note.";
let nowMs = 0;
const presence = createPresenceRuntime({ now: () => nowMs });
const trace = createPresenceTrace({ limit: 24 });
const detachTrace = trace.attach(presence, { includeInitial: false });
const assistantLifecycle = createAssistantLifecycleAdapter(presence);
const frames = [];

const appState = {
  threadId,
  runId: null,
  assistantMessageId: null,
  assistantText: "",
  lifecycle: "idle",
};

function formatMs(value) {
  return Number.isFinite(Number(value)) ? `${Math.round(Number(value))}ms` : "none";
}

function assistantLifecycleSurface(snapshot, controlInputs, summary, state) {
  const assistantTextEmpty = state.assistantText.length === 0;
  const beforeOutput = controlInputs.latencyPhase === "before-output"
    && assistantTextEmpty
    && !summary.hasOutput;

  return Object.freeze({
    surface: "assistant-lifecycle",
    attributes: Object.freeze({
      "data-surface": "assistant-lifecycle",
      "data-thread-id": state.threadId,
      "data-run-id": state.runId || "none",
      "data-message-id": state.assistantMessageId || "none",
      "data-lifecycle": state.lifecycle,
      "data-presence-state": snapshot.state,
      "data-presence-phase": controlInputs.latencyPhase,
      "data-presence-attention": controlInputs.attentionTarget,
      "data-presence-event": snapshot.event,
      "data-assistant-output-empty": String(assistantTextEmpty),
      "data-presence-before-output": String(beforeOutput),
      "data-stream-open-ms": formatMs(summary.streamOpenMs),
      "data-first-output-ms": formatMs(summary.firstOutputMs),
      "data-lead-ms": formatMs(summary.presenceBeforeOutputMs),
    }),
  });
}

function captureFrame(atMs, snapshot) {
  const controlInputs = presenceControlInputsForSnapshot(snapshot, {
    trace,
    now: atMs,
  });
  const summary = summarizePresenceTrace(trace);
  const surface = assistantLifecycleSurface(snapshot, controlInputs, summary, appState);

  frames.push({
    atMs,
    event: snapshot.event,
    state: snapshot.state,
    phase: controlInputs.latencyPhase,
    lifecycle: appState.lifecycle,
    surface,
  });
}

function sendAt(atMs, event, patch = {}) {
  nowMs = atMs;
  Object.assign(appState, patch);
  captureFrame(atMs, assistantLifecycle.handleEvent(event));
}

sendAt(0, { type: "composer-input", threadId, text: draft }, {
  lifecycle: "composing",
});
sendAt(140, { type: "composer-pause", threadId, text: draft, completion: 0.58 }, {
  lifecycle: "composing",
});
sendAt(260, { type: "run-created", threadId, runId, userText: draft }, {
  runId,
  lifecycle: "run-created",
});
sendAt(520, { type: "message-created", threadId, runId, messageId: assistantMessageId, role: "assistant" }, {
  assistantMessageId,
  assistantText: "",
  lifecycle: "assistant-message-open",
});
sendAt(900, {
  type: "text-delta",
  threadId,
  runId,
  messageId: assistantMessageId,
  delta: "Show the open run before text.",
}, {
  assistantText: "Show the open run before text.",
  lifecycle: "assistant-text-delta",
});
sendAt(1240, { type: "run-completed", threadId, runId, messageId: assistantMessageId }, {
  lifecycle: "run-completed",
});

detachTrace();

const entries = trace.getEntries();
const summary = summarizePresenceTrace(trace);
const firstOutputMs = Number(summary.firstOutputMs);
const beforeOutputFrame = frames.find((frame) => {
  const attributes = frame.surface.attributes;

  return frame.atMs < firstOutputMs
    && attributes["data-surface"] === "assistant-lifecycle"
    && attributes["data-run-id"] === runId
    && attributes["data-message-id"] === assistantMessageId
    && attributes["data-presence-state"] === "waiting"
    && attributes["data-presence-phase"] === "before-output"
    && attributes["data-presence-attention"] === "response"
    && attributes["data-presence-event"] === "stream-open"
    && attributes["data-assistant-output-empty"] === "true"
    && attributes["data-presence-before-output"] === "true";
});

if (
  summary.firstOutputEvent !== PresenceEvent.TOKEN
  || summary.presenceBeforeOutputMs <= 0
  || summary.streamOpenMs !== 520
  || summary.firstOutputMs !== 900
  || summary.finalState !== "ready"
  || !summary.hasOutput
  || !summary.complete
  || !beforeOutputFrame
) {
  throw new Error("Assistant lifecycle did not produce before-output adoption evidence.");
}

console.log([
  "assistant-lifecycle:summary",
  "surface=assistant-lifecycle",
  `statePath=${entries.map((entry) => entry.state).join(">")}`,
  `eventPath=${entries.map((entry) => entry.event).join(">")}`,
  `frameworkEventPath=${frames.map((frame) => frame.lifecycle).join(">")}`,
  `phasePath=${frames.map((frame) => frame.phase).join(">")}`,
  "beforeOutput=true",
  `threadId=${beforeOutputFrame.surface.attributes["data-thread-id"]}`,
  `runId=${beforeOutputFrame.surface.attributes["data-run-id"]}`,
  `messageId=${beforeOutputFrame.surface.attributes["data-message-id"]}`,
  `surfaceState=${beforeOutputFrame.surface.attributes["data-presence-state"]}`,
  `surfacePhase=${beforeOutputFrame.surface.attributes["data-presence-phase"]}`,
  `surfaceEvent=${beforeOutputFrame.surface.attributes["data-presence-event"]}`,
  `assistantOutputEmpty=${beforeOutputFrame.surface.attributes["data-assistant-output-empty"]}`,
  `streamOpenMs=${formatMs(summary.streamOpenMs)}`,
  `firstOutputMs=${formatMs(summary.firstOutputMs)}`,
  `leadMs=${formatMs(summary.presenceBeforeOutputMs)}`,
  `presenceBeforeOutputMs=${formatMs(summary.presenceBeforeOutputMs)}`,
  `finalState=${summary.finalState || "none"}`,
  `hasOutput=${summary.hasOutput}`,
  `complete=${summary.complete}`,
  `interrupted=${summary.interrupted}`,
].join(" "));
