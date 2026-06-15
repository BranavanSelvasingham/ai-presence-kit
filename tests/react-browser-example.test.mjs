import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const root = resolve(new URL("..", import.meta.url).pathname);
const html = readFileSync(resolve(root, "examples/react-browser.html"), "utf8");
const composerLaneHtml = readFileSync(resolve(root, "examples/react-browser-composer-lane.html"), "utf8");
const script = readFileSync(resolve(root, "examples/react-browser-demo.js"), "utf8");
const css = readFileSync(resolve(root, "examples/react-browser.css"), "utf8");
const {
  PresenceEvent,
  PresenceState,
  createPresenceRuntime,
  createPresenceTrace,
  presenceControlInputsForSnapshot,
  summarizePresenceTrace,
} = require(resolve(root, "packages/core/src/presence-core.js"));
const { createVercelAISDKAdapter } = require(resolve(root, "packages/adapters/src/runtime-adapter.js"));
const { renderPresenceFaceSvg } = require(resolve(root, "packages/face/src/presence-face.js"));

assert.match(html, /node_modules\/react\/umd\/react\.production\.min\.js/);
assert.match(html, /node_modules\/react-dom\/umd\/react-dom\.production\.min\.js/);
assert.match(html, /packages\/core\/src\/presence-core\.js/);
assert.match(html, /packages\/face\/src\/presence-face\.js/);
assert.match(html, /packages\/react\/src\/presence-react\.js/);
assert.match(html, /data-react-demo-root/);

assert.match(composerLaneHtml, /packages\/core\/src\/presence-core\.js/);
assert.match(composerLaneHtml, /packages\/adapters\/src\/runtime-adapter\.js/);
assert.match(composerLaneHtml, /packages\/react\/src\/presence-react\.js/);
assert.match(composerLaneHtml, /node_modules\/react\/umd\/react\.production\.min\.js/);
assert.match(composerLaneHtml, /node_modules\/react-dom\/umd\/react-dom\.production\.min\.js/);
assert.match(composerLaneHtml, /react-browser-demo\.js\?mode=composer-lane/);
assert.match(composerLaneHtml, /data-react-demo-root/);
assert.doesNotMatch(composerLaneHtml, /packages\/face|presence-face|AIPresenceFace|@ai-presence\/face/);
assert.doesNotMatch(composerLaneHtml, /emotion/i);

