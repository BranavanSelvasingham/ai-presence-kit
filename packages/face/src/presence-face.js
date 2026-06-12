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

  const DEFAULT_FACE_CONTROL_PROFILE = Object.freeze({
    blinkCadenceMs: 4600,
    drift: 0.18,
    settleMs: 160,
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

  function normalizeSnapshotInput(snapshotOrState, options = {}) {
    if (typeof snapshotOrState === "string") {
      return {
        state: snapshotOrState,
        previousState: null,
        event: null,
        detail: options.detail || {},
        updatedAt: null,
      };
    }

    return {
      state: snapshotOrState?.state,
      previousState: snapshotOrState?.previousState || null,
      event: snapshotOrState?.event || null,
      detail: snapshotOrState?.detail || {},
      updatedAt: Number.isFinite(Number(snapshotOrState?.updatedAt))
        ? Number(snapshotOrState.updatedAt)
        : null,
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function readHistory(options = {}) {
    if (Array.isArray(options.history)) return options.history;
    if (options.trace && typeof options.trace.getEntries === "function") {
      return options.trace.getEntries();
    }
    if (Array.isArray(options.trace)) return options.trace;
    return [];
  }

  function resolveNow(options, snapshot, history) {
    const optionNow = typeof options.now === "function" ? options.now() : options.now;
    const numericNow = Number(optionNow);
    if (Number.isFinite(numericNow)) return numericNow;
    if (snapshot.updatedAt !== null) return snapshot.updatedAt;
    const latest = history[history.length - 1];
    const latestTime = Number(latest?.updatedAt);
    return Number.isFinite(latestTime) ? latestTime : 0;
  }

  function latestHistoryEntry(history) {
    return history.length ? history[history.length - 1] : null;
  }

  function includesRecentState(snapshot, history, state, windowMs, now) {
    if (snapshot.previousState === state) return true;
    for (let index = history.length - 1; index >= 0; index -= 1) {
      const entry = history[index];
      if (entry?.state !== state) continue;
      const updatedAt = Number(entry.updatedAt);
      if (!Number.isFinite(updatedAt) || now - updatedAt <= windowMs) return true;
      return false;
    }
    return false;
  }

  function stateAgeMs(snapshot, history, now) {
    if (snapshot.updatedAt !== null) return Math.max(0, now - snapshot.updatedAt);
    const latest = latestHistoryEntry(history);
    const latestTime = Number(latest?.updatedAt);
    return Number.isFinite(latestTime) ? Math.max(0, now - latestTime) : 0;
  }

  function controlProfile(options = {}) {
    const profile = options.profile || {};
    return {
      blinkCadenceMs: Number.isFinite(Number(profile.blinkCadenceMs))
        ? Number(profile.blinkCadenceMs)
        : DEFAULT_FACE_CONTROL_PROFILE.blinkCadenceMs,
      drift: Number.isFinite(Number(profile.drift))
        ? Number(profile.drift)
        : DEFAULT_FACE_CONTROL_PROFILE.drift,
      settleMs: Number.isFinite(Number(profile.settleMs))
        ? Number(profile.settleMs)
        : DEFAULT_FACE_CONTROL_PROFILE.settleMs,
    };
  }

  function controlInputsForPresence(snapshot, options) {
    if (typeof core?.presenceControlInputsForSnapshot === "function") {
      return core.presenceControlInputsForSnapshot(snapshot, options);
    }
    return null;
  }

  function inputNumber(inputs, key, fallback) {
    const value = Number(inputs?.[key]);
    return Number.isFinite(value) ? value : fallback;
  }

  function faceAttentionTarget(stateName, detail, inputs, fallback) {
    if (detail.question && (stateName === PresenceState.READING || stateName === "reading")) {
      return "question";
    }

    switch (inputs?.attentionTarget) {
      case "audience":
      case "content":
      case "input":
      case "status":
      case "user":
        return inputs.attentionTarget;
      case "response":
        return fallback === "middle-distance" ? "middle-distance" : "response-origin";
      default:
        return fallback;
    }
  }

  function controlsForState(state, detail, profile, inputs) {
    const stateName = state || PresenceState.IDLE || "idle";
    const base = {
      gaze: {
        target: faceAttentionTarget(stateName, detail, inputs, "user"),
        x: inputNumber(inputs, "attentionX", 0),
        y: inputNumber(inputs, "attentionY", 0),
        focus: inputNumber(inputs, "focus", 0.56),
      },
      blink: { openness: 1, cadenceMs: profile.blinkCadenceMs, pulse: false },
      brows: { lift: 0, pinch: 0, asymmetry: 0 },
      mouth: { shape: "rest", openness: 0, activity: inputNumber(inputs, "speechActivity", 0), tension: inputNumber(inputs, "tension", 0) },
      posture: { lean: 0, turn: 0, energy: inputNumber(inputs, "energy", 0.2), recovery: inputNumber(inputs, "recovery", 0) },
      motion: {
        energy: inputNumber(inputs, "energy", 0.2),
        drift: profile.drift,
        anticipation: inputNumber(inputs, "anticipation", 0),
        recovery: inputNumber(inputs, "recovery", 0),
        settleMs: profile.settleMs,
      },
    };

    switch (stateName) {
      case PresenceState.USER_TYPING:
      case "user-typing":
        return {
          gaze: {
            target: faceAttentionTarget(stateName, detail, inputs, "input"),
            x: inputNumber(inputs, "attentionX", -0.18),
            y: inputNumber(inputs, "attentionY", 0.18),
            focus: inputNumber(inputs, "focus", 0.7),
          },
          blink: { openness: 1, cadenceMs: 4400, pulse: false },
          brows: { lift: 0.08, pinch: 0.06, asymmetry: 0 },
          mouth: { shape: "listening", openness: 0.03, activity: 0.05, tension: inputNumber(inputs, "tension", 0.08) },
          posture: { lean: 0.1, turn: -0.04, energy: inputNumber(inputs, "energy", 0.38), recovery: inputNumber(inputs, "recovery", 0) },
          motion: { energy: 0.34, drift: profile.drift + 0.04, anticipation: inputNumber(inputs, "anticipation", 0.18), recovery: inputNumber(inputs, "recovery", 0), settleMs: profile.settleMs },
        };

      case PresenceState.READING:
      case "reading":
        return {
          gaze: {
            target: faceAttentionTarget(stateName, detail, inputs, "content"),
            x: inputNumber(inputs, "attentionX", -0.2),
            y: inputNumber(inputs, "attentionY", 0.28),
            focus: inputNumber(inputs, "focus", 0.76),
          },
          blink: { openness: 0.94, cadenceMs: 5200, pulse: false },
          brows: { lift: detail.question ? 0.22 : 0.08, pinch: detail.revision ? 0.2 : 0.12, asymmetry: detail.question ? 0.16 : 0 },
          mouth: { shape: detail.question ? "curious" : "held", openness: 0.04, activity: 0.08, tension: inputNumber(inputs, "tension", detail.revision ? 0.32 : 0.12) },
          posture: { lean: 0.14, turn: -0.06, energy: inputNumber(inputs, "energy", 0.42), recovery: inputNumber(inputs, "recovery", 0) },
          motion: { energy: 0.34, drift: profile.drift + 0.02, anticipation: inputNumber(inputs, "anticipation", 0.22), recovery: inputNumber(inputs, "recovery", 0), settleMs: profile.settleMs },
        };

      case PresenceState.WAITING:
      case "waiting":
        return {
          gaze: {
            target: faceAttentionTarget(stateName, detail, inputs, "response-origin"),
            x: inputNumber(inputs, "attentionX", -0.08),
            y: inputNumber(inputs, "attentionY", -0.04),
            focus: inputNumber(inputs, "focus", 0.66),
          },
          blink: { openness: 0.9, cadenceMs: 3400, pulse: false },
          brows: { lift: 0.02, pinch: 0.28, asymmetry: 0.04 },
          mouth: { shape: "preparing", openness: 0.03, activity: 0.16, tension: inputNumber(inputs, "tension", 0.34) },
          posture: { lean: 0.24, turn: 0, energy: inputNumber(inputs, "energy", 0.5), recovery: inputNumber(inputs, "recovery", 0) },
          motion: { energy: 0.46, drift: profile.drift + 0.08, anticipation: inputNumber(inputs, "anticipation", 0.62), recovery: inputNumber(inputs, "recovery", 0), settleMs: 120 },
        };

      case PresenceState.THINKING:
      case "thinking":
        return {
          gaze: {
            target: faceAttentionTarget(stateName, detail, inputs, "middle-distance"),
            x: inputNumber(inputs, "attentionX", 0.16),
            y: inputNumber(inputs, "attentionY", -0.02),
            focus: inputNumber(inputs, "focus", 0.58),
          },
          blink: { openness: 0.82, cadenceMs: 3800, pulse: false },
          brows: { lift: -0.04, pinch: 0.36, asymmetry: 0.08 },
          mouth: { shape: "pressed", openness: 0.02, activity: 0.12, tension: inputNumber(inputs, "tension", 0.42) },
          posture: { lean: 0.18, turn: 0.05, energy: inputNumber(inputs, "energy", 0.48), recovery: inputNumber(inputs, "recovery", 0) },
          motion: { energy: 0.42, drift: profile.drift + 0.05, anticipation: inputNumber(inputs, "anticipation", 0.52), recovery: inputNumber(inputs, "recovery", 0), settleMs: 140 },
        };

      case PresenceState.STREAMING:
      case "streaming":
        return {
          gaze: {
            target: faceAttentionTarget(stateName, detail, inputs, "audience"),
            x: inputNumber(inputs, "attentionX", 0),
            y: inputNumber(inputs, "attentionY", 0),
            focus: inputNumber(inputs, "focus", 0.74),
          },
          blink: { openness: 0.98, cadenceMs: 6800, pulse: false },
          brows: { lift: 0.08, pinch: 0.08, asymmetry: 0 },
          mouth: { shape: "speaking", openness: 0.34, activity: inputNumber(inputs, "speechActivity", 0.82), tension: inputNumber(inputs, "tension", 0.06) },
          posture: { lean: 0.14, turn: 0, energy: inputNumber(inputs, "energy", 0.72), recovery: inputNumber(inputs, "recovery", 0) },
          motion: { energy: 0.78, drift: profile.drift + 0.1, anticipation: inputNumber(inputs, "anticipation", 0.12), recovery: inputNumber(inputs, "recovery", 0), settleMs: 90 },
        };

      case PresenceState.SPEAKING:
      case "speaking":
        return {
          gaze: {
            target: faceAttentionTarget(stateName, detail, inputs, "audience"),
            x: inputNumber(inputs, "attentionX", 0),
            y: inputNumber(inputs, "attentionY", -0.02),
            focus: inputNumber(inputs, "focus", 0.78),
          },
          blink: { openness: 0.98, cadenceMs: 7200, pulse: false },
          brows: { lift: 0.12, pinch: 0.04, asymmetry: 0 },
          mouth: { shape: "speaking", openness: 0.42, activity: inputNumber(inputs, "speechActivity", 1), tension: inputNumber(inputs, "tension", 0.04) },
          posture: { lean: 0.12, turn: 0, energy: inputNumber(inputs, "energy", 0.78), recovery: inputNumber(inputs, "recovery", 0) },
          motion: { energy: 0.86, drift: profile.drift + 0.12, anticipation: inputNumber(inputs, "anticipation", 0), recovery: inputNumber(inputs, "recovery", 0), settleMs: 80 },
        };

      case PresenceState.INTERRUPTED:
      case "interrupted":
        return {
          gaze: {
            target: faceAttentionTarget(stateName, detail, inputs, "user"),
            x: inputNumber(inputs, "attentionX", -0.26),
            y: inputNumber(inputs, "attentionY", -0.08),
            focus: inputNumber(inputs, "focus", 0.88),
          },
          blink: { openness: 0.72, cadenceMs: 900, pulse: true },
          brows: { lift: -0.12, pinch: 0.54, asymmetry: 0.34 },
          mouth: { shape: "held", openness: 0.07, activity: 0.04, tension: inputNumber(inputs, "tension", 0.72) },
          posture: { lean: -0.22, turn: -0.08, energy: inputNumber(inputs, "energy", 0.62), recovery: Math.max(inputNumber(inputs, "recovery", 0), 0.16) },
          motion: { energy: 0.54, drift: profile.drift + 0.04, anticipation: inputNumber(inputs, "anticipation", 0), recovery: inputNumber(inputs, "recovery", 1), settleMs: 90 },
        };

      case PresenceState.READY:
      case "ready":
        return {
          gaze: {
            target: faceAttentionTarget(stateName, detail, inputs, "user"),
            x: inputNumber(inputs, "attentionX", 0),
            y: inputNumber(inputs, "attentionY", 0),
            focus: inputNumber(inputs, "focus", 0.68),
          },
          blink: { openness: 1, cadenceMs: 4600, pulse: false },
          brows: { lift: 0.1, pinch: 0, asymmetry: 0 },
          mouth: { shape: "soft-smile", openness: 0.12, activity: inputNumber(inputs, "speechActivity", 0.1), tension: inputNumber(inputs, "tension", 0) },
          posture: { lean: 0.02, turn: 0, energy: inputNumber(inputs, "energy", 0.3), recovery: inputNumber(inputs, "recovery", 0) },
          motion: {
            energy: clamp(inputNumber(inputs, "energy", 0.3) - 0.06, 0.16, 1),
            drift: profile.drift,
            anticipation: inputNumber(inputs, "anticipation", 0),
            recovery: inputNumber(inputs, "recovery", 0),
            settleMs: profile.settleMs + 40,
          },
        };

      case PresenceState.ERROR:
      case "error":
        return {
          gaze: {
            target: faceAttentionTarget(stateName, detail, inputs, "status"),
            x: inputNumber(inputs, "attentionX", 0),
            y: inputNumber(inputs, "attentionY", 0.18),
            focus: inputNumber(inputs, "focus", 0.8),
          },
          blink: { openness: 0.86, cadenceMs: 3000, pulse: false },
          brows: { lift: -0.08, pinch: 0.5, asymmetry: 0.08 },
          mouth: { shape: "downturned", openness: 0.03, activity: 0, tension: inputNumber(inputs, "tension", 0.66) },
          posture: { lean: -0.12, turn: 0, energy: inputNumber(inputs, "energy", 0.42), recovery: inputNumber(inputs, "recovery", 0) },
          motion: { energy: 0.18, drift: profile.drift * 0.6, anticipation: inputNumber(inputs, "anticipation", 0), recovery: Math.max(inputNumber(inputs, "recovery", 0), 0.24), settleMs: profile.settleMs + 80 },
        };

      default:
        return base;
    }
  }

  function applyHistoryAdjustments(controls, snapshot, history, now, inputs) {
    const ageMs = inputs ? inputs.ageMs : stateAgeMs(snapshot, history, now);
    const recentlyInterrupted = inputs
      ? inputs.latencyPhase === "recovery" && inputs.recovery >= 0.4
      : includesRecentState(snapshot, history, PresenceState.INTERRUPTED || "interrupted", 2400, now);
    const recentlySpoke = inputs
      ? inputs.latencyPhase === "recovery" && inputs.speechActivity > 0
      : includesRecentState(snapshot, history, PresenceState.STREAMING || "streaming", 1800, now)
        || includesRecentState(snapshot, history, PresenceState.SPEAKING || "speaking", 1800, now);

    if ((snapshot.state === PresenceState.READY || snapshot.state === "ready") && recentlyInterrupted) {
      controls.posture.recovery = Math.max(controls.posture.recovery, 0.42);
      controls.motion.recovery = Math.max(controls.motion.recovery, 0.38);
      controls.motion.settleMs = Math.max(controls.motion.settleMs, 220);
      controls.mouth.tension = Math.max(controls.mouth.tension, 0.18);
    } else if ((snapshot.state === PresenceState.READY || snapshot.state === "ready") && recentlySpoke) {
      controls.mouth.shape = "release";
      controls.mouth.activity = 0.18;
      controls.motion.settleMs = Math.max(controls.motion.settleMs, 210);
    }

    if (!inputs && (snapshot.state === PresenceState.READY || snapshot.state === "ready")) {
      const softness = clamp(ageMs / 1800, 0, 1);
      controls.gaze.focus = clamp(controls.gaze.focus - softness * 0.1, 0.5, 0.72);
      controls.motion.energy = clamp(controls.motion.energy - softness * 0.08, 0.16, 1);
    }

    return controls;
  }

  function freezeControls(controls) {
    return Object.freeze({
      expression: controls.expression,
      gaze: Object.freeze({ ...controls.gaze }),
      blink: Object.freeze({ ...controls.blink }),
      brows: Object.freeze({ ...controls.brows }),
      mouth: Object.freeze({ ...controls.mouth }),
      posture: Object.freeze({ ...controls.posture }),
      motion: Object.freeze({ ...controls.motion }),
    });
  }

  function faceControlsForPresence(snapshotOrState, options = {}) {
    const snapshot = normalizeSnapshotInput(snapshotOrState, options);
    const history = readHistory(options);
    const now = resolveNow(options, snapshot, history);
    const profile = controlProfile(options);
    const inputs = controlInputsForPresence(snapshot, { ...options, history, now });
    const controls = controlsForState(snapshot.state, snapshot.detail, profile, inputs);

    controls.expression = faceExpressionForPresence(snapshotOrState, options);
    return freezeControls(applyHistoryAdjustments(controls, snapshot, history, now, inputs));
  }

  function createFaceControllerRuntime(options = {}) {
    const baseOptions = { ...options };
    let lastControls = null;

    return Object.freeze({
      getControls() {
        return lastControls;
      },
      update(snapshot, updateOptions = {}) {
        const controls = faceControlsForPresence(snapshot, { ...baseOptions, ...updateOptions });
        lastControls = controls;
        if (typeof baseOptions.update === "function") baseOptions.update(controls, snapshot);
        if (typeof updateOptions.update === "function") updateOptions.update(controls, snapshot);
        return controls;
      },
    });
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
    DEFAULT_FACE_CONTROL_PROFILE,
    FaceExpression,
    FACE_EXPRESSIONS,
    DEFAULT_FACE_MAP,
    createFaceControllerRuntime,
    createFaceRenderer,
    faceControlsForPresence,
    faceExpressionForPresence,
    isFaceExpression,
    normalizeFaceExpression,
  });

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  globalScope.AIPresenceFace = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
