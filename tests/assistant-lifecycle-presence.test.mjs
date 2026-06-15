import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const examplePath = resolve(root, "examples/assistant-lifecycle-presence.mjs");
const source = readFileSync(examplePath, "utf8");
const output = execFileSync("node", ["examples/assistant-lifecycle-presence.mjs"], {
  cwd: root,
  encoding: "utf8",
});
const line = output.trim();
const fields = Object.fromEntries(
  line
    .replace(/^assistant-lifecycle:summary\s+/, "")
    .split(/\s+/)
    .map((part) => part.split("=")),
);
const secretShape = /\b(?:OPENAI_API_KEY|NPM_TOKEN|npm_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,})\b/;

assert.match(line, /^assistant-lifecycle:summary /);
assert.equal(fields.surface, "assistant-lifecycle");
assert.equal(fields.statePath, "user-typing>thinking>thinking>waiting>streaming>ready");
assert.equal(fields.eventPath, "user-input>user-pause>submit>stream-open>token>response-complete");
assert.equal(
  fields.frameworkEventPath,
  "composing>composing>run-created>assistant-message-open>assistant-text-delta>run-completed",
);
assert.equal(fields.phasePath, "input>before-output>before-output>before-output>output>recovery");
assert.equal(fields.beforeOutput, "true");
assert.equal(fields.threadId, "thread_presence_1");
assert.equal(fields.runId, "run_presence_1");
assert.equal(fields.messageId, "msg_presence_1");
assert.equal(fields.surfaceState, "waiting");
assert.equal(fields.surfacePhase, "before-output");
assert.equal(fields.surfaceEvent, "stream-open");
assert.equal(fields.assistantOutputEmpty, "true");
assert.equal(fields.streamOpenMs, "520ms");
assert.equal(fields.firstOutputMs, "900ms");
assert.equal(fields.leadMs, "900ms");
assert.equal(fields.presenceBeforeOutputMs, "900ms");
assert.equal(fields.finalState, "ready");
assert.equal(fields.hasOutput, "true");
assert.equal(fields.complete, "true");
assert.equal(fields.interrupted, "false");
assert.ok(Number.parseInt(fields.firstOutputMs, 10) > Number.parseInt(fields.streamOpenMs, 10));
assert.ok(Number.parseInt(fields.leadMs, 10) > 0);

for (const apiName of [
  "@ai-presence/core",
  "@ai-presence/adapters",
  "PresenceEvent.TOKEN",
  "createPresenceRuntime",
  "createPresenceTrace",
  "presenceControlInputsForSnapshot",
  "summarizePresenceTrace",
  "createAssistantLifecycleAdapter",
]) {
  assert.match(source, new RegExp(apiName.replaceAll("/", "\\/").replaceAll(".", "\\.")));
}

for (const dataAttribute of [
  "\"data-surface\"",
  "\"data-thread-id\"",
  "\"data-run-id\"",
  "\"data-message-id\"",
  "\"data-lifecycle\"",
  "\"data-presence-state\"",
  "\"data-presence-phase\"",
  "\"data-presence-attention\"",
  "\"data-presence-event\"",
  "\"data-assistant-output-empty\"",
  "\"data-presence-before-output\"",
]) {
  assert.match(source, new RegExp(dataAttribute));
}

assert.doesNotMatch(source, /assistant-ui|@assistant-ui|langchain|@langchain|openai|@openai/i);
assert.doesNotMatch(source, /@ai-presence\/face|packages\/face|renderPresenceFaceSvg|faceExpressionForPresence|<svg|svg/i);
assert.doesNotMatch(source, /@ai-presence\/react|react-dom|ReactDOM|createPresenceReactBindings/);
assert.doesNotMatch(source, secretShape);
assert.doesNotMatch(output, secretShape);
assert.doesNotMatch(source, /emotion[- ]detection|private emotion|private inference/i);
assert.doesNotMatch(output, /emotion[- ]detection|private emotion|private inference/i);

console.log("assistant-lifecycle-presence ok");
