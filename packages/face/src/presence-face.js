(function initPresenceFace(globalScope) {
  "use strict";

  const core = resolveCore(globalScope);
  const PresenceState = core?.PresenceState || {};
  const PresenceEvent = core?.PresenceEvent || {};

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

  const FACE_CONTROL_CHANNELS = Object.freeze(["gaze", "blink", "brows", "mouth", "posture", "motion"]);

  const FACE_MOUTH_SHAPES = Object.freeze([
    "curious",
    "downturned",
    "held",
    "listening",
    "preparing",
    "pressed",
    "release",
    "rest",
    "soft-smile",
    "speaking",
  ]);

  const FACE_CONTROLLER_READS = Object.freeze({
    gaze: Object.freeze(["state", "detail.question", "attentionTarget", "attentionX", "attentionY", "focus", "ageMs"]),
    blink: Object.freeze(["state", "profile.blinkCadenceMs", "transitionEvent", "transitionAgeMs"]),
    brows: Object.freeze(["state", "detail.question", "detail.revision"]),
    mouth: Object.freeze(["state", "detail.question", "detail.revision", "speechActivity", "tension", "latencyPhase", "recovery"]),
    posture: Object.freeze(["state", "energy", "recovery", "interruption", "latencyPhase"]),
    motion: Object.freeze(["state", "profile.drift", "profile.settleMs", "energy", "anticipation", "recovery", "speechActivity", "latencyPhase", "ageMs"]),
  });

  const BLINK_TRANSITION_PULSE_EVENTS = Object.freeze([
    PresenceEvent.SUBMIT || "submit",
    PresenceEvent.STREAM_OPEN || "stream-open",
    PresenceEvent.TOKEN || "token",
    PresenceEvent.INTERRUPT || "interrupt",
  ]);

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

  function finiteNumber(value, fallback = 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function finiteClamp(value, min, max, fallback = 0) {
    return clamp(finiteNumber(value, fallback), min, max);
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

  function resolveFrameTime(options, fallbackTime) {
    const optionTime = typeof options.timeMs === "function" ? options.timeMs() : options.timeMs;
    const numericTime = Number(optionTime);
    return Number.isFinite(numericTime) ? numericTime : fallbackTime;
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

  function isReadyState(stateName) {
    return stateName === PresenceState.READY || stateName === "ready";
  }

  function hasFreshTransitionEvent(inputs, events, windowMs) {
    const ageMs = Number(inputs?.transitionAgeMs);
    return events.includes(inputs?.transitionEvent)
      && Number.isFinite(ageMs)
      && ageMs >= 0
      && ageMs <= windowMs;
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

  function recoverySignalsForContext(context) {
    const { inputs, snapshot, history, now } = context;
    const recentlyInterrupted = inputs
      ? inputs.latencyPhase === "recovery" && inputs.recovery >= 0.4
      : includesRecentState(snapshot, history, PresenceState.INTERRUPTED || "interrupted", 2400, now);
    const recentlySpoke = inputs
      ? inputs.latencyPhase === "recovery" && inputs.speechActivity > 0
      : includesRecentState(snapshot, history, PresenceState.STREAMING || "streaming", 1800, now)
        || includesRecentState(snapshot, history, PresenceState.SPEAKING || "speaking", 1800, now);

    return { recentlyInterrupted, recentlySpoke };
  }

  function createFaceControllerContext(snapshotOrState, options = {}) {
    const snapshot = normalizeSnapshotInput(snapshotOrState, options);
    const history = readHistory(options);
    const now = resolveNow(options, snapshot, history);
    const profile = controlProfile(options);
    const inputs = controlInputsForPresence(snapshot, { ...options, history, now });
    const stateName = snapshot.state || PresenceState.IDLE || "idle";

    return {
      snapshot,
      snapshotOrState,
      stateName,
      detail: snapshot.detail,
      history,
      now,
      profile,
      inputs,
      ageMs: inputs ? inputs.ageMs : stateAgeMs(snapshot, history, now),
    };
  }

  function decideGaze(context) {
    const { stateName, detail, inputs } = context;
    let control;

    switch (stateName) {
      case PresenceState.USER_TYPING:
      case "user-typing":
        control = {
          target: faceAttentionTarget(stateName, detail, inputs, "input"),
          x: inputNumber(inputs, "attentionX", -0.18),
          y: inputNumber(inputs, "attentionY", 0.18),
          focus: inputNumber(inputs, "focus", 0.7),
        };
        break;

      case PresenceState.READING:
      case "reading":
        control = {
          target: faceAttentionTarget(stateName, detail, inputs, "content"),
          x: inputNumber(inputs, "attentionX", -0.2),
          y: inputNumber(inputs, "attentionY", 0.28),
          focus: inputNumber(inputs, "focus", 0.76),
        };
        break;

      case PresenceState.WAITING:
      case "waiting":
        control = {
          target: faceAttentionTarget(stateName, detail, inputs, "response-origin"),
          x: inputNumber(inputs, "attentionX", -0.08),
          y: inputNumber(inputs, "attentionY", -0.04),
          focus: inputNumber(inputs, "focus", 0.66),
        };
        break;

      case PresenceState.THINKING:
      case "thinking":
        control = {
          target: faceAttentionTarget(stateName, detail, inputs, "middle-distance"),
          x: inputNumber(inputs, "attentionX", 0.16),
          y: inputNumber(inputs, "attentionY", -0.02),
          focus: inputNumber(inputs, "focus", 0.58),
        };
        break;

      case PresenceState.STREAMING:
      case "streaming":
        control = {
          target: faceAttentionTarget(stateName, detail, inputs, "audience"),
          x: inputNumber(inputs, "attentionX", 0),
          y: inputNumber(inputs, "attentionY", 0),
          focus: inputNumber(inputs, "focus", 0.74),
        };
        break;

      case PresenceState.SPEAKING:
      case "speaking":
        control = {
          target: faceAttentionTarget(stateName, detail, inputs, "audience"),
          x: inputNumber(inputs, "attentionX", 0),
          y: inputNumber(inputs, "attentionY", -0.02),
          focus: inputNumber(inputs, "focus", 0.78),
        };
        break;

      case PresenceState.INTERRUPTED:
      case "interrupted":
        control = {
          target: faceAttentionTarget(stateName, detail, inputs, "user"),
          x: inputNumber(inputs, "attentionX", -0.26),
          y: inputNumber(inputs, "attentionY", -0.08),
          focus: inputNumber(inputs, "focus", 0.88),
        };
        break;

      case PresenceState.READY:
      case "ready":
        control = {
          target: faceAttentionTarget(stateName, detail, inputs, "user"),
          x: inputNumber(inputs, "attentionX", 0),
          y: inputNumber(inputs, "attentionY", 0),
          focus: inputNumber(inputs, "focus", 0.68),
        };
        break;

      case PresenceState.ERROR:
      case "error":
        control = {
          target: faceAttentionTarget(stateName, detail, inputs, "status"),
          x: inputNumber(inputs, "attentionX", 0),
          y: inputNumber(inputs, "attentionY", 0.18),
          focus: inputNumber(inputs, "focus", 0.8),
        };
        break;

      default:
        control = {
          target: faceAttentionTarget(stateName, detail, inputs, "user"),
          x: inputNumber(inputs, "attentionX", 0),
          y: inputNumber(inputs, "attentionY", 0),
          focus: inputNumber(inputs, "focus", 0.56),
        };
        break;
    }

    if (!inputs && isReadyState(stateName)) {
      const softness = clamp(context.ageMs / 1800, 0, 1);
      control.focus = clamp(control.focus - softness * 0.1, 0.5, 0.72);
    }

    return control;
  }

  function decideBlink(context) {
    const { stateName, profile, inputs } = context;
    const transitionPulse = hasFreshTransitionEvent(inputs, BLINK_TRANSITION_PULSE_EVENTS, 180);
    let control;

    switch (stateName) {
      case PresenceState.USER_TYPING:
      case "user-typing":
        control = { openness: 1, cadenceMs: 4400, pulse: false };
        break;

      case PresenceState.READING:
      case "reading":
        control = { openness: 0.94, cadenceMs: 5200, pulse: false };
        break;

      case PresenceState.WAITING:
      case "waiting":
        control = { openness: 0.9, cadenceMs: 3400, pulse: false };
        break;

      case PresenceState.THINKING:
      case "thinking":
        control = { openness: 0.82, cadenceMs: 3800, pulse: false };
        break;

      case PresenceState.STREAMING:
      case "streaming":
        control = { openness: 0.98, cadenceMs: 6800, pulse: false };
        break;

      case PresenceState.SPEAKING:
      case "speaking":
        control = { openness: 0.98, cadenceMs: 7200, pulse: false };
        break;

      case PresenceState.INTERRUPTED:
      case "interrupted":
        control = { openness: 0.72, cadenceMs: 900, pulse: true };
        break;

      case PresenceState.ERROR:
      case "error":
        control = { openness: 0.86, cadenceMs: 3000, pulse: false };
        break;

      case PresenceState.READY:
      case "ready":
      default:
        control = { openness: 1, cadenceMs: profile.blinkCadenceMs, pulse: false };
        break;
    }

    if (transitionPulse) control.pulse = true;
    return control;
  }

  function decideBrows(context) {
    const { stateName, detail } = context;

    switch (stateName) {
      case PresenceState.USER_TYPING:
      case "user-typing":
        return { lift: 0.08, pinch: 0.06, asymmetry: 0 };

      case PresenceState.READING:
      case "reading":
        return {
          lift: detail.question ? 0.22 : 0.08,
          pinch: detail.revision ? 0.2 : 0.12,
          asymmetry: detail.question ? 0.16 : 0,
        };

      case PresenceState.WAITING:
      case "waiting":
        return { lift: 0.02, pinch: 0.28, asymmetry: 0.04 };

      case PresenceState.THINKING:
      case "thinking":
        return { lift: -0.04, pinch: 0.36, asymmetry: 0.08 };

      case PresenceState.STREAMING:
      case "streaming":
        return { lift: 0.08, pinch: 0.08, asymmetry: 0 };

      case PresenceState.SPEAKING:
      case "speaking":
        return { lift: 0.12, pinch: 0.04, asymmetry: 0 };

      case PresenceState.INTERRUPTED:
      case "interrupted":
        return { lift: -0.12, pinch: 0.54, asymmetry: 0.34 };

      case PresenceState.READY:
      case "ready":
        return { lift: 0.1, pinch: 0, asymmetry: 0 };

      case PresenceState.ERROR:
      case "error":
        return { lift: -0.08, pinch: 0.5, asymmetry: 0.08 };

      default:
        return { lift: 0, pinch: 0, asymmetry: 0 };
    }
  }

  function decideMouth(context) {
    const { stateName, detail, inputs } = context;
    let control;

    switch (stateName) {
      case PresenceState.USER_TYPING:
      case "user-typing":
        control = { shape: "listening", openness: 0.03, activity: 0.05, tension: inputNumber(inputs, "tension", 0.08) };
        break;

      case PresenceState.READING:
      case "reading":
        control = {
          shape: detail.question ? "curious" : "held",
          openness: 0.04,
          activity: 0.08,
          tension: inputNumber(inputs, "tension", detail.revision ? 0.32 : 0.12),
        };
        break;

      case PresenceState.WAITING:
      case "waiting":
        control = { shape: "preparing", openness: 0.03, activity: 0.16, tension: inputNumber(inputs, "tension", 0.34) };
        break;

      case PresenceState.THINKING:
      case "thinking":
        control = { shape: "pressed", openness: 0.02, activity: 0.12, tension: inputNumber(inputs, "tension", 0.42) };
        break;

      case PresenceState.STREAMING:
      case "streaming":
        control = {
          shape: "speaking",
          openness: 0.34,
          activity: inputNumber(inputs, "speechActivity", 0.82),
          tension: inputNumber(inputs, "tension", 0.06),
        };
        break;

      case PresenceState.SPEAKING:
      case "speaking":
        control = {
          shape: "speaking",
          openness: 0.42,
          activity: inputNumber(inputs, "speechActivity", 1),
          tension: inputNumber(inputs, "tension", 0.04),
        };
        break;

      case PresenceState.INTERRUPTED:
      case "interrupted":
        control = { shape: "held", openness: 0.07, activity: 0.04, tension: inputNumber(inputs, "tension", 0.72) };
        break;

      case PresenceState.READY:
      case "ready":
        control = {
          shape: "soft-smile",
          openness: 0.12,
          activity: inputNumber(inputs, "speechActivity", 0.1),
          tension: inputNumber(inputs, "tension", 0),
        };
        break;

      case PresenceState.ERROR:
      case "error":
        control = { shape: "downturned", openness: 0.03, activity: 0, tension: inputNumber(inputs, "tension", 0.66) };
        break;

      default:
        control = { shape: "rest", openness: 0, activity: inputNumber(inputs, "speechActivity", 0), tension: inputNumber(inputs, "tension", 0) };
        break;
    }

    const { recentlyInterrupted, recentlySpoke } = recoverySignalsForContext(context);
    if (isReadyState(stateName) && recentlyInterrupted) {
      control.tension = Math.max(control.tension, 0.18);
    } else if (isReadyState(stateName) && recentlySpoke) {
      control.shape = "release";
      control.activity = 0.18;
    }

    return control;
  }

  function decidePosture(context) {
    const { stateName, inputs } = context;
    let control;

    switch (stateName) {
      case PresenceState.USER_TYPING:
      case "user-typing":
        control = { lean: 0.1, turn: -0.04, energy: inputNumber(inputs, "energy", 0.38), recovery: inputNumber(inputs, "recovery", 0) };
        break;

      case PresenceState.READING:
      case "reading":
        control = { lean: 0.14, turn: -0.06, energy: inputNumber(inputs, "energy", 0.42), recovery: inputNumber(inputs, "recovery", 0) };
        break;

      case PresenceState.WAITING:
      case "waiting":
        control = { lean: 0.24, turn: 0, energy: inputNumber(inputs, "energy", 0.5), recovery: inputNumber(inputs, "recovery", 0) };
        break;

      case PresenceState.THINKING:
      case "thinking":
        control = { lean: 0.18, turn: 0.05, energy: inputNumber(inputs, "energy", 0.48), recovery: inputNumber(inputs, "recovery", 0) };
        break;

      case PresenceState.STREAMING:
      case "streaming":
        control = { lean: 0.14, turn: 0, energy: inputNumber(inputs, "energy", 0.72), recovery: inputNumber(inputs, "recovery", 0) };
        break;

      case PresenceState.SPEAKING:
      case "speaking":
        control = { lean: 0.12, turn: 0, energy: inputNumber(inputs, "energy", 0.78), recovery: inputNumber(inputs, "recovery", 0) };
        break;

      case PresenceState.INTERRUPTED:
      case "interrupted":
        control = {
          lean: -0.22,
          turn: -0.08,
          energy: inputNumber(inputs, "energy", 0.62),
          recovery: Math.max(inputNumber(inputs, "recovery", 0), 0.16),
        };
        break;

      case PresenceState.READY:
      case "ready":
        control = { lean: 0.02, turn: 0, energy: inputNumber(inputs, "energy", 0.3), recovery: inputNumber(inputs, "recovery", 0) };
        break;

      case PresenceState.ERROR:
      case "error":
        control = { lean: -0.12, turn: 0, energy: inputNumber(inputs, "energy", 0.42), recovery: inputNumber(inputs, "recovery", 0) };
        break;

      default:
        control = { lean: 0, turn: 0, energy: inputNumber(inputs, "energy", 0.2), recovery: inputNumber(inputs, "recovery", 0) };
        break;
    }

    if (isReadyState(stateName) && recoverySignalsForContext(context).recentlyInterrupted) {
      control.recovery = Math.max(control.recovery, 0.42);
    }

    return control;
  }

  function decideMotion(context) {
    const { stateName, inputs, profile } = context;
    let control;

    switch (stateName) {
      case PresenceState.USER_TYPING:
      case "user-typing":
        control = {
          energy: 0.34,
          drift: profile.drift + 0.04,
          anticipation: inputNumber(inputs, "anticipation", 0.18),
          recovery: inputNumber(inputs, "recovery", 0),
          settleMs: profile.settleMs,
        };
        break;

      case PresenceState.READING:
      case "reading":
        control = {
          energy: 0.34,
          drift: profile.drift + 0.02,
          anticipation: inputNumber(inputs, "anticipation", 0.22),
          recovery: inputNumber(inputs, "recovery", 0),
          settleMs: profile.settleMs,
        };
        break;

      case PresenceState.WAITING:
      case "waiting":
        control = {
          energy: 0.46,
          drift: profile.drift + 0.08,
          anticipation: inputNumber(inputs, "anticipation", 0.62),
          recovery: inputNumber(inputs, "recovery", 0),
          settleMs: 120,
        };
        break;

      case PresenceState.THINKING:
      case "thinking":
        control = {
          energy: 0.42,
          drift: profile.drift + 0.05,
          anticipation: inputNumber(inputs, "anticipation", 0.52),
          recovery: inputNumber(inputs, "recovery", 0),
          settleMs: 140,
        };
        break;

      case PresenceState.STREAMING:
      case "streaming":
        control = {
          energy: 0.78,
          drift: profile.drift + 0.1,
          anticipation: inputNumber(inputs, "anticipation", 0.12),
          recovery: inputNumber(inputs, "recovery", 0),
          settleMs: 90,
        };
        break;

      case PresenceState.SPEAKING:
      case "speaking":
        control = {
          energy: 0.86,
          drift: profile.drift + 0.12,
          anticipation: inputNumber(inputs, "anticipation", 0),
          recovery: inputNumber(inputs, "recovery", 0),
          settleMs: 80,
        };
        break;

      case PresenceState.INTERRUPTED:
      case "interrupted":
        control = {
          energy: 0.54,
          drift: profile.drift + 0.04,
          anticipation: inputNumber(inputs, "anticipation", 0),
          recovery: inputNumber(inputs, "recovery", 1),
          settleMs: 90,
        };
        break;

      case PresenceState.READY:
      case "ready":
        control = {
          energy: clamp(inputNumber(inputs, "energy", 0.3) - 0.06, 0.16, 1),
          drift: profile.drift,
          anticipation: inputNumber(inputs, "anticipation", 0),
          recovery: inputNumber(inputs, "recovery", 0),
          settleMs: profile.settleMs + 40,
        };
        break;

      case PresenceState.ERROR:
      case "error":
        control = {
          energy: 0.18,
          drift: profile.drift * 0.6,
          anticipation: inputNumber(inputs, "anticipation", 0),
          recovery: Math.max(inputNumber(inputs, "recovery", 0), 0.24),
          settleMs: profile.settleMs + 80,
        };
        break;

      default:
        control = {
          energy: inputNumber(inputs, "energy", 0.2),
          drift: profile.drift,
          anticipation: inputNumber(inputs, "anticipation", 0),
          recovery: inputNumber(inputs, "recovery", 0),
          settleMs: profile.settleMs,
        };
        break;
    }

    const { recentlyInterrupted, recentlySpoke } = recoverySignalsForContext(context);
    if (isReadyState(stateName) && recentlyInterrupted) {
      control.recovery = Math.max(control.recovery, 0.38);
      control.settleMs = Math.max(control.settleMs, 220);
    } else if (isReadyState(stateName) && recentlySpoke) {
      control.settleMs = Math.max(control.settleMs, 210);
    }

    if (!inputs && isReadyState(stateName)) {
      const softness = clamp(context.ageMs / 1800, 0, 1);
      control.energy = clamp(control.energy - softness * 0.08, 0.16, 1);
    }

    return control;
  }

  const faceControllerDeciders = Object.freeze({
    gaze: decideGaze,
    blink: decideBlink,
    brows: decideBrows,
    mouth: decideMouth,
    posture: decidePosture,
    motion: decideMotion,
  });

  function composeFaceControllerDecisions(context) {
    const decisions = {};
    for (const channel of FACE_CONTROL_CHANNELS) {
      decisions[channel] = Object.freeze({
        channel,
        controller: `${channel}-controller`,
        reads: FACE_CONTROLLER_READS[channel],
        control: Object.freeze(faceControllerDeciders[channel](context)),
      });
    }
    return Object.freeze(decisions);
  }

  function freezeSharedControlInputs(inputs) {
    if (!inputs) return null;
    return Object.freeze({
      ...inputs,
      recentStates: Object.freeze([...(inputs.recentStates || [])]),
    });
  }

  function freezeControlsFromDecisions(expression, decisions) {
    return Object.freeze({
      expression,
      gaze: decisions.gaze.control,
      blink: decisions.blink.control,
      brows: decisions.brows.control,
      mouth: decisions.mouth.control,
      posture: decisions.posture.control,
      motion: decisions.motion.control,
    });
  }

  function normalizedWave(timeMs, periodMs, offset = 0) {
    const period = Math.max(1, finiteNumber(periodMs, 1));
    const turns = (finiteNumber(timeMs, 0) / period) + offset;
    return Math.sin(turns * Math.PI * 2);
  }

  function normalizedPhase(timeMs, periodMs, offset = 0) {
    const period = Math.max(1, finiteNumber(periodMs, 1));
    const raw = (finiteNumber(timeMs, 0) / period) + offset;
    return raw - Math.floor(raw);
  }

  function resolveMotionScale(options = {}) {
    return finiteClamp(options.motionScale, 0, 1, 1);
  }

  function blinkClosureForPhase(phase, pulse) {
    const closure = phase < 0.08
      ? 1 - Math.abs(phase - 0.04) / 0.04
      : phase > 0.92
        ? (phase - 0.92) / 0.08
        : 0;
    return clamp(closure * (pulse ? 0.52 : 0.32), 0, 0.72);
  }

  function transitionBlinkClosure(inputs, motionScale) {
    if (!hasFreshTransitionEvent(inputs, BLINK_TRANSITION_PULSE_EVENTS, 180)) return 0;
    const progress = clamp(finiteNumber(inputs.transitionAgeMs, 0) / 180, 0, 1);
    const envelope = progress < 0.45
      ? progress / 0.45
      : 1 - ((progress - 0.45) / 0.55);
    return clamp(envelope * 0.52 * motionScale, 0, 0.72);
  }

  function composeFaceControllerFrame(report, context, options = {}) {
    const timeMs = resolveFrameTime(options, context.now);
    const motionScale = resolveMotionScale(options);
    const ageMs = stateAgeMs(context.snapshot, context.history, timeMs);
    const controls = freezeControlsFromDecisions(report.expression, report.decisions);
    const motion = controls.motion;
    const blink = controls.blink;
    const mouth = controls.mouth;
    const posture = controls.posture;
    const cadenceMs = finiteClamp(blink.cadenceMs, 300, 20000, context.profile.blinkCadenceMs);
    const phase = normalizedPhase(timeMs * motionScale, cadenceMs);
    const closure = Math.max(
      blinkClosureForPhase(phase, blink.pulse) * motionScale,
      transitionBlinkClosure(context.inputs, motionScale),
    );
    const energy = finiteClamp(motion.energy, 0, 1, 0);
    const drift = finiteClamp(motion.drift, 0, 1, context.profile.drift);
    const anticipation = finiteClamp(motion.anticipation, 0, 1, 0);
    const recovery = finiteClamp(motion.recovery, 0, 1, 0);
    const speechActivity = finiteClamp(mouth.activity, 0, 1, 0);
    const driftWaveX = motionScale === 0 ? 0 : normalizedWave(timeMs, 2400, 0.13) * motionScale;
    const driftWaveY = motionScale === 0 ? 0 : normalizedWave(timeMs, 3100, 0.41) * motionScale;
    const speechBeat = speechActivity * (0.5 + normalizedWave(timeMs, 260, 0.08) * 0.5) * motionScale;
    const breath = clamp((0.5 + normalizedWave(timeMs, 3600, 0.32) * 0.5) * motionScale, 0, 1);
    const settle = clamp(ageMs / Math.max(1, finiteNumber(motion.settleMs, context.profile.settleMs)), 0, 1);
    const driftScale = drift * (0.18 + energy * 0.32) * (1 - recovery * 0.35);
    const driftX = driftWaveX * driftScale;
    const driftY = driftWaveY * driftScale * 0.72;
    const anticipationKick = anticipation * (1 - settle) * 0.08 * motionScale;
    const recoveryDrop = recovery * (1 - settle * 0.45) * 0.08 * motionScale;

    return Object.freeze({
      gaze: Object.freeze({
        target: controls.gaze.target,
        x: finiteClamp(controls.gaze.x + driftX * 0.18 - recoveryDrop, -1, 1, 0),
        y: finiteClamp(controls.gaze.y + driftY * 0.12 - anticipationKick, -1, 1, 0),
        focus: finiteClamp(controls.gaze.focus - closure * 0.2 + anticipation * 0.04, 0, 1, 0.56),
        driftX: finiteClamp(driftX, -0.2, 0.2, 0),
        driftY: finiteClamp(driftY, -0.2, 0.2, 0),
      }),
      blink: Object.freeze({
        openness: finiteClamp(blink.openness - closure, 0, 1, 1),
        cadenceMs,
        pulse: Boolean(blink.pulse),
        phase: finiteClamp(phase, 0, 1, 0),
      }),
      brows: Object.freeze({
        lift: finiteClamp(controls.brows.lift + breath * 0.018 + anticipation * 0.04 - recovery * 0.03, -1, 1, 0),
        pinch: finiteClamp(controls.brows.pinch + anticipation * 0.04 + recovery * 0.06, 0, 1, 0),
        asymmetry: finiteClamp(controls.brows.asymmetry + driftWaveX * drift * 0.06, -1, 1, 0),
      }),
      mouth: Object.freeze({
        shape: mouth.shape,
        openness: finiteClamp(mouth.openness + speechBeat * 0.16 - closure * 0.04, 0, 1, 0),
        activity: speechActivity,
        tension: finiteClamp(mouth.tension + anticipation * 0.04 + recovery * 0.08, 0, 1, 0),
        beat: finiteClamp(speechBeat, 0, 1, 0),
      }),
      posture: Object.freeze({
        lean: finiteClamp(posture.lean + breath * energy * 0.025 + anticipationKick - recoveryDrop, -1, 1, 0),
        turn: finiteClamp(posture.turn + driftWaveX * drift * 0.04, -1, 1, 0),
        energy: finiteClamp(posture.energy, 0, 1, energy),
        recovery: finiteClamp(posture.recovery, 0, 1, recovery),
        breath,
      }),
      motion: Object.freeze({
        energy,
        drift,
        anticipation,
        recovery,
        settleMs: finiteClamp(motion.settleMs, 0, 20000, context.profile.settleMs),
        offsetX: finiteClamp(driftX + anticipationKick - recoveryDrop, -1, 1, 0),
        offsetY: finiteClamp(driftY + breath * energy * 0.02 - recoveryDrop, -1, 1, 0),
      }),
    });
  }

  function finiteInRange(value, min, max) {
    return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
  }

  function validateCoherenceNumber(channel, frame, key, min, max, warnings) {
    if (!finiteInRange(frame?.[key], min, max)) {
      warnings.push(`${channel}.${key} must be finite ${min}..${max}`);
      return null;
    }
    return frame[key];
  }

  function validateCoherenceString(channel, frame, key, allowed, warnings) {
    if (!allowed.includes(frame?.[key])) {
      warnings.push(`${channel}.${key} must be one of ${allowed.join(",")}`);
      return null;
    }
    return frame[key];
  }

  function validateCoherenceBoolean(channel, frame, key, warnings) {
    if (typeof frame?.[key] !== "boolean") {
      warnings.push(`${channel}.${key} must be boolean`);
      return null;
    }
    return frame[key];
  }

  function compactNumber(value) {
    return typeof value === "number" && Number.isFinite(value)
      ? Math.round(value * 1000) / 1000
      : null;
  }

  function compactBoolean(value) {
    return typeof value === "boolean" ? value : null;
  }

  function compactString(value) {
    return typeof value === "string" ? value : null;
  }

  function compactSummaryRecord(summary) {
    const compact = {};
    if (!summary || typeof summary !== "object") return Object.freeze(compact);

    for (const [key, value] of Object.entries(summary)) {
      if (value === null || typeof value === "string" || typeof value === "boolean") {
        compact[key] = value;
      } else {
        compact[key] = compactNumber(value);
      }
    }

    return Object.freeze(compact);
  }

  function compactControlSummary(channel, control = {}) {
    if (channel === "gaze") {
      return Object.freeze({
        target: compactString(control.target),
        x: compactNumber(control.x),
        y: compactNumber(control.y),
        focus: compactNumber(control.focus),
      });
    }
    if (channel === "blink") {
      return Object.freeze({
        openness: compactNumber(control.openness),
        cadenceMs: compactNumber(control.cadenceMs),
        pulse: compactBoolean(control.pulse),
      });
    }
    if (channel === "brows") {
      return Object.freeze({
        lift: compactNumber(control.lift),
        pinch: compactNumber(control.pinch),
        asymmetry: compactNumber(control.asymmetry),
      });
    }
    if (channel === "mouth") {
      return Object.freeze({
        shape: compactString(control.shape),
        openness: compactNumber(control.openness),
        activity: compactNumber(control.activity),
        tension: compactNumber(control.tension),
      });
    }
    if (channel === "posture") {
      return Object.freeze({
        lean: compactNumber(control.lean),
        turn: compactNumber(control.turn),
        energy: compactNumber(control.energy),
        recovery: compactNumber(control.recovery),
      });
    }
    return Object.freeze({
      energy: compactNumber(control.energy),
      drift: compactNumber(control.drift),
      anticipation: compactNumber(control.anticipation),
      recovery: compactNumber(control.recovery),
      settleMs: compactNumber(control.settleMs),
    });
  }

  function freezeChannelCoherence(channel, present, bounded, summary, warnings) {
    return Object.freeze({
      channel,
      present,
      bounded,
      summary: Object.freeze(summary),
      warnings: Object.freeze(warnings),
    });
  }

  function hasCompleteChannelCoherenceReports(coherence) {
    if (!coherence || typeof coherence !== "object") return false;
    if (!coherence.channelReports || typeof coherence.channelReports !== "object") return false;
    return FACE_CONTROL_CHANNELS.every((channel) => {
      const report = coherence.channelReports[channel];
      return report && typeof report === "object" && report.channel === channel;
    });
  }

  function coherenceForDecisionTrace(frameReport) {
    const existingCoherence = frameReport?.coherence;
    return hasCompleteChannelCoherenceReports(existingCoherence)
      ? existingCoherence
      : faceControllerCoherenceForFrame(frameReport);
  }

  function freezeDecisionTraceChannel(channel, decision, channelCoherence) {
    const warnings = Array.isArray(channelCoherence?.warnings)
      ? [...channelCoherence.warnings]
      : [];
    const reads = Array.isArray(decision?.reads)
      ? decision.reads.filter((read) => typeof read === "string")
      : [];
    const present = Boolean(channelCoherence?.present);
    const bounded = Boolean(channelCoherence?.bounded);

    return Object.freeze({
      channel,
      controller: typeof decision?.controller === "string" ? decision.controller : null,
      reads: Object.freeze(reads),
      control: compactControlSummary(channel, decision?.control),
      frame: compactSummaryRecord(channelCoherence?.summary),
      present,
      bounded,
      rendererSafe: present && bounded,
      warningCount: warnings.length,
      warnings: Object.freeze(warnings),
    });
  }

  function faceControllerCoherenceForFrame(frameReport = {}) {
    const warnings = [];
    const frame = frameReport?.frame || {};
    const decisions = frameReport?.decisions || {};
    const channelReports = {};

    for (const channel of FACE_CONTROL_CHANNELS) {
      const channelWarnings = [];
      const channelFrame = frame[channel];
      const decision = decisions[channel];
      const present = Boolean(channelFrame && typeof channelFrame === "object" && decision && typeof decision === "object");

      if (!channelFrame || typeof channelFrame !== "object") {
        channelWarnings.push(`${channel} frame is missing`);
      }
      if (!decision || typeof decision !== "object") {
        channelWarnings.push(`${channel} decision is missing`);
      } else {
        if (decision.channel !== channel) channelWarnings.push(`${channel} decision channel mismatch`);
        if (decision.controller !== `${channel}-controller`) channelWarnings.push(`${channel} controller mismatch`);
        if (!Array.isArray(decision.reads) || !decision.reads.includes("state")) {
          channelWarnings.push(`${channel} decision reads must include state`);
        }
      }

      const summary = {};
      if (channel === "gaze") {
        summary.target = validateCoherenceString(channel, channelFrame, "target", [
          "audience",
          "content",
          "input",
          "middle-distance",
          "question",
          "response-origin",
          "status",
          "user",
        ], channelWarnings);
        summary.x = compactNumber(validateCoherenceNumber(channel, channelFrame, "x", -1, 1, channelWarnings));
        summary.y = compactNumber(validateCoherenceNumber(channel, channelFrame, "y", -1, 1, channelWarnings));
        summary.focus = compactNumber(validateCoherenceNumber(channel, channelFrame, "focus", 0, 1, channelWarnings));
        summary.driftX = compactNumber(validateCoherenceNumber(channel, channelFrame, "driftX", -0.2, 0.2, channelWarnings));
        summary.driftY = compactNumber(validateCoherenceNumber(channel, channelFrame, "driftY", -0.2, 0.2, channelWarnings));
      } else if (channel === "blink") {
        summary.openness = compactNumber(validateCoherenceNumber(channel, channelFrame, "openness", 0, 1, channelWarnings));
        summary.cadenceMs = compactNumber(validateCoherenceNumber(channel, channelFrame, "cadenceMs", 300, 20000, channelWarnings));
        summary.pulse = validateCoherenceBoolean(channel, channelFrame, "pulse", channelWarnings);
        summary.phase = compactNumber(validateCoherenceNumber(channel, channelFrame, "phase", 0, 1, channelWarnings));
      } else if (channel === "brows") {
        summary.lift = compactNumber(validateCoherenceNumber(channel, channelFrame, "lift", -1, 1, channelWarnings));
        summary.pinch = compactNumber(validateCoherenceNumber(channel, channelFrame, "pinch", 0, 1, channelWarnings));
        summary.asymmetry = compactNumber(validateCoherenceNumber(channel, channelFrame, "asymmetry", -1, 1, channelWarnings));
      } else if (channel === "mouth") {
        summary.shape = validateCoherenceString(channel, channelFrame, "shape", FACE_MOUTH_SHAPES, channelWarnings);
        summary.openness = compactNumber(validateCoherenceNumber(channel, channelFrame, "openness", 0, 1, channelWarnings));
        summary.activity = compactNumber(validateCoherenceNumber(channel, channelFrame, "activity", 0, 1, channelWarnings));
        summary.tension = compactNumber(validateCoherenceNumber(channel, channelFrame, "tension", 0, 1, channelWarnings));
        summary.beat = compactNumber(validateCoherenceNumber(channel, channelFrame, "beat", 0, 1, channelWarnings));
      } else if (channel === "posture") {
        summary.lean = compactNumber(validateCoherenceNumber(channel, channelFrame, "lean", -1, 1, channelWarnings));
        summary.turn = compactNumber(validateCoherenceNumber(channel, channelFrame, "turn", -1, 1, channelWarnings));
        summary.energy = compactNumber(validateCoherenceNumber(channel, channelFrame, "energy", 0, 1, channelWarnings));
        summary.recovery = compactNumber(validateCoherenceNumber(channel, channelFrame, "recovery", 0, 1, channelWarnings));
        summary.breath = compactNumber(validateCoherenceNumber(channel, channelFrame, "breath", 0, 1, channelWarnings));
      } else if (channel === "motion") {
        summary.energy = compactNumber(validateCoherenceNumber(channel, channelFrame, "energy", 0, 1, channelWarnings));
        summary.drift = compactNumber(validateCoherenceNumber(channel, channelFrame, "drift", 0, 1, channelWarnings));
        summary.anticipation = compactNumber(validateCoherenceNumber(channel, channelFrame, "anticipation", 0, 1, channelWarnings));
        summary.recovery = compactNumber(validateCoherenceNumber(channel, channelFrame, "recovery", 0, 1, channelWarnings));
        summary.settleMs = compactNumber(validateCoherenceNumber(channel, channelFrame, "settleMs", 0, 20000, channelWarnings));
        summary.offsetX = compactNumber(validateCoherenceNumber(channel, channelFrame, "offsetX", -1, 1, channelWarnings));
        summary.offsetY = compactNumber(validateCoherenceNumber(channel, channelFrame, "offsetY", -1, 1, channelWarnings));
      }

      const bounded = channelWarnings.length === 0;
      warnings.push(...channelWarnings);
      channelReports[channel] = freezeChannelCoherence(channel, present, bounded, summary, channelWarnings);
    }

    const presentChannels = FACE_CONTROL_CHANNELS.filter((channel) => channelReports[channel].present);
    const boundedChannels = FACE_CONTROL_CHANNELS.filter((channel) => channelReports[channel].bounded);
    const complete = presentChannels.length === FACE_CONTROL_CHANNELS.length;
    const bounded = boundedChannels.length === FACE_CONTROL_CHANNELS.length;

    return Object.freeze({
      channels: FACE_CONTROL_CHANNELS,
      complete,
      bounded,
      rendererSafe: complete && bounded,
      summary: Object.freeze({
        channelCount: FACE_CONTROL_CHANNELS.length,
        presentChannelCount: presentChannels.length,
        boundedChannelCount: boundedChannels.length,
        gazeTarget: channelReports.gaze.summary.target,
        gazeFocus: channelReports.gaze.summary.focus,
        blinkOpenness: channelReports.blink.summary.openness,
        mouthShape: channelReports.mouth.summary.shape,
        mouthActivity: channelReports.mouth.summary.activity,
        postureLean: channelReports.posture.summary.lean,
        motionEnergy: channelReports.motion.summary.energy,
        motionRecovery: channelReports.motion.summary.recovery,
      }),
      channelReports: Object.freeze(channelReports),
      warnings: Object.freeze(warnings),
    });
  }

  function faceControllerDecisionTraceForFrame(frameReport = {}) {
    const report = frameReport && typeof frameReport === "object" ? frameReport : {};
    const decisions = report.decisions && typeof report.decisions === "object"
      ? report.decisions
      : {};
    const coherence = coherenceForDecisionTrace(report);
    const channelTraces = {};
    let decisionCount = 0;

    for (const channel of FACE_CONTROL_CHANNELS) {
      const decision = decisions[channel];
      if (decision && typeof decision === "object") decisionCount += 1;
      channelTraces[channel] = freezeDecisionTraceChannel(
        channel,
        decision,
        coherence.channelReports[channel],
      );
    }

    const warnings = Array.isArray(coherence.warnings) ? [...coherence.warnings] : [];
    const complete = Boolean(coherence.complete && decisionCount === FACE_CONTROL_CHANNELS.length);

    return Object.freeze({
      channels: FACE_CONTROL_CHANNELS,
      decisionCount,
      complete,
      rendererSafe: Boolean(complete && coherence.rendererSafe),
      warningCount: warnings.length,
      warnings: Object.freeze(warnings),
      decisions: Object.freeze(channelTraces),
    });
  }

  function formatSvgNumber(value, fallback = 0) {
    const numeric = finiteNumber(value, fallback);
    if (Math.abs(numeric) < 0.0005) return "0";
    return String(Math.round(numeric * 1000) / 1000);
  }

  function escapeSvgAttribute(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function svgAttribute(name, value) {
    if (value === false || value === null || value === undefined) return "";
    return ` ${name}="${escapeSvgAttribute(value === true ? "" : value)}"`;
  }

  function svgAttrs(attributes) {
    return Object.entries(attributes)
      .map(([name, value]) => svgAttribute(name, value))
      .join("");
  }

  function serializeChannelEvidence(report) {
    const evidence = {};
    for (const channel of FACE_CONTROL_CHANNELS) {
      evidence[channel] = Object.freeze({
        controller: report.decisions[channel].controller,
        reads: report.decisions[channel].reads,
        frame: report.frame[channel],
      });
    }
    return Object.freeze(evidence);
  }

  function serializeDecisionTraceAttributes(report, decisionTrace) {
    const latencyPhase = typeof report.sharedInputs?.latencyPhase === "string"
      ? report.sharedInputs.latencyPhase
      : null;

    return Object.freeze({
      decisionTrace: decisionTrace.complete ? "complete" : "incomplete",
      decisionTraceChannels: decisionTrace.channels.join(" "),
      decisionTraceDecisions: String(decisionTrace.decisionCount),
      decisionTraceWarnings: String(decisionTrace.warningCount),
      decisionTraceRendererSafe: String(decisionTrace.rendererSafe),
      ...(latencyPhase ? { latencyPhase } : {}),
    });
  }

  function mouthPathForFrame(mouth) {
    const centerY = 126 + mouth.tension * 6 - mouth.openness * 8 - mouth.beat * 4;
    const open = mouth.openness * 18 + mouth.beat * 10;
    const smile = mouth.shape === "soft-smile" || mouth.shape === "release" ? 9 : 0;
    const downturn = mouth.shape === "downturned" ? -10 : 0;
    const width = 28 + mouth.activity * 12 - mouth.tension * 5;
    const leftX = 120 - width;
    const rightX = 120 + width;
    const curveY = centerY + open + smile + downturn;

    if (mouth.shape === "pressed") {
      return `M${formatSvgNumber(leftX)} ${formatSvgNumber(centerY)} L${formatSvgNumber(rightX)} ${formatSvgNumber(centerY)}`;
    }

    return `M${formatSvgNumber(leftX)} ${formatSvgNumber(centerY)} C${formatSvgNumber(120 - width * 0.35)} ${formatSvgNumber(curveY)} ${formatSvgNumber(120 + width * 0.35)} ${formatSvgNumber(curveY)} ${formatSvgNumber(rightX)} ${formatSvgNumber(centerY)}`;
  }

  function renderPresenceFaceSvg(snapshotOrState, options = {}) {
    const report = faceControllerFrameForPresence(snapshotOrState, options);
    const frame = report.frame;
    const width = Number.isFinite(Number(options.width)) ? Number(options.width) : 240;
    const height = Number.isFinite(Number(options.height)) ? Number(options.height) : 180;
    const className = options.className || "presence-face-svg";
    const title = options.title || `${report.state} reference face`;
    const faceX = 120 + frame.motion.offsetX * 18 + frame.posture.turn * 12;
    const faceY = 88 + frame.motion.offsetY * 12 - frame.posture.lean * 10;
    const eyeOpen = clamp(frame.blink.openness, 0.08, 1);
    const focus = clamp(frame.gaze.focus, 0, 1);
    const eyeShare = 10 + focus * 8;
    const lookX = frame.gaze.x * eyeShare;
    const lookY = frame.gaze.y * 6;
    const browLift = -frame.brows.lift * 14 + frame.brows.pinch * 5;
    const browPinch = frame.brows.pinch * 8;
    const browAsymmetry = frame.brows.asymmetry * 6;
    const mouthPath = mouthPathForFrame(frame.mouth);
    const decisionTrace = faceControllerDecisionTraceForFrame(report);
    const traceAttributes = serializeDecisionTraceAttributes(report, decisionTrace);
    const attributes = Object.freeze({
      state: report.state,
      expression: report.expression,
      channels: FACE_CONTROL_CHANNELS.join(" "),
      gazeTarget: frame.gaze.target,
      blinkOpenness: formatSvgNumber(frame.blink.openness),
      browsPinch: formatSvgNumber(frame.brows.pinch),
      mouthShape: frame.mouth.shape,
      postureLean: formatSvgNumber(frame.posture.lean),
      motionEnergy: formatSvgNumber(frame.motion.energy),
      motionScale: formatSvgNumber(resolveMotionScale(options), 1),
      ...traceAttributes,
    });
    const channelEvidence = serializeChannelEvidence(report);
    const rootAttributes = {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 240 180",
      width: formatSvgNumber(width, 240),
      height: formatSvgNumber(height, 180),
      role: "img",
      class: className,
      "aria-label": title,
      "data-presence-state": attributes.state,
      "data-face-expression": attributes.expression,
      "data-face-channels": attributes.channels,
      "data-gaze-target": attributes.gazeTarget,
      "data-blink-openness": attributes.blinkOpenness,
      "data-brows-pinch": attributes.browsPinch,
      "data-mouth-shape": attributes.mouthShape,
      "data-posture-lean": attributes.postureLean,
      "data-motion-energy": attributes.motionEnergy,
      "data-motion-scale": attributes.motionScale,
      "data-face-decision-trace": attributes.decisionTrace,
      "data-face-decision-trace-channels": attributes.decisionTraceChannels,
      "data-face-decision-trace-decisions": attributes.decisionTraceDecisions,
      "data-face-decision-trace-warnings": attributes.decisionTraceWarnings,
      "data-face-decision-trace-renderer-safe": attributes.decisionTraceRendererSafe,
      "data-face-latency-phase": attributes.latencyPhase,
    };
    const svg = [
      `<svg${svgAttrs(rootAttributes)}>`,
      `<title>${escapeSvgAttribute(title)}</title>`,
      `<g transform="translate(${formatSvgNumber(faceX - 120)} ${formatSvgNumber(faceY - 88)})">`,
      `<ellipse cx="120" cy="88" rx="${formatSvgNumber(67 - frame.posture.recovery * 4)}" ry="${formatSvgNumber(72 + frame.posture.lean * 8)}" fill="none" stroke="currentColor" stroke-width="4"/>`,
      `<path d="M71 ${formatSvgNumber(61 + browLift - browAsymmetry)} C88 ${formatSvgNumber(52 + browLift)} ${formatSvgNumber(100 + browPinch)} ${formatSvgNumber(54 + browLift)} 111 ${formatSvgNumber(63 + browLift)}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="4"/>`,
      `<path d="M129 ${formatSvgNumber(63 + browLift)} C${formatSvgNumber(140 - browPinch)} ${formatSvgNumber(54 + browLift)} 152 ${formatSvgNumber(52 + browLift)} 169 ${formatSvgNumber(61 + browLift + browAsymmetry)}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="4"/>`,
      `<g transform="translate(${formatSvgNumber(lookX)} ${formatSvgNumber(lookY)}) scale(1 ${formatSvgNumber(eyeOpen)})">`,
      `<ellipse cx="88" cy="82" rx="12" ry="14" fill="currentColor"/>`,
      `<ellipse cx="152" cy="82" rx="12" ry="14" fill="currentColor"/>`,
      `</g>`,
      `<path d="${mouthPath}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="${formatSvgNumber(4 + frame.mouth.activity * 2 + frame.mouth.tension)}"/>`,
      `</g>`,
      `</svg>`,
    ].join("");

    return Object.freeze({
      svg,
      state: report.state,
      expression: report.expression,
      frame: report.frame,
      frameReport: report,
      attributes,
      channelEvidence,
      decisionTrace,
    });
  }

  function faceControllerDecisionReportFromContext(context, options = {}) {
    const expression = faceExpressionForPresence(context.snapshotOrState, options);
    return Object.freeze({
      state: context.stateName,
      expression,
      sharedInputs: freezeSharedControlInputs(context.inputs),
      decisions: composeFaceControllerDecisions(context),
    });
  }

  function faceControllerDecisionsForPresence(snapshotOrState, options = {}) {
    return faceControllerDecisionReportFromContext(
      createFaceControllerContext(snapshotOrState, options),
      options,
    );
  }

  function faceControlsForPresence(snapshotOrState, options = {}) {
    const report = faceControllerDecisionsForPresence(snapshotOrState, options);
    return freezeControlsFromDecisions(report.expression, report.decisions);
  }

  function faceControllerFrameForPresence(snapshotOrState, options = {}) {
    const context = createFaceControllerContext(snapshotOrState, options);
    const report = faceControllerDecisionReportFromContext(context, options);
    const frameReport = {
      ...report,
      frame: composeFaceControllerFrame(report, context, options),
    };

    return Object.freeze({
      ...frameReport,
      coherence: faceControllerCoherenceForFrame(frameReport),
    });
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

  function createFaceControllerFrameRuntime(options = {}) {
    const baseOptions = { ...options };
    let lastFrame = null;

    return Object.freeze({
      getFrame() {
        return lastFrame;
      },
      update(snapshot, updateOptions = {}) {
        const frame = faceControllerFrameForPresence(snapshot, { ...baseOptions, ...updateOptions });
        lastFrame = frame;
        if (typeof baseOptions.update === "function") baseOptions.update(frame, snapshot);
        if (typeof updateOptions.update === "function") updateOptions.update(frame, snapshot);
        return frame;
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
    FACE_CONTROL_CHANNELS,
    createFaceControllerFrameRuntime,
    createFaceControllerRuntime,
    createFaceRenderer,
    renderPresenceFaceSvg,
    faceControllerCoherenceForFrame,
    faceControllerDecisionTraceForFrame,
    faceControllerFrameForPresence,
    faceControllerDecisionsForPresence,
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
