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

// Primary docs checked for this no-network route:
// https://www.assistant-ui.com/docs/runtimes/custom/external-store
// https://www.assistant-ui.com/docs/runtimes/concepts/architecture
//
// Published package shape:
// import {
//   PresenceEvent,
//   createPresenceRuntime,
//   createPresenceTrace,
//   presenceControlInputsForSnapshot,
//   summarizePresenceTrace,
// } from "@ai-presence/core";
// import { createAssistantLifecycleAdapter } from "@ai-presence/adapters";

const threadId = "assistant-ui-thread-1";
const runId = "assistant-ui-run-1";
const userMessageId = "assistant-ui-user-1";
const assistantMessageId = "assistant-ui-assistant-1";
const draft = "Show the run before assistant text.";
let nowMs = 0;
const presence = createPresenceRuntime({ now: () => nowMs });
const trace = createPresenceTrace({ limit: 24 });
const detachTrace = trace.attach(presence, { includeInitial: false });
const assistantLifecycle = createAssistantLifecycleAdapter(presence);
const frames = [];

const externalStoreState = {
  threadId,
  runId: null,
  isRunning: false,
  messages: [],
  assistantText: "",
  assistantMessageStatusType: "none",
  lifecycle: "idle",
};

function formatMs(value) {
  return Number.isFinite(Number(value)) ? `${Math.round(Number(value))}ms` : "none";
}

function textFromAssistantMessage(message) {
  const part = Array.isArray(message?.content) ? message.content[0] : null;
  return part?.type === "text" && typeof part.text === "string" ? part.text : "";
}

function assistantUiExternalStoreEventToAssistantLifecycle(event = {}) {
  const detail = {
    framework: "assistant-ui",
    route: "ExternalStoreRuntime",
    assistantUiEvent: event.type,
    threadId: event.threadId,
    runId: event.runId,
    messageId: event.messageId,
  };

  switch (event.type) {
    case "onNew":
      return {
        type: "run-created",
        ...detail,
        userMessageId: event.userMessageId,
        text: event.text,
      };
    case "isRunning:true":
      return {
        type: "running",
        ...detail,
        isRunning: true,
      };
    case "assistant-message:running-empty":
      return {
        type: "message-created",
        ...detail,
        role: "assistant",
        status: { type: "running" },
        assistantText: "",
      };
    case "assistant-message:running-delta":
      return {
        type: "text-delta",
        ...detail,
        role: "assistant",
        status: { type: "running" },
        delta: event.delta,
        text: event.delta,
        message: event.message,
      };
    case "assistant-message:complete":
      return {
        type: "complete",
        ...detail,
        isRunning: false,
        role: "assistant",
        status: { type: "complete" },
        message: event.message,
      };
    default:
      return {
        type: "error",
        ...detail,
        message: `Unknown assistant-ui ExternalStoreRuntime event: ${event.type}`,
      };
  }
}