assert.match(script, /ReactDOM\.createRoot/);
assert.match(script, /createPresenceReactBindings\(React, \{ runtime \}\)/);
assert.match(script, /createVercelAISDKAdapter\(runtime\)/);
assert.match(script, /createPresenceTrace\(\{ limit: 16 \}\)/);
assert.match(script, /summarizePresenceTrace\(reactTrace\)/);
assert.match(script, /recordReactTraceSnapshot\(submitSnapshot, 0\)/);
assert.match(script, /recordReactTraceSnapshot\(streamOpenSnapshot, 420\)/);
assert.match(script, /recordReactTraceSnapshot\(firstTokenSnapshot, 980\)/);
assert.match(script, /recordReactTraceSnapshot\(laterTokenSnapshot, 1520\)/);
assert.match(script, /recordReactTraceSnapshot\(completeSnapshot, 2080\)/);
assert.match(script, /summary\.presenceBeforeOutputMs/);
assert.match(script, /bindings\.PresenceRendererSlot/);
assert.match(script, /React\.createElement\(NonFaceRendererSurface, \{/);
assert.match(script, /data-presence-phase/);
assert.match(script, /data-presence-attention/);
assert.match(script, /data-nonface-renderer/);
assert.match(script, /data-nonface-state/);
assert.match(script, /data-nonface-phase/);
assert.match(script, /data-nonface-attention/);
assert.match(script, /data-nonface-event/);
assert.match(script, /data-nonface-frame-time/);
assert.match(script, /data-nonface-before-output/);
assert.match(script, /data-react-trace-summary/);
assert.match(script, /data-react-trace-entry-count/);
assert.match(script, /data-react-trace-first-output-ms/);
assert.match(script, /data-react-trace-first-output-event/);
assert.match(script, /data-react-trace-lead-ms/);
assert.match(script, /data-react-trace-final-state/);
assert.match(script, /data-react-trace-has-output/);
assert.match(script, /data-react-trace-complete/);
assert.match(script, /faceExpressionForPresence\(snapshot\)/);
assert.doesNotMatch(script, /faceControllerFrameForPresence/);
assert.doesNotMatch(script, /faceControllerDecisionTraceForFrame/);
assert.match(script, /renderPresenceFaceSvg\(snapshot, \{/);
assert.match(script, /now: frameTimeMs/);
assert.match(script, /timeMs: frameTimeMs/);
assert.match(script, /dangerouslySetInnerHTML: \{ __html: renderedFace\.svg \}/);
assert.match(script, /data-face-svg-renderer/);
assert.match(script, /data-face-svg-state/);
assert.match(script, /data-face-svg-channels/);
assert.match(script, /data-face-svg-frame-time/);
assert.match(script, /data-face-svg-motion-energy/);
assert.match(script, /data-face-decision-trace/);
assert.match(script, /data-face-decision-trace-channels/);
assert.match(script, /data-face-decision-trace-decisions/);
assert.match(script, /data-face-decision-trace-warnings/);
assert.match(script, /data-face-decision-trace-renderer-safe/);
assert.match(script, /data-face-latency-phase/);
assert.match(script, /data-face-previous-state/);
assert.match(script, /data-face-transition-event/);
assert.match(script, /data-face-transition-age-ms/);
assert.match(script, /data-face-transition-context/);
assert.match(script, /data-face-transition-controller-reads/);
assert.match(script, /data-face-transition-controller-reads-event/);
assert.match(script, /data-face-transition-controller-reads-age/);
assert.match(script, /renderedFace\.attributes\.decisionTrace/);
assert.match(script, /renderedFace\.attributes\.decisionTraceChannels/);
assert.match(script, /renderedFace\.attributes\.decisionTraceDecisions/);
assert.match(script, /renderedFace\.attributes\.decisionTraceWarnings/);
assert.match(script, /renderedFace\.attributes\.decisionTraceRendererSafe/);
assert.match(script, /renderedFace\.attributes\.latencyPhase/);
assert.match(script, /renderedFace\.attributes\.previousState/);
assert.match(script, /renderedFace\.attributes\.transitionEvent/);
assert.match(script, /renderedFace\.attributes\.transitionAgeMs/);
assert.match(script, /transitionEvidenceForRenderedFace\(renderedFace\)/);
assert.match(script, /controllerReadChannels\(renderedFace\.decisionTrace, "transitionEvent"\)/);
assert.match(script, /controllerReadChannels\(renderedFace\.decisionTrace, "transitionAgeMs"\)/);
assert.match(script, /decisionTrace\.decisions\[channel\]\?\.reads/);
assert.match(script, /data-renderer-slot-face/);
assert.match(script, /@ai-presence\/face/);
assert.match(script, /function ComposerLaneApp/);
assert.match(script, /function ComposerLaneSurface/);
assert.match(script, /function composerLaneTraceEvidence/);
assert.match(script, /summarizePresenceTrace\(trace\)/);
assert.match(script, /reactDemoMode/);
assert.match(script, /searchParams\.get\("mode"\)/);
assert.match(script, /data-react-composer-lane-route/);
assert.match(script, /data-react-composer-lane-stream-open-ms/);
assert.match(script, /data-react-composer-lane-first-output-ms/);
assert.match(script, /data-react-composer-lane-lead-ms/);
assert.match(script, /data-react-composer-lane-has-output/);
assert.match(script, /data-renderer": "composer-lane"/);
assert.match(script, /data-presence-state/);
assert.match(script, /data-presence-phase/);
assert.match(script, /data-presence-attention/);
assert.match(script, /data-presence-event/);
assert.match(script, /data-presence-before-output/);
assert.match(script, /data-composer-lock/);
assert.match(script, /data-assistant-text-empty/);
assert.match(script, /data-progress-step/);
assert.match(script, /data-stream-open-ms/);
assert.match(script, /data-first-output-ms/);
assert.match(script, /data-lead-ms/);
assert.match(script, /pendingComposerLeadMs/);
assert.doesNotMatch(script, /emotion/i);

const composerLaneSource = script.match(/function ComposerLaneApp\([\s\S]*?\n  function PresencePanel/);
assert.ok(composerLaneSource, "ComposerLaneApp source missing");
assert.match(composerLaneSource[0], /bindings\.PresenceProvider/);
assert.match(composerLaneSource[0], /bindings\.PresenceRendererSlot/);
assert.match(composerLaneSource[0], /createPresenceTrace\(\{ limit: 24 \}\)/);
assert.match(composerLaneSource[0], /aiSdkPresence\.update/);
assert.doesNotMatch(composerLaneSource[0], /PresenceFace|renderPresenceFaceSvg|faceExpressionForPresence|renderedFace|data-face-|<svg|svg/i);

const nonFaceSurfaceSource = script.match(/function NonFaceRendererSurface\([\s\S]*?\n  }\n\n  function reactTraceSummaryEvidence/);
assert.ok(nonFaceSurfaceSource, "NonFaceRendererSurface source missing");
assert.match(nonFaceSurfaceSource[0], /snapshot\.state/);
assert.match(nonFaceSurfaceSource[0], /controlInputs\.latencyPhase/);
assert.match(nonFaceSurfaceSource[0], /controlInputs\.attentionTarget/);
assert.match(nonFaceSurfaceSource[0], /snapshot\.event/);
assert.match(nonFaceSurfaceSource[0], /String\(frameTimeMs\)/);
assert.match(nonFaceSurfaceSource[0], /controlInputs\.latencyPhase === "before-output"/);
assert.doesNotMatch(nonFaceSurfaceSource[0], /PresenceFace|renderPresenceFaceSvg|faceExpressionForPresence|renderedFace|data-face-/);

const traceRuntime = createPresenceRuntime({ initialState: PresenceState.IDLE });
const traceAdapter = createVercelAISDKAdapter(traceRuntime);
const reactTrace = createPresenceTrace({ limit: 16 });

function recordAt(snapshot, updatedAt) {
  reactTrace.record({
    ...snapshot,
    updatedAt,
  });
}

recordAt(traceAdapter.onSubmit("Why does this feel faster?"), 0);
const waitingSnapshot = traceAdapter.update({ status: "streaming", messages: [] });
recordAt(waitingSnapshot, 420);
recordAt(traceAdapter.update({
  status: "streaming",
  messages: [{ role: "assistant", parts: [{ type: "text", text: "Presence moved through thinking" }] }],
}), 980);
recordAt(traceAdapter.update({
  status: "streaming",
  messages: [{ role: "assistant", parts: [{ type: "text", text: "Presence moved through thinking and waiting before the first visible token." }] }],
}), 1520);
recordAt(traceAdapter.onFinish({ finishReason: "stop" }), 2080);

const reactTraceSummary = summarizePresenceTrace(reactTrace);
assert.equal(reactTraceSummary.entryCount, 5);
assert.equal(reactTraceSummary.firstStateMs, 0);
assert.equal(reactTraceSummary.streamOpenMs, 420);
assert.equal(reactTraceSummary.firstTokenMs, 980);
assert.equal(reactTraceSummary.firstOutputMs, 980);
assert.equal(reactTraceSummary.firstOutputEvent, PresenceEvent.TOKEN);
assert.equal(reactTraceSummary.presenceBeforeOutputMs, 980);
assert.equal(reactTraceSummary.finalState, PresenceState.READY);
assert.equal(reactTraceSummary.hasOutput, true);
assert.equal(reactTraceSummary.complete, true);

const composerRuntime = createPresenceRuntime({ initialState: PresenceState.IDLE });
const composerAdapter = createVercelAISDKAdapter(composerRuntime);
const composerTrace = createPresenceTrace({ limit: 24 });
const composerMessages = [{ role: "user", content: "Write a concise launch note for before-output presence." }];

function recordComposerAt(snapshot, updatedAt) {
  composerTrace.record({
    ...snapshot,
    updatedAt,
  });
}

recordComposerAt(composerAdapter.update({ status: "submitted", messages: composerMessages }), 0);
const composerWaitingSnapshot = composerAdapter.update({ status: "streaming", messages: composerMessages });
recordComposerAt(composerWaitingSnapshot, 420);
const pendingComposerSummary = summarizePresenceTrace(composerTrace);
const composerWaitingInputs = presenceControlInputsForSnapshot(composerWaitingSnapshot, {
  now: composerWaitingSnapshot.updatedAt,
});
assert.equal(composerWaitingSnapshot.state, PresenceState.WAITING);
assert.equal(composerWaitingSnapshot.event, PresenceEvent.STREAM_OPEN);
assert.equal(composerWaitingInputs.latencyPhase, "before-output");
assert.equal(composerWaitingInputs.attentionTarget, "response");
assert.equal(pendingComposerSummary.streamOpenMs, 420);
assert.equal(pendingComposerSummary.hasOutput, false);
assert.equal(String(
  composerWaitingInputs.latencyPhase === "before-output"
    && pendingComposerSummary.hasOutput === false,
), "true");

recordComposerAt(composerAdapter.update({
  status: "streaming",
  messages: [
    ...composerMessages,
    { role: "assistant", content: "Lead with the pre-output" },
  ],
}), 980);
recordComposerAt(composerAdapter.update({
  status: "streaming",
  messages: [
    ...composerMessages,
    { role: "assistant", content: "Lead with the pre-output posture evidence." },
  ],
}), 1520);
recordComposerAt(composerAdapter.update({
  status: "ready",
  messages: [
    ...composerMessages,
    { role: "assistant", content: "Lead with the pre-output posture evidence." },
  ],
}), 2080);
const composerTraceSummary = summarizePresenceTrace(composerTrace);
assert.equal(composerTraceSummary.entryCount, 5);
assert.equal(composerTraceSummary.streamOpenMs, 420);
assert.equal(composerTraceSummary.firstOutputMs, 980);
assert.equal(composerTraceSummary.presenceBeforeOutputMs, 980);
assert.equal(composerTraceSummary.finalState, PresenceState.READY);
assert.equal(composerTraceSummary.hasOutput, true);
assert.equal(composerTraceSummary.complete, true);

const waitingInputs = presenceControlInputsForSnapshot(waitingSnapshot, { now: waitingSnapshot.updatedAt });
assert.equal(waitingSnapshot.state, PresenceState.WAITING);
assert.equal(waitingSnapshot.event, PresenceEvent.STREAM_OPEN);
assert.equal(waitingInputs.latencyPhase, "before-output");
assert.equal(waitingInputs.attentionTarget, "response");
assert.equal(String(waitingInputs.latencyPhase === "before-output"), "true");

const thinkingFace = renderPresenceFaceSvg("thinking", { now: 1000, timeMs: 1000 });
assert.equal(thinkingFace.frameReport.sharedInputs.latencyPhase, "before-output");
assert.equal(thinkingFace.decisionTrace.complete, true);
assert.deepEqual(thinkingFace.decisionTrace.channels, ["gaze", "blink", "brows", "mouth", "posture", "motion"]);
assert.equal(thinkingFace.decisionTrace.decisionCount, 6);
assert.equal(thinkingFace.decisionTrace.warningCount, 0);
assert.equal(thinkingFace.decisionTrace.rendererSafe, true);
assert.equal(thinkingFace.attributes.decisionTrace, "complete");
assert.equal(thinkingFace.attributes.decisionTraceChannels, "gaze blink brows mouth posture motion");
assert.equal(thinkingFace.attributes.decisionTraceDecisions, "6");
assert.equal(thinkingFace.attributes.decisionTraceWarnings, "0");
assert.equal(thinkingFace.attributes.decisionTraceRendererSafe, "true");
assert.equal(thinkingFace.attributes.latencyPhase, "before-output");
assert.match(thinkingFace.svg, /data-face-decision-trace="complete"/);
assert.match(thinkingFace.svg, /data-face-latency-phase="before-output"/);

const freshTransitionFace = renderPresenceFaceSvg({
  state: "waiting",
  previousState: "thinking",
  event: "stream-open",
  updatedAt: 1000,
}, {
  now: 1000,
  timeMs: 1000,
});
const freshTransitionReadChannels = freshTransitionFace.decisionTrace.channels.filter((channel) => {
  const reads = freshTransitionFace.decisionTrace.decisions[channel].reads;
  return reads.includes("transitionEvent") && reads.includes("transitionAgeMs");
});
assert.equal(freshTransitionFace.attributes.previousState, "thinking");
assert.equal(freshTransitionFace.attributes.transitionEvent, "stream-open");
assert.equal(freshTransitionFace.attributes.transitionAgeMs, "0");
assert.deepEqual(freshTransitionFace.decisionTrace.transitionContext, {
  previousState: "thinking",
  transitionEvent: "stream-open",
  transitionAgeMs: 0,
});
assert.deepEqual(freshTransitionReadChannels, ["gaze", "blink", "brows", "mouth", "posture", "motion"]);
assert.match(freshTransitionFace.svg, /data-face-transition-event="stream-open"/);
assert.match(freshTransitionFace.svg, /data-face-transition-age-ms="0"/);

const renderedFace = renderPresenceFaceSvg("ready", { timeMs: 1000 });
assert.match(renderedFace.svg, /data-face-channels="gaze blink brows mouth posture motion"/);
assert.match(renderedFace.svg, /data-face-decision-trace-channels="gaze blink brows mouth posture motion"/);
assert.equal(renderedFace.attributes.channels, "gaze blink brows mouth posture motion");
assert.equal(renderedFace.attributes.decisionTrace, "complete");

assert.match(css, /grid-template-columns/);
assert.match(css, /nonface-status-surface/);
assert.match(css, /data-nonface-phase="before-output"/);
assert.match(css, /composer-lane-surface/);
assert.match(css, /data-presence-phase="before-output"/);
assert.match(css, /composer-lane-progress/);
assert.match(css, /@media \(max-width: 760px\)/);

console.log("react-browser-example ok");
