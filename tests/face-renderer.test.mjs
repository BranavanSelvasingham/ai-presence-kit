import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PresenceEvent, PresenceState, createPresenceRuntime } = require("../packages/core/src/presence-core.js");
const {
  FaceExpression,
  createFaceRenderer,
  faceExpressionForPresence,
} = require("../packages/face/src/presence-face.js");

assert.equal(
  faceExpressionForPresence({ state: PresenceState.IDLE }),
  FaceExpression.IDLE,
);

assert.equal(
  faceExpressionForPresence({ state: PresenceState.READING, detail: { question: true } }),
  FaceExpression.CURIOUS,
);

assert.equal(
  faceExpressionForPresence({ state: PresenceState.INTERRUPTED }),
  FaceExpression.UNCERTAIN,
);

const rendered = [];
const runtime = createPresenceRuntime({ initialState: PresenceState.IDLE });
const renderer = createFaceRenderer({
  render: (expression, snapshot) => rendered.push({ expression, state: snapshot.state }),
});

renderer.render(runtime.send(PresenceEvent.SUBMIT));
renderer.render(runtime.send(PresenceEvent.TOKEN));

assert.equal(renderer.getExpression(), FaceExpression.SPEAKING);
assert.deepEqual(rendered, [
  { expression: FaceExpression.THINKING, state: PresenceState.THINKING },
  { expression: FaceExpression.SPEAKING, state: PresenceState.STREAMING },
]);

console.log("face-renderer ok");