function assistantUiExternalStoreSurface(snapshot, controlInputs, summary, state) {
  const assistantTextEmpty = state.assistantText.length === 0;
  const beforeOutput = controlInputs.latencyPhase === "before-output"
    && state.isRunning
    && state.assistantMessageStatusType === "running"
    && assistantTextEmpty
    && !summary.hasOutput;

  return Object.freeze({
    surface: "assistant-ui-external-store",
    attributes: Object.freeze({
      "data-surface": "assistant-ui-external-store",
      "data-framework": "assistant-ui",
      "data-route": "ExternalStoreRuntime",
      "data-thread-id": state.threadId,
      "data-run-id": state.runId || "none",
      "data-message-id": assistantMessageId,
      "data-lifecycle": state.lifecycle,
      "data-is-running": String(state.isRunning),
      "data-assistant-message-status": state.assistantMessageStatusType,
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

function captureFrame(atMs, frameworkEvent, snapshot) {
  const controlInputs = presenceControlInputsForSnapshot(snapshot, {
    trace,
    now: atMs,
  });
  const summary = summarizePresenceTrace(trace);
  const surface = assistantUiExternalStoreSurface(snapshot, controlInputs, summary, externalStoreState);

  frames.push({
    atMs,
    frameworkEvent,
    frameworkStatus: externalStoreState.assistantMessageStatusType,
    event: snapshot.event,
    state: snapshot.state,
    phase: controlInputs.latencyPhase,
    lifecycle: externalStoreState.lifecycle,
    surface,
  });
}

function sendAssistantUiEventAt(atMs, event, patch = {}) {
  nowMs = atMs;
  Object.assign(externalStoreState, patch);
  const lifecycleEvent = assistantUiExternalStoreEventToAssistantLifecycle(event);
  captureFrame(atMs, event.type, assistantLifecycle.handleEvent(lifecycleEvent));
}

sendAssistantUiEventAt(0, {
  type: "onNew",
  threadId,
  runId,
  userMessageId,
  text: draft,
}, {
  runId,
  lifecycle: "onNew",
  messages: [{ id: userMessageId, role: "user", content: [{ type: "text", text: draft }] }],
});

sendAssistantUiEventAt(260, {
  type: "isRunning:true",
  threadId,
  runId,
}, {
  isRunning: true,
  lifecycle: "isRunning:true",
});

const emptyAssistantMessage = {
  id: assistantMessageId,
  role: "assistant",
  content: [{ type: "text", text: "" }],
  status: { type: "running" },
};
sendAssistantUiEventAt(520, {
  type: "assistant-message:running-empty",
  threadId,
  runId,
  messageId: assistantMessageId,
  message: emptyAssistantMessage,
}, {
  assistantMessageStatusType: "running",
  assistantText: "",
  lifecycle: "assistant-message:running-empty",
  messages: [...externalStoreState.messages, emptyAssistantMessage],
});

const streamedAssistantMessage = {
  ...emptyAssistantMessage,
  content: [{ type: "text", text: "Render presence before output." }],
};
sendAssistantUiEventAt(900, {
  type: "assistant-message:running-delta",
  threadId,
  runId,
  messageId: assistantMessageId,
  delta: "Render presence before output.",
  message: streamedAssistantMessage,
}, {
  assistantText: textFromAssistantMessage(streamedAssistantMessage),
  lifecycle: "assistant-message:running-delta",
  messages: externalStoreState.messages.map((message) => (
    message.id === assistantMessageId ? streamedAssistantMessage : message
  )),
});

const completedAssistantMessage = {
  ...streamedAssistantMessage,
  status: { type: "complete" },
};
sendAssistantUiEventAt(1240, {
  type: "assistant-message:complete",
  threadId,
  runId,
  messageId: assistantMessageId,
  message: completedAssistantMessage,
}, {
  isRunning: false,
  assistantMessageStatusType: "complete",
  lifecycle: "assistant-message:complete",
  messages: externalStoreState.messages.map((message) => (
    message.id === assistantMessageId ? completedAssistantMessage : message
  )),
});

detachTrace();

const entries = trace.getEntries();
const summary = summarizePresenceTrace(trace);
const firstOutputMs = Number(summary.firstOutputMs);
const beforeOutputFrame = frames.find((frame) => {
  const attributes = frame.surface.attributes;

  return frame.atMs < firstOutputMs
    && attributes["data-framework"] === "assistant-ui"
    && attributes["data-route"] === "ExternalStoreRuntime"
    && attributes["data-is-running"] === "true"
    && attributes["data-assistant-message-status"] === "running"
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
  throw new Error("assistant-ui ExternalStoreRuntime proof did not produce before-output evidence.");
}

console.log([
  "assistant-ui-external-store:summary",
  "surface=assistant-ui-external-store",
  "framework=assistant-ui",
  "route=ExternalStoreRuntime",
  `statePath=${entries.map((entry) => entry.state).join(">")}`,
  `eventPath=${entries.map((entry) => entry.event).join(">")}`,
  `frameworkEventPath=${frames.map((frame) => frame.frameworkEvent).join(">")}`,
  `frameworkStatusPath=${frames.map((frame) => frame.frameworkStatus).join(">")}`,
  `phasePath=${frames.map((frame) => frame.phase).join(">")}`,
  "beforeOutput=true",
  `isRunning=${beforeOutputFrame.surface.attributes["data-is-running"]}`,
  `messageStatus=${beforeOutputFrame.surface.attributes["data-assistant-message-status"]}`,
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
