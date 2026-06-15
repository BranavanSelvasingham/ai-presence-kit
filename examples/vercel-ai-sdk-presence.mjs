import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  PresenceEvent,
  PresenceState,
  createPresenceRuntime,
  createPresenceTrace,
  presenceControlInputsForSnapshot,
  summarizePresenceTrace,
} = require("../packages/core/src/presence-core.js");
const { createVercelAISDKAdapter } = require("../packages/adapters/src/runtime-adapter.js");

// Primary docs checked for this no-network route:
// https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
// https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
//
// Published package shape:
// import {
//   PresenceEvent,
//   PresenceState,
//   createPresenceRuntime,
//   createPresenceTrace,
//   presenceControlInputsForSnapshot,
//   summarizePresenceTrace,
// } from "@ai-presence/core";
// import { createVercelAISDKAdapter } from "@ai-presence/adapters";

const draft = "Show Vercel AI SDK before-output presence.";
let nowMs = 0;
const presence = createPresenceRuntime({ now: () => nowMs });
const trace = createPresenceTrace({ limit: 24 });
const detachTrace = trace.attach(presence, { includeInitial: false });
const aiChat = createVercelAISDKAdapter(presence);
const frames = [];

const chatState = {
  status: "ready",
  messages: [],
  assistantText: "",
};

function formatMs(value) {
  return Number.isFinite(Number(value)) ? `${Math.round(Number(value))}ms` : "none";
}

function textFromAIMessage(message) {
  if (!message || typeof message !== "object") return "";
  if (typeof message.content === "string") return message.content;
  if (!Array.isArray(message.parts)) return "";
  return message.parts.map((part) => (
    part?.type === "text" && typeof part.text === "string" ? part.text : ""
  )).join("");
}

function lastAssistantText(messages) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "assistant") return textFromAIMessage(message);
  }
  return "";
}

