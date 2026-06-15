import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  PresenceEvent,
  createPresenceRuntime,
  createPresenceTrace,
  presenceControlInputsForSnapshot,
  summarizePresenceTrace,
} = require("../packages/core/src/presence-core.js");
const { createVercelAISDKAdapter } = require("../packages/adapters/src/runtime-adapter.js");

// Published package shape:
// import {
//   PresenceEvent,
//   createPresenceRuntime,
//   createPresenceTrace,
//   presenceControlInputsForSnapshot,
//   summarizePresenceTrace,
// } from "@ai-presence/core";
// import { createVercelAISDKAdapter } from "@ai-presence/adapters";

const draft = "Write a concise launch note for before-output presence.";
let nowMs = 0;
const presence = createPresenceRuntime({ now: () => nowMs });
const trace = createPresenceTrace({ limit: 24 });
const detachTrace = trace.attach(presence, { includeInitial: false });
const aiChat = createVercelAISDKAdapter(presence);
const frames = [];

const appState = {
  draft,
  assistantText: "",
  chatStatus: "idle",
};

function formatMs(value) {
  return Number.isFinite(Number(value)) ? `${Math.round(Number(value))}ms` : "none";
}

function timelineItemsForTrace(traceEntries, controlInputs) {
  return traceEntries.map((entry) => [
    entry.event,
    entry.state,
    entry.event === controlInputs.transitionEvent ? controlInputs.latencyPhase : "past",
  ].join(":"));
}

function composerLaneForPresence(snapshot, controlInputs, summary, state) {
  const assistantTextEmpty = state.assistantText.length === 0;
  const beforeOutput = controlInputs.latencyPhase === "before-output"
    && assistantTextEmpty
    && !summary.hasOutput;
  const locked = controlInputs.latencyPhase === "before-output" || controlInputs.latencyPhase === "output";
  const progressStep = beforeOutput
    ? snapshot.event
    : summary.hasOutput
      ? "first-output"
      : snapshot.state;
  const traceEntries = trace.getEntries();

  return Object.freeze({
    renderer: "composer-lane",
    statusBar: Object.freeze({
      text: beforeOutput ? "waiting-before-output" : snapshot.state,
      attributes: Object.freeze({
        "data-renderer": "composer-lane",
        "data-presence-state": snapshot.state,
        "data-presence-phase": controlInputs.latencyPhase,
        "data-presence-attention": controlInputs.attentionTarget,
        "data-presence-event": snapshot.event,
        "data-presence-before-output": String(beforeOutput),
      }),
    }),
    messageComposer: Object.freeze({
      locked,
      attributes: Object.freeze({
        "data-composer-lock": String(locked),
        "data-composer-draft-present": String(state.draft.length > 0),
        "data-assistant-text-empty": String(assistantTextEmpty),
      }),
    }),
    progressLane: Object.freeze({
      step: progressStep,
      attributes: Object.freeze({
        "data-progress-step": progressStep,
        "data-stream-open-ms": formatMs(summary.streamOpenMs),
        "data-first-output-ms": formatMs(summary.firstOutputMs),
        "data-lead-ms": formatMs(summary.presenceBeforeOutputMs),
      }),
    }),
    traceTimeline: Object.freeze({
      items: Object.freeze(timelineItemsForTrace(traceEntries, controlInputs)),
      attributes: Object.freeze({
        "data-trace-events": traceEntries.map((entry) => entry.event).join(" "),
        "data-trace-states": traceEntries.map((entry) => entry.state).join(" "),
        "data-trace-summary": summary.complete ? "complete" : "pending",
      }),
    }),
  });
}

function captureFrame(atMs, snapshot) {
  const controlInputs = presenceControlInputsForSnapshot(snapshot, {
    trace,
    now: atMs,
  });
  const summary = summarizePresenceTrace(trace);
  const surface = composerLaneForPresence(snapshot, controlInputs, summary, appState);

  frames.push({
    atMs,
    state: snapshot.state,
    event: snapshot.event,
    phase: controlInputs.latencyPhase,
    surface,
  });
}

