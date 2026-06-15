(function initPresenceAdapters(globalScope) {
  "use strict";

  const core = resolveCore(globalScope);
  const PresenceEvent = core?.PresenceEvent || {};

  const RuntimeSignal = Object.freeze({
    RESET: "reset",
    USER_INPUT: "user-input",
    USER_PAUSE: "user-pause",
    LOCAL_READ: "local-read",
    MODEL_WAITING: "model-waiting",
    STREAM_OPEN: "stream-open",
    TOKEN: "token",
    RESPONSE_COMPLETE: "response-complete",
    SPEECH_START: "speech-start",
    SPEECH_END: "speech-end",
    VOICE_WAITING: "voice-waiting",
    INTERRUPT: "interrupt",
    ERROR: "error",
  });

  const RUNTIME_SIGNALS = Object.freeze(Object.values(RuntimeSignal));
  const runtimeSignalSet = new Set(RUNTIME_SIGNALS);

  const signalToPresenceEvent = Object.freeze({
    [RuntimeSignal.RESET]: PresenceEvent.RESET,
    [RuntimeSignal.USER_INPUT]: PresenceEvent.USER_INPUT,
    [RuntimeSignal.USER_PAUSE]: PresenceEvent.USER_PAUSE,
    [RuntimeSignal.LOCAL_READ]: PresenceEvent.LOCAL_READ,
    [RuntimeSignal.MODEL_WAITING]: PresenceEvent.SUBMIT,
    [RuntimeSignal.STREAM_OPEN]: PresenceEvent.STREAM_OPEN,
    [RuntimeSignal.TOKEN]: PresenceEvent.TOKEN,
    [RuntimeSignal.RESPONSE_COMPLETE]: PresenceEvent.RESPONSE_COMPLETE,
    [RuntimeSignal.SPEECH_START]: PresenceEvent.SPEECH_START,
    [RuntimeSignal.SPEECH_END]: PresenceEvent.SPEECH_END,
    [RuntimeSignal.VOICE_WAITING]: PresenceEvent.VOICE_WAITING,
    [RuntimeSignal.INTERRUPT]: PresenceEvent.INTERRUPT,
    [RuntimeSignal.ERROR]: PresenceEvent.ERROR,
  });

  const VercelAIStatus = Object.freeze({
    SUBMITTED: "submitted",
    STREAMING: "streaming",
    READY: "ready",
    ERROR: "error",
  });

  const OPENAI_REALTIME_EVENT_MAP = Object.freeze({
    "session.created": RuntimeSignal.VOICE_WAITING,
    "session.updated": RuntimeSignal.VOICE_WAITING,
    "input_audio_buffer.speech_started": RuntimeSignal.LOCAL_READ,
    "input_audio_buffer.speech_stopped": RuntimeSignal.MODEL_WAITING,
    "input_audio_buffer.committed": RuntimeSignal.MODEL_WAITING,
    "response.created": RuntimeSignal.MODEL_WAITING,
    "response.output_item.created": RuntimeSignal.STREAM_OPEN,
    "response.content_part.added": RuntimeSignal.STREAM_OPEN,
    "response.output_text.delta": RuntimeSignal.TOKEN,
    "response.text.delta": RuntimeSignal.TOKEN,
    "response.output_audio_transcript.delta": RuntimeSignal.TOKEN,
    "response.audio_transcript.delta": RuntimeSignal.TOKEN,
    "response.output_audio.delta": RuntimeSignal.SPEECH_START,
    "response.audio.delta": RuntimeSignal.SPEECH_START,
    "response.output_audio.done": RuntimeSignal.SPEECH_END,
    "response.audio.done": RuntimeSignal.SPEECH_END,
    "response.output_text.done": RuntimeSignal.RESPONSE_COMPLETE,
    "response.text.done": RuntimeSignal.RESPONSE_COMPLETE,
    "response.output_audio_transcript.done": RuntimeSignal.RESPONSE_COMPLETE,
    "response.audio_transcript.done": RuntimeSignal.RESPONSE_COMPLETE,
    "response.done": RuntimeSignal.RESPONSE_COMPLETE,
    "response.completed": RuntimeSignal.RESPONSE_COMPLETE,
    "response.failed": RuntimeSignal.ERROR,
    error: RuntimeSignal.ERROR,
  });

  const OPENAI_RESPONSES_EVENT_MAP = Object.freeze({
    "response.created": RuntimeSignal.MODEL_WAITING,
    "response.in_progress": RuntimeSignal.STREAM_OPEN,
    "response.output_item.added": RuntimeSignal.STREAM_OPEN,
    "response.content_part.added": RuntimeSignal.STREAM_OPEN,
    "response.output_text.delta": RuntimeSignal.TOKEN,
    "response.function_call_arguments.delta": RuntimeSignal.TOKEN,
    "response.output_text.done": RuntimeSignal.RESPONSE_COMPLETE,
    "response.function_call_arguments.done": RuntimeSignal.RESPONSE_COMPLETE,
    "response.completed": RuntimeSignal.RESPONSE_COMPLETE,
    "response.done": RuntimeSignal.RESPONSE_COMPLETE,
    "response.failed": RuntimeSignal.ERROR,
    "response.incomplete": RuntimeSignal.INTERRUPT,
    error: RuntimeSignal.ERROR,
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

  function isRuntimeSignal(value) {
    return runtimeSignalSet.has(value);
  }

  function normalizeRuntimeSignal(signal) {
    if (typeof signal === "string") {
      return { type: signal, detail: {} };
    }

    if (!signal || typeof signal !== "object") {
      return { type: RuntimeSignal.RESET, detail: {} };
    }

    const { type, detail: explicitDetail, ...rest } = signal;
    const detail = explicitDetail && typeof explicitDetail === "object"
      ? { ...rest, ...explicitDetail }
      : rest;

    return {
      type: isRuntimeSignal(type) ? type : RuntimeSignal.RESET,
      detail,
    };
  }

  function presenceEventForRuntimeSignal(signal) {
    const normalized = normalizeRuntimeSignal(signal);
    return {
      event: signalToPresenceEvent[normalized.type] || PresenceEvent.RESET,
      detail: normalized.detail,
    };
  }

  function textFromPart(part) {
    if (!part || typeof part !== "object") return "";
    if (typeof part.text === "string") return part.text;
    if (typeof part.content === "string") return part.content;
    if (typeof part.delta === "string") return part.delta;
    return "";
  }

  function textFromMessage(message) {
    if (!message || typeof message !== "object") return "";
    if (typeof message.content === "string") return message.content;
    if (typeof message.text === "string") return message.text;
    if (!Array.isArray(message.parts)) return "";
    return message.parts.map(textFromPart).join("");
  }

  function lastAssistantText(messages = []) {
    if (!Array.isArray(messages)) return "";
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message?.role === "assistant") return textFromMessage(message);
    }
    return "";
  }

  function hasAssistantContent(chatState = {}) {
    if (typeof chatState.assistantText === "string") return chatState.assistantText.length > 0;
    if (typeof chatState.completion === "string") return chatState.completion.length > 0;
    return lastAssistantText(chatState.messages).length > 0;
  }

  function vercelAIStatusToRuntimeSignal(chatState = {}) {
    const status = typeof chatState === "string" ? chatState : chatState.status;
    const detail = typeof chatState === "string" ? {} : { ...chatState };

    if (status === VercelAIStatus.SUBMITTED) {
      return { type: RuntimeSignal.MODEL_WAITING, detail };
    }

    if (status === VercelAIStatus.STREAMING) {
      return {
        type: hasAssistantContent(detail) ? RuntimeSignal.TOKEN : RuntimeSignal.STREAM_OPEN,
        detail,
      };
    }

    if (status === VercelAIStatus.READY) {
      return { type: RuntimeSignal.RESPONSE_COMPLETE, detail };
    }

    if (status === VercelAIStatus.ERROR) {
      return { type: RuntimeSignal.ERROR, detail };
    }

    return { type: RuntimeSignal.RESET, detail };
  }

  function createVercelAISDKAdapter(presenceRuntime, options = {}) {
    const adapter = createRuntimeSignalAdapter(presenceRuntime, options);

    return Object.freeze({
      onInput(text, detail = {}) {
        return adapter.send({ type: RuntimeSignal.USER_INPUT, text, ...detail });
      },
      onSubmit(text, detail = {}) {
        adapter.send({ type: RuntimeSignal.USER_INPUT, text, ...detail });
        return adapter.send({ type: RuntimeSignal.MODEL_WAITING, text, ...detail });
      },
      update(chatState) {
        return adapter.send(vercelAIStatusToRuntimeSignal(chatState));
      },
      onData(dataPart, detail = {}) {
        return adapter.send({
          type: hasAssistantContent({ assistantText: textFromPart(dataPart) })
            ? RuntimeSignal.TOKEN
            : RuntimeSignal.STREAM_OPEN,
          dataPart,
          ...detail,
        });
      },
      onFinish(result = {}) {
        if (result.isAbort) return adapter.send({ type: RuntimeSignal.INTERRUPT, ...result });
        if (result.isError) return adapter.send({ type: RuntimeSignal.ERROR, ...result });
        return adapter.send({ type: RuntimeSignal.RESPONSE_COMPLETE, ...result });
      },
      onError(error, detail = {}) {
        return adapter.send({ type: RuntimeSignal.ERROR, error, ...detail });
      },
    });
  }

  function openAIRealtimeEventToRuntimeSignal(event = {}) {
    const type = typeof event === "string" ? event : event.type;
    const signalType = OPENAI_REALTIME_EVENT_MAP[type] || RuntimeSignal.RESET;
    const detail = typeof event === "string" ? { eventType: event } : { ...event, eventType: type };

    if (type === "input_audio_buffer.speech_started") {
      detail.text = detail.text || "voice input";
      detail.completion = 0.2;
    }

    if (type === "input_audio_buffer.speech_stopped" || type === "input_audio_buffer.committed") {
      detail.text = detail.text || "voice input";
    }

    if (type?.endsWith(".delta")) {
      detail.delta = detail.delta || detail.text || "";
    }

    return { type: signalType, detail };
  }

  function textFromOpenAIResponsesEvent(event = {}) {
    if (!event || typeof event !== "object") return "";
    for (const key of ["delta", "text", "arguments_delta", "arguments", "content"]) {
      if (typeof event[key] === "string") return event[key];
    }
    if (typeof event.part?.text === "string") return event.part.text;
    if (typeof event.item?.arguments === "string") return event.item.arguments;
    return "";
  }

  function openAIResponsesEventToRuntimeSignal(event = {}) {
    const type = typeof event === "string" ? event : event.type;
    const signalType = OPENAI_RESPONSES_EVENT_MAP[type] || RuntimeSignal.RESET;
    const detail = typeof event === "string" ? { eventType: event } : { ...event, eventType: type };

    if (type?.endsWith(".delta")) {
      const delta = textFromOpenAIResponsesEvent(event);
      detail.delta = typeof detail.delta === "string" ? detail.delta : delta;
      if (delta && typeof detail.text !== "string") detail.text = delta;
    }

    if (type === "response.incomplete") {
      detail.reason = detail.reason
        || detail.incomplete_details?.reason
        || detail.response?.incomplete_details?.reason
        || "incomplete";
    }

    if (type === "response.failed" || type === "error") {
      const message = detail.message || detail.error?.message || detail.response?.error?.message;
      if (message) detail.message = message;
    }

    return { type: signalType, detail };
  }

  function createOpenAIRealtimeAdapter(presenceRuntime, options = {}) {
    const adapter = createRuntimeSignalAdapter(presenceRuntime, options);

    return Object.freeze({
      handleEvent(event) {
        return adapter.send(openAIRealtimeEventToRuntimeSignal(event));
      },
    });
  }

  function createOpenAIResponsesAdapter(presenceRuntime, options = {}) {
    const adapter = createRuntimeSignalAdapter(presenceRuntime, options);

    return Object.freeze({
      handleEvent(event) {
        return adapter.send(openAIResponsesEventToRuntimeSignal(event));
      },
    });
  }

  function chatEventToRuntimeSignal(event = {}) {
    const type = typeof event === "string" ? event : event.type;
    const detail = typeof event === "string" ? {} : { ...event };

    switch (type) {
      case "input":
      case "user-input":
        return { type: RuntimeSignal.USER_INPUT, detail };
      case "pause":
      case "user-pause":
        return { type: RuntimeSignal.USER_PAUSE, detail };
      case "submit":
      case "request":
        return { type: RuntimeSignal.MODEL_WAITING, detail };
      case "stream-open":
      case "response-start":
        return { type: RuntimeSignal.STREAM_OPEN, detail };
      case "delta":
      case "token":
      case "message-delta":
        return { type: RuntimeSignal.TOKEN, detail };
      case "finish":
      case "done":
      case "response-complete":
        return { type: RuntimeSignal.RESPONSE_COMPLETE, detail };
      case "abort":
      case "interrupt":
        return { type: RuntimeSignal.INTERRUPT, detail };
      case "speech-start":
        return { type: RuntimeSignal.SPEECH_START, detail };
      case "speech-end":
        return { type: RuntimeSignal.SPEECH_END, detail };
      case "error":
        return { type: RuntimeSignal.ERROR, detail };
      default:
        return { type: RuntimeSignal.RESET, detail };
    }
  }

  function createChatEventAdapter(presenceRuntime, options = {}) {
    const adapter = createRuntimeSignalAdapter(presenceRuntime, options);

    return Object.freeze({
      handleEvent(event) {
        return adapter.send(chatEventToRuntimeSignal(event));
      },
    });
  }

  function applyRuntimeSignal(presenceRuntime, signal) {
    if (!presenceRuntime || typeof presenceRuntime.send !== "function") {
      throw new TypeError("applyRuntimeSignal requires a presence runtime with send(event, detail).");
    }

    const { event, detail } = presenceEventForRuntimeSignal(signal);
    return presenceRuntime.send(event, detail);
  }

  function createRuntimeSignalAdapter(presenceRuntime, options = {}) {
    const onSignal = typeof options.onSignal === "function" ? options.onSignal : null;

    return Object.freeze({
      send(signal) {
        const normalized = normalizeRuntimeSignal(signal);
        const result = applyRuntimeSignal(presenceRuntime, normalized);
        if (onSignal) onSignal(normalized, result);
        return result;
      },
    });
  }

  const api = Object.freeze({
    OPENAI_RESPONSES_EVENT_MAP,
    VercelAIStatus,
    OPENAI_REALTIME_EVENT_MAP,
    RuntimeSignal,
    RUNTIME_SIGNALS,
    applyRuntimeSignal,
    chatEventToRuntimeSignal,
    createChatEventAdapter,
    createOpenAIResponsesAdapter,
    createOpenAIRealtimeAdapter,
    createRuntimeSignalAdapter,
    createVercelAISDKAdapter,
    isRuntimeSignal,
    lastAssistantText,
    normalizeRuntimeSignal,
    openAIResponsesEventToRuntimeSignal,
    openAIRealtimeEventToRuntimeSignal,
    presenceEventForRuntimeSignal,
    textFromOpenAIResponsesEvent,
    textFromMessage,
    vercelAIStatusToRuntimeSignal,
  });

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  globalScope.AIPresenceAdapters = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
