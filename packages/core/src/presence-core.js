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

  function isPresenceState(value) {
    return presenceStateSet.has(value);
  }

  function normalizePresenceState(value, fallback = PresenceState.IDLE) {
    return isPresenceState(value) ? value : fallback;
  }

  function hasText(payload) {
    return typeof payload?.text === "string" && payload.text.trim().length > 0;
  }

  function readCompletion(payload) {
    const completion = Number(payload?.completion ?? payload?.features?.completion);
    return Number.isFinite(completion) ? Math.max(0, Math.min(1, completion)) : 0;
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
    createPresenceTrace,
    createPresenceRuntime,
    isPresenceState,
    normalizePresenceState,
    reducePresenceState,
  });

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  globalScope.AIPresenceCore = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
