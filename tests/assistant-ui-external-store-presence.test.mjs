import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const examplePath = resolve(root, "examples/assistant-ui-external-store-presence.mjs");
const source = readFileSync(examplePath, "utf8");
const output = execFileSync("node", ["examples/assistant-ui-external-store-presence.mjs"], {
  cwd: root,
  encoding: "utf8",
});
const line = output.trim();
const fields = Object.fromEntries(
  line
    .replace(/^assistant-ui-external-store:summary\s+/, "")
    .split(/\s+/)
    .map((part) => part.split("=")),
);
const secretShape = /\b(?:OPENAI_API_KEY|NPM_TOKEN|npm_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,})\b/;

assert.match(line, /^assistant-ui-external-store:summary /);
assert.equal(fields.surface, "assistant-ui-external-store");
assert.equal(fields.framework, "assistant-ui");
assert.equal(fields.route, "ExternalStoreRuntime");
assert.equal(fields.statePath, "thinking>thinking>waiting>streaming>ready");
assert.equal(fields.eventPath, "submit>submit>stream-open>token>response-complete");
assert.equal(
  fields.frameworkEventPath,
  "onNew>isRunning:true>assistant-message:running-empty>assistant-message:running-delta>assistant-message:complete",
);
assert.equal(fields.frameworkStatusPath, "none>none>running>running>complete");
assert.equal(fields.phasePath, "before-output>before-output>before-output>output>recovery");
assert.equal(fields.beforeOutput, "true");
assert.equal(fields.isRunning, "true");
assert.equal(fields.messageStatus, "running");
assert.equal(fields.threadId, "assistant-ui-thread-1");
assert.equal(fields.runId, "assistant-ui-run-1");
assert.equal(fields.messageId, "assistant-ui-assistant-1");
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

for (const frameworkName of [
  "ExternalStoreRuntime",
  "onNew",
  "isRunning:true",
  "assistant-message:running-empty",
  "assistant-message:running-delta",
  "assistant-message:complete",
  "status: { type: \"running\" }",
  "status: { type: \"complete\" }",
]) {
  assert.match(source, new RegExp(frameworkName.replaceAll("/", "\\/").replaceAll(".", "\\.")));
}

for (const dataAttribute of [
  "\"data-surface\"",
  "\"data-framework\"",
  "\"data-route\"",
  "\"data-thread-id\"",
  "\"data-run-id\"",
  "\"data-message-id\"",
  "\"data-is-running\"",
  "\"data-assistant-message-status\"",
  "\"data-presence-state\"",
  "\"data-presence-phase\"",
  "\"data-presence-attention\"",
  "\"data-presence-event\"",
  "\"data-assistant-output-empty\"",
  "\"data-presence-before-output\"",
]) {
  assert.match(source, new RegExp(dataAttribute));
}

assert.match(source, /www\.assistant-ui\.com\/docs\/runtimes\/custom\/external-store/);
assert.match(source, /www\.assistant-ui\.com\/docs\/runtimes\/concepts\/architecture/);
assert.doesNotMatch(source, /from ["']@assistant-ui\/|require\(["']@assistant-ui\//);
assert.doesNotMatch(source, /from ["']@langchain\/|require\(["']@langchain\//);
assert.doesNotMatch(source, /from ["']openai["']|require\(["']openai["']\)/);
assert.doesNotMatch(source, /@ai-presence\/face|packages\/face|renderPresenceFaceSvg|faceExpressionForPresence|<svg|svg/i);
assert.doesNotMatch(source, /@ai-presence\/react|react-dom|ReactDOM|createPresenceReactBindings/);
assert.doesNotMatch(source, secretShape);
assert.doesNotMatch(output, secretShape);
assert.doesNotMatch(source, /emotion[- ]detection|private emotion|private inference/i);
assert.doesNotMatch(output, /emotion[- ]detection|private emotion|private inference/i);

console.log("assistant-ui-external-store-presence ok");
