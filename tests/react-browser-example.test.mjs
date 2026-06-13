import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const root = resolve(new URL("..", import.meta.url).pathname);
const html = readFileSync(resolve(root, "examples/react-browser.html"), "utf8");
const script = readFileSync(resolve(root, "examples/react-browser-demo.js"), "utf8");
const css = readFileSync(resolve(root, "examples/react-browser.css"), "utf8");
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
assert.match(script, /bindings\.PresenceRendererSlot/);
assert.match(script, /data-presence-phase/);
assert.match(script, /data-presence-attention/);
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
assert.match(script, /renderedFace\.attributes\.decisionTrace/);
assert.match(script, /renderedFace\.attributes\.decisionTraceChannels/);
assert.match(script, /renderedFace\.attributes\.decisionTraceDecisions/);
assert.match(script, /renderedFace\.attributes\.decisionTraceWarnings/);
assert.match(script, /renderedFace\.attributes\.decisionTraceRendererSafe/);
assert.match(script, /renderedFace\.attributes\.latencyPhase/);
assert.match(script, /data-renderer-slot-face/);
assert.match(script, /@ai-presence\/face/);
assert.doesNotMatch(script, /emotion/i);

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

const renderedFace = renderPresenceFaceSvg("ready", { timeMs: 1000 });
assert.match(renderedFace.svg, /data-face-channels="gaze blink brows mouth posture motion"/);
assert.match(renderedFace.svg, /data-face-decision-trace-channels="gaze blink brows mouth posture motion"/);
assert.equal(renderedFace.attributes.channels, "gaze blink brows mouth posture motion");
assert.equal(renderedFace.attributes.decisionTrace, "complete");

assert.match(css, /grid-template-columns/);
assert.match(css, /@media \(max-width: 760px\)/);

console.log("react-browser-example ok");
