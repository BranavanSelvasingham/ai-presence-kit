import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const version = process.argv[2] || process.env.npm_package_version;

const packages = [
  "@ai-presence/core",
  "@ai-presence/face",
  "@ai-presence/adapters",
  "@ai-presence/react",
];

if (!version) {
  console.error("Usage: npm run release:consumer-smoke -- <published-version>");
  process.exit(1);
}

const tempDir = mkdtempSync(join(tmpdir(), "ai-presence-consumer-smoke-"));
const installTargets = [
  ...packages.map((packageName) => `${packageName}@${version}`),
  "react@18.3.1",
  "react-dom@18.3.1",
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || tempDir,
    encoding: options.encoding || "utf8",
    shell: process.platform === "win32",
    stdio: options.stdio || "inherit",
  });

  if (result.status !== 0) {
    console.error(`Command failed: ${command} ${args.join(" ")}`);
    console.error(`Consumer smoke temp dir retained: ${tempDir}`);
    process.exit(result.status || 1);
  }

  return result;
}

function writeSmokeFiles() {
  writeFileSync(
    join(tempDir, "package.json"),
    JSON.stringify({ private: true, type: "module" }, null, 2),
  );

  writeFileSync(
    join(tempDir, "esm-smoke.mjs"),
    `import assert from "node:assert/strict";
import * as core from "@ai-presence/core";
import * as face from "@ai-presence/face";
import * as adapters from "@ai-presence/adapters";
import * as reactPresence from "@ai-presence/react";
import React from "react";

assert.equal(core.PresenceState.THINKING, "thinking");
assert.equal(typeof core.createPresenceRuntime, "function");
assert.equal(typeof core.createPresenceTrace, "function");
assert.equal(typeof core.presenceControlInputsForSnapshot, "function");
assert.equal(typeof core.summarizePresenceTrace, "function");

assert.equal(typeof adapters.createChatEventAdapter, "function");
assert.equal(typeof adapters.createAssistantLifecycleAdapter, "function");
assert.equal(typeof adapters.createVercelAISDKAdapter, "function");
assert.equal(typeof adapters.createOpenAIResponsesAdapter, "function");
assert.equal(typeof adapters.openAIResponsesEventToRuntimeSignal, "function");
assert.equal(typeof adapters.createOpenAIRealtimeAdapter, "function");

let nowMs = 0;
const runtime = core.createPresenceRuntime({ now: () => nowMs });
const trace = core.createPresenceTrace({ limit: 16 });
const detachTrace = trace.attach(runtime, { includeInitial: false });
const chatPresence = adapters.createChatEventAdapter(runtime);
const timeline = [];

function sendAt(atMs, event) {
  nowMs = atMs;
  const snapshot = chatPresence.handleEvent(event);
  const controlInputs = core.presenceControlInputsForSnapshot(snapshot, {
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
const summary = core.summarizePresenceTrace(trace);
const statePath = entries.map((entry) => entry.state).join(">");
const eventPath = entries.map((entry) => entry.event).join(">");
const phasePath = timeline.map((entry) => entry.phase).join(">");

assert.equal(statePath, "user-typing>thinking>thinking>waiting>streaming>ready");
assert.equal(eventPath, "user-input>user-pause>submit>stream-open>token>response-complete");
assert.equal(phasePath, "input>before-output>before-output>before-output>output>recovery");
assert.equal(summary.streamOpenMs, 520);
assert.equal(summary.firstOutputMs, 900);
assert.equal(summary.firstOutputEvent, core.PresenceEvent.TOKEN);
assert.equal(summary.presenceBeforeOutputMs, 900);
assert.equal(summary.complete, true);
assert.equal(summary.hasOutput, true);
assert.equal(summary.finalState, "ready");
assert.equal(summary.interrupted, false);

const rendered = face.renderPresenceFaceSvg(runtime.getSnapshot(), {
  history: entries,
  now: 1240,
  timeMs: 1240,
});
assert.match(rendered.svg, /<svg/);
assert.equal(rendered.attributes.decisionTrace, "complete");
assert.equal(rendered.decisionTrace.decisionCount, 6);

const bindings = reactPresence.createPresenceReactBindings(React, { runtime });
assert.equal(typeof bindings.PresenceProvider, "function");
assert.equal(typeof bindings.usePresenceFrameTime, "function");

function formatMs(value) {
  return Number.isFinite(Number(value)) ? String(Math.round(Number(value))) + "ms" : "none";
}

console.log([
  "esm consumer smoke ok",
  "statePath=" + statePath,
  "eventPath=" + eventPath,
  "firstOutputMs=" + formatMs(summary.firstOutputMs),
  "leadMs=" + formatMs(summary.presenceBeforeOutputMs),
  "finalState=" + (summary.finalState || "none"),
  "hasOutput=" + summary.hasOutput,
  "complete=" + summary.complete,
  "interrupted=" + summary.interrupted,
].join(" "));
`,
  );

  writeFileSync(
    join(tempDir, "responses-smoke.mjs"),
    `import assert from "node:assert/strict";
import {
  PresenceEvent,
  createPresenceRuntime,
  createPresenceTrace,
  summarizePresenceTrace,
} from "@ai-presence/core";
import {
  createOpenAIResponsesAdapter,
  openAIResponsesEventToRuntimeSignal,
} from "@ai-presence/adapters";

let nowMs = 0;
const presence = createPresenceRuntime({ now: () => nowMs });
const trace = createPresenceTrace({ limit: 12 });
const detachTrace = trace.attach(presence, { includeInitial: false });
const responses = createOpenAIResponsesAdapter(presence);

function sendAt(atMs, event) {
  nowMs = atMs;
  return responses.handleEvent(event);
}

assert.equal(
  openAIResponsesEventToRuntimeSignal({ type: "response.output_text.delta", delta: "Hello" }).detail.text,
  "Hello",
);

sendAt(0, { type: "response.created", response: { id: "resp_consumer_smoke" } });
sendAt(420, { type: "response.output_item.added", item: { type: "message" } });
sendAt(980, { type: "response.output_text.delta", delta: "Installed packages prove this path." });
sendAt(1260, { type: "response.completed" });

detachTrace();

const entries = trace.getEntries();
const summary = summarizePresenceTrace(trace);
const statePath = entries.map((entry) => entry.state).join(">");
const eventPath = entries.map((entry) => entry.event).join(">");

assert.equal(statePath, "thinking>waiting>streaming>ready");
assert.equal(eventPath, "submit>stream-open>token>response-complete");
assert.equal(summary.streamOpenMs, 420);
assert.equal(summary.firstOutputMs, 980);
assert.equal(summary.firstOutputEvent, PresenceEvent.TOKEN);
assert.equal(summary.presenceBeforeOutputMs, 980);
assert.equal(summary.finalState, "ready");
assert.equal(summary.hasOutput, true);
assert.equal(summary.complete, true);
assert.equal(summary.interrupted, false);

function formatMs(value) {
  return Number.isFinite(Number(value)) ? String(Math.round(Number(value))) + "ms" : "none";
}

console.log([
  "responses consumer smoke ok",
  "statePath=" + statePath,
  "eventPath=" + eventPath,
  "streamOpenMs=" + formatMs(summary.streamOpenMs),
  "firstOutputMs=" + formatMs(summary.firstOutputMs),
  "leadMs=" + formatMs(summary.presenceBeforeOutputMs),
  "finalState=" + (summary.finalState || "none"),
  "hasOutput=" + summary.hasOutput,
  "complete=" + summary.complete,
  "interrupted=" + summary.interrupted,
].join(" "));
`,
  );

  writeFileSync(
    join(tempDir, "vanilla-status-surface-smoke.mjs"),
    `import assert from "node:assert/strict";
import {
  PresenceEvent,
  createPresenceRuntime,
  createPresenceTrace,
  presenceControlInputsForSnapshot,
  summarizePresenceTrace,
} from "@ai-presence/core";
import { createChatEventAdapter } from "@ai-presence/adapters";

const draft = "Show a plain status surface before output.";
let nowMs = 0;
let assistantText = "";
const presence = createPresenceRuntime({ now: () => nowMs });
const trace = createPresenceTrace({ limit: 18 });
const detachTrace = trace.attach(presence, { includeInitial: false });
const chatPresence = createChatEventAdapter(presence);
const frames = [];

function formatMs(value) {
  return Number.isFinite(Number(value)) ? String(Math.round(Number(value))) + "ms" : "none";
}

function statusSurfaceForPresence(snapshot, controlInputs, summary, state, atMs) {
  const assistantTextEmpty = state.assistantText.length === 0;
  const beforeOutput = controlInputs.latencyPhase === "before-output"
    && assistantTextEmpty
    && !summary.hasOutput;
  const activeLeadMs = beforeOutput && Number.isFinite(Number(summary.streamOpenMs))
    ? Math.max(0, atMs - Number(summary.streamOpenMs))
    : summary.presenceBeforeOutputMs;

  return Object.freeze({
    renderer: "status-surface",
    attributes: Object.freeze({
      "data-renderer": "status-surface",
      "data-presence-state": snapshot.state,
      "data-presence-phase": controlInputs.latencyPhase,
      "data-presence-attention": controlInputs.attentionTarget,
      "data-presence-event": snapshot.event,
      "data-presence-before-output": String(beforeOutput),
      "data-assistant-text-empty": String(assistantTextEmpty),
      "data-stream-open-ms": formatMs(summary.streamOpenMs),
      "data-first-output-ms": beforeOutput ? "none" : formatMs(summary.firstOutputMs),
      "data-lead-ms": formatMs(activeLeadMs),
      "data-final-state": summary.finalState || snapshot.state,
      "data-has-output": String(summary.hasOutput),
      "data-complete": String(summary.complete),
      "data-interrupted": String(summary.interrupted),
    }),
  });
}

function captureFrame(atMs, snapshot) {
  nowMs = atMs;
  const controlInputs = presenceControlInputsForSnapshot(snapshot, { trace, now: atMs });
  const summary = summarizePresenceTrace(trace);
  const surface = statusSurfaceForPresence(snapshot, controlInputs, summary, {
    assistantText,
  }, atMs);

  frames.push({
    atMs,
    state: snapshot.state,
    event: snapshot.event,
    phase: controlInputs.latencyPhase,
    surface,
  });
}

function sendAt(atMs, event, nextAssistantText = assistantText) {
  nowMs = atMs;
  assistantText = nextAssistantText;
  captureFrame(atMs, chatPresence.handleEvent(event));
}

sendAt(0, { type: "input", text: draft });
sendAt(140, { type: "pause", text: draft, completion: 0.42 });
sendAt(260, { type: "submit", text: draft });
sendAt(520, { type: "stream-open" }, "");
captureFrame(760, presence.getSnapshot());
sendAt(900, { type: "token", text: "Plain status stayed visible before this text." }, "Plain status stayed visible before this text.");
sendAt(1240, { type: "done" }, assistantText);

detachTrace();

const entries = trace.getEntries();
const summary = summarizePresenceTrace(trace);
const firstOutputMs = Number(summary.firstOutputMs);
const beforeOutputFrame = frames.find((frame) => {
  const attributes = frame.surface.attributes;

  return frame.atMs < firstOutputMs
    && frame.surface.renderer === "status-surface"
    && attributes["data-renderer"] === "status-surface"
    && attributes["data-presence-state"] === "waiting"
    && attributes["data-presence-phase"] === "before-output"
    && attributes["data-presence-attention"] === "response"
    && attributes["data-presence-event"] === "stream-open"
    && attributes["data-presence-before-output"] === "true"
    && attributes["data-assistant-text-empty"] === "true"
    && attributes["data-stream-open-ms"] === "520ms"
    && attributes["data-first-output-ms"] === "none"
    && Number.parseInt(attributes["data-lead-ms"], 10) > 0;
});

const statePath = entries.map((entry) => entry.state).join(">");
const eventPath = entries.map((entry) => entry.event).join(">");
const phasePath = frames.map((frame) => frame.phase).join(">");

assert.equal(statePath, "user-typing>thinking>thinking>waiting>streaming>ready");
assert.equal(eventPath, "user-input>user-pause>submit>stream-open>token>response-complete");
assert.equal(phasePath, "input>before-output>before-output>before-output>before-output>output>recovery");
assert.equal(summary.firstOutputEvent, PresenceEvent.TOKEN);
assert.equal(summary.streamOpenMs, 520);
assert.equal(summary.firstOutputMs, 900);
assert.equal(summary.presenceBeforeOutputMs, 900);
assert.equal(summary.finalState, "ready");
assert.equal(summary.hasOutput, true);
assert.equal(summary.complete, true);
assert.equal(summary.interrupted, false);
assert.ok(beforeOutputFrame);

console.log([
  "vanilla status-surface consumer smoke ok",
  "renderer=status-surface",
  "beforeOutput=true",
  "statePath=" + statePath,
  "eventPath=" + eventPath,
  "phasePath=" + phasePath,
  "surfaceState=" + beforeOutputFrame.surface.attributes["data-presence-state"],
  "surfacePhase=" + beforeOutputFrame.surface.attributes["data-presence-phase"],
  "surfaceAttention=" + beforeOutputFrame.surface.attributes["data-presence-attention"],
  "surfaceEvent=" + beforeOutputFrame.surface.attributes["data-presence-event"],
  "assistantTextEmpty=" + beforeOutputFrame.surface.attributes["data-assistant-text-empty"],
  "surfaceStreamOpenMs=" + beforeOutputFrame.surface.attributes["data-stream-open-ms"],
  "surfaceFirstOutputMs=" + beforeOutputFrame.surface.attributes["data-first-output-ms"],
  "surfaceLeadMs=" + beforeOutputFrame.surface.attributes["data-lead-ms"],
  "streamOpenMs=" + formatMs(summary.streamOpenMs),
  "firstOutputMs=" + formatMs(summary.firstOutputMs),
  "leadMs=" + formatMs(summary.presenceBeforeOutputMs),
  "presenceBeforeOutputMs=" + formatMs(summary.presenceBeforeOutputMs),
  "finalState=" + (summary.finalState || "none"),
  "hasOutput=" + summary.hasOutput,
  "complete=" + summary.complete,
  "interrupted=" + summary.interrupted,
].join(" "));
`,
  );

  writeFileSync(
    join(tempDir, "vercel-ai-sdk-smoke.mjs"),
    `import {
  PresenceEvent,
  PresenceState,
  createPresenceRuntime,
  createPresenceTrace,
  presenceControlInputsForSnapshot,
  summarizePresenceTrace,
} from "@ai-presence/core";
import { createVercelAISDKAdapter } from "@ai-presence/adapters";

const draft = "Show Vercel AI SDK before-output presence from installed packages.";
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

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(label + ": expected " + expected + ", received " + actual);
  }
}

function assertOk(value, label) {
  if (!value) throw new Error(label);
}

function formatMs(value) {
  return Number.isFinite(Number(value)) ? String(Math.round(Number(value))) + "ms" : "none";
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
  id: "user-consumer-smoke",
  role: "user",
  parts: [{ type: "text", text: draft }],
};
const emptyAssistantMessage = {
  id: "assistant-consumer-smoke",
  role: "assistant",
  parts: [{ type: "text", text: "" }],
};
const textAssistantMessage = {
  ...emptyAssistantMessage,
  parts: [{ type: "text", text: "Installed packages show presence before output." }],
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

assertEqual(statePath, "user-typing>thinking>thinking>waiting>streaming>ready", "statePath");
assertEqual(eventPath, "user-input>user-pause>submit>stream-open>token>response-complete", "eventPath");
assertEqual(statusPath, "submitted>streaming>streaming>ready", "statusPath");
assertEqual(frameworkEventPath, "input>pause>submitted>streaming:empty>streaming:text>ready", "frameworkEventPath");
assertEqual(phasePath, "input>before-output>before-output>before-output>output>recovery", "phasePath");
assertEqual(summary.firstOutputEvent, PresenceEvent.TOKEN, "firstOutputEvent");
assertEqual(summary.streamOpenMs, 520, "streamOpenMs");
assertEqual(summary.firstOutputMs, 900, "firstOutputMs");
assertEqual(summary.presenceBeforeOutputMs, 900, "presenceBeforeOutputMs");
assertEqual(summary.finalState, PresenceState.READY, "finalState");
assertEqual(summary.hasOutput, true, "hasOutput");
assertEqual(summary.complete, true, "complete");
assertEqual(summary.interrupted, false, "interrupted");
assertEqual(errorState, PresenceState.ERROR, "errorState");
assertEqual(abortState, PresenceState.INTERRUPTED, "abortState");
assertOk(beforeOutputFrame, "before-output Vercel AI SDK frame missing");

console.log([
  "vercel-ai-sdk consumer smoke ok",
  "framework=vercel-ai-sdk",
  "beforeOutput=true",
  "statePath=" + statePath,
  "eventPath=" + eventPath,
  "statusPath=" + statusPath,
  "frameworkEventPath=" + frameworkEventPath,
  "phasePath=" + phasePath,
  "status=" + beforeOutputFrame.status,
  "state=" + beforeOutputFrame.surface.attributes["data-presence-state"],
  "phase=" + beforeOutputFrame.surface.attributes["data-presence-phase"],
  "surfaceEvent=" + beforeOutputFrame.surface.attributes["data-presence-event"],
  "assistantTextEmpty=" + beforeOutputFrame.surface.attributes["data-assistant-text-empty"],
  "surfaceFirstOutputMs=" + beforeOutputFrame.surface.attributes["data-first-output-ms"],
  "streamOpenMs=" + formatMs(summary.streamOpenMs),
  "firstOutputMs=" + formatMs(summary.firstOutputMs),
  "leadMs=" + formatMs(summary.presenceBeforeOutputMs),
  "presenceBeforeOutputMs=" + formatMs(summary.presenceBeforeOutputMs),
  "finalState=" + (summary.finalState || "none"),
  "hasOutput=" + summary.hasOutput,
  "complete=" + summary.complete,
  "interrupted=" + summary.interrupted,
  "abortState=" + abortState,
  "errorState=" + errorState,
].join(" "));
`,
  );

  writeFileSync(
    join(tempDir, "composer-lane-smoke.mjs"),
    `import assert from "node:assert/strict";
import {
  PresenceEvent,
  createPresenceRuntime,
  createPresenceTrace,
  presenceControlInputsForSnapshot,
  summarizePresenceTrace,
} from "@ai-presence/core";
import { createVercelAISDKAdapter } from "@ai-presence/adapters";

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
  return Number.isFinite(Number(value)) ? String(Math.round(Number(value))) + "ms" : "none";
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
    && frame.surface.renderer === "composer-lane"
    && attributes["data-renderer"] === "composer-lane"
    && attributes["data-presence-state"] === "waiting"
    && attributes["data-presence-phase"] === "before-output"
    && attributes["data-presence-attention"] === "response"
    && attributes["data-presence-event"] === "stream-open"
    && attributes["data-presence-before-output"] === "true"
    && frame.surface.messageComposer.attributes["data-assistant-text-empty"] === "true"
    && frame.surface.messageComposer.attributes["data-composer-lock"] === "true"
    && frame.surface.progressLane.attributes["data-progress-step"] === "stream-open";
});

assert.equal(entries.map((entry) => entry.state).join(">"), "user-typing>thinking>thinking>waiting>streaming>ready");
assert.equal(entries.map((entry) => entry.event).join(">"), "user-input>user-pause>submit>stream-open>token>response-complete");
assert.equal(frames.map((frame) => frame.phase).join(">"), "input>before-output>before-output>before-output>output>recovery");
assert.equal(summary.firstOutputEvent, PresenceEvent.TOKEN);
assert.equal(summary.streamOpenMs, 520);
assert.equal(summary.firstOutputMs, 900);
assert.equal(summary.presenceBeforeOutputMs, 900);
assert.equal(summary.finalState, "ready");
assert.equal(summary.hasOutput, true);
assert.equal(summary.complete, true);
assert.equal(summary.interrupted, false);
assert.ok(beforeOutputFrame);

console.log([
  "composer-lane consumer smoke ok",
  "renderer=composer-lane",
  "beforeOutput=true",
  "laneState=" + beforeOutputFrame.surface.statusBar.attributes["data-presence-state"],
  "lanePhase=" + beforeOutputFrame.surface.statusBar.attributes["data-presence-phase"],
  "composerLocked=" + beforeOutputFrame.surface.messageComposer.attributes["data-composer-lock"],
  "assistantTextEmpty=" + beforeOutputFrame.surface.messageComposer.attributes["data-assistant-text-empty"],
  "progressStep=" + beforeOutputFrame.surface.progressLane.attributes["data-progress-step"],
  "streamOpenMs=" + formatMs(summary.streamOpenMs),
  "firstOutputMs=" + formatMs(summary.firstOutputMs),
  "leadMs=" + formatMs(summary.presenceBeforeOutputMs),
  "finalState=" + (summary.finalState || "none"),
  "hasOutput=" + summary.hasOutput,
  "complete=" + summary.complete,
  "interrupted=" + summary.interrupted,
].join(" "));
`,
  );

  writeFileSync(
    join(tempDir, "assistant-lifecycle-smoke.mjs"),
    `import assert from "node:assert/strict";
import {
  PresenceEvent,
  createPresenceRuntime,
  createPresenceTrace,
  presenceControlInputsForSnapshot,
  summarizePresenceTrace,
} from "@ai-presence/core";
import {
  assistantLifecycleEventToRuntimeSignal,
  createAssistantLifecycleAdapter,
} from "@ai-presence/adapters";

const threadId = "thread_consumer_smoke";
const runId = "run_consumer_smoke";
const messageId = "msg_consumer_smoke";
let nowMs = 0;
const presence = createPresenceRuntime({ now: () => nowMs });
const trace = createPresenceTrace({ limit: 18 });
const detachTrace = trace.attach(presence, { includeInitial: false });
const assistantLifecycle = createAssistantLifecycleAdapter(presence);
const frames = [];

const surfaceState = {
  threadId,
  runId: null,
  messageId: null,
  assistantText: "",
  lifecycle: "idle",
};

function formatMs(value) {
  return Number.isFinite(Number(value)) ? String(Math.round(Number(value))) + "ms" : "none";
}

function surfaceForSnapshot(snapshot, controlInputs, summary, state) {
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
      "data-message-id": state.messageId || "none",
      "data-lifecycle": state.lifecycle,
      "data-presence-state": snapshot.state,
      "data-presence-phase": controlInputs.latencyPhase,
      "data-presence-attention": controlInputs.attentionTarget,
      "data-presence-event": snapshot.event,
      "data-assistant-output-empty": String(assistantTextEmpty),
      "data-presence-before-output": String(beforeOutput),
    }),
  });
}

function captureFrame(atMs, snapshot) {
  const controlInputs = presenceControlInputsForSnapshot(snapshot, { trace, now: atMs });
  const summary = summarizePresenceTrace(trace);
  const surface = surfaceForSnapshot(snapshot, controlInputs, summary, surfaceState);

  frames.push({
    atMs,
    state: snapshot.state,
    event: snapshot.event,
    phase: controlInputs.latencyPhase,
    lifecycle: surfaceState.lifecycle,
    surface,
  });
}

function sendAt(atMs, event, patch = {}) {
  nowMs = atMs;
  Object.assign(surfaceState, patch);
  captureFrame(atMs, assistantLifecycle.handleEvent(event));
}

assert.equal(
  assistantLifecycleEventToRuntimeSignal({ type: "text-delta", delta: "Hello" }).detail.text,
  "Hello",
);

sendAt(0, { type: "composer-input", threadId, text: "Draft a release note." }, {
  lifecycle: "composing",
});
sendAt(140, { type: "composer-pause", threadId, text: "Draft a release note.", completion: 0.5 }, {
  lifecycle: "composing",
});
sendAt(260, { type: "run-created", threadId, runId }, {
  runId,
  lifecycle: "run-created",
});
sendAt(520, { type: "message-created", threadId, runId, messageId, role: "assistant" }, {
  messageId,
  assistantText: "",
  lifecycle: "assistant-message-open",
});
sendAt(900, { type: "text-delta", threadId, runId, messageId, delta: "Installed packages prove this adapter." }, {
  assistantText: "Installed packages prove this adapter.",
  lifecycle: "assistant-text-delta",
});
sendAt(1240, { type: "run-completed", threadId, runId, messageId }, {
  lifecycle: "run-completed",
});

detachTrace();

const entries = trace.getEntries();
const summary = summarizePresenceTrace(trace);
const firstOutputMs = Number(summary.firstOutputMs);
const beforeOutputFrame = frames.find((frame) => {
  const attributes = frame.surface.attributes;

  return frame.atMs < firstOutputMs
    && frame.surface.surface === "assistant-lifecycle"
    && attributes["data-run-id"] === runId
    && attributes["data-message-id"] === messageId
    && attributes["data-presence-state"] === "waiting"
    && attributes["data-presence-phase"] === "before-output"
    && attributes["data-presence-attention"] === "response"
    && attributes["data-presence-event"] === "stream-open"
    && attributes["data-assistant-output-empty"] === "true"
    && attributes["data-presence-before-output"] === "true";
});

const statePath = entries.map((entry) => entry.state).join(">");
const eventPath = entries.map((entry) => entry.event).join(">");
const frameworkEventPath = frames.map((frame) => frame.lifecycle).join(">");
const phasePath = frames.map((frame) => frame.phase).join(">");

assert.equal(statePath, "user-typing>thinking>thinking>waiting>streaming>ready");
assert.equal(eventPath, "user-input>user-pause>submit>stream-open>token>response-complete");
assert.equal(frameworkEventPath, "composing>composing>run-created>assistant-message-open>assistant-text-delta>run-completed");
assert.equal(phasePath, "input>before-output>before-output>before-output>output>recovery");
assert.equal(summary.firstOutputEvent, PresenceEvent.TOKEN);
assert.equal(summary.streamOpenMs, 520);
assert.equal(summary.firstOutputMs, 900);
assert.equal(summary.presenceBeforeOutputMs, 900);
assert.equal(summary.finalState, "ready");
assert.equal(summary.hasOutput, true);
assert.equal(summary.complete, true);
assert.equal(summary.interrupted, false);
assert.ok(beforeOutputFrame);

console.log([
  "assistant-lifecycle consumer smoke ok",
  "surface=assistant-lifecycle",
  "beforeOutput=true",
  "statePath=" + statePath,
  "eventPath=" + eventPath,
  "frameworkEventPath=" + frameworkEventPath,
  "phasePath=" + phasePath,
  "runId=" + beforeOutputFrame.surface.attributes["data-run-id"],
  "messageId=" + beforeOutputFrame.surface.attributes["data-message-id"],
  "surfaceState=" + beforeOutputFrame.surface.attributes["data-presence-state"],
  "surfacePhase=" + beforeOutputFrame.surface.attributes["data-presence-phase"],
  "assistantOutputEmpty=" + beforeOutputFrame.surface.attributes["data-assistant-output-empty"],
  "streamOpenMs=" + formatMs(summary.streamOpenMs),
  "firstOutputMs=" + formatMs(summary.firstOutputMs),
  "leadMs=" + formatMs(summary.presenceBeforeOutputMs),
  "finalState=" + (summary.finalState || "none"),
  "hasOutput=" + summary.hasOutput,
  "complete=" + summary.complete,
  "interrupted=" + summary.interrupted,
].join(" "));
`,
  );

  writeFileSync(
    join(tempDir, "assistant-ui-external-store-smoke.mjs"),
    `import assert from "node:assert/strict";
import {
  PresenceEvent,
  createPresenceRuntime,
  createPresenceTrace,
  presenceControlInputsForSnapshot,
  summarizePresenceTrace,
} from "@ai-presence/core";
import { createAssistantLifecycleAdapter } from "@ai-presence/adapters";

const threadId = "assistant_ui_thread_consumer_smoke";
const runId = "assistant_ui_run_consumer_smoke";
const userMessageId = "assistant_ui_user_consumer_smoke";
const assistantMessageId = "assistant_ui_assistant_consumer_smoke";
const draft = "Show ExternalStoreRuntime posture before output.";
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
  return Number.isFinite(Number(value)) ? String(Math.round(Number(value))) + "ms" : "none";
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
      throw new Error("Unknown assistant-ui ExternalStoreRuntime event: " + event.type);
  }
}

function surfaceForSnapshot(snapshot, controlInputs, summary, state) {
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
    }),
  });
}

function captureFrame(atMs, frameworkEvent, snapshot) {
  const controlInputs = presenceControlInputsForSnapshot(snapshot, { trace, now: atMs });
  const summary = summarizePresenceTrace(trace);
  const surface = surfaceForSnapshot(snapshot, controlInputs, summary, externalStoreState);

  frames.push({
    atMs,
    frameworkEvent,
    frameworkStatus: externalStoreState.assistantMessageStatusType,
    state: snapshot.state,
    event: snapshot.event,
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
  content: [{ type: "text", text: "Installed packages prove ExternalStoreRuntime posture." }],
};
sendAssistantUiEventAt(900, {
  type: "assistant-message:running-delta",
  threadId,
  runId,
  messageId: assistantMessageId,
  delta: "Installed packages prove ExternalStoreRuntime posture.",
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
    && frame.surface.surface === "assistant-ui-external-store"
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

const statePath = entries.map((entry) => entry.state).join(">");
const eventPath = entries.map((entry) => entry.event).join(">");
const frameworkEventPath = frames.map((frame) => frame.frameworkEvent).join(">");
const frameworkStatusPath = frames.map((frame) => frame.frameworkStatus).join(">");
const phasePath = frames.map((frame) => frame.phase).join(">");

assert.equal(statePath, "thinking>thinking>waiting>streaming>ready");
assert.equal(eventPath, "submit>submit>stream-open>token>response-complete");
assert.equal(
  frameworkEventPath,
  "onNew>isRunning:true>assistant-message:running-empty>assistant-message:running-delta>assistant-message:complete",
);
assert.equal(frameworkStatusPath, "none>none>running>running>complete");
assert.equal(phasePath, "before-output>before-output>before-output>output>recovery");
assert.equal(summary.firstOutputEvent, PresenceEvent.TOKEN);
assert.equal(summary.streamOpenMs, 520);
assert.equal(summary.firstOutputMs, 900);
assert.equal(summary.presenceBeforeOutputMs, 900);
assert.equal(summary.finalState, "ready");
assert.equal(summary.hasOutput, true);
assert.equal(summary.complete, true);
assert.equal(summary.interrupted, false);
assert.ok(beforeOutputFrame);

console.log([
  "assistant-ui-external-store consumer smoke ok",
  "surface=assistant-ui-external-store",
  "framework=assistant-ui",
  "route=ExternalStoreRuntime",
  "beforeOutput=true",
  "statePath=" + statePath,
  "eventPath=" + eventPath,
  "frameworkEventPath=" + frameworkEventPath,
  "frameworkStatusPath=" + frameworkStatusPath,
  "phasePath=" + phasePath,
  "isRunning=" + beforeOutputFrame.surface.attributes["data-is-running"],
  "messageStatus=" + beforeOutputFrame.surface.attributes["data-assistant-message-status"],
  "threadId=" + beforeOutputFrame.surface.attributes["data-thread-id"],
  "runId=" + beforeOutputFrame.surface.attributes["data-run-id"],
  "messageId=" + beforeOutputFrame.surface.attributes["data-message-id"],
  "surfaceState=" + beforeOutputFrame.surface.attributes["data-presence-state"],
  "surfacePhase=" + beforeOutputFrame.surface.attributes["data-presence-phase"],
  "surfaceEvent=" + beforeOutputFrame.surface.attributes["data-presence-event"],
  "assistantOutputEmpty=" + beforeOutputFrame.surface.attributes["data-assistant-output-empty"],
  "streamOpenMs=" + formatMs(summary.streamOpenMs),
  "firstOutputMs=" + formatMs(summary.firstOutputMs),
  "leadMs=" + formatMs(summary.presenceBeforeOutputMs),
  "presenceBeforeOutputMs=" + formatMs(summary.presenceBeforeOutputMs),
  "finalState=" + (summary.finalState || "none"),
  "hasOutput=" + summary.hasOutput,
  "complete=" + summary.complete,
  "interrupted=" + summary.interrupted,
].join(" "));
`,
  );

  writeFileSync(
    join(tempDir, "cjs-smoke.cjs"),
    `const assert = require("node:assert/strict");
const core = require("@ai-presence/core");
const face = require("@ai-presence/face");
const adapters = require("@ai-presence/adapters");
const reactPresence = require("@ai-presence/react");
const React = require("react");

const runtime = core.createPresenceRuntime({ now: () => 1000 });
runtime.send(core.PresenceEvent.SUBMIT);

assert.equal(runtime.getSnapshot().state, core.PresenceState.THINKING);
assert.match(face.renderPresenceFaceSvg(runtime.getSnapshot(), { now: 1000, timeMs: 1000 }).svg, /data-presence-state="thinking"/);
assert.equal(typeof adapters.createChatEventAdapter, "function");
assert.equal(typeof adapters.createAssistantLifecycleAdapter, "function");
assert.equal(typeof adapters.createOpenAIResponsesAdapter, "function");
assert.equal(typeof reactPresence.createPresenceReactBindings(React, { runtime }).PresenceRendererSlot, "function");

console.log("cjs consumer smoke ok");
`,
  );
}

