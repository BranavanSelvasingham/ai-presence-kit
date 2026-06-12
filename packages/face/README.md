# @ai-presence/face

Reference face renderer primitives for AI Presence Kit.

This package maps canonical presence snapshots from `@ai-presence/core` to renderer-specific face controls. The expression mapper remains available, and the additive controller API turns the same interaction-posture snapshot into parallel micro-decisions for gaze, blink, brows, mouth, posture, and motion.

```js
import { faceExpressionForPresence } from "@ai-presence/face";

const expression = faceExpressionForPresence(snapshot);
```

```js
import { faceControlsForPresence } from "@ai-presence/face";

const controls = faceControlsForPresence(snapshot, { trace });

renderer.setGaze(controls.gaze);
renderer.setMouth(controls.mouth);
```

The controller does not infer private emotion. It stays grounded in observable states such as `reading`, `thinking`, `waiting`, `streaming`, `speaking`, `interrupted`, and `ready`, then lets each facial subsystem make a small local decision from the shared snapshot and optional trace/history.