function vercelAISDKSurface(snapshot, controlInputs, summary, state) {
  const assistantText = lastAssistantText(state.messages);
  const assistantTextEmpty = assistantText.length === 0;
  const beforeOutput = state.status === "streaming"
    && controlInputs.latencyPhase === "before-output"
    && assistantTextEmpty
    && !summary.hasOutput;

  return Object.freeze({
    surface: "vercel-ai-sdk",
    attributes: Object.freeze({
      "data-framework": "vercel-ai-sdk",
      "data-status": state.status,
      "data-presence-state": snapshot.state,
      "data-presence-phase": controlInputs.latencyPhase,
      "data-presence-attention": controlInputs.attentionTarget,
      "data-presence-event": snapshot.event,
      "data-assistant-text-empty": String(assistantTextEmpty),
      "data-presence-before-output": String(beforeOutput),
      "data-stream-open-ms": formatMs(summary.streamOpenMs),
      "data-first-output-ms": beforeOutput ? "none" : formatMs(summary.firstOutputMs),
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
  const surface = vercelAISDKSurface(snapshot, controlInputs, summary, chatState);

  frames.push({
    atMs,
    frameworkEvent,
    status: chatState.status,
    state: snapshot.state,
    event: snapshot.event,
    phase: controlInputs.latencyPhase,
    surface,
  });
}

function sendAt(atMs, frameworkEvent, run, patch = {}) {
  nowMs = atMs;
  Object.assign(chatState, patch);
  captureFrame(atMs, frameworkEvent, run());
}

const userMessage = {
  id: "user-1",
  role: "user",
  parts: [{ type: "text", text: draft }],
};
const emptyAssistantMessage = {
  id: "assistant-1",
  role: "assistant",
  parts: [{ type: "text", text: "" }],
};
const textAssistantMessage = {
  ...emptyAssistantMessage,
  parts: [{ type: "text", text: "Presence appears before the first visible token." }],
};

sendAt(0, "input", () => aiChat.onInput(draft, { source: "composer" }), {
  status: "ready",
  messages: [],
  assistantText: "",
});
sendAt(140, "pause", () => presence.send(PresenceEvent.USER_PAUSE, { text: draft, completion: 0.58 }), {
  status: "ready",
});
sendAt(260, "submitted", () => aiChat.update({
  status: "submitted",
  messages: [userMessage],
}), {
  status: "submitted",
  messages: [userMessage],
});
sendAt(520, "streaming:empty", () => aiChat.update({
  status: "streaming",
  messages: [userMessage, emptyAssistantMessage],
}), {
  status: "streaming",
  messages: [userMessage, emptyAssistantMessage],
  assistantText: "",
});
sendAt(900, "streaming:text", () => aiChat.update({
  status: "streaming",
  messages: [userMessage, textAssistantMessage],
}), {
  status: "streaming",
  messages: [userMessage, textAssistantMessage],
  assistantText: textFromAIMessage(textAssistantMessage),
});
sendAt(1240, "ready", () => aiChat.update({
  status: "ready",
  messages: [userMessage, textAssistantMessage],
}), {
  status: "ready",
  messages: [userMessage, textAssistantMessage],
});

detachTrace();

function stateAfterError() {
  const errorRuntime = createPresenceRuntime();
  const errorAdapter = createVercelAISDKAdapter(errorRuntime);
  errorAdapter.update({ status: "submitted", messages: [userMessage] });
  return errorAdapter.update({ status: "error", messages: [userMessage] }).state;
}

function stateAfterAbort() {
  const abortRuntime = createPresenceRuntime();
  const abortAdapter = createVercelAISDKAdapter(abortRuntime);
  abortAdapter.update({ status: "submitted", messages: [userMessage] });
  abortAdapter.update({ status: "streaming", messages: [userMessage, emptyAssistantMessage] });
  return abortAdapter.onFinish({ isAbort: true, finishReason: "stop" }).state;
}

const entries = trace.getEntries();
const summary = summarizePresenceTrace(trace);
const firstOutputMs = Number(summary.firstOutputMs);
const beforeOutputFrame = frames.find((frame) => {
  const attributes = frame.surface.attributes;

  return frame.atMs < firstOutputMs
    && frame.status === "streaming"
    && frame.surface.surface === "vercel-ai-sdk"
    && attributes["data-framework"] === "vercel-ai-sdk"
    && attributes["data-status"] === "streaming"
    && attributes["data-presence-state"] === "waiting"
    && attributes["data-presence-phase"] === "before-output"
    && attributes["data-presence-attention"] === "response"
    && attributes["data-presence-event"] === "stream-open"
    && attributes["data-assistant-text-empty"] === "true"
    && attributes["data-presence-before-output"] === "true"
    && attributes["data-stream-open-ms"] === "520ms"
    && attributes["data-first-output-ms"] === "none";
});

const statePath = entries.map((entry) => entry.state).join(">");
const eventPath = entries.map((entry) => entry.event).join(">");
const statusPath = frames
  .filter((frame) => ["submitted", "streaming:empty", "streaming:text", "ready"].includes(frame.frameworkEvent))
  .map((frame) => frame.status)
  .join(">");
const frameworkEventPath = frames.map((frame) => frame.frameworkEvent).join(">");
const phasePath = frames.map((frame) => frame.phase).join(">");
const errorState = stateAfterError();
const abortState = stateAfterAbort();

if (
  statePath !== "user-typing>thinking>thinking>waiting>streaming>ready"
  || eventPath !== "user-input>user-pause>submit>stream-open>token>response-complete"
  || statusPath !== "submitted>streaming>streaming>ready"
  || frameworkEventPath !== "input>pause>submitted>streaming:empty>streaming:text>ready"
  || phasePath !== "input>before-output>before-output>before-output>output>recovery"
  || summary.firstOutputEvent !== PresenceEvent.TOKEN
  || summary.streamOpenMs !== 520
  || summary.firstOutputMs !== 900
  || summary.presenceBeforeOutputMs !== 900
  || summary.finalState !== PresenceState.READY
  || !summary.hasOutput
  || !summary.complete
  || summary.interrupted
  || !beforeOutputFrame
  || errorState !== PresenceState.ERROR
  || abortState !== PresenceState.INTERRUPTED
) {
  throw new Error("Vercel AI SDK proof did not produce before-output adoption evidence.");
}

console.log([
  "vercel-ai-sdk:summary",
  "framework=vercel-ai-sdk",
  "beforeOutput=true",
  `statePath=${statePath}`,
  `eventPath=${eventPath}`,
  `statusPath=${statusPath}`,
  `frameworkEventPath=${frameworkEventPath}`,
  `phasePath=${phasePath}`,
  `streamOpenStatus=${beforeOutputFrame.status}`,
  `surfaceState=${beforeOutputFrame.surface.attributes["data-presence-state"]}`,
  `surfacePhase=${beforeOutputFrame.surface.attributes["data-presence-phase"]}`,
  `surfaceEvent=${beforeOutputFrame.surface.attributes["data-presence-event"]}`,
  `assistantTextEmpty=${beforeOutputFrame.surface.attributes["data-assistant-text-empty"]}`,
  `surfaceFirstOutputMs=${beforeOutputFrame.surface.attributes["data-first-output-ms"]}`,
  `streamOpenMs=${formatMs(summary.streamOpenMs)}`,
  `firstOutputMs=${formatMs(summary.firstOutputMs)}`,
  `leadMs=${formatMs(summary.presenceBeforeOutputMs)}`,
  `presenceBeforeOutputMs=${formatMs(summary.presenceBeforeOutputMs)}`,
  `finalState=${summary.finalState || "none"}`,
  `hasOutput=${summary.hasOutput}`,
  `complete=${summary.complete}`,
  `interrupted=${summary.interrupted}`,
  `abortState=${abortState}`,
  `errorState=${errorState}`,
].join(" "));