function assertInstalledVersions() {
  const result = run(
    "npm",
    ["ls", "--json", "--depth=0", ...packages],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  let dependencyTree;
  try {
    dependencyTree = JSON.parse(result.stdout);
  } catch (error) {
    console.error("Unable to parse npm ls output.");
    console.error(error.message);
    console.error(`Consumer smoke temp dir retained: ${tempDir}`);
    process.exit(1);
  }

  for (const packageName of packages) {
    const installed = dependencyTree.dependencies?.[packageName]?.version;
    if (installed !== version) {
      console.error(`${packageName}: expected ${version}, found ${installed || "missing"}`);
      console.error(`Consumer smoke temp dir retained: ${tempDir}`);
      process.exit(1);
    }
    console.log(`${packageName}@${installed}: resolved from npm`);
  }
}

writeSmokeFiles();

console.log(`consumer smoke temp dir: ${tempDir}`);
run("npm", ["install", "--ignore-scripts", "--no-audit", "--fund=false", ...installTargets]);
run("node", ["esm-smoke.mjs"]);
run("node", ["responses-smoke.mjs"]);
run("node", ["vanilla-status-surface-smoke.mjs"]);
run("node", ["vercel-ai-sdk-smoke.mjs"]);
run("node", ["composer-lane-smoke.mjs"]);
run("node", ["assistant-lifecycle-smoke.mjs"]);
run("node", ["assistant-ui-external-store-smoke.mjs"]);
run("node", ["cjs-smoke.cjs"]);
assertInstalledVersions();

if (process.env.AI_PRESENCE_KEEP_CONSUMER_SMOKE === "1") {
  console.log(`consumer smoke temp dir retained: ${tempDir}`);
} else {
  rmSync(tempDir, { recursive: true, force: true });
}

console.log(`consumer smoke passed for ${version}`);
