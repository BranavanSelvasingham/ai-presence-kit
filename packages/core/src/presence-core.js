(function initPresenceCore(globalScope) {
  "use strict";

  const PresenceState = Object.freeze({
    IDLE: "idle",
    USER_TYPING: "user-typing",
    READING: "reading",
    WAITING: "waiting",
    THINKING: "thinking",
    STREAMING: "streaming",
    SPEAKING: "speaking",
    INTERRUPTED: "interrupted",
    READY: "ready",
    ERROR: "error",
  });

  const PresenceEvent = Object.freeze({
    RESET: "reset",
    USER_INPUT: "user-input",
    LOCAL_READ: "local-read",
    USER_PAUSE: "user-pause",
    SPECULATION_START: "speculation-start",
    SPECULATION_READY: "speculation-ready",
    SUBMIT: "submit",
    STREAM_OPEN: "stream-open",
    TOKEN: "token",
    RESPONSE_COMPLETE: "response-complete",
    SPEECH_START: "speech-start",
    SPEECH_END: "speech-end",
    VOICE_WAITING: "voice-waiting",
    INTERRUPT: "interrupt",
    ERROR: "error",
  });

  const PRESENCE_STATES = Object.freeze(Object.values(PresenceState));
  const PRESENCE_EVENTS = Object.freeze(Object.values(PresenceEvent));
  const presenceStateSet = new Set(PRESENCE_STATES);
  const presenceTransitionEventSet = new Set([...PRESENCE_EVENTS, "set-state"]);

  function isPresenceState(value) {
    return presenceStateSet.has(value);
  }

  function normalizePresenceState(value, fallback = PresenceState.IDLE) {
    return isPresenceState(value) ? value : fallback;
  }

  function normalizePresenceTransitionEvent(value) {
    return presenceTransitionEventSet.has(value) ? value : null;
  }

  function hasText(payload) {
    return typeof payload?.text === "string" && payload.text.trim().length > 0;
  }

  function readCompletion(payload) {
    const completion = Number(payload?.completion ?? payload?.features?.completion);
    return Number.isFinite(completion) ? Math.max(0, Math.min(1, completion)) : 0;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function reducePresenceState(currentState, event, payload = {}) {
    switch (event) {
      case PresenceEvent.RESET:
        return hasText(payload) ? PresenceState.READY : PresenceState.IDLE;

      case PresenceEvent.USER_INPUT:
        return hasText(payload) ? PresenceState.USER_TYPING : PresenceState.IDLE;

      case PresenceEvent.LOCAL_READ:
        if (!hasText(payload)) return PresenceState.IDLE;
        return payload.ready || readCompletion(payload) > 0.72
          ? PresenceState.READY
          : PresenceState.READING;

      case PresenceEvent.USER_PAUSE:
        if (!hasText(payload)) return PresenceState.IDLE;
        return payload.ready || readCompletion(payload) > 0.68
          ? PresenceState.READY
          : PresenceState.THINKING;

      case PresenceEvent.SPECULATION_START:
        return currentState === PresenceState.USER_TYPING ? PresenceState.READING : currentState;

      case PresenceEvent.SPECULATION_READY:
        if (!hasText(payload)) return PresenceState.IDLE;
        return payload.ready || readCompletion(payload) > 0.72
          ? PresenceState.READY
          : PresenceState.THINKING;

      case PresenceEvent.SUBMIT:
        return PresenceState.THINKING;

      case PresenceEvent.STREAM_OPEN:
        return PresenceState.WAITING;

      case PresenceEvent.TOKEN:
        return PresenceState.STREAMING;

      case PresenceEvent.RESPONSE_COMPLETE:
        return PresenceState.READY;

      case PresenceEvent.SPEECH_START:
        return PresenceState.SPEAKING;

      case PresenceEvent.SPEECH_END:
        return PresenceState.READY;

      case PresenceEvent.VOICE_WAITING:
        return PresenceState.WAITING;

      case PresenceEvent.INTERRUPT:
        return PresenceState.INTERRUPTED;

      case PresenceEvent.ERROR:
        return PresenceState.ERROR;

      default:
        return currentState;
    }
  }

  function normalizeTraceLimit(limit) {
    if (limit === Infinity) return Infinity;
    const numericLimit = Number(limit ?? 128);
    if (!Number.isFinite(numericLimit)) return 128;
    return Math.max(0, Math.floor(numericLimit));
  }

  function createPresenceTrace(options = {}) {
    const limit = normalizeTraceLimit(options.limit);
    const entries = [];
    let firstUpdatedAt = null;
    let previousUpdatedAt = null;
    let nextIndex = 0;

    function record(snapshot) {
      if (!snapshot || typeof snapshot !== "object") {
        throw new TypeError("createPresenceTrace().record requires a presence snapshot.");
      }

      if (firstUpdatedAt === null) firstUpdatedAt = snapshot.updatedAt;

      const entry = Object.freeze({
        index: nextIndex,
        state: normalizePresenceState(snapshot.state),
        previousState: snapshot.previousState
          ? normalizePresenceState(snapshot.previousState, null)
          : null,
        event: snapshot.event,
        detail: Object.freeze({ ...(snapshot.detail || {}) }),
        changed: Boolean(snapshot.changed),
        updatedAt: snapshot.updatedAt,
        version: Number(snapshot.version) || 0,
        elapsedMs: snapshot.updatedAt - firstUpdatedAt,
        sincePreviousMs: previousUpdatedAt === null ? 0 : snapshot.updatedAt - previousUpdatedAt,
      });

      nextIndex += 1;
      previousUpdatedAt = snapshot.updatedAt;

      if (limit > 0) {
        entries.push(entry);
        while (entries.length > limit) entries.shift();
      }

      return entry;
    }

    function attach(runtime, attachOptions = {}) {
      if (!runtime || typeof runtime.subscribe !== "function" || typeof runtime.getSnapshot !== "function") {
        throw new TypeError("createPresenceTrace().attach requires a presence runtime.");
      }

      if (attachOptions.includeInitial !== false) {
        record(runtime.getSnapshot());
      }

      return runtime.subscribe(record);
    }

    return Object.freeze({
      attach,
      clear() {
        entries.length = 0;
        firstUpdatedAt = null;
        previousUpdatedAt = null;
        nextIndex = 0;
      },
      getEntries() {
        return entries.slice();
      },
      record,
      toJSON() {
        return entries.slice();
      },
    });
  }

  function traceEntriesFromInput(traceOrEntries) {
    if (Array.isArray(traceOrEntries)) return traceOrEntries;
    if (traceOrEntries && typeof traceOrEntries.getEntries === "function") {
      const entries = traceOrEntries.getEntries();
      return Array.isArray(entries) ? entries : [];
    }
    if (traceOrEntries && typeof traceOrEntries.toJSON === "function") {
      const entries = traceOrEntries.toJSON();
      return Array.isArray(entries) ? entries : [];
    }
    return [];
  }

  function firstFiniteUpdatedAt(entries) {
    for (const entry of entries) {
      const updatedAt = Number(entry?.updatedAt);
      if (Number.isFinite(updatedAt)) return updatedAt;
    }
    return null;
  }

  function elapsedMsForTraceEntry(entry, firstUpdatedAt) {
    const elapsedMs = Number(entry?.elapsedMs);
    if (Number.isFinite(elapsedMs)) return elapsedMs;

    const updatedAt = Number(entry?.updatedAt);
    if (Number.isFinite(updatedAt) && Number.isFinite(firstUpdatedAt)) {
      return Math.max(0, updatedAt - firstUpdatedAt);
    }

    return null;
  }

  function pushUnique(values, value) {
    if (value && !values.includes(value)) values.push(value);
  }

  function summarizePresenceTrace(traceOrEntries) {
    const entries = traceEntriesFromInput(traceOrEntries);
    const firstUpdatedAt = firstFiniteUpdatedAt(entries);
    const states = [];
    const events = [];
    let firstStateMs = null;
    let streamOpenMs = null;
    let firstTokenMs = null;
    let speechStartMs = null;
    let firstOutputMs = null;
    let firstOutputEvent = null;
    let interruptMs = null;
    let interrupted = false;
    let finalState = null;
    let complete = false;

    for (const entry of entries) {
      const elapsedMs = elapsedMsForTraceEntry(entry, firstUpdatedAt);
      const state = normalizePresenceState(entry?.state, null);
      const event = typeof entry?.event === "string" && entry.event.length ? entry.event : null;

      if (state) {
        pushUnique(states, state);
        finalState = state;
        if (state === PresenceState.INTERRUPTED) interrupted = true;
        if (firstStateMs === null && elapsedMs !== null) firstStateMs = elapsedMs;
      }

      if (!event) continue;
      pushUnique(events, event);

      if (event === PresenceEvent.STREAM_OPEN && streamOpenMs === null) streamOpenMs = elapsedMs;
      if (event === PresenceEvent.TOKEN && firstTokenMs === null) firstTokenMs = elapsedMs;
      if (event === PresenceEvent.SPEECH_START && speechStartMs === null) speechStartMs = elapsedMs;
      if (event === PresenceEvent.INTERRUPT) {
        if (interruptMs === null) interruptMs = elapsedMs;
        interrupted = true;
      }
      if ((event === PresenceEvent.TOKEN || event === PresenceEvent.SPEECH_START) && firstOutputEvent === null) {
        firstOutputEvent = event;
        firstOutputMs = elapsedMs;
      }
      if (event === PresenceEvent.RESPONSE_COMPLETE || event === PresenceEvent.SPEECH_END) {
        complete = true;
      }
    }

    const presenceBeforeOutputMs = firstStateMs !== null && firstOutputMs !== null && firstStateMs < firstOutputMs
      ? firstOutputMs - firstStateMs
      : null;

    return Object.freeze({
      entryCount: entries.length,
      states: Object.freeze(states),
      events: Object.freeze(events),
      firstStateMs,
      streamOpenMs,
      firstTokenMs,
      speechStartMs,
      firstOutputMs,
      firstOutputEvent,
      interruptMs,
      interrupted,
      presenceBeforeOutputMs,
      finalState,
      hasOutput: firstOutputEvent !== null,
      complete,
    });
  }

  function normalizeSnapshotInput(snapshotOrState, options = {}) {
    if (typeof snapshotOrState === "string") {
      return {
        state: normalizePresenceState(snapshotOrState),
        previousState: null,
        event: null,
        detail: options.detail || {},
        updatedAt: null,
        version: 0,
      };
    }

    return {
      state: normalizePresenceState(snapshotOrState?.state),
      previousState: snapshotOrState?.previousState
        ? normalizePresenceState(snapshotOrState.previousState, null)
        : null,
      event: snapshotOrState?.event || null,
      detail: snapshotOrState?.detail || {},
      updatedAt: Number.isFinite(Number(snapshotOrState?.updatedAt))
        ? Number(snapshotOrState.updatedAt)
        : null,
      version: Number(snapshotOrState?.version) || 0,
    };
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

  function latestTransitionHistory(history, state) {
    for (let index = history.length - 1; index >= 0; index -= 1) {
      const entry = history[index];
      const entryState = normalizePresenceState(entry?.state, null);
      if (!entryState || entryState === state) return { entry, index };
    }
    return { entry: null, index: -1 };
  }

  function stateAgeMs(snapshot, history, now) {
    if (snapshot.updatedAt !== null) return Math.max(0, now - snapshot.updatedAt);
    const latest = latestHistoryEntry(history);
    const latestTime = Number(latest?.updatedAt);
    return Number.isFinite(latestTime) ? Math.max(0, now - latestTime) : 0;
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

  function recentStates(history) {
    const states = [];
    for (let index = history.length - 1; index >= 0 && states.length < 4; index -= 1) {
      const state = normalizePresenceState(history[index]?.state, null);
      if (state && !states.includes(state)) states.unshift(state);
    }
    return Object.freeze(states);
  }

  function previousHistoryState(history, beforeIndex) {
    for (let index = beforeIndex - 1; index >= 0; index -= 1) {
      const state = normalizePresenceState(history[index]?.state, null);
      if (state) return state;
    }
    return null;
  }

  function transitionContext(snapshot, history, now) {
    const transitionHistory = latestTransitionHistory(history, snapshot.state);
    const latest = transitionHistory.entry;
    const previousState = snapshot.previousState
      || normalizePresenceState(latest?.previousState, null)
      || previousHistoryState(history, transitionHistory.index);
    const transitionEvent = normalizePresenceTransitionEvent(snapshot.event)
      || normalizePresenceTransitionEvent(latest?.event);
    const transitionUpdatedAt = snapshot.updatedAt !== null
      ? snapshot.updatedAt
      : Number(latest?.updatedAt);
    const transitionAgeMs = Number.isFinite(transitionUpdatedAt)
      ? Math.max(0, now - transitionUpdatedAt)
      : 0;

    return {
      previousState,
      transitionEvent,
      transitionAgeMs,
    };
  }

  function baseControlInputsForState(state, detail = {}) {
    switch (state) {
      case PresenceState.USER_TYPING:
        return {
          attentionTarget: "input",
          attentionX: -0.18,
          attentionY: 0.18,
          focus: 0.7,
          tension: 0.08,
          energy: 0.38,
          anticipation: 0.18,
          speechActivity: 0,
          interruption: 0,
          latencyPhase: "input",
        };

      case PresenceState.READING:
        return {
          attentionTarget: "content",
          attentionX: -0.2,
          attentionY: 0.28,
          focus: 0.76,
          tension: detail.revision ? 0.32 : 0.12,
          energy: 0.42,
          anticipation: 0.22,
          speechActivity: 0,
          interruption: 0,
          latencyPhase: "input",
        };

      case PresenceState.WAITING:
        return {
          attentionTarget: "response",
          attentionX: -0.08,
          attentionY: -0.04,
          focus: 0.66,
          tension: 0.34,
          energy: 0.5,
          anticipation: 0.62,
          speechActivity: 0,
          interruption: 0,
          latencyPhase: "before-output",
        };

      case PresenceState.THINKING:
        return {
          attentionTarget: "response",
          attentionX: 0.16,
          attentionY: -0.02,
          focus: 0.58,
          tension: 0.42,
          energy: 0.48,
          anticipation: 0.52,
          speechActivity: 0,
          interruption: 0,
          latencyPhase: "before-output",
        };

      case PresenceState.STREAMING:
        return {
          attentionTarget: "audience",
          attentionX: 0,
          attentionY: 0,
          focus: 0.74,
          tension: 0.06,
          energy: 0.72,
          anticipation: 0.12,
          speechActivity: 0.82,
          interruption: 0,
          latencyPhase: "output",
        };

      case PresenceState.SPEAKING:
        return {
          attentionTarget: "audience",
          attentionX: 0,
          attentionY: -0.02,
          focus: 0.78,
          tension: 0.04,
          energy: 0.78,
          anticipation: 0,
          speechActivity: 1,
          interruption: 0,
          latencyPhase: "output",
        };

      case PresenceState.INTERRUPTED:
        return {
          attentionTarget: "user",
          attentionX: -0.26,
          attentionY: -0.08,
          focus: 0.88,
          tension: 0.72,
          energy: 0.62,
          anticipation: 0,
          speechActivity: 0,
          interruption: 1,
          latencyPhase: "interrupted",
        };

      case PresenceState.READY:
        return {
          attentionTarget: "user",
          attentionX: 0,
          attentionY: 0,
          focus: 0.68,
          tension: 0,
          energy: 0.3,
          anticipation: 0,
          speechActivity: 0,
          interruption: 0,
          latencyPhase: "settled",
        };

      case PresenceState.ERROR:
        return {
          attentionTarget: "status",
          attentionX: 0,
          attentionY: 0.18,
          focus: 0.8,
          tension: 0.66,
          energy: 0.42,
          anticipation: 0,
          speechActivity: 0,
          interruption: 0,
          latencyPhase: "error",
        };

      case PresenceState.IDLE:
      default:
        return {
          attentionTarget: "user",
          attentionX: 0,
          attentionY: 0,
          focus: 0.56,
          tension: 0,
          energy: 0.2,
          anticipation: 0,
          speechActivity: 0,
          interruption: 0,
          latencyPhase: "settled",
        };
    }
  }

  function presenceControlInputsForSnapshot(snapshotOrState, options = {}) {
    const snapshot = normalizeSnapshotInput(snapshotOrState, options);
    const history = readHistory(options);
    const now = resolveNow(options, snapshot, history);
    const ageMs = stateAgeMs(snapshot, history, now);
    const transition = transitionContext(snapshot, history, now);
    const inputs = baseControlInputsForState(snapshot.state, snapshot.detail);
    const recentlyInterrupted = includesRecentState(snapshot, history, PresenceState.INTERRUPTED, 2400, now);
    const recentlyStreaming = includesRecentState(snapshot, history, PresenceState.STREAMING, 1800, now);
    const recentlySpeaking = includesRecentState(snapshot, history, PresenceState.SPEAKING, 1800, now);
    let recovery = snapshot.state === PresenceState.INTERRUPTED ? 1 : 0;
    let latencyPhase = inputs.latencyPhase;

    if (snapshot.state === PresenceState.READY && recentlyInterrupted) {
      recovery = 0.42;
      latencyPhase = "recovery";
      inputs.tension = Math.max(inputs.tension, 0.18);
    } else if (snapshot.state === PresenceState.READY && (recentlyStreaming || recentlySpeaking)) {
      recovery = 0.24;
      latencyPhase = "recovery";
      inputs.speechActivity = 0.18;
    }

    if (snapshot.state === PresenceState.READY) {
      const softness = clamp(ageMs / 1800, 0, 1);
      inputs.focus = clamp(inputs.focus - softness * 0.1, 0.5, 0.72);
      inputs.energy = clamp(inputs.energy - softness * 0.08, 0.16, 1);
    }

    return Object.freeze({
      state: snapshot.state,
      previousState: transition.previousState,
      transitionEvent: transition.transitionEvent,
      transitionAgeMs: transition.transitionAgeMs,
      attentionTarget: inputs.attentionTarget,
      attentionX: inputs.attentionX,
      attentionY: inputs.attentionY,
      focus: inputs.focus,
      tension: inputs.tension,
      energy: inputs.energy,
      anticipation: inputs.anticipation,
      recovery,
      speechActivity: inputs.speechActivity,
      interruption: inputs.interruption,
      latencyPhase,
      ageMs,
      recentStates: recentStates(history),
    });
  }

  function createPresenceControlInputRuntime(options = {}) {
    const baseOptions = { ...options };
    let lastInputs = null;

    return Object.freeze({
      getInputs() {
        return lastInputs;
      },
      update(snapshot, updateOptions = {}) {
        const inputs = presenceControlInputsForSnapshot(snapshot, { ...baseOptions, ...updateOptions });
        lastInputs = inputs;
        if (typeof baseOptions.update === "function") baseOptions.update(inputs, snapshot);
        if (typeof updateOptions.update === "function") updateOptions.update(inputs, snapshot);
        return inputs;
      },
    });
  }

  function createPresenceRuntime(options = {}) {
    const now = typeof options.now === "function" ? options.now : Date.now;
    const onTransition = typeof options.onTransition === "function" ? options.onTransition : null;
    const listeners = new Set();
    let snapshot = Object.freeze({
      state: normalizePresenceState(options.initialState),
      previousState: null,
      event: PresenceEvent.RESET,
      detail: {},
      changed: false,
      updatedAt: now(),
      version: 0,
    });

    function commit(nextState, event, detail = {}) {
      const normalizedState = normalizePresenceState(nextState, snapshot.state);
      const nextSnapshot = Object.freeze({
        state: normalizedState,
        previousState: snapshot.state,
        event,
        detail,
        changed: normalizedState !== snapshot.state,
        updatedAt: now(),
        version: snapshot.version + 1,
      });
      snapshot = nextSnapshot;
      if (onTransition) onTransition(nextSnapshot);
      for (const listener of listeners) {
        listener(nextSnapshot);
      }
      return nextSnapshot;
    }

    return Object.freeze({
      getSnapshot() {
        return snapshot;
      },
      subscribe(listener) {
        if (typeof listener !== "function") return () => {};
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      setState(nextState, detail = {}) {
        return commit(nextState, "set-state", detail);
      },
      send(event, detail = {}) {
        return commit(reducePresenceState(snapshot.state, event, detail), event, detail);
      },
    });
  }

  const api = Object.freeze({
    PresenceState,
    PresenceEvent,
    PRESENCE_STATES,
    PRESENCE_EVENTS,
    createPresenceControlInputRuntime,
    createPresenceTrace,
    createPresenceRuntime,
    isPresenceState,
    normalizePresenceState,
    presenceControlInputsForSnapshot,
    reducePresenceState,
    summarizePresenceTrace,
  });

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  globalScope.AIPresenceCore = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
