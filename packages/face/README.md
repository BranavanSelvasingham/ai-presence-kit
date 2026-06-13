# @ai-presence/face

Reference face renderer primitives for AI Presence Kit.

This package maps canonical presence snapshots from `@ai-presence/core` to renderer-specific face controls. The expression mapper remains available, and the additive controller APIs turn the same interaction-posture snapshot into parallel micro-decisions and deterministic per-frame micro-movement for gaze, blink, brows, mouth, posture, and motion.

```js
import { faceExpressionForPresence } from "@ai-presence/face";

const expression = faceExpressionForPresence(snapshot);
```

```js
import { faceControllerDecisionsForPresence, faceControlsForPresence } from "@ai-presence/face";

const controls = faceControlsForPresence(snapshot, { trace });
const report = faceControllerDecisionsForPresence(snapshot, { trace });

renderer.setGaze(controls.gaze);
renderer.setMouth(controls.mouth);

console.log(report.decisions.gaze.controller); // "gaze-controller"
```

```js
import {
  faceControllerCoherenceForFrame,
  faceControllerDecisionTraceForFrame,
  faceControllerFrameForPresence,
} from "@ai-presence/face";

const frameReport = faceControllerFrameForPresence(snapshot, {
  trace,
  timeMs: performance.now(),
  motionScale: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1,
});
const decisionTrace = faceControllerDecisionTraceForFrame(frameReport);

renderer.setGaze(frameReport.frame.gaze);
renderer.setBlink(frameReport.frame.blink);
renderer.setPosture(frameReport.frame.posture);

console.log(frameReport.coherence.rendererSafe); // true
console.log(faceControllerCoherenceForFrame(frameReport).channels); // ["gaze", "blink", "brows", "mouth", "posture", "motion"]
console.log(decisionTrace.decisions.gaze.control.target); // "response-origin"
```

```js
import { renderPresenceFaceSvg } from "@ai-presence/face";

const result = renderPresenceFaceSvg(snapshot, {
  trace,
  timeMs: performance.now(),
  motionScale: 0,
});

container.innerHTML = result.svg;
console.log(result.channelEvidence.mouth.frame.shape);
console.log(result.attributes.motionScale); // "0"
```

The controller does not claim hidden internal state. It stays grounded in observable states such as `reading`, `thinking`, `waiting`, `streaming`, `speaking`, `interrupted`, and `ready`, then lets each facial subsystem make a small local decision from the shared snapshot and optional trace/history.

`faceControlsForPresence` remains the renderer-friendly compatibility surface. `faceControllerDecisionsForPresence` exposes the same composition as an inspection report:

```js
{
  state: "waiting",
  expression: "listening",
  sharedInputs: {
    state: "waiting",
    attentionTarget: "response",
    latencyPhase: "before-output"
  },
  decisions: {
    gaze: { channel: "gaze", controller: "gaze-controller", reads: ["state", "attentionTarget", "..."], control: {} },
    blink: { channel: "blink", controller: "blink-controller", reads: ["state", "..."], control: {} },
    brows: { channel: "brows", controller: "brows-controller", reads: ["state", "..."], control: {} },
    mouth: { channel: "mouth", controller: "mouth-controller", reads: ["state", "speechActivity", "..."], control: {} },
    posture: { channel: "posture", controller: "posture-controller", reads: ["state", "energy", "..."], control: {} },
    motion: { channel: "motion", controller: "motion-controller", reads: ["state", "anticipation", "..."], control: {} }
  }
}
```

`faceControllerFrameForPresence` returns the same report fields plus a frozen `frame` object and frozen `coherence` audit. The frame keeps controller decisions stable and adds bounded temporal values such as blink `phase`, mouth `beat`, posture `breath`, and motion offsets so renderers can animate interaction posture without adding their own timing policy.

`faceControllerDecisionTraceForFrame(frameReport)` turns a frame report into bounded per-channel controller evidence. It keeps all six channels inspectable as local decisions before the composed frame is consumed by a renderer:

```js
{
  channels: ["gaze", "blink", "brows", "mouth", "posture", "motion"],
  decisionCount: 6,
  complete: true,
  rendererSafe: true,
  warningCount: 0,
  decisions: {
    gaze: {
      channel: "gaze",
      controller: "gaze-controller",
      reads: ["state", "detail.question", "attentionTarget", "..."],
      control: { target: "response-origin", x: -0.08, y: -0.04, focus: 0.66 },
      frame: { target: "response-origin", x: -0.079, y: -0.044, focus: 0.66, driftX: 0.007, driftY: -0.032 },
      present: true,
      bounded: true,
      rendererSafe: true,
      warningCount: 0,
      warnings: []
    }
  }
}
```

Use the decision trace for debug UIs, tests, logs, and adapter smoke output that need to show which controller read which runtime fields without parsing full internal control objects. It is evidence for observable interaction posture, not a claim about hidden user or model state.

The coherence audit proves the six independently decided channels compose into one renderer-consumable frame:

```js
{
  channels: ["gaze", "blink", "brows", "mouth", "posture", "motion"],
  complete: true,
  bounded: true,
  rendererSafe: true,
  summary: {
    channelCount: 6,
    presentChannelCount: 6,
    boundedChannelCount: 6,
    gazeTarget: "response-origin",
    gazeFocus: 0.66,
    blinkOpenness: 0.9,
    mouthShape: "preparing",
    mouthActivity: 0.16,
    postureLean: 0.24,
    motionEnergy: 0.46,
    motionRecovery: 0
  },
  channelReports: {
    gaze: { channel: "gaze", present: true, bounded: true, summary: {}, warnings: [] },
    blink: { channel: "blink", present: true, bounded: true, summary: {}, warnings: [] },
    brows: { channel: "brows", present: true, bounded: true, summary: {}, warnings: [] },
    mouth: { channel: "mouth", present: true, bounded: true, summary: {}, warnings: [] },
    posture: { channel: "posture", present: true, bounded: true, summary: {}, warnings: [] },
    motion: { channel: "motion", present: true, bounded: true, summary: {}, warnings: [] }
  },
  warnings: []
}
```

Use `faceControllerCoherenceForFrame(frameReport)` when auditing a saved or externally assembled report. Missing channels, mismatched controller metadata, invalid targets/shapes, and out-of-range numeric values make `rendererSafe` false and appear in `warnings`.

Pass `motionScale` when a downstream renderer needs reduced motion. `motionScale: 1` is the default live temporal behavior, `motionScale: 0` produces deterministic still frames across different `timeMs` values for the same snapshot/options, and values between `0` and `1` reduce temporal blink closure, drift, mouth beat, breath, anticipation/recovery kicks, and motion offsets. The option does not remove the six controller channels or their evidence; gaze target, blink baseline, brows, mouth shape, posture, and motion decisions remain available for custom renderers.

`renderPresenceFaceSvg` is the no-DOM reference SVG surface. It calls `faceControllerFrameForPresence`, returns a compact SVG string, and includes state, expression, frame data, and six-channel evidence so downstream AI interfaces can inspect what drove the rendered posture without copying the browser demo internals.
