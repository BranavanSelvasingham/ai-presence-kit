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
assert.equal(typeof core.summarizePresenceTrace, "function");

const trace = core.createPresenceTrace();
const runtime = core.createPresenceRuntime({ now: () => 1000 + trace.getEntries().length * 20 });
trace.attach(runtime);
runtime.send(core.PresenceEvent.SUBMIT);
runtime.send(core.PresenceEvent.STREAM_OPEN);
runtime.send(core.PresenceEvent.TOKEN, { delta: "Hello" });
runtime.send(core.PresenceEvent.RESPONSE_COMPLETE);

const summary = core.summarizePresenceTrace(trace);
assert.equal(summary.complete, true);
assert.equal(summary.hasOutput, true);

const rendered = face.renderPresenceFaceSvg(runtime.getSnapshot(), {
  history: trace.getEntries(),
  now: 1200,
  timeMs: 1200,
});
assert.match(rendered.svg, /<svg/);
assert.equal(rendered.attributes.decisionTrace, "complete");
assert.equal(rendered.decisionTrace.decisionCount, 6);

assert.equal(typeof adapters.createVercelAISDKAdapter, "function");
assert.equal(typeof adapters.createOpenAIRealtimeAdapter, "function");

const bindings = reactPresence.createPresenceReactBindings(React, { runtime });
assert.equal(typeof bindings.PresenceProvider, "function");
assert.equal(typeof bindings.usePresenceFrameTime, "function");

console.log("esm consumer smoke ok");
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
