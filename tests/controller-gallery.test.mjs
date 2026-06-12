import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const root = resolve(new URL("..", import.meta.url).pathname);
const html = readFileSync(resolve(root, "index.html"), "utf8");
const app = readFileSync(resolve(root, "app.js"), "utf8");
const css = readFileSync(resolve(root, "styles.css"), "utf8");
const { PresenceState } = require("../packages/core/src/presence-core.js");
const { createFaceControllerRuntime } = require("../packages/face/src/presence-face.js");

assert.match(html, /id="controllerGallery"/);
assert.match(html, /id="controllerGalleryGrid"/);
assert.match(app, /params\.get\("controls"\)/);
assert.match(app, /params\.get\("controllerGallery"\)/);
assert.match(app, /createFaceControllerRuntime\(\)/);
assert.match(css, /body\.controller-gallery-mode/);

for (const constantName of [
  "IDLE",
  "USER_TYPING",
  "READING",
  "THINKING",
  "WAITING",
  "STREAMING",
  "SPEAKING",
  "READY",
  "INTERRUPTED",
  "ERROR",
]) {
  assert.match(app, new RegExp(`PresenceState\\.${constantName}`), `${constantName} missing from gallery state list`);
}

for (const channel of ["gaze", "blink", "brows", "mouth", "posture", "motion"]) {
  assert.match(app, new RegExp(`"${channel}"`), `${channel} channel missing from gallery renderer`);
}

const history = [];
for (const state of [
  PresenceState.USER_TYPING,
  PresenceState.READING,
  PresenceState.THINKING,
  PresenceState.WAITING,
  PresenceState.STREAMING,
  PresenceState.SPEAKING,
  PresenceState.READY,
  PresenceState.INTERRUPTED,
  PresenceState.ERROR,
]) {
  const snapshot = {
    state,
    previousState: history.at(-1)?.state || null,
    event: "controller-gallery",
    detail: { source: "controller-gallery" },
    changed: true,
    updatedAt: 1000 + history.length * 180,
    version: history.length + 1,
  };
  const controls = createFaceControllerRuntime().update(snapshot, { history, now: snapshot.updatedAt + 120 });

  assert.equal(typeof controls.gaze.target, "string", `${state} gaze target`);
  assert.equal(typeof controls.mouth.shape, "string", `${state} mouth shape`);
  assert.ok(Number.isFinite(controls.blink.cadenceMs), `${state} blink cadence`);
  assert.ok(Number.isFinite(controls.brows.pinch), `${state} brow pinch`);
  assert.ok(Number.isFinite(controls.posture.lean), `${state} posture lean`);
  assert.ok(Number.isFinite(controls.motion.energy), `${state} motion energy`);
  history.push(snapshot);
}

assert.doesNotMatch(`${html}\n${app}\n${css}`, /emotion[- ]detection|private emotion/i);

console.log("controller-gallery ok");
