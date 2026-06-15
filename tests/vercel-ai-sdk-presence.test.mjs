import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const examplePath = resolve(root, "examples/vercel-ai-sdk-presence.mjs");
const source = readFileSync(examplePath, "utf8");
const output = execFileSync("node", ["examples/vercel-ai-sdk-presence.mjs"], {
  cwd: root,
  encoding: "utf8",
});
const line = output.trim();
const fields = Object.fromEntries(
  line
    .replace(/^vercel-ai-sdk:summary\s+/, "")
    .split(/\s+/)
    .map((part) => part.split("=")),
);
const secretShape = /\b(?:OPENAI_API_KEY|NPM_TOKEN|npm_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,})\b/;

assert.match(line, /^vercel-ai-sdk:summary /);
assert.equal(fields.framework, "vercel-ai-sdk");
assert.equal(fields.beforeOutput, "true");
assert.equal(fields.statePath, "user-typing>thinking>thinking>waiting>streaming>ready");
assert.equal(fields.eventPath, "user-input>user-pause>submit>stream-open>token>response-complete");
assert.equal(fields.statusPath, "submitted>streaming>streaming>ready");
assert.equal(fields.frameworkEventPath, "input>pause>submitted>streaming:empty>streaming:text>ready");
assert.equal(fields.phasePath, "input>before-output>before-output>before-output>output>recovery");
assert.equal(fields.streamOpenStatus, "streaming");
assert.equal(fields.surfaceState, "waiting");
assert.equal(fields.surfacePhase, "before-output");
assert.equal(fields.surfaceEvent, "stream-open");
assert.equal(fields.assistantTextEmpty, "true");
assert.equal(fields.surfaceFirstOutputMs, "none");
assert.equal(fields.streamOpenMs, "520ms");
assert.equal(fields.firstOutputMs, "900ms");
assert.equal(fields.leadMs, "900ms");
assert.equal(fields.presenceBeforeOutputMs, "900ms");
assert.equal(fields.finalState, "ready");
assert.equal(fields.hasOutput, "true");
assert.equal(fields.complete, "true");
assert.equal(fields.interrupted, "false");
assert.equal(fields.abortState, "interrupted");
assert.equal(fields.errorState, "error");
assert.ok(Number.parseInt(fields.firstOutputMs, 10) > Number.parseInt(fields.streamOpenMs, 10));
assert.ok(Number.parseInt(fields.leadMs, 10) > 0);

for (const apiName of [
  "@ai-presence/core",
  "@ai-presence/adapters",
  "PresenceEvent.TOKEN",
  "PresenceState.READY",
  "PresenceState.INTERRUPTED",
  "createPresenceRuntime",
  "createPresenceTrace",
  "presenceControlInputsForSnapshot",
  "summarizePresenceTrace",
  "createVercelAISDKAdapter",
]) {
  assert.match(source, new RegExp(apiName.replaceAll("/", "\\/").replaceAll(".", "\\.")));
}

for (const docsUrl of [
  "https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat",
  "https://ai-sdk.dev/docs/ai-sdk-ui/chatbot",
]) {
  assert.match(source, new RegExp(docsUrl.replaceAll("/", "\\/").replaceAll(".", "\\.")));
}

for (const statusName of [
  "submitted",
  "streaming",
  "ready",
  "error",
]) {
  assert.match(source, new RegExp(`status: "${statusName}"`));
}

for (const dataAttribute of [
  "\"data-framework\"",
  "\"data-status\"",
  "\"data-presence-state\"",
  "\"data-presence-phase\"",
  "\"data-presence-attention\"",
  "\"data-presence-event\"",
  "\"data-assistant-text-empty\"",
  "\"data-presence-before-output\"",
  "\"data-stream-open-ms\"",
  "\"data-first-output-ms\"",
  "\"data-lead-ms\"",
]) {
  assert.match(source, new RegExp(dataAttribute));
}

assert.match(source, /role: "assistant"/);
assert.match(source, /parts: \[\{ type: "text", text: "" \}\]/);
assert.match(source, /parts: \[\{ type: "text", text: "Presence appears before the first visible token\." \}\]/);
assert.match(source, /isAbort: true/);
assert.doesNotMatch(source, /from ["']ai["']|require\(["']ai["']\)/);
assert.doesNotMatch(source, /from ["']@ai-sdk\/|require\(["']@ai-sdk\//);
assert.doesNotMatch(source, /@ai-presence\/face|packages\/face|renderPresenceFaceSvg|faceExpressionForPresence|<svg|svg/i);
assert.doesNotMatch(source, /@ai-presence\/react|react-dom|ReactDOM|createPresenceReactBindings/);
assert.doesNotMatch(source, secretShape);
assert.doesNotMatch(output, secretShape);
assert.doesNotMatch(source, /emotion[- ]detection|private emotion|private inference/i);
assert.doesNotMatch(output, /emotion[- ]detection|private emotion|private inference/i);

console.log("vercel-ai-sdk-presence ok");
