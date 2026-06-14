import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const root = resolve(new URL("..", import.meta.url).pathname);
const html = readFileSync(resolve(root, "examples/react-browser.html"), "utf8");
const script = readFileSync(resolve(root, "examples/react-browser-demo.js"), "utf8");
const css = readFileSync(resolve(root, "examples/react-browser.css"), "utf8");
const {
  PresenceEvent,
  PresenceState,
  createPresenceRuntime,
  createPresenceTrace,
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
assert.match(script, /data-presence-phase/);
assert.match(script, /data-presence-attention/);
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
assert.doesNotMatch(script, /emotion/i);

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
recordAt(traceAdapter.update({ status: "streaming", messages: [] }), 420);
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
assert.match(css, /@media \(max-width: 760px\)/);

console.log("react-browser-example ok");
