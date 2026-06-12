(function initPresenceFace(globalScope) {
  "use strict";

  const core = resolveCore(globalScope);
  const PresenceState = core?.PresenceState || {};

  const FaceExpression = Object.freeze({
    IDLE: "idle",
    LISTENING: "listening",
    READING: "reading",
    THINKING: "thinking",
    CURIOUS: "curious",
    AMUSED: "amused",
    DELIGHTED: "delighted",
    UNCERTAIN: "uncertain",
    CONCERNED: "concerned",
    READY: "ready",
    SPEAKING: "speaking",
  });

  const FACE_EXPRESSIONS = Object.freeze(Object.values(FaceExpression));
  const faceExpressionSet = new Set(FACE_EXPRESSIONS);

  const DEFAULT_FACE_MAP = Object.freeze({
    [PresenceState.IDLE || "idle"]: FaceExpression.IDLE,
    [PresenceState.USER_TYPING || "user-typing"]: FaceExpression.LISTENING,
    [PresenceState.READING || "reading"]: FaceExpression.READING,
    [PresenceState.WAITING || "waiting"]: FaceExpression.LISTENING,
    [PresenceState.THINKING || "thinking"]: FaceExpression.THINKING,
    [PresenceState.STREAMING || "streaming"]: FaceExpression.SPEAKING,
    [PresenceState.SPEAKING || "speaking"]: FaceExpression.SPEAKING,
    [PresenceState.INTERRUPTED || "interrupted"]: FaceExpression.UNCERTAIN,
    [PresenceState.READY || "ready"]: FaceExpression.READY,
    [PresenceState.ERROR || "error"]: FaceExpression.CONCERNED,
  });

  function resolveCore(scope) {
    if (scope?.AIPresenceCore) return scope.AIPresenceCore;
    if (typeof require === "function") {
      try {
        return require("@ai-presence/core");
      } catch {
        // Fall back to the no-build monorepo path used by the prototype.
      }
      try {
        return require("../../core/src/presence-core.js");
      } catch {
        return null;
      }
    }
    return null;
  }

  function isFaceExpression(value) {
    return faceExpressionSet.has(value);
  }

  function normalizeFaceExpression(value, fallback = FaceExpression.IDLE) {
    return isFaceExpression(value) ? value : fallback;
  }

  function faceExpressionForPresence(snapshotOrState, options = {}) {
    const state = typeof snapshotOrState === "string"
      ? snapshotOrState
      : snapshotOrState?.state;
    const detail = typeof snapshotOrState === "string"
      ? options.detail || {}
      : snapshotOrState?.detail || {};
    const map = options.map || DEFAULT_FACE_MAP;

    if (isFaceExpression(detail.expression)) return detail.expression;
    if (detail.error) return FaceExpression.CONCERNED;
    if (detail.question && state === PresenceState.READING) return FaceExpression.CURIOUS;
    if (detail.revision && state === PresenceState.READING) return FaceExpression.UNCERTAIN;
    if (detail.ready && state === PresenceState.READY) return FaceExpression.READY;

    return normalizeFaceExpression(map[state], FaceExpression.IDLE);
  }

  function createFaceRenderer(options = {}) {
    const render = typeof options.render === "function" ? options.render : null;
    const map = options.map || DEFAULT_FACE_MAP;
    let lastExpression = null;

    return Object.freeze({
      getExpression() {
        return lastExpression;
      },
      render(snapshot) {
        const expression = faceExpressionForPresence(snapshot, { map });
        lastExpression = expression;
        if (render) render(expression, snapshot);
        return expression;
      },
    });
  }

  const api = Object.freeze({
    FaceExpression,
    FACE_EXPRESSIONS,
    DEFAULT_FACE_MAP,
    createFaceRenderer,
    faceExpressionForPresence,
    isFaceExpression,
    normalizeFaceExpression,
  });

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  globalScope.AIPresenceFace = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
