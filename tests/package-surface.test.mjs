import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const root = resolve(new URL("..", import.meta.url).pathname);

for (const requiredFile of [
  ".github/workflows/ci.yml",
  "AGENTS.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "CORE_PILLARS.md",
  "docs/GOAL_LOOP.md",
  "docs/INTEGRATION_QUICKSTART.md",
  "docs/media/presence-comparison.jpg",
  "docs/media/main-app-release.png",
  "docs/media/react-browser-demo.jpg",
  "docs/ORCHESTRATION_LOOP.md",
  "docs/PUBLIC_RELEASE_GATE.md",
  "docs/RELEASE_POLICY.md",
  "docs/RELEASE_READINESS.md",
  "docs/RELEASE_RUNBOOK.md",
  "OPERATING_MANUAL.md",
  "examples/adapter-demo.mjs",
  "tests/adapter-demo.test.mjs",
  "examples/quickstart-presence.mjs",
  "tests/quickstart-presence.test.mjs",
  "examples/status-surface-presence.mjs",
  "tests/status-surface-presence.test.mjs",
  "examples/composer-lane-presence.mjs",
  "tests/composer-lane-presence.test.mjs",
  "examples/assistant-lifecycle-presence.mjs",
  "tests/assistant-lifecycle-presence.test.mjs",
  "examples/assistant-ui-external-store-presence.mjs",
  "tests/assistant-ui-external-store-presence.test.mjs",
  "examples/react-browser.css",
  "examples/react-browser-demo.js",
  "examples/react-browser-composer-lane.html",
  "examples/react-browser.html",
  "examples/react-presence-demo.js",
  "package-lock.json",
  "scripts/check-package-names.mjs",
  "scripts/check-npm-scope.mjs",
  "scripts/pack-dry-run.mjs",
  "scripts/browser-smoke.mjs",
  "scripts/capture-release-media.mjs",
  "scripts/release-consumer-smoke.mjs",
  "scripts/release-public-readiness.mjs",
  "scripts/release-publish.mjs",
  "scripts/release-preflight.mjs",
  "scripts/release-security-preflight.mjs",
  "scripts/benchmark-core-runtime.mjs",
  "scripts/benchmark-face-pipeline.mjs",
  "VALIDATION.md",
]) {
  assert.ok(existsSync(resolve(root, requiredFile)), `${requiredFile} missing`);
}

const rootManifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
assert.equal(rootManifest.description, "Low-latency facial presence engine for AI interfaces.");
assert.match(rootManifest.scripts.check, /scripts\/pack-dry-run\.mjs/);
assert.match(rootManifest.scripts.check, /scripts\/check-package-names\.mjs/);
assert.match(rootManifest.scripts.check, /scripts\/check-npm-scope\.mjs/);
assert.match(rootManifest.scripts.check, /scripts\/release-public-readiness\.mjs/);
assert.match(rootManifest.scripts.check, /scripts\/release-security-preflight\.mjs/);
assert.match(rootManifest.scripts.check, /scripts\/release-preflight\.mjs/);
assert.match(rootManifest.scripts.check, /scripts\/release-publish\.mjs/);
assert.match(rootManifest.scripts.check, /scripts\/release-consumer-smoke\.mjs/);
assert.match(rootManifest.scripts.check, /scripts\/capture-release-media\.mjs/);
assert.match(rootManifest.scripts.check, /scripts\/browser-smoke\.mjs/);
assert.match(rootManifest.scripts.check, /scripts\/benchmark-core-runtime\.mjs/);
assert.match(rootManifest.scripts.check, /scripts\/benchmark-face-pipeline\.mjs/);
assert.match(rootManifest.scripts.check, /examples\/quickstart-presence\.mjs/);
assert.match(rootManifest.scripts.check, /examples\/status-surface-presence\.mjs/);
assert.match(rootManifest.scripts.check, /examples\/composer-lane-presence\.mjs/);
assert.match(rootManifest.scripts.check, /examples\/assistant-lifecycle-presence\.mjs/);
assert.match(rootManifest.scripts.check, /examples\/assistant-ui-external-store-presence\.mjs/);
assert.equal(rootManifest.scripts["pack:dry-run"], "node scripts/pack-dry-run.mjs");
assert.equal(rootManifest.scripts["perf:core"], "node scripts/benchmark-core-runtime.mjs");
assert.equal(rootManifest.scripts["perf:face"], "node scripts/benchmark-face-pipeline.mjs");
assert.equal(rootManifest.scripts["demo:quickstart"], "node examples/quickstart-presence.mjs");
assert.equal(rootManifest.scripts["demo:status-surface"], "node examples/status-surface-presence.mjs");
assert.equal(rootManifest.scripts["demo:composer-lane"], "node examples/composer-lane-presence.mjs");
assert.equal(rootManifest.scripts["demo:assistant-lifecycle"], "node examples/assistant-lifecycle-presence.mjs");
assert.equal(rootManifest.scripts["demo:assistant-ui-external-store"], "node examples/assistant-ui-external-store-presence.mjs");
assert.equal(rootManifest.scripts["release:check-names"], "node scripts/check-package-names.mjs");
assert.equal(rootManifest.scripts["release:check-scope"], "node scripts/check-npm-scope.mjs");
assert.equal(rootManifest.scripts["release:public-gate"], "node scripts/release-public-readiness.mjs");
assert.equal(rootManifest.scripts["release:security"], "node scripts/release-security-preflight.mjs");
assert.equal(rootManifest.scripts["release:preflight"], "node scripts/release-preflight.mjs");
assert.equal(rootManifest.scripts["release:publish"], "node scripts/release-publish.mjs");
assert.equal(rootManifest.scripts["release:consumer-smoke"], "node scripts/release-consumer-smoke.mjs");
assert.equal(rootManifest.scripts["release:capture-media"], "node scripts/capture-release-media.mjs");
assert.equal(rootManifest.scripts["browser:smoke"], "node scripts/browser-smoke.mjs");
assert.match(rootManifest.scripts.validate, /npm run check/);
assert.match(rootManifest.scripts.validate, /npm test/);
assert.match(rootManifest.scripts.validate, /npm run demo:adapters/);
assert.match(rootManifest.scripts.validate, /npm run demo:quickstart/);
assert.match(rootManifest.scripts.validate, /npm run demo:status-surface/);
assert.match(rootManifest.scripts.validate, /npm run demo:composer-lane/);
assert.match(rootManifest.scripts.validate, /npm run demo:assistant-lifecycle/);
assert.match(rootManifest.scripts.validate, /npm run demo:assistant-ui-external-store/);
assert.match(rootManifest.scripts.validate, /npm run demo:react/);
assert.match(rootManifest.scripts.validate, /npm run pack:dry-run/);
assert.doesNotMatch(rootManifest.scripts.validate, /browser:smoke/);
assert.match(rootManifest.scripts.test, /tests\/adapter-demo\.test\.mjs/);
assert.match(rootManifest.scripts.test, /tests\/quickstart-presence\.test\.mjs/);
assert.match(rootManifest.scripts.test, /tests\/status-surface-presence\.test\.mjs/);
assert.match(rootManifest.scripts.test, /tests\/composer-lane-presence\.test\.mjs/);
assert.match(rootManifest.scripts.test, /tests\/assistant-lifecycle-presence\.test\.mjs/);
assert.match(rootManifest.scripts.test, /tests\/assistant-ui-external-store-presence\.test\.mjs/);

const workflow = readFileSync(resolve(root, ".github/workflows/ci.yml"), "utf8");
assert.match(workflow, /npm ci/);
assert.match(workflow, /npm run validate/);

const server = readFileSync(resolve(root, "server.mjs"), "utf8");
assert.doesNotMatch(server, /features\.emotion/);
assert.match(server, /Return interaction posture, not emotion detection/);

const releasePolicy = readFileSync(resolve(root, "docs/RELEASE_POLICY.md"), "utf8");
assert.match(releasePolicy, /0\.1\.0/);
assert.match(releasePolicy, /npm run release:check-names/);
assert.match(releasePolicy, /npm run release:check-scope/);
assert.match(releasePolicy, /npm run release:public-gate/);
assert.match(releasePolicy, /npm run release:preflight/);
assert.match(releasePolicy, /npm run release:publish -- X\.Y\.Z/);
assert.match(releasePolicy, /@ai-presence\/core -> npm E404/);
assert.match(releasePolicy, /2026-06-12/);
assert.match(releasePolicy, /scope/);

const releaseRunbook = readFileSync(resolve(root, "docs/RELEASE_RUNBOOK.md"), "utf8");
assert.match(releaseRunbook, /Fresh-Eyes Gate/);
assert.match(releaseRunbook, /npm run release:public-gate/);
assert.match(releaseRunbook, /npm run browser:smoke/);
assert.match(releaseRunbook, /temporary port with OpenAI disabled/);
assert.match(releaseRunbook, /not part of CI or the default `npm run validate` gate/);
assert.match(releaseRunbook, /react-browser-composer-lane\.html\?autorun=1/);
assert.match(releaseRunbook, /npm run release:preflight/);
assert.match(releaseRunbook, /npm run release:security/);
assert.match(releaseRunbook, /npm run release:publish -- X\.Y\.Z/);
assert.match(releaseRunbook, /npm run release:consumer-smoke -- X\.Y\.Z/);
assert.match(releaseRunbook, /npm run release:capture-media/);
assert.match(releaseRunbook, /npm publish \.\/packages\/core --access public/);
assert.match(releaseRunbook, /npm publish \.\/packages\/face --access public/);
assert.match(releaseRunbook, /npm publish \.\/packages\/adapters --access public/);
assert.match(releaseRunbook, /npm publish \.\/packages\/react --access public/);
assert.match(releaseRunbook, /Do not paste API keys, npm tokens, or npm OTP values/);
assert.match(releaseRunbook, /\.env\.release\.local/);
assert.match(releaseRunbook, /\.env/);
assert.match(releaseRunbook, /tracked secret scan/);
assert.match(releaseRunbook, /consumer smoke/);
assert.match(releaseRunbook, /renderer-agnostic before-output trace evidence/);
assert.match(releaseRunbook, /generic chat quickstart trace/);
assert.match(releaseRunbook, /OpenAI Responses adapter path/);
assert.match(releaseRunbook, /assistant lifecycle adapter path/);
assert.match(releaseRunbook, /assistant-ui ExternalStoreRuntime route/);
assert.match(releaseRunbook, /composer-lane adoption path/);
assert.match(releaseRunbook, /installed `@ai-presence\/core` and `@ai-presence\/adapters`/);
assert.match(releaseRunbook, /response\.created/);
assert.match(releaseRunbook, /response\.output_text\.delta/);
assert.match(releaseRunbook, /run-created.*message-created.*text-delta.*run-completed/s);
assert.match(releaseRunbook, /surface=assistant-lifecycle/);
assert.match(releaseRunbook, /assistantOutputEmpty=true/);
assert.match(releaseRunbook, /documented `onNew`, `isRunning=true`, empty assistant message `status\.type="running"`/);
assert.match(releaseRunbook, /surface=assistant-ui-external-store/);
assert.match(releaseRunbook, /framework=assistant-ui/);
assert.match(releaseRunbook, /route=ExternalStoreRuntime/);
assert.match(releaseRunbook, /frameworkStatusPath/);
assert.match(releaseRunbook, /presenceBeforeOutputMs/);
assert.match(releaseRunbook, /Vercel AI SDK-style `submitted`, `streaming`, and `ready` updates/);
assert.match(releaseRunbook, /renderer=composer-lane/);
assert.match(releaseRunbook, /npm registry propagation delays do not require manual reruns/);
assert.match(releaseRunbook, /bounded wait for npm registry metadata propagation/);

