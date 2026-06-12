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

  const FACE_CONTROL_CHANNELS = Object.freeze(["gaze", "blink", "brows", "mouth", "posture", "motion"]);

  const FACE_CONTROLLER_READS = Object.freeze({
    gaze: Object.freeze(["state", "detail.question", "attentionTarget", "attentionX", "attentionY", "focus", "ageMs"]),
    blink: Object.freeze(["state", "profile.blinkCadenceMs"]),
    brows: Object.freeze(["state", "detail.question", "detail.revision"]),
    mouth: Object.freeze(["state", "detail.question", "detail.revision", "speechActivity", "tension", "latencyPhase", "recovery"]),
    posture: Object.freeze(["state", "energy", "recovery", "interruption", "latencyPhase"]),
    motion: Object.freeze(["state", "profile.drift", "profile.settleMs", "energy", "anticipation", "recovery", "speechActivity", "latencyPhase", "ageMs"]),
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
    const { stateName, profile } = context;

    switch (stateName) {
      case PresenceState.USER_TYPING:
      case "user-typing":
        return { openness: 1, cadenceMs: 4400, pulse: false };

      case PresenceState.READING:
      case "reading":
        return { openness: 0.94, cadenceMs: 5200, pulse: false };

      case PresenceState.WAITING:
      case "waiting":
        return { openness: 0.9, cadenceMs: 3400, pulse: false };

      case PresenceState.THINKING:
      case "thinking":
        return { openness: 0.82, cadenceMs: 3800, pulse: false };

      case PresenceState.STREAMING:
      case "streaming":
        return { openness: 0.98, cadenceMs: 6800, pulse: false };

      case PresenceState.SPEAKING:
      case "speaking":
        return { openness: 0.98, cadenceMs: 7200, pulse: false };

      case PresenceState.INTERRUPTED:
      case "interrupted":
        return { openness: 0.72, cadenceMs: 900, pulse: true };

      case PresenceState.ERROR:
      case "error":
        return { openness: 0.86, cadenceMs: 3000, pulse: false };

      case PresenceState.READY:
      case "ready":
      default:
        return { openness: 1, cadenceMs: profile.blinkCadenceMs, pulse: false };
    }
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

  function blinkClosureForPhase(phase, pulse) {
    const closure = phase < 0.08
      ? 1 - Math.abs(phase - 0.04) / 0.04
      : phase > 0.92
        ? (phase - 0.92) / 0.08
        : 0;
    return clamp(closure * (pulse ? 0.52 : 0.32), 0, 0.72);
  }

  function composeFaceControllerFrame(report, context, options = {}) {
    const timeMs = resolveFrameTime(options, context.now);
    const ageMs = stateAgeMs(context.snapshot, context.history, timeMs);
    const controls = freezeControlsFromDecisions(report.expression, report.decisions);
    const motion = controls.motion;
    const blink = controls.blink;
    const mouth = controls.mouth;
    const posture = controls.posture;
    const cadenceMs = finiteClamp(blink.cadenceMs, 300, 20000, context.profile.blinkCadenceMs);
    const phase = normalizedPhase(timeMs, cadenceMs);
    const closure = blinkClosureForPhase(phase, blink.pulse);
    const energy = finiteClamp(motion.energy, 0, 1, 0);
    const drift = finiteClamp(motion.drift, 0, 1, context.profile.drift);
    const anticipation = finiteClamp(motion.anticipation, 0, 1, 0);
    const recovery = finiteClamp(motion.recovery, 0, 1, 0);
    const speechActivity = finiteClamp(mouth.activity, 0, 1, 0);
    const driftWaveX = normalizedWave(timeMs, 2400, 0.13);
    const driftWaveY = normalizedWave(timeMs, 3100, 0.41);
    const speechBeat = speechActivity * (0.5 + normalizedWave(timeMs, 260, 0.08) * 0.5);
    const breath = clamp(0.5 + normalizedWave(timeMs, 3600, 0.32) * 0.5, 0, 1);
    const settle = clamp(ageMs / Math.max(1, finiteNumber(motion.settleMs, context.profile.settleMs)), 0, 1);
    const driftScale = drift * (0.18 + energy * 0.32) * (1 - recovery * 0.35);
    const driftX = driftWaveX * driftScale;
    const driftY = driftWaveY * driftScale * 0.72;
    const anticipationKick = anticipation * (1 - settle) * 0.08;
    const recoveryDrop = recovery * (1 - settle * 0.45) * 0.08;

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

    return Object.freeze({
      ...report,
      frame: composeFaceControllerFrame(report, context, options),
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
