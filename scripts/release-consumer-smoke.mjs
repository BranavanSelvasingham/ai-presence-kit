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
run("node", ["cjs-smoke.cjs"]);
assertInstalledVersions();

if (process.env.AI_PRESENCE_KEEP_CONSUMER_SMOKE === "1") {
  console.log(`consumer smoke temp dir retained: ${tempDir}`);
} else {
  rmSync(tempDir, { recursive: true, force: true });
}

console.log(`consumer smoke passed for ${version}`);
