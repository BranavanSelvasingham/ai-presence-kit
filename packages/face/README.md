# @ai-presence/face

Reference face renderer primitives for AI Presence Kit.

This package maps canonical presence snapshots from `@ai-presence/core` to renderer-specific face controls. The expression mapper remains available, and the additive controller API turns the same interaction-posture snapshot into parallel micro-decisions for gaze, blink, brows, mouth, posture, and motion.

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
