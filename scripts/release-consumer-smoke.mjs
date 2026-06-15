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
assert.equal(typeof adapters.createVercelAISDKAdapter, "function");
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
run("node", ["composer-lane-smoke.mjs"]);
run("node", ["cjs-smoke.cjs"]);
assertInstalledVersions();

if (process.env.AI_PRESENCE_KEEP_CONSUMER_SMOKE === "1") {
  console.log(`consumer smoke temp dir retained: ${tempDir}`);
} else {
  rmSync(tempDir, { recursive: true, force: true });
}

console.log(`consumer smoke passed for ${version}`);