function sendAt(atMs, run, patch = {}) {
  nowMs = atMs;
  Object.assign(appState, patch);
  captureFrame(atMs, run());
}

sendAt(0, () => aiChat.onInput(draft, { source: "composer" }), {
  chatStatus: "typing",
});
sendAt(140, () => presence.send(PresenceEvent.USER_PAUSE, { text: draft, completion: 0.56 }), {
  chatStatus: "typing",
});
sendAt(260, () => aiChat.update({ status: "submitted", messages: [{ role: "user", content: draft }] }), {
  chatStatus: "submitted",
});
sendAt(520, () => aiChat.update({ status: "streaming", messages: [{ role: "user", content: draft }] }), {
  chatStatus: "streaming",
});
sendAt(900, () => aiChat.update({
  status: "streaming",
  messages: [
    { role: "user", content: draft },
    { role: "assistant", content: "Lead with the pre-output posture evidence." },
  ],
}), {
  assistantText: "Lead with the pre-output posture evidence.",
  chatStatus: "streaming",
});
sendAt(1240, () => aiChat.update({
  status: "ready",
  messages: [
    { role: "user", content: draft },
    { role: "assistant", content: appState.assistantText },
  ],
}), {
  chatStatus: "ready",
});

detachTrace();

const entries = trace.getEntries();
const summary = summarizePresenceTrace(trace);
const firstOutputMs = Number(summary.firstOutputMs);
const beforeOutputFrame = frames.find((frame) => {
  const attributes = frame.surface.statusBar.attributes;

  return frame.atMs < firstOutputMs
    && attributes["data-presence-state"] === "waiting"
    && attributes["data-presence-phase"] === "before-output"
    && attributes["data-presence-attention"] === "response"
    && attributes["data-presence-event"] === "stream-open"
    && attributes["data-presence-before-output"] === "true"
    && frame.surface.messageComposer.attributes["data-assistant-text-empty"] === "true"
    && frame.surface.messageComposer.attributes["data-composer-lock"] === "true"
    && frame.surface.progressLane.attributes["data-progress-step"] === "stream-open";
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
  throw new Error("Composer lane did not produce before-output adoption evidence.");
}

console.log([
  "composer-lane:summary",
  "renderer=composer-lane",
  `statePath=${entries.map((entry) => entry.state).join(">")}`,
  `eventPath=${entries.map((entry) => entry.event).join(">")}`,
  `phasePath=${frames.map((frame) => frame.phase).join(">")}`,
  "beforeOutput=true",
  `laneState=${beforeOutputFrame.surface.statusBar.attributes["data-presence-state"]}`,
  `lanePhase=${beforeOutputFrame.surface.statusBar.attributes["data-presence-phase"]}`,
  `laneAttention=${beforeOutputFrame.surface.statusBar.attributes["data-presence-attention"]}`,
  `laneEvent=${beforeOutputFrame.surface.statusBar.attributes["data-presence-event"]}`,
  `composerLocked=${beforeOutputFrame.surface.messageComposer.attributes["data-composer-lock"]}`,
  `assistantTextEmpty=${beforeOutputFrame.surface.messageComposer.attributes["data-assistant-text-empty"]}`,
  `progressStep=${beforeOutputFrame.surface.progressLane.attributes["data-progress-step"]}`,
  `timelineEvents=${beforeOutputFrame.surface.traceTimeline.attributes["data-trace-events"].replaceAll(" ", ">")}`,
  `streamOpenMs=${formatMs(summary.streamOpenMs)}`,
  `firstOutputMs=${formatMs(summary.firstOutputMs)}`,
  `leadMs=${formatMs(summary.presenceBeforeOutputMs)}`,
  `finalState=${summary.finalState || "none"}`,
  `hasOutput=${summary.hasOutput}`,
  `complete=${summary.complete}`,
  `interrupted=${summary.interrupted}`,
].join(" "));