const releasePublish = readFileSync(resolve(root, "scripts/release-publish.mjs"), "utf8");
assert.match(releasePublish, /AI_PRESENCE_NPM_VISIBILITY_ATTEMPTS/);
assert.match(releasePublish, /AI_PRESENCE_NPM_VISIBILITY_DELAY_MS/);
assert.match(releasePublish, /waitForRegistryVersion/);
assert.match(releasePublish, /after accepted publish/);
assert.match(releasePublish, /final exact metadata check/);
assert.match(releasePublish, /final latest metadata check/);
assert.match(releasePublish, /already published, skipping publish/);
assert.match(releasePublish, /release publish dry-run passed/);

const releaseReadiness = readFileSync(resolve(root, "docs/RELEASE_READINESS.md"), "utf8");
assert.match(releaseReadiness, /summarizePresenceTrace/);
assert.match(releaseReadiness, /interruptMs/);
assert.match(releaseReadiness, /interrupted/);
assert.match(releaseReadiness, /npm run perf:core/);
assert.match(releaseReadiness, /npm run browser:smoke/);
assert.match(releaseReadiness, /temporary local port with OpenAI disabled/);
assert.match(releaseReadiness, /not part of GitHub Actions or the default `npm run validate` gate/);
assert.match(releaseReadiness, /npm run demo:quickstart/);
assert.match(releaseReadiness, /npm run demo:status-surface/);
assert.match(releaseReadiness, /npm run demo:composer-lane/);
assert.match(releaseReadiness, /npm run demo:assistant-lifecycle/);
assert.match(releaseReadiness, /npm run demo:assistant-ui-external-store/);
assert.match(releaseReadiness, /no-network adoption proof/);
assert.match(releaseReadiness, /framework-free non-face consumer proof/);
assert.match(releaseReadiness, /real-app-style composer lane proof/);
assert.match(releaseReadiness, /assistant app lifecycle proof/);
assert.match(releaseReadiness, /assistant-ui ExternalStoreRuntime proof/);
assert.match(releaseReadiness, /renderer=status-surface/);
assert.match(releaseReadiness, /renderer=composer-lane/);
assert.match(releaseReadiness, /surface=assistant-lifecycle/);
assert.match(releaseReadiness, /surface=assistant-ui-external-store/);
assert.match(releaseReadiness, /framework=assistant-ui/);
assert.match(releaseReadiness, /route=ExternalStoreRuntime/);
assert.match(releaseReadiness, /data-renderer="status-surface"/);
assert.match(releaseReadiness, /data-renderer="composer-lane"/);
assert.match(releaseReadiness, /data-assistant-output-empty="true"/);
assert.match(releaseReadiness, /data-presence-state="waiting"/);
assert.match(releaseReadiness, /data-presence-phase="before-output"/);
assert.match(releaseReadiness, /data-presence-before-output="true"/);
assert.match(releaseReadiness, /data-composer-lock="true"/);
assert.match(releaseReadiness, /data-assistant-text-empty="true"/);
assert.match(releaseReadiness, /data-progress-step="stream-open"/);
assert.match(releaseReadiness, /react-browser-composer-lane\.html/);
assert.match(releaseReadiness, /omits the face package/);
assert.match(releaseReadiness, /data-stream-open-ms="420ms"/);
assert.match(releaseReadiness, /data-first-output-ms="none"/);
assert.match(releaseReadiness, /positive `data-lead-ms`/);
assert.match(releaseReadiness, /renderer-agnostic package path before the face renderer/);
assert.match(releaseReadiness, /faceControllerFrameForPresence|temporal frame reports/);
assert.match(releaseReadiness, /faceControllerDecisionTraceForFrame/);
assert.match(releaseReadiness, /faceControllerCoherenceForFrame|coherence evidence/);
assert.match(releaseReadiness, /motionScale/);
assert.match(releaseReadiness, /renderPresenceFaceSvg/);
assert.match(releaseReadiness, /data-controller-decision-trace/);
assert.match(releaseReadiness, /data-transition-events="submit stream-open token interrupt"/);
assert.match(releaseReadiness, /data-transition-decision-trace="complete"/);
assert.match(releaseReadiness, /data-transition-controller-reads="gaze blink brows mouth posture motion"/);
assert.match(releaseReadiness, /data-transition-controller-reads-event="true"/);
assert.match(releaseReadiness, /data-transition-controller-reads-age="true"/);
assert.match(releaseReadiness, /data-generic-first-token-ms/);
assert.match(releaseReadiness, /data-presence-first-token-ms/);
assert.match(releaseReadiness, /data-presence-first-state-ms/);
assert.match(releaseReadiness, /data-presence-frame-before-token-ms/);
assert.match(releaseReadiness, /data-presence-decision-trace-before-token-ms/);
assert.match(releaseReadiness, /data-presence-decision-trace-lead-ms/);
assert.match(releaseReadiness, /data-presence-trace-summary="complete"/);
assert.match(releaseReadiness, /data-presence-trace-entry-count/);
assert.match(releaseReadiness, /data-presence-trace-first-output-ms/);
assert.match(releaseReadiness, /data-presence-trace-lead-ms/);
assert.match(releaseReadiness, /data-presence-trace-final-state/);
assert.match(releaseReadiness, /data-presence-trace-has-output/);
assert.match(releaseReadiness, /data-presence-trace-complete/);
assert.match(releaseReadiness, /data-react-trace-summary="complete"/);
assert.match(releaseReadiness, /data-react-trace-entry-count/);
assert.match(releaseReadiness, /data-react-trace-first-output-ms/);
assert.match(releaseReadiness, /data-react-trace-first-output-event/);
assert.match(releaseReadiness, /data-react-trace-lead-ms/);
assert.match(releaseReadiness, /data-react-trace-final-state/);
assert.match(releaseReadiness, /data-react-trace-has-output/);
assert.match(releaseReadiness, /data-react-trace-complete/);
assert.match(releaseReadiness, /data-nonface-renderer="status-surface"/);
assert.match(releaseReadiness, /data-nonface-state="waiting"/);
assert.match(releaseReadiness, /data-nonface-phase="before-output"/);
assert.match(releaseReadiness, /data-nonface-attention="response"/);
assert.match(releaseReadiness, /data-nonface-event="stream-open"/);
assert.match(releaseReadiness, /data-nonface-frame-time/);
assert.match(releaseReadiness, /data-nonface-before-output="true"/);
assert.match(releaseReadiness, /data-face-decision-trace="complete"/);
assert.match(releaseReadiness, /data-face-decision-trace-channels="gaze blink brows mouth posture motion"/);
assert.match(releaseReadiness, /data-face-decision-trace-decisions="6"/);
assert.match(releaseReadiness, /data-face-decision-trace-warnings="0"/);
assert.match(releaseReadiness, /data-face-decision-trace-renderer-safe="true"/);
assert.match(releaseReadiness, /data-face-latency-phase="before-output"/);
assert.match(releaseReadiness, /data-face-transition-context` beginning with `thinking stream-open`/);
assert.match(releaseReadiness, /data-face-transition-controller-reads="gaze blink brows mouth posture motion"/);
assert.match(releaseReadiness, /data-face-transition-controller-reads-event="true"/);
assert.match(releaseReadiness, /data-face-transition-controller-reads-age="true"/);
assert.match(releaseReadiness, /usePresenceFrameTime/);
assert.match(releaseReadiness, /before the first visible token/);
assert.match(releaseReadiness, /npm run perf:face/);
assert.match(releaseReadiness, /package-level latency evidence/);
assert.match(releaseReadiness, /2026-06-12/);
assert.match(releaseReadiness, /0\.1\.4/);
assert.match(releaseReadiness, /npm run release:check-scope/);
assert.match(releaseReadiness, /npm run release:preflight/);
assert.match(releaseReadiness, /npm run release:consumer-smoke -- X\.Y\.Z/);
assert.match(releaseReadiness, /installed `@ai-presence\/core` plus `@ai-presence\/adapters`/);
assert.match(releaseReadiness, /statePath.*eventPath.*firstOutputMs.*leadMs/s);
assert.match(releaseReadiness, /OpenAI Responses adapter path/);
assert.match(releaseReadiness, /response\.created.*response\.output_item\.added.*response\.output_text\.delta.*response\.completed/s);
assert.match(releaseReadiness, /assistant lifecycle adapter path/);
assert.match(releaseReadiness, /composer-input.*composer-pause.*run-created.*message-created.*text-delta.*run-completed/s);
assert.match(releaseReadiness, /surface=assistant-lifecycle/);
assert.match(releaseReadiness, /assistantOutputEmpty=true/);
assert.match(releaseReadiness, /assistant-ui ExternalStoreRuntime route/);
assert.match(releaseReadiness, /onNew.*isRunning=true.*status\.type="running".*status\.type="complete"/s);
assert.match(releaseReadiness, /surface=assistant-ui-external-store/);
assert.match(releaseReadiness, /frameworkStatusPath/);
assert.match(releaseReadiness, /presenceBeforeOutputMs/);
assert.match(releaseReadiness, /composer-lane adoption path/);
assert.match(releaseReadiness, /renderer=composer-lane/);
assert.match(releaseReadiness, /streamOpenMs.*firstOutputMs.*leadMs/s);

const releaseConsumerSmoke = readFileSync(resolve(root, "scripts/release-consumer-smoke.mjs"), "utf8");
assert.match(releaseConsumerSmoke, /@ai-presence\/core/);
assert.match(releaseConsumerSmoke, /@ai-presence\/adapters/);
assert.match(releaseConsumerSmoke, /createPresenceRuntime/);
assert.match(releaseConsumerSmoke, /createPresenceTrace/);
assert.match(releaseConsumerSmoke, /presenceControlInputsForSnapshot/);
assert.match(releaseConsumerSmoke, /summarizePresenceTrace/);
assert.match(releaseConsumerSmoke, /createChatEventAdapter/);
assert.match(releaseConsumerSmoke, /assistant-lifecycle-smoke\.mjs/);
assert.match(releaseConsumerSmoke, /createAssistantLifecycleAdapter/);
assert.match(releaseConsumerSmoke, /assistantLifecycleEventToRuntimeSignal/);
assert.match(releaseConsumerSmoke, /type: "composer-input"/);
assert.match(releaseConsumerSmoke, /type: "composer-pause"/);
assert.match(releaseConsumerSmoke, /type: "run-created"/);
assert.match(releaseConsumerSmoke, /type: "message-created"/);
assert.match(releaseConsumerSmoke, /type: "text-delta"/);
assert.match(releaseConsumerSmoke, /type: "run-completed"/);
assert.match(releaseConsumerSmoke, /assistant-lifecycle consumer smoke ok/);
assert.match(releaseConsumerSmoke, /surface=assistant-lifecycle/);
assert.match(releaseConsumerSmoke, /frameworkEventPath=/);
assert.match(releaseConsumerSmoke, /assistantOutputEmpty=/);
assert.match(releaseConsumerSmoke, /assistant-ui-external-store-smoke\.mjs/);
assert.match(releaseConsumerSmoke, /type: "onNew"/);
assert.match(releaseConsumerSmoke, /type: "isRunning:true"/);
assert.match(releaseConsumerSmoke, /type: "assistant-message:running-empty"/);
assert.match(releaseConsumerSmoke, /type: "assistant-message:running-delta"/);
assert.match(releaseConsumerSmoke, /type: "assistant-message:complete"/);
assert.match(releaseConsumerSmoke, /status: \{ type: "running" \}/);
assert.match(releaseConsumerSmoke, /status: \{ type: "complete" \}/);
assert.match(releaseConsumerSmoke, /assistant-ui-external-store consumer smoke ok/);
assert.match(releaseConsumerSmoke, /surface=assistant-ui-external-store/);
assert.match(releaseConsumerSmoke, /framework=assistant-ui/);
assert.match(releaseConsumerSmoke, /route=ExternalStoreRuntime/);
assert.match(releaseConsumerSmoke, /frameworkStatusPath=/);
assert.match(releaseConsumerSmoke, /isRunning=/);
assert.match(releaseConsumerSmoke, /messageStatus=/);
assert.match(releaseConsumerSmoke, /assistantOutputEmpty=/);
assert.match(releaseConsumerSmoke, /presenceBeforeOutputMs=/);
assert.match(releaseConsumerSmoke, /responses-smoke\.mjs/);
assert.match(releaseConsumerSmoke, /createOpenAIResponsesAdapter/);
assert.match(releaseConsumerSmoke, /openAIResponsesEventToRuntimeSignal/);
assert.match(releaseConsumerSmoke, /type: "response\.created"/);
assert.match(releaseConsumerSmoke, /type: "response\.output_item\.added"/);
assert.match(releaseConsumerSmoke, /type: "response\.output_text\.delta"/);
assert.match(releaseConsumerSmoke, /type: "response\.completed"/);
assert.match(releaseConsumerSmoke, /responses consumer smoke ok/);
assert.match(releaseConsumerSmoke, /type: "input"/);
assert.match(releaseConsumerSmoke, /type: "pause"/);
assert.match(releaseConsumerSmoke, /type: "submit"/);
assert.match(releaseConsumerSmoke, /type: "stream-open"/);
assert.match(releaseConsumerSmoke, /type: "token"/);
assert.match(releaseConsumerSmoke, /type: "done"/);
assert.match(releaseConsumerSmoke, /summary\.firstOutputEvent/);
assert.match(releaseConsumerSmoke, /core\.PresenceEvent\.TOKEN/);
assert.match(releaseConsumerSmoke, /summary\.presenceBeforeOutputMs/);
assert.match(releaseConsumerSmoke, /statePath=/);
assert.match(releaseConsumerSmoke, /eventPath=/);
assert.match(releaseConsumerSmoke, /firstOutputMs=/);
assert.match(releaseConsumerSmoke, /leadMs=/);
assert.match(releaseConsumerSmoke, /finalState=/);
assert.match(releaseConsumerSmoke, /hasOutput=/);
assert.match(releaseConsumerSmoke, /complete=/);
assert.match(releaseConsumerSmoke, /interrupted=/);
assert.match(releaseConsumerSmoke, /composer-lane-smoke\.mjs/);
assert.match(releaseConsumerSmoke, /createVercelAISDKAdapter/);
assert.match(releaseConsumerSmoke, /status: "submitted"/);
assert.match(releaseConsumerSmoke, /status: "streaming"/);
assert.match(releaseConsumerSmoke, /status: "ready"/);
assert.match(releaseConsumerSmoke, /renderer=composer-lane/);
assert.match(releaseConsumerSmoke, /beforeOutput=true/);
assert.match(releaseConsumerSmoke, /laneState=/);
assert.match(releaseConsumerSmoke, /lanePhase=/);
assert.match(releaseConsumerSmoke, /composerLocked=/);
assert.match(releaseConsumerSmoke, /assistantTextEmpty=/);
assert.match(releaseConsumerSmoke, /progressStep=/);
assert.match(releaseConsumerSmoke, /streamOpenMs=/);

const responsesSmokeStart = releaseConsumerSmoke.indexOf('join(tempDir, "responses-smoke.mjs")');
const responsesSmokeEnd = releaseConsumerSmoke.indexOf('join(tempDir, "composer-lane-smoke.mjs")');
assert.ok(responsesSmokeStart > -1, "Responses smoke source missing");
assert.ok(responsesSmokeEnd > responsesSmokeStart, "Responses smoke source boundary missing");
const responsesConsumerSmoke = releaseConsumerSmoke.slice(
  responsesSmokeStart,
  responsesSmokeEnd,
);
assert.match(responsesConsumerSmoke, /from "@ai-presence\/core"/);
assert.match(responsesConsumerSmoke, /from "@ai-presence\/adapters"/);
assert.match(responsesConsumerSmoke, /createOpenAIResponsesAdapter/);
assert.match(responsesConsumerSmoke, /summary\.presenceBeforeOutputMs/);
assert.doesNotMatch(responsesConsumerSmoke, /@ai-presence\/face|@ai-presence\/react|react-dom|ReactDOM|renderPresenceFaceSvg|<svg|svg/i);

const composerLaneSmokeStart = releaseConsumerSmoke.indexOf('join(tempDir, "composer-lane-smoke.mjs")');
const composerLaneSmokeEnd = releaseConsumerSmoke.indexOf('join(tempDir, "assistant-lifecycle-smoke.mjs")');
assert.ok(composerLaneSmokeStart > -1, "composer-lane smoke source missing");
assert.ok(composerLaneSmokeEnd > composerLaneSmokeStart, "composer-lane smoke source boundary missing");
const composerLaneConsumerSmoke = releaseConsumerSmoke.slice(
  composerLaneSmokeStart,
  composerLaneSmokeEnd,
);
assert.match(composerLaneConsumerSmoke, /from "@ai-presence\/core"/);
assert.match(composerLaneConsumerSmoke, /from "@ai-presence\/adapters"/);
assert.doesNotMatch(composerLaneConsumerSmoke, /@ai-presence\/face|@ai-presence\/react|react-dom|ReactDOM|renderPresenceFaceSvg|<svg|svg/i);

const assistantLifecycleSmokeStart = releaseConsumerSmoke.indexOf('join(tempDir, "assistant-lifecycle-smoke.mjs")');
const assistantLifecycleSmokeEnd = releaseConsumerSmoke.indexOf('join(tempDir, "assistant-ui-external-store-smoke.mjs")');
assert.ok(assistantLifecycleSmokeStart > -1, "assistant lifecycle smoke source missing");
assert.ok(assistantLifecycleSmokeEnd > assistantLifecycleSmokeStart, "assistant lifecycle smoke source boundary missing");
const assistantLifecycleConsumerSmoke = releaseConsumerSmoke.slice(
  assistantLifecycleSmokeStart,
  assistantLifecycleSmokeEnd,
);
assert.match(assistantLifecycleConsumerSmoke, /from "@ai-presence\/core"/);
assert.match(assistantLifecycleConsumerSmoke, /from "@ai-presence\/adapters"/);
assert.match(assistantLifecycleConsumerSmoke, /createAssistantLifecycleAdapter/);
assert.match(assistantLifecycleConsumerSmoke, /assistantLifecycleEventToRuntimeSignal/);
assert.match(assistantLifecycleConsumerSmoke, /summary\.presenceBeforeOutputMs/);
assert.doesNotMatch(assistantLifecycleConsumerSmoke, /@ai-presence\/face|@ai-presence\/react|react-dom|ReactDOM|renderPresenceFaceSvg|<svg|svg/i);

const assistantUiExternalStoreSmokeStart = releaseConsumerSmoke.indexOf('join(tempDir, "assistant-ui-external-store-smoke.mjs")');
const assistantUiExternalStoreSmokeEnd = releaseConsumerSmoke.indexOf('join(tempDir, "cjs-smoke.cjs")');
assert.ok(assistantUiExternalStoreSmokeStart > -1, "assistant-ui ExternalStoreRuntime smoke source missing");
assert.ok(
  assistantUiExternalStoreSmokeEnd > assistantUiExternalStoreSmokeStart,
  "assistant-ui ExternalStoreRuntime smoke source boundary missing",
);
const assistantUiExternalStoreConsumerSmoke = releaseConsumerSmoke.slice(
  assistantUiExternalStoreSmokeStart,
  assistantUiExternalStoreSmokeEnd,
);
assert.match(assistantUiExternalStoreConsumerSmoke, /from "@ai-presence\/core"/);
assert.match(assistantUiExternalStoreConsumerSmoke, /from "@ai-presence\/adapters"/);
assert.match(assistantUiExternalStoreConsumerSmoke, /createAssistantLifecycleAdapter/);
assert.match(assistantUiExternalStoreConsumerSmoke, /ExternalStoreRuntime/);
assert.match(assistantUiExternalStoreConsumerSmoke, /onNew/);
assert.match(assistantUiExternalStoreConsumerSmoke, /isRunning:true/);
assert.match(assistantUiExternalStoreConsumerSmoke, /assistant-message:running-empty/);
assert.match(assistantUiExternalStoreConsumerSmoke, /assistant-message:running-delta/);
assert.match(assistantUiExternalStoreConsumerSmoke, /assistant-message:complete/);
assert.match(assistantUiExternalStoreConsumerSmoke, /summary\.presenceBeforeOutputMs/);
assert.doesNotMatch(assistantUiExternalStoreConsumerSmoke, /from ["']@assistant-ui\/|require\(["']@assistant-ui\//);
assert.doesNotMatch(assistantUiExternalStoreConsumerSmoke, /from ["']@langchain\/|require\(["']@langchain\//);
assert.doesNotMatch(assistantUiExternalStoreConsumerSmoke, /from ["']openai["']|require\(["']openai["']\)/);
assert.doesNotMatch(assistantUiExternalStoreConsumerSmoke, /@ai-presence\/face|@ai-presence\/react|react-dom|ReactDOM|renderPresenceFaceSvg|<svg|svg/i);

const publicReleaseGate = readFileSync(resolve(root, "docs/PUBLIC_RELEASE_GATE.md"), "utf8");
assert.match(publicReleaseGate, /Fresh-Eyes Gate/);
assert.match(publicReleaseGate, /Collaborator-Readiness Gate/);
assert.match(publicReleaseGate, /npm run release:public-gate/);
assert.match(publicReleaseGate, /npm run release:preflight/);
assert.match(publicReleaseGate, /npm run release:publish -- X\.Y\.Z/);
assert.match(publicReleaseGate, /NPM_TOKEN/);
assert.match(publicReleaseGate, /Do not paste/);
assert.match(publicReleaseGate, /CONTRIBUTING\.md/);

const integrationQuickstart = readFileSync(resolve(root, "docs/INTEGRATION_QUICKSTART.md"), "utf8");
assert.match(integrationQuickstart, /renderer-agnostic presence state layer/);
assert.match(integrationQuickstart, /observable presence-before-output evidence/);
assert.match(integrationQuickstart, /not emotion detection or private emotion inference/i);
assert.match(integrationQuickstart, /node examples\/quickstart-presence\.mjs/);
assert.match(integrationQuickstart, /node examples\/status-surface-presence\.mjs/);
assert.match(integrationQuickstart, /node examples\/composer-lane-presence\.mjs/);
assert.match(integrationQuickstart, /node examples\/assistant-lifecycle-presence\.mjs/);
assert.match(integrationQuickstart, /node examples\/assistant-ui-external-store-presence\.mjs/);
assert.match(integrationQuickstart, /statePath/);
assert.match(integrationQuickstart, /eventPath/);
assert.match(integrationQuickstart, /renderer=status-surface/);
assert.match(integrationQuickstart, /renderer=composer-lane/);
assert.match(integrationQuickstart, /surface="assistant-lifecycle"|surface=assistant-lifecycle|data-surface="assistant-lifecycle"/);
assert.match(integrationQuickstart, /framework=assistant-ui/);
assert.match(integrationQuickstart, /route=ExternalStoreRuntime/);
assert.match(integrationQuickstart, /status\.type="running"/);
assert.match(integrationQuickstart, /data-renderer="status-surface"/);
assert.match(integrationQuickstart, /data-renderer="composer-lane"/);
assert.match(integrationQuickstart, /data-assistant-output-empty/);
assert.match(integrationQuickstart, /data-presence-before-output/);
assert.match(integrationQuickstart, /data-composer-lock/);
assert.match(integrationQuickstart, /data-assistant-text-empty/);
assert.match(integrationQuickstart, /data-progress-step/);
assert.match(integrationQuickstart, /leadMs/);
assert.match(integrationQuickstart, /npm install @ai-presence\/core @ai-presence\/adapters/);
assert.match(integrationQuickstart, /npm install @ai-presence\/react @ai-presence\/face/);
assert.match(integrationQuickstart, /PresenceEvent/);
assert.match(integrationQuickstart, /createPresenceRuntime/);
assert.match(integrationQuickstart, /createPresenceTrace/);
assert.match(integrationQuickstart, /presenceControlInputsForSnapshot/);
assert.match(integrationQuickstart, /summarizePresenceTrace/);
assert.match(integrationQuickstart, /PresenceEvent\.USER_INPUT/);
assert.match(integrationQuickstart, /PresenceEvent\.USER_PAUSE/);
assert.match(integrationQuickstart, /PresenceEvent\.SUBMIT/);
assert.match(integrationQuickstart, /PresenceEvent\.STREAM_OPEN/);
assert.match(integrationQuickstart, /PresenceEvent\.TOKEN/);
assert.match(integrationQuickstart, /PresenceEvent\.RESPONSE_COMPLETE/);
assert.match(integrationQuickstart, /PresenceEvent\.INTERRUPT/);
assert.match(integrationQuickstart, /PresenceEvent\.ERROR/);
assert.match(integrationQuickstart, /user input -> user-typing/);
assert.match(integrationQuickstart, /stream open -> waiting/);
assert.match(integrationQuickstart, /first token -> streaming/);
assert.match(integrationQuickstart, /createChatEventAdapter/);
assert.match(integrationQuickstart, /createAssistantLifecycleAdapter/);
assert.match(integrationQuickstart, /run-created .*-> thinking/);
assert.match(integrationQuickstart, /message-created .*-> waiting/);
assert.match(integrationQuickstart, /text-delta .*-> streaming/);
assert.match(integrationQuickstart, /createOpenAIResponsesAdapter/);
assert.match(integrationQuickstart, /response\.created -> thinking/);
assert.match(integrationQuickstart, /response\.output_text\.delta -> streaming/);
assert.match(integrationQuickstart, /response\.function_call_arguments\.delta -> streaming/);
assert.match(integrationQuickstart, /response\.failed \/ error -> error/);
assert.match(integrationQuickstart, /response\.incomplete -> interrupted/);
assert.match(integrationQuickstart, /createVercelAISDKAdapter/);
assert.match(integrationQuickstart, /streaming with no assistant content -> waiting/);
assert.match(integrationQuickstart, /streaming with assistant content -> streaming/);
assert.match(integrationQuickstart, /summary\.presenceBeforeOutputMs/);
assert.match(integrationQuickstart, /hasOutput: true/);
assert.match(integrationQuickstart, /complete: true/);
assert.match(integrationQuickstart, /finalState: "ready"/);
assert.match(integrationQuickstart, /Renderer.*consume the snapshot and control inputs/s);
assert.match(integrationQuickstart, /@ai-presence\/react/);
assert.match(integrationQuickstart, /PresenceRendererSlot/);
assert.match(integrationQuickstart, /@ai-presence\/face/);
assert.match(integrationQuickstart, /renderPresenceFaceSvg/);
assert.match(integrationQuickstart, /The SVG face is optional proof/);
assert.doesNotMatch(integrationQuickstart, /\b(?:OPENAI_API_KEY|NPM_TOKEN|npm_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,})\b/);

const contributing = readFileSync(resolve(root, "CONTRIBUTING.md"), "utf8");
assert.match(contributing, /Good First Collaboration Areas/);
assert.match(contributing, /presence state layer/);
assert.match(contributing, /interaction posture/);
assert.match(contributing, /not emotion detection/i);
assert.match(contributing, /npm run validate/);
assert.match(contributing, /npm run release:public-gate/);

const validation = readFileSync(resolve(root, "VALIDATION.md"), "utf8");
assert.match(validation, /npm run release:capture-media/);
assert.match(validation, /npm run browser:smoke/);
assert.match(validation, /temporary local port with OpenAI disabled/);
assert.match(validation, /Chrome DevTools Protocol/);
assert.match(validation, /browser console exceptions or errors/);
assert.match(validation, /not part of `npm run validate` or CI/);
assert.match(validation, /CHROME_PATH/);
assert.match(validation, /npm run perf:core/);
assert.match(validation, /createPresenceRuntime\(\)\.send/);
assert.match(validation, /0\.35ms/);
assert.match(validation, /npm run demo:status-surface/);
assert.match(validation, /npm run demo:composer-lane/);
assert.match(validation, /npm run demo:assistant-lifecycle/);
assert.match(validation, /npm run demo:assistant-ui-external-store/);
assert.match(validation, /renderer=status-surface/);
assert.match(validation, /renderer=composer-lane/);
assert.match(validation, /surface=assistant-lifecycle/);
assert.match(validation, /surface=assistant-ui-external-store/);
assert.match(validation, /framework=assistant-ui/);
assert.match(validation, /route=ExternalStoreRuntime/);
assert.match(validation, /status\.type="running"/);
assert.match(validation, /data-presence-phase/);
assert.match(validation, /data-composer-lock/);
assert.match(validation, /assistant output empty/);
assert.match(validation, /react-browser-composer-lane\.html\?autorun=1/);
assert.match(validation, /data-stream-open-ms="420ms"/);
assert.match(validation, /data-first-output-ms="none"/);
assert.match(validation, /data-nonface-renderer="status-surface"/);
assert.match(validation, /data-nonface-before-output="true"/);
assert.match(validation, /npm run perf:face/);
assert.match(validation, /0\.25ms/);
assert.match(validation, /generic chat quickstart trace/);
assert.match(validation, /assistant-ui ExternalStoreRuntime route/);
assert.match(validation, /surface=assistant-ui-external-store/);
assert.match(validation, /frameworkStatusPath/);
assert.match(validation, /presenceBeforeOutputMs/);
assert.match(validation, /composer-lane adoption path/);
assert.match(validation, /Assistant Lifecycle Smoke/);
assert.match(validation, /from installed package APIs only/);

const browserSmoke = readFileSync(resolve(root, "scripts/browser-smoke.mjs"), "utf8");
assert.match(browserSmoke, /CHROME_PATH/);
assert.match(browserSmoke, /server\.mjs/);
assert.match(browserSmoke, /OPENAI_API_KEY: ""/);
assert.match(browserSmoke, /--remote-debugging-port/);
assert.match(browserSmoke, /Runtime\.evaluate/);
assert.match(browserSmoke, /document\.documentElement\.outerHTML/);
assert.match(browserSmoke, /Runtime\.exceptionThrown/);
assert.match(browserSmoke, /Runtime\.consoleAPICalled/);
assert.match(browserSmoke, /data-live-response-configured/);
assert.match(browserSmoke, /data-controller-decision-trace/);
assert.match(browserSmoke, /data-transition-events/);
assert.match(browserSmoke, /data-generic-first-token-ms/);
assert.match(browserSmoke, /data-react-trace-summary/);
assert.match(browserSmoke, /data-nonface-renderer/);
assert.match(browserSmoke, /data-renderer/);
assert.match(browserSmoke, /browser smoke ok/);
assert.doesNotMatch(browserSmoke, /playwright|puppeteer/i);

const operatingManual = readFileSync(resolve(root, "OPERATING_MANUAL.md"), "utf8");
assert.match(operatingManual, /npm run release:check-names/);
assert.match(operatingManual, /npm run release:check-scope/);
assert.match(operatingManual, /npm run release:public-gate/);
assert.match(operatingManual, /npm run release:preflight/);
assert.match(operatingManual, /npm run release:publish -- X\.Y\.Z/);
assert.match(operatingManual, /Browser-smoke the reference, metrics, comparison, and React browser routes/);

const goalLoop = readFileSync(resolve(root, "docs/GOAL_LOOP.md"), "utf8");
assert.match(goalLoop, /2026-06-12/);
assert.match(goalLoop, /0\.1\.4/);
assert.match(goalLoop, /no-network quickstart adoption proof/);
assert.match(goalLoop, /npm run release:check-scope/);
assert.match(goalLoop, /summarizePresenceTrace/);
assert.match(goalLoop, /createOpenAIResponsesAdapter/);
assert.match(goalLoop, /createAssistantLifecycleAdapter/);
assert.match(goalLoop, /assistant-ui ExternalStoreRuntime proof/);
assert.match(goalLoop, /npm run browser:smoke/);
assert.match(goalLoop, /Published-package consumer smoke now covers generic chat, OpenAI Responses, assistant lifecycle, assistant-ui ExternalStoreRuntime, and composer-lane adoption paths/);
assert.doesNotMatch(goalLoop, /Minimal assistant-ui or adjacent app-framework adapter as the next adoption check/);
assert.match(goalLoop, /firstOutputMs/);
assert.match(goalLoop, /leadMs/);
assert.match(goalLoop, /interruptMs/);
assert.match(goalLoop, /interrupted/);
assert.match(goalLoop, /data-presence-trace-summary="complete"/);
assert.match(goalLoop, /data-presence-trace-first-output-ms/);
assert.match(goalLoop, /data-presence-trace-lead-ms/);
assert.match(goalLoop, /data-presence-trace-final-state/);
assert.match(goalLoop, /data-presence-trace-has-output/);
assert.match(goalLoop, /data-presence-trace-complete/);
assert.match(goalLoop, /data-react-trace-summary="complete"/);
assert.match(goalLoop, /data-react-trace-first-output-ms/);
assert.match(goalLoop, /data-react-trace-lead-ms/);
assert.match(goalLoop, /data-react-trace-final-state/);
assert.match(goalLoop, /data-react-trace-has-output/);
assert.match(goalLoop, /data-react-trace-complete/);

const changelog = readFileSync(resolve(root, "CHANGELOG.md"), "utf8");
assert.match(changelog, /parallel face controller decisions/);
assert.match(changelog, /summarizePresenceTrace/);
assert.match(changelog, /interruptMs/);
assert.match(changelog, /interrupted/);
assert.match(changelog, /npm run perf:core/);
assert.match(changelog, /core-runtime benchmark validation/);
assert.match(changelog, /faceControllerDecisionTraceForFrame/);
assert.match(changelog, /renderPresenceFaceSvg/);
assert.match(changelog, /motionScale/);
assert.match(changelog, /data-controller-decision-trace/);
assert.match(changelog, /adapter demo decision-trace evidence/);
assert.match(changelog, /npm run perf:face/);
assert.match(changelog, /face-pipeline benchmark validation/);
assert.match(changelog, /release:check-scope/);
assert.match(changelog, /adapter demo coverage/);
assert.match(changelog, /usePresenceFrameTime/);
assert.match(changelog, /before-first-token presence/);
assert.match(changelog, /comparison-route DOM lead-time evidence/);
assert.match(changelog, /comparison-route DOM trace-summary evidence/);
assert.match(changelog, /React browser DOM trace-summary evidence/);
assert.match(changelog, /React browser renderer-slot DOM evidence/);
assert.match(changelog, /React browser renderer-slot transition-context DOM evidence/);
assert.match(changelog, /controller-gallery transition-cue DOM evidence/);
assert.match(changelog, /adapter demo transition-read evidence/);
assert.match(changelog, /data-face-latency-phase="before-output"/);
assert.match(changelog, /all-six-controller `transitionEvent` and `transitionAgeMs` reads/);

const adapterDemo = readFileSync(resolve(root, "examples/adapter-demo.mjs"), "utf8");
assert.match(adapterDemo, /faceControllerFrameForPresence/);
assert.match(adapterDemo, /faceControllerDecisionTraceForFrame/);
assert.match(adapterDemo, /FACE_CONTROL_CHANNELS/);
assert.match(adapterDemo, /createAssistantLifecycleAdapter/);
assert.match(adapterDemo, /assistant-lifecycle/);
assert.match(adapterDemo, /channels=/);
assert.match(adapterDemo, /trace=/);
assert.match(adapterDemo, /decisions=/);
assert.match(adapterDemo, /safe=/);
assert.match(adapterDemo, /warnings=/);
assert.match(adapterDemo, /transition=/);
assert.match(adapterDemo, /transitionReads=/);
assert.match(adapterDemo, /transitionEvent/);
assert.match(adapterDemo, /transitionAgeMs/);
assert.match(adapterDemo, /summarizePresenceTrace/);
assert.match(adapterDemo, /traceSummary=/);
assert.match(adapterDemo, /firstOutputMs=/);
assert.match(adapterDemo, /leadMs=/);

const quickstartPresence = readFileSync(resolve(root, "examples/quickstart-presence.mjs"), "utf8");
assert.match(quickstartPresence, /@ai-presence\/core/);
assert.match(quickstartPresence, /@ai-presence\/adapters/);
assert.match(quickstartPresence, /createPresenceRuntime/);
assert.match(quickstartPresence, /createPresenceTrace/);
assert.match(quickstartPresence, /presenceControlInputsForSnapshot/);
assert.match(quickstartPresence, /summarizePresenceTrace/);
assert.match(quickstartPresence, /createChatEventAdapter/);
assert.match(quickstartPresence, /statePath=/);
assert.match(quickstartPresence, /eventPath=/);
assert.match(quickstartPresence, /firstOutputMs=/);
assert.match(quickstartPresence, /leadMs=/);
assert.match(quickstartPresence, /finalState=/);
assert.match(quickstartPresence, /hasOutput=/);
assert.match(quickstartPresence, /complete=/);
assert.match(quickstartPresence, /interrupted=/);
assert.doesNotMatch(quickstartPresence, /emotion[- ]detection|private emotion|private inference/i);

const statusSurfacePresence = readFileSync(resolve(root, "examples/status-surface-presence.mjs"), "utf8");
assert.match(statusSurfacePresence, /@ai-presence\/core/);
assert.match(statusSurfacePresence, /@ai-presence\/adapters/);
assert.match(statusSurfacePresence, /createPresenceRuntime/);
assert.match(statusSurfacePresence, /createPresenceTrace/);
assert.match(statusSurfacePresence, /presenceControlInputsForSnapshot/);
assert.match(statusSurfacePresence, /summarizePresenceTrace/);
assert.match(statusSurfacePresence, /createChatEventAdapter/);
assert.match(statusSurfacePresence, /data-renderer/);
assert.match(statusSurfacePresence, /data-presence-state/);
assert.match(statusSurfacePresence, /data-presence-phase/);
assert.match(statusSurfacePresence, /data-presence-attention/);
assert.match(statusSurfacePresence, /data-presence-event/);
assert.match(statusSurfacePresence, /data-presence-before-output/);
assert.match(statusSurfacePresence, /renderer=status-surface/);
assert.match(statusSurfacePresence, /statePath=/);
assert.match(statusSurfacePresence, /eventPath=/);
assert.match(statusSurfacePresence, /phasePath=/);
assert.match(statusSurfacePresence, /beforeOutput=true/);
assert.match(statusSurfacePresence, /firstOutputMs=/);
assert.match(statusSurfacePresence, /leadMs=/);
assert.match(statusSurfacePresence, /finalState=/);
assert.match(statusSurfacePresence, /hasOutput=/);
assert.match(statusSurfacePresence, /complete=/);
assert.match(statusSurfacePresence, /interrupted=/);
assert.doesNotMatch(statusSurfacePresence, /@ai-presence\/face|packages\/face|renderPresenceFaceSvg|faceExpressionForPresence/);
assert.doesNotMatch(statusSurfacePresence, /@ai-presence\/react|react-dom|ReactDOM|createPresenceReactBindings/);
assert.doesNotMatch(statusSurfacePresence, /emotion[- ]detection|private emotion|private inference/i);

const composerLanePresence = readFileSync(resolve(root, "examples/composer-lane-presence.mjs"), "utf8");
assert.match(composerLanePresence, /@ai-presence\/core/);
assert.match(composerLanePresence, /@ai-presence\/adapters/);
assert.match(composerLanePresence, /createPresenceRuntime/);
assert.match(composerLanePresence, /createPresenceTrace/);
assert.match(composerLanePresence, /presenceControlInputsForSnapshot/);
assert.match(composerLanePresence, /summarizePresenceTrace/);
assert.match(composerLanePresence, /createVercelAISDKAdapter/);
assert.match(composerLanePresence, /statusBar/);
assert.match(composerLanePresence, /messageComposer/);
assert.match(composerLanePresence, /progressLane/);
assert.match(composerLanePresence, /traceTimeline/);
assert.match(composerLanePresence, /data-renderer/);
assert.match(composerLanePresence, /data-presence-state/);
assert.match(composerLanePresence, /data-presence-phase/);
assert.match(composerLanePresence, /data-presence-attention/);
assert.match(composerLanePresence, /data-presence-event/);
assert.match(composerLanePresence, /data-presence-before-output/);
assert.match(composerLanePresence, /data-composer-lock/);
assert.match(composerLanePresence, /data-assistant-text-empty/);
assert.match(composerLanePresence, /data-progress-step/);
assert.match(composerLanePresence, /renderer=composer-lane/);
assert.match(composerLanePresence, /statePath=/);
assert.match(composerLanePresence, /eventPath=/);
assert.match(composerLanePresence, /phasePath=/);
assert.match(composerLanePresence, /beforeOutput=true/);
assert.match(composerLanePresence, /streamOpenMs=/);
assert.match(composerLanePresence, /firstOutputMs=/);
assert.match(composerLanePresence, /leadMs=/);
assert.match(composerLanePresence, /finalState=/);
assert.match(composerLanePresence, /hasOutput=/);
assert.match(composerLanePresence, /complete=/);
assert.match(composerLanePresence, /interrupted=/);
assert.doesNotMatch(composerLanePresence, /@ai-presence\/face|packages\/face|renderPresenceFaceSvg|faceExpressionForPresence|<svg|svg/i);
assert.doesNotMatch(composerLanePresence, /@ai-presence\/react|react-dom|ReactDOM|createPresenceReactBindings/);
assert.doesNotMatch(composerLanePresence, /emotion[- ]detection|private emotion|private inference/i);

const assistantLifecyclePresence = readFileSync(resolve(root, "examples/assistant-lifecycle-presence.mjs"), "utf8");
assert.match(assistantLifecyclePresence, /@ai-presence\/core/);
assert.match(assistantLifecyclePresence, /@ai-presence\/adapters/);
assert.match(assistantLifecyclePresence, /createPresenceRuntime/);
assert.match(assistantLifecyclePresence, /createPresenceTrace/);
assert.match(assistantLifecyclePresence, /presenceControlInputsForSnapshot/);
assert.match(assistantLifecyclePresence, /summarizePresenceTrace/);
assert.match(assistantLifecyclePresence, /createAssistantLifecycleAdapter/);
assert.match(assistantLifecyclePresence, /run-created/);
assert.match(assistantLifecyclePresence, /message-created/);
assert.match(assistantLifecyclePresence, /text-delta/);
assert.match(assistantLifecyclePresence, /run-completed/);
assert.match(assistantLifecyclePresence, /data-surface/);
assert.match(assistantLifecyclePresence, /data-thread-id/);
assert.match(assistantLifecyclePresence, /data-run-id/);
assert.match(assistantLifecyclePresence, /data-message-id/);
assert.match(assistantLifecyclePresence, /data-presence-state/);
assert.match(assistantLifecyclePresence, /data-presence-phase/);
assert.match(assistantLifecyclePresence, /data-assistant-output-empty/);
assert.match(assistantLifecyclePresence, /data-presence-before-output/);
assert.match(assistantLifecyclePresence, /surface=assistant-lifecycle/);
assert.match(assistantLifecyclePresence, /statePath=/);
assert.match(assistantLifecyclePresence, /eventPath=/);
assert.match(assistantLifecyclePresence, /frameworkEventPath=/);
assert.match(assistantLifecyclePresence, /streamOpenMs=/);
assert.match(assistantLifecyclePresence, /firstOutputMs=/);
assert.match(assistantLifecyclePresence, /leadMs=/);
assert.match(assistantLifecyclePresence, /presenceBeforeOutputMs=/);
assert.match(assistantLifecyclePresence, /finalState=/);
assert.match(assistantLifecyclePresence, /hasOutput=/);
assert.match(assistantLifecyclePresence, /complete=/);
assert.match(assistantLifecyclePresence, /interrupted=/);
assert.doesNotMatch(assistantLifecyclePresence, /assistant-ui|@assistant-ui|langchain|@langchain|openai|@openai/i);
assert.doesNotMatch(assistantLifecyclePresence, /@ai-presence\/face|packages\/face|renderPresenceFaceSvg|faceExpressionForPresence|<svg|svg/i);
assert.doesNotMatch(assistantLifecyclePresence, /@ai-presence\/react|react-dom|ReactDOM|createPresenceReactBindings/);
assert.doesNotMatch(assistantLifecyclePresence, /emotion[- ]detection|private emotion|private inference/i);

const assistantUiExternalStorePresence = readFileSync(
  resolve(root, "examples/assistant-ui-external-store-presence.mjs"),
  "utf8",
);
assert.match(assistantUiExternalStorePresence, /@ai-presence\/core/);
assert.match(assistantUiExternalStorePresence, /@ai-presence\/adapters/);
assert.match(assistantUiExternalStorePresence, /createPresenceRuntime/);
assert.match(assistantUiExternalStorePresence, /createPresenceTrace/);
assert.match(assistantUiExternalStorePresence, /presenceControlInputsForSnapshot/);
assert.match(assistantUiExternalStorePresence, /summarizePresenceTrace/);
assert.match(assistantUiExternalStorePresence, /createAssistantLifecycleAdapter/);
assert.match(assistantUiExternalStorePresence, /www\.assistant-ui\.com\/docs\/runtimes\/custom\/external-store/);
assert.match(assistantUiExternalStorePresence, /ExternalStoreRuntime/);
assert.match(assistantUiExternalStorePresence, /onNew/);
assert.match(assistantUiExternalStorePresence, /isRunning:true/);
assert.match(assistantUiExternalStorePresence, /assistant-message:running-empty/);
assert.match(assistantUiExternalStorePresence, /assistant-message:running-delta/);
assert.match(assistantUiExternalStorePresence, /assistant-message:complete/);
assert.match(assistantUiExternalStorePresence, /status: \{ type: "running" \}/);
assert.match(assistantUiExternalStorePresence, /status: \{ type: "complete" \}/);
assert.match(assistantUiExternalStorePresence, /data-surface/);
assert.match(assistantUiExternalStorePresence, /data-framework/);
assert.match(assistantUiExternalStorePresence, /data-route/);
assert.match(assistantUiExternalStorePresence, /data-is-running/);
assert.match(assistantUiExternalStorePresence, /data-assistant-message-status/);
assert.match(assistantUiExternalStorePresence, /data-presence-state/);
assert.match(assistantUiExternalStorePresence, /data-presence-phase/);
assert.match(assistantUiExternalStorePresence, /data-assistant-output-empty/);
assert.match(assistantUiExternalStorePresence, /data-presence-before-output/);
assert.match(assistantUiExternalStorePresence, /surface=assistant-ui-external-store/);
assert.match(assistantUiExternalStorePresence, /framework=assistant-ui/);
assert.match(assistantUiExternalStorePresence, /route=ExternalStoreRuntime/);
assert.match(assistantUiExternalStorePresence, /statePath=/);
assert.match(assistantUiExternalStorePresence, /eventPath=/);
assert.match(assistantUiExternalStorePresence, /frameworkEventPath=/);
assert.match(assistantUiExternalStorePresence, /frameworkStatusPath=/);
assert.match(assistantUiExternalStorePresence, /streamOpenMs=/);
assert.match(assistantUiExternalStorePresence, /firstOutputMs=/);
assert.match(assistantUiExternalStorePresence, /leadMs=/);
assert.match(assistantUiExternalStorePresence, /presenceBeforeOutputMs=/);
assert.match(assistantUiExternalStorePresence, /finalState=/);
assert.match(assistantUiExternalStorePresence, /hasOutput=/);
assert.match(assistantUiExternalStorePresence, /complete=/);
assert.match(assistantUiExternalStorePresence, /interrupted=/);
assert.doesNotMatch(assistantUiExternalStorePresence, /from ["']@assistant-ui\/|require\(["']@assistant-ui\//);
assert.doesNotMatch(assistantUiExternalStorePresence, /from ["']@langchain\/|require\(["']@langchain\//);
assert.doesNotMatch(assistantUiExternalStorePresence, /from ["']openai["']|require\(["']openai["']\)/);
assert.doesNotMatch(assistantUiExternalStorePresence, /@ai-presence\/face|packages\/face|renderPresenceFaceSvg|faceExpressionForPresence|<svg|svg/i);
assert.doesNotMatch(assistantUiExternalStorePresence, /@ai-presence\/react|react-dom|ReactDOM|createPresenceReactBindings/);
assert.doesNotMatch(assistantUiExternalStorePresence, /emotion[- ]detection|private emotion|private inference/i);

const coreRuntimeBenchmark = readFileSync(resolve(root, "scripts/benchmark-core-runtime.mjs"), "utf8");
assert.match(coreRuntimeBenchmark, /createPresenceRuntime/);
assert.match(coreRuntimeBenchmark, /createPresenceTrace/);
assert.match(coreRuntimeBenchmark, /summarizePresenceTrace/);
assert.match(coreRuntimeBenchmark, /createVercelAISDKAdapter/);
assert.match(coreRuntimeBenchmark, /createChatEventAdapter/);
assert.match(coreRuntimeBenchmark, /summary=complete/);
assert.doesNotMatch(coreRuntimeBenchmark, /@ai-presence\/face|packages\/face/);

const adaptersReadme = readFileSync(resolve(root, "packages/adapters/README.md"), "utf8");
assert.match(adaptersReadme, /createAssistantLifecycleAdapter/);
assert.match(adaptersReadme, /run-created \/ run-started \/ submitted \/ running -> model-waiting -> thinking/);
assert.match(adaptersReadme, /message-created \/ content-block-start \/ stream-open -> stream-open -> waiting/);
assert.match(adaptersReadme, /text-delta \/ message-delta \/ output -> token -> streaming/);
assert.match(adaptersReadme, /run-completed \/ message-completed \/ ready -> response-complete -> ready/);
assert.match(adaptersReadme, /node examples\/assistant-lifecycle-presence\.mjs/);
assert.match(adaptersReadme, /assistant-ui ExternalStoreRuntime/);
assert.match(adaptersReadme, /onNew -> run-created -> model-waiting -> thinking/);
assert.match(adaptersReadme, /isRunning=true -> running -> model-waiting -> thinking/);
assert.match(adaptersReadme, /status\.type="running" -> message-created -> stream-open -> waiting/);
assert.match(adaptersReadme, /first assistant text chunk -> text-delta -> token -> streaming/);
assert.match(adaptersReadme, /status\.type="complete" -> complete -> response-complete -> ready/);
assert.match(adaptersReadme, /node examples\/assistant-ui-external-store-presence\.mjs/);
assert.match(adaptersReadme, /framework=assistant-ui/);
assert.match(adaptersReadme, /route=ExternalStoreRuntime/);
assert.match(adaptersReadme, /frameworkStatusPath/);
assert.match(adaptersReadme, /presenceBeforeOutputMs/);
assert.match(adaptersReadme, /createOpenAIResponsesAdapter/);
assert.match(adaptersReadme, /response\.created -> model-waiting -> thinking/);
assert.match(adaptersReadme, /response\.output_text\.delta -> token -> streaming/);
assert.match(adaptersReadme, /response\.function_call_arguments\.delta -> token -> streaming/);
assert.match(adaptersReadme, /response\.failed \/ error -> error -> error/);
assert.match(adaptersReadme, /response\.incomplete -> interrupt -> interrupted/);
assert.match(adaptersReadme, /reference face frame evidence/);
assert.match(adaptersReadme, /decision-trace evidence/);
assert.match(adaptersReadme, /channels=gaze,blink,brows,mouth,posture,motion/);
assert.match(adaptersReadme, /trace=complete/);
assert.match(adaptersReadme, /transition=thinking:stream-open\+0ms/);
assert.match(adaptersReadme, /transitionReads=6\/6/);
assert.match(adaptersReadme, /reads=state,transitionEvent,transitionAgeMs/);

const adapterTypes = readFileSync(resolve(root, "packages/adapters/src/runtime-adapter.d.ts"), "utf8");
assert.match(adapterTypes, /AssistantLifecycleStatus/);
assert.match(adapterTypes, /AssistantLifecycleEvent/);
assert.match(adapterTypes, /AssistantLifecycleAdapter/);
assert.match(adapterTypes, /assistantLifecycleEventToRuntimeSignal/);
assert.match(adapterTypes, /createAssistantLifecycleAdapter/);
assert.match(adapterTypes, /textFromAssistantLifecycleEvent/);

for (const mediaFile of [
  "docs/media/presence-comparison.jpg",
  "docs/media/react-browser-demo.jpg",
]) {
  const bytes = readFileSync(resolve(root, mediaFile));
  assert.ok(bytes.length > 10_000, `${mediaFile} is unexpectedly small`);
  assert.equal(bytes[0], 0xff, `${mediaFile} is not a JPEG`);
  assert.equal(bytes[1], 0xd8, `${mediaFile} is not a JPEG`);
}

for (const mediaFile of [
  "docs/media/main-app-release.png",
]) {
  const bytes = readFileSync(resolve(root, mediaFile));
  assert.ok(bytes.length > 10_000, `${mediaFile} is unexpectedly small`);
  assert.equal(bytes[0], 0x89, `${mediaFile} is not a PNG`);
  assert.equal(bytes[1], 0x50, `${mediaFile} is not a PNG`);
  assert.equal(bytes[2], 0x4e, `${mediaFile} is not a PNG`);
  assert.equal(bytes[3], 0x47, `${mediaFile} is not a PNG`);
}

const packages = [
  {
    dir: "packages/core",
    name: "@ai-presence/core",
    description: "Renderer-agnostic presence state runtime for AI interfaces.",
    types: "src/presence-core.d.ts",
    exports: [
      "createPresenceControlInputRuntime",
      "createPresenceRuntime",
      "createPresenceTrace",
      "presenceControlInputsForSnapshot",
      "summarizePresenceTrace",
      "PresenceState",
      "PresenceEvent",
    ],
  },
  {
    dir: "packages/face",
    name: "@ai-presence/face",
    description: "SVG reference face renderer with parallel presence controllers.",
    types: "src/presence-face.d.ts",
    exports: [
      "FACE_CONTROL_CHANNELS",
      "createFaceControllerFrameRuntime",
      "FaceExpression",
      "createFaceControllerRuntime",
      "createFaceRenderer",
      "faceControllerCoherenceForFrame",
      "faceControllerDecisionTraceForFrame",
      "faceControllerFrameForPresence",
      "faceControllerDecisionsForPresence",
      "faceControlsForPresence",
      "faceExpressionForPresence",
      "renderPresenceFaceSvg",
    ],
  },
  {
    dir: "packages/adapters",
    name: "@ai-presence/adapters",
    description: "Runtime signal adapters for AI Presence Kit.",
    types: "src/runtime-adapter.d.ts",
    exports: [
      "createAssistantLifecycleAdapter",
      "createVercelAISDKAdapter",
      "createOpenAIResponsesAdapter",
      "createOpenAIRealtimeAdapter",
      "createChatEventAdapter",
      "assistantLifecycleEventToRuntimeSignal",
      "openAIResponsesEventToRuntimeSignal",
    ],
  },
  {
    dir: "packages/react",
    name: "@ai-presence/react",
    description: "React bindings for AI Presence Kit presence runtimes.",
    types: "src/presence-react.d.ts",
    exports: ["createPresenceReactBindings"],
  },
];

for (const packageInfo of packages) {
  const packagePath = resolve(root, packageInfo.dir);
  const manifest = JSON.parse(readFileSync(resolve(packagePath, "package.json"), "utf8"));
  assert.equal(manifest.name, packageInfo.name);
  assert.equal(manifest.description, packageInfo.description);
  assert.equal(manifest.types, `./${packageInfo.types}`);
  assert.equal(manifest.module, "./dist/index.mjs");
  assert.equal(manifest.exports["."].import, "./dist/index.mjs");
  assert.equal(manifest.exports["."].require, manifest.main);
  assert.ok(existsSync(resolve(packagePath, packageInfo.types)), `${packageInfo.name} types missing`);
  assert.ok(existsSync(resolve(packagePath, "dist/index.mjs")), `${packageInfo.name} ESM entry missing`);

  const api = require(packagePath);
  const esmApi = await import(pathToFileURL(resolve(packagePath, "dist/index.mjs")).href);
  for (const exportName of packageInfo.exports) {
    assert.ok(api[exportName], `${packageInfo.name} missing ${exportName}`);
    assert.ok(esmApi[exportName], `${packageInfo.name} ESM missing ${exportName}`);
  }
}

const coreTypes = readFileSync(resolve(root, "packages/core/src/presence-core.d.ts"), "utf8");
assert.match(coreTypes, /PresenceTransitionEvent = PresenceEventValue \| "set-state"/);
assert.match(coreTypes, /PresenceTraceSummary/);
assert.match(coreTypes, /firstOutputMs: number \| null/);
assert.match(coreTypes, /presenceBeforeOutputMs: number \| null/);
assert.match(coreTypes, /interruptMs: number \| null/);
assert.match(coreTypes, /interrupted: boolean/);
assert.match(coreTypes, /summarizePresenceTrace/);
assert.match(coreTypes, /previousState: PresenceStateValue \| null/);
assert.match(coreTypes, /transitionEvent: PresenceTransitionEvent \| null/);
assert.match(coreTypes, /transitionAgeMs: number/);

const faceGlobal = globalThis.AIPresenceFace;
assert.equal(typeof faceGlobal.faceControllerDecisionsForPresence, "function");
assert.equal(typeof faceGlobal.faceControllerCoherenceForFrame, "function");
assert.equal(typeof faceGlobal.faceControllerDecisionTraceForFrame, "function");
assert.equal(typeof faceGlobal.faceControllerFrameForPresence, "function");
assert.equal(typeof faceGlobal.createFaceControllerFrameRuntime, "function");
assert.equal(typeof faceGlobal.renderPresenceFaceSvg, "function");
assert.deepEqual(faceGlobal.FACE_CONTROL_CHANNELS, ["gaze", "blink", "brows", "mouth", "posture", "motion"]);
assert.match(faceGlobal.renderPresenceFaceSvg("thinking", { timeMs: 1200 }).svg, /data-presence-state="thinking"/);
assert.match(faceGlobal.renderPresenceFaceSvg("thinking", { timeMs: 1200 }).svg, /data-face-decision-trace="complete"/);
assert.equal(faceGlobal.renderPresenceFaceSvg("thinking", { timeMs: 1200 }).attributes.decisionTrace, "complete");
assert.equal(faceGlobal.renderPresenceFaceSvg("thinking", { timeMs: 1200 }).decisionTrace.decisionCount, 6);
const transitionGlobalSvg = faceGlobal.renderPresenceFaceSvg({
  state: "thinking",
  previousState: "ready",
  event: "submit",
  updatedAt: 1000,
}, {
  now: 1080,
  timeMs: 1080,
});
assert.deepEqual(transitionGlobalSvg.decisionTrace.transitionContext, {
  previousState: "ready",
  transitionEvent: "submit",
  transitionAgeMs: 80,
});
assert.equal(transitionGlobalSvg.attributes.previousState, "ready");
assert.equal(transitionGlobalSvg.attributes.transitionEvent, "submit");
assert.equal(transitionGlobalSvg.attributes.transitionAgeMs, "80");
assert.match(transitionGlobalSvg.svg, /data-face-previous-state="ready"/);
assert.match(transitionGlobalSvg.svg, /data-face-transition-event="submit"/);
assert.match(transitionGlobalSvg.svg, /data-face-transition-age-ms="80"/);
assert.equal(faceGlobal.faceControllerFrameForPresence("waiting", { timeMs: 1200 }).coherence.rendererSafe, true);
assert.equal(faceGlobal.faceControllerDecisionTraceForFrame(
  faceGlobal.faceControllerFrameForPresence("waiting", { timeMs: 1200 }),
).decisionCount, 6);

const coreApi = require(resolve(root, "packages/core"));
assert.equal(typeof globalThis.AIPresenceCore.summarizePresenceTrace, "function");
const coreTraceSummary = coreApi.summarizePresenceTrace([
  { state: coreApi.PresenceState.THINKING, event: coreApi.PresenceEvent.SUBMIT, elapsedMs: 0 },
  { state: coreApi.PresenceState.STREAMING, event: coreApi.PresenceEvent.TOKEN, elapsedMs: 44 },
]);
assert.equal(coreTraceSummary.firstOutputEvent, coreApi.PresenceEvent.TOKEN);
assert.equal(coreTraceSummary.presenceBeforeOutputMs, 44);
assert.equal(coreTraceSummary.interruptMs, null);
assert.equal(coreTraceSummary.interrupted, false);
let contextValue = null;
const fakeReact = {
  createContext(defaultValue) {
    contextValue = defaultValue;
    return {
      Provider: "PresenceProvider",
      defaultValue,
    };
  },
  createElement(type, props, children) {
    contextValue = props.value;
    return { type, props, children };
  },
  useContext(context) {
    return contextValue || context.defaultValue;
  },
  useEffect(effect) {
    const cleanup = effect();
    if (typeof cleanup === "function") cleanup();
    return cleanup;
  },
  useState(initialState) {
    const state = typeof initialState === "function" ? initialState() : initialState;
    return [state, () => {}];
  },
  useSyncExternalStore(subscribe, getSnapshot) {
    const unsubscribe = subscribe(() => {});
    unsubscribe();
    return getSnapshot();
  },
};

const reactApi = require(resolve(root, "packages/react"));
const reactBindings = reactApi.createPresenceReactBindings(fakeReact);
assert.equal(typeof reactBindings.usePresenceControlInputs, "function");
assert.equal(typeof reactBindings.usePresenceFrameTime, "function");
assert.equal(typeof reactBindings.PresenceRendererSlot, "function");
reactBindings.defaultRuntime.send(coreApi.PresenceEvent.SUBMIT);
assert.equal(reactBindings.usePresenceControlInputs().latencyPhase, "before-output");
const reactSlot = reactBindings.PresenceRendererSlot({
  frameOptions: { now: () => 1200 },
  children: (slot) => slot,
});
assert.equal(reactSlot.snapshot.state, coreApi.PresenceState.THINKING);
assert.equal(reactSlot.controlInputs.latencyPhase, "before-output");
assert.equal(reactSlot.controlInputs.attentionTarget, "response");
assert.equal(reactSlot.frameTimeMs, 1200);
assert.equal(reactSlot.runtime, reactBindings.defaultRuntime);

const reactEsmApi = await import(pathToFileURL(resolve(root, "packages/react/dist/index.mjs")).href);
const reactEsmBindings = reactEsmApi.createPresenceReactBindings(fakeReact);
assert.equal(typeof reactEsmBindings.usePresenceFrameTime, "function");
assert.equal(typeof reactEsmBindings.PresenceRendererSlot, "function");
assert.equal(reactEsmBindings.usePresenceFrameTime({ now: () => 1200 }), 1200);

const reactTypes = readFileSync(resolve(root, "packages/react/src/presence-react.d.ts"), "utf8");
assert.match(reactTypes, /PresenceControlInputOptions/);
assert.match(reactTypes, /PresenceControlInputs/);
assert.match(reactTypes, /usePresenceControlInputs/);
assert.match(reactTypes, /PresenceFrameTimeOptions/);
assert.match(reactTypes, /usePresenceFrameTime/);
assert.match(reactTypes, /PresenceRendererSlotValue/);
assert.match(reactTypes, /PresenceRendererSlotProps/);
assert.match(reactTypes, /PresenceRendererSlot/);

const faceTypes = readFileSync(resolve(root, "packages/face/src/presence-face.d.ts"), "utf8");
assert.match(faceTypes, /motionScale\?: number/);
assert.match(faceTypes, /motionScale: string/);
assert.match(faceTypes, /PresenceTransitionEvent/);
assert.match(faceTypes, /FaceControllerTransitionContext/);
assert.match(faceTypes, /transitionContext: FaceControllerTransitionContext/);
assert.match(faceTypes, /transitionAgeMs: number \| null/);
assert.match(faceTypes, /decisionTrace: "complete" \| "incomplete"/);
assert.match(faceTypes, /decisionTraceChannels: string/);
assert.match(faceTypes, /decisionTraceRendererSafe: "true" \| "false"/);
assert.match(faceTypes, /latencyPhase\?: PresenceLatencyPhase/);
assert.match(faceTypes, /previousState\?: PresenceStateValue/);
assert.match(faceTypes, /transitionEvent\?: PresenceTransitionEvent/);
assert.match(faceTypes, /transitionAgeMs\?: string/);
assert.match(faceTypes, /decisionTrace: FaceControllerDecisionTrace/);
assert.match(faceTypes, /FaceControllerCoherence/);
assert.match(faceTypes, /faceControllerCoherenceForFrame/);
assert.match(faceTypes, /FaceControllerDecisionTrace/);
assert.match(faceTypes, /faceControllerDecisionTraceForFrame/);

const rootReadme = readFileSync(resolve(root, "README.md"), "utf8");
assert.match(rootReadme, /Why This Exists/);
assert.match(rootReadme, /AI interfaces should not feel frozen until text appears/);
assert.match(rootReadme, /Collaborating/);
assert.match(rootReadme, /AI interfaces, expressive systems, interaction design, SVG\/rendering, or low-latency UI behavior/);
assert.match(rootReadme, /docs\/INTEGRATION_QUICKSTART\.md/);
assert.match(rootReadme, /minimal copyable path from published packages/);
assert.match(rootReadme, /examples\/quickstart-presence\.mjs/);
assert.match(rootReadme, /examples\/status-surface-presence\.mjs/);
assert.match(rootReadme, /examples\/composer-lane-presence\.mjs/);
assert.match(rootReadme, /examples\/assistant-lifecycle-presence\.mjs/);
assert.match(rootReadme, /examples\/assistant-ui-external-store-presence\.mjs/);
assert.match(rootReadme, /examples\/react-browser-composer-lane\.html/);
assert.match(rootReadme, /npm run browser:smoke/);
assert.match(rootReadme, /local release gate, not part of CI or the default `npm run validate` gate/);
assert.match(rootReadme, /OpenAI Responses adapter usage/);
assert.match(rootReadme, /createOpenAIResponsesAdapter/);
assert.match(rootReadme, /response\.created/);
assert.match(rootReadme, /response\.output_text\.delta/);
assert.match(rootReadme, /response\.completed/);
assert.match(rootReadme, /npm run demo:quickstart/);
assert.match(rootReadme, /npm run demo:status-surface/);
assert.match(rootReadme, /npm run demo:composer-lane/);
assert.match(rootReadme, /npm run demo:assistant-lifecycle/);
assert.match(rootReadme, /npm run demo:assistant-ui-external-store/);
assert.match(rootReadme, /Vercel AI SDK, assistant lifecycle, OpenAI Responses, OpenAI Realtime, and generic chat transitions/);
assert.match(rootReadme, /five starter adapter paths/);
assert.match(rootReadme, /createAssistantLifecycleAdapter/);
assert.match(rootReadme, /surface=assistant-lifecycle/);
assert.match(rootReadme, /surface=assistant-ui-external-store/);
assert.match(rootReadme, /framework=assistant-ui/);
assert.match(rootReadme, /route=ExternalStoreRuntime/);
assert.match(rootReadme, /thread\/run\/message lifecycle/i);
assert.match(rootReadme, /data-assistant-output-empty="true"/);
assert.match(rootReadme, /release consumer smoke now repeats the OpenAI Responses adapter path, assistant lifecycle adapter path, assistant-ui ExternalStoreRuntime route, and composer-lane pattern/i);
assert.doesNotMatch(rootReadme, /three starter adapter paths/);
assert.match(rootReadme, /framework-free non-face consumer proof/);
assert.match(rootReadme, /real-app-style composer lane proof/);
assert.match(rootReadme, /data-renderer="status-surface"/);
assert.match(rootReadme, /data-renderer="composer-lane"/);
assert.match(rootReadme, /face-free React composer-lane route/);
assert.match(rootReadme, /without loading `@ai-presence\/face`/);
assert.match(rootReadme, /data-stream-open-ms="420ms"/);
assert.match(rootReadme, /data-first-output-ms="none"/);
assert.match(rootReadme, /positive `data-lead-ms`/);
assert.match(rootReadme, /real-app adoption slice/i);
assert.match(rootReadme, /named assistant-ui adoption proof/i);
assert.match(rootReadme, /documented `onNew`, `isRunning`, and assistant message `status\.type` values/);
assert.doesNotMatch(rootReadme, /Create or confirm control of the npm `@ai-presence` scope before publishing/);
assert.match(rootReadme, /main-app-release\.png/);
assert.doesNotMatch(rootReadme, /presence-comparison-release\.png/);
assert.doesNotMatch(rootReadme, /react-before-output-release\.png/);
assert.match(rootReadme, /summarizePresenceTrace/);
assert.match(rootReadme, /firstOutputMs/);
assert.match(rootReadme, /interruptMs/);
assert.match(rootReadme, /interrupted/);
assert.match(rootReadme, /PresenceRendererSlot/);
assert.match(rootReadme, /usePresenceFrameTime/);
assert.match(rootReadme, /renderPresenceFaceSvg/);
assert.match(rootReadme, /data-face-transition-context="thinking stream-open 0"/);
assert.match(rootReadme, /data-face-transition-controller-reads="gaze blink brows mouth posture motion"/);
assert.match(rootReadme, /data-face-transition-controller-reads-event="true"/);
assert.match(rootReadme, /data-face-transition-controller-reads-age="true"/);
assert.match(rootReadme, /npm run demo:adapters/);
assert.match(rootReadme, /npm run perf:core/);
assert.match(rootReadme, /renderer-agnostic runtime path/);
assert.match(rootReadme, /npm run perf:face/);
assert.match(rootReadme, /0\.25ms/);
assert.match(rootReadme, /reference face frame evidence/);
assert.match(rootReadme, /decision-trace evidence/);
assert.match(rootReadme, /data-generic-first-token-ms/);
assert.match(rootReadme, /data-presence-first-state-ms/);
assert.match(rootReadme, /data-presence-frame-before-token-ms/);
assert.match(rootReadme, /data-presence-decision-trace-lead-ms/);
assert.match(rootReadme, /data-face-decision-trace="complete"/);
assert.match(rootReadme, /data-face-decision-trace-channels="gaze blink brows mouth posture motion"/);
assert.match(rootReadme, /data-face-decision-trace-decisions="6"/);
assert.match(rootReadme, /data-face-decision-trace-warnings="0"/);
assert.match(rootReadme, /data-face-decision-trace-renderer-safe="true"/);
assert.match(rootReadme, /data-face-latency-phase="before-output"/);
assert.match(rootReadme, /data-nonface-renderer="status-surface"/);
assert.match(rootReadme, /data-nonface-state="waiting"/);
assert.match(rootReadme, /data-nonface-phase="before-output"/);
assert.match(rootReadme, /data-nonface-before-output="true"/);
assert.match(rootReadme, /data-transition-events="submit stream-open token interrupt"/);
assert.match(rootReadme, /data-transition-decision-trace="complete"/);
assert.match(rootReadme, /data-transition-controller-reads="gaze blink brows mouth posture motion"/);

const faceReadme = readFileSync(resolve(root, "packages/face/README.md"), "utf8");
assert.match(faceReadme, /motionScale/);
assert.match(faceReadme, /reduced motion/);
assert.match(faceReadme, /renderer-owned decision-trace evidence/);
assert.match(faceReadme, /transitionContext/);
assert.match(faceReadme, /data-face-transition-event/);
assert.match(faceReadme, /data-face-decision-trace\*/);
assert.doesNotMatch(faceReadme, /emotion[- ]detection|private emotion/i);

const reactReadme = readFileSync(resolve(root, "packages/react/README.md"), "utf8");
assert.match(reactReadme, /PresenceRendererSlot/);
assert.match(reactReadme, /controlInputs/);
assert.match(reactReadme, /usePresenceFrameTime/);
assert.match(reactReadme, /Date\.now/);
assert.match(reactReadme, /non-face status surface/);
assert.match(reactReadme, /data-nonface-renderer="status-surface"/);
assert.match(reactReadme, /data-nonface-phase="before-output"/);
assert.doesNotMatch(reactReadme, /emotion[- ]detection|private emotion/i);

console.log("package-surface ok");
