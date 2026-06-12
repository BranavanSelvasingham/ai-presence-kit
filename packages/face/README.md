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
import { faceControllerFrameForPresence } from "@ai-presence/face";

const frameReport = faceControllerFrameForPresence(snapshot, {
  trace,
  timeMs: performance.now(),
});

renderer.setGaze(frameReport.frame.gaze);
renderer.setBlink(frameReport.frame.blink);
renderer.setPosture(frameReport.frame.posture);
```

```js
import { renderPresenceFaceSvg } from "@ai-presence/face";

const result = renderPresenceFaceSvg(snapshot, {
  trace,
  timeMs: performance.now(),
});

container.innerHTML = result.svg;
console.log(result.channelEvidence.mouth.frame.shape);
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

`faceControllerFrameForPresence` returns the same report fields plus a frozen `frame` object. The frame keeps controller decisions stable and adds bounded temporal values such as blink `phase`, mouth `beat`, posture `breath`, and motion offsets so renderers can animate interaction posture without adding their own timing policy.

`renderPresenceFaceSvg` is the no-DOM reference SVG surface. It calls `faceControllerFrameForPresence`, returns a compact SVG string, and includes state, expression, frame data, and six-channel evidence so downstream AI interfaces can inspect what drove the rendered posture without copying the browser demo internals.
