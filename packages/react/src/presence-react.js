(function initPresenceReact(globalScope) {
  "use strict";

  const core = resolveCore(globalScope);
  const adapters = resolveAdapters(globalScope);

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

  function resolveAdapters(scope) {
    if (scope?.AIPresenceAdapters) return scope.AIPresenceAdapters;
    if (typeof require === "function") {
      try {
        return require("@ai-presence/adapters");
      } catch {
        // Fall back to the no-build monorepo path used by the prototype.
      }
      try {
        return require("../../adapters/src/runtime-adapter.js");
      } catch {
        return null;
      }
    }
    return null;
  }

  function assertReact(React) {
    const missing = [];
    if (!React?.createContext) missing.push("createContext");
    if (!React?.createElement) missing.push("createElement");
    if (!React?.useContext) missing.push("useContext");
    if (!React?.useSyncExternalStore) missing.push("useSyncExternalStore");
    if (missing.length) {
      throw new TypeError(`createPresenceReactBindings requires React with ${missing.join(", ")}.`);
    }
  }

  function assertFrameReact(React) {
    const missing = [];
    if (!React?.useEffect) missing.push("useEffect");
    if (!React?.useState) missing.push("useState");
    if (missing.length) {
      throw new TypeError(`usePresenceFrameTime requires React with ${missing.join(", ")}.`);
    }
  }

  function assertCore() {
    if (
      !core?.createPresenceRuntime
      || !core?.createPresenceTrace
      || !core?.presenceControlInputsForSnapshot
      || !core?.summarizePresenceTrace
    ) {
      throw new Error("AI Presence core is required before creating React bindings.");
    }
  }

  function assertVercelAdapters(activeAdapters) {
    if (!activeAdapters?.createVercelAISDKAdapter) {
      throw new Error("AI Presence adapters are required before using Vercel AI SDK presence.");
    }
  }

  function assertVercelHookReact(React) {
    const missing = [];
    if (!React?.useEffect) missing.push("useEffect");
    if (!React?.useState) missing.push("useState");
    if (missing.length) {
      throw new TypeError(`useVercelAIPresence requires React with ${missing.join(", ")}.`);
    }
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

  function assistantTextFromChatState(chatState = {}) {
    if (typeof chatState === "string") return "";
    if (typeof chatState.assistantText === "string") return chatState.assistantText;
    if (typeof chatState.completion === "string") return chatState.completion;
    return lastAssistantText(chatState.messages);
  }

  function formatEvidenceMs(value) {
    return typeof value === "number" && Number.isFinite(value) ? `${Math.round(value)}ms` : "none";
  }

  function stringFromEvidenceValue(value, fallback = "none") {
    if (value === null || value === undefined || value === "") return fallback;
    return String(value);
  }

  function vercelAIPresenceEvidence({
    chatState = {},
    controlInputs,
    snapshot,
    traceSummary = {},
  } = {}) {
    const status = typeof chatState === "string" ? chatState : chatState.status;
    const assistantText = assistantTextFromChatState(chatState);
    const assistantTextEmpty = assistantText.length === 0;
    const beforeOutput = status === "streaming"
      && controlInputs?.latencyPhase === "before-output"
      && assistantTextEmpty
      && !traceSummary.hasOutput;
    const leadMs = typeof traceSummary.presenceBeforeOutputMs === "number"
      ? traceSummary.presenceBeforeOutputMs
      : beforeOutput && typeof traceSummary.streamOpenMs === "number"
        ? traceSummary.streamOpenMs
        : undefined;
    const attributes = Object.freeze({
      "data-ai-presence-framework": "vercel-ai-sdk",
      "data-ai-presence-status": stringFromEvidenceValue(status, "unknown"),
      "data-presence-state": stringFromEvidenceValue(snapshot?.state),
      "data-presence-phase": stringFromEvidenceValue(controlInputs?.latencyPhase),
      "data-presence-attention": stringFromEvidenceValue(controlInputs?.attentionTarget),
      "data-presence-event": stringFromEvidenceValue(snapshot?.event),
      "data-assistant-text-empty": String(assistantTextEmpty),
      "data-presence-before-output": String(beforeOutput),
      "data-stream-open-ms": formatEvidenceMs(traceSummary.streamOpenMs),
      "data-first-output-ms": beforeOutput ? "none" : formatEvidenceMs(traceSummary.firstOutputMs),
      "data-lead-ms": formatEvidenceMs(leadMs),
      "data-presence-final-state": stringFromEvidenceValue(traceSummary.finalState),
      "data-presence-has-output": String(Boolean(traceSummary.hasOutput)),
      "data-presence-complete": String(Boolean(traceSummary.complete)),
    });

    return Object.freeze({
      assistantText,
      assistantTextEmpty,
      attributes,
      beforeOutput,
      framework: "vercel-ai-sdk",
      status: stringFromEvidenceValue(status, "unknown"),
    });
  }

  function createPresenceReactBindings(React, options = {}) {
    assertCore();
    assertReact(React);

    const defaultRuntime = options.runtime || core.createPresenceRuntime(options.runtimeOptions);
    const PresenceContext = React.createContext(defaultRuntime);

    function PresenceProvider({ runtime = defaultRuntime, children }) {
      return React.createElement(PresenceContext.Provider, { value: runtime }, children);
    }

    function usePresenceRuntime() {
      return React.useContext(PresenceContext);
    }

    function usePresenceSnapshot(runtime = null) {
      const activeRuntime = runtime || usePresenceRuntime();
      return React.useSyncExternalStore(
        activeRuntime.subscribe,
        activeRuntime.getSnapshot,
        activeRuntime.getSnapshot,
      );
    }

    function usePresenceState(runtime = null) {
      return usePresenceSnapshot(runtime).state;
    }

    function usePresenceControlInputs(runtime = null, options = {}) {
      return core.presenceControlInputsForSnapshot(usePresenceSnapshot(runtime), options);
    }

    function usePresenceFrameTime(options = {}) {
      assertFrameReact(React);
      const now = typeof options.now === "function" ? options.now : Date.now;
      const [timeMs, setTimeMs] = React.useState(() => now());

      React.useEffect(() => {
        let active = true;
        let frameId = null;
        let timeoutId = null;
        const requestFrame = globalScope.requestAnimationFrame;
        const cancelFrame = globalScope.cancelAnimationFrame;

        function scheduleNextFrame() {
          if (typeof requestFrame === "function") {
            frameId = requestFrame(tick);
            return;
          }
          timeoutId = setTimeout(tick, 16);
        }

        function tick() {
          if (!active) return;
          setTimeMs(now());
          scheduleNextFrame();
        }

        scheduleNextFrame();

        return () => {
          active = false;
          if (frameId !== null && typeof cancelFrame === "function") cancelFrame(frameId);
          if (timeoutId !== null) clearTimeout(timeoutId);
        };
      }, [now]);

      return timeMs;
    }

    function PresenceRenderer({ runtime = null, children }) {
      const snapshot = usePresenceSnapshot(runtime);
      return typeof children === "function" ? children(snapshot) : null;
    }

    function presenceRendererSlotControlOptions(controlOptions, frameTimeMs) {
      const slotControlOptions = controlOptions && typeof controlOptions === "object"
        ? { ...controlOptions }
        : {};
      if (!Object.prototype.hasOwnProperty.call(slotControlOptions, "now")) {
        slotControlOptions.now = frameTimeMs;
      }
      return slotControlOptions;
    }

    function PresenceRendererSlot({
      runtime = null,
      controlOptions = {},
      frameOptions = {},
      children,
    }) {
      const activeRuntime = runtime || usePresenceRuntime();
      const snapshot = usePresenceSnapshot(activeRuntime);
      const frameTimeMs = usePresenceFrameTime(frameOptions);
      const controlInputs = usePresenceControlInputs(
        activeRuntime,
        presenceRendererSlotControlOptions(controlOptions, frameTimeMs),
      );
      const slot = Object.freeze({
        snapshot,
        controlInputs,
        frameTimeMs,
        runtime: activeRuntime,
      });

      return typeof children === "function" ? children(slot) : null;
    }

    function useVercelAIPresence(chatState = {}, hookOptions = {}) {
      assertVercelHookReact(React);
      const activeRuntime = hookOptions.runtime || usePresenceRuntime();
      const activeAdapters = hookOptions.adapters || adapters;
      assertVercelAdapters(activeAdapters);

      const [controller] = React.useState(() => {
        const trace = hookOptions.trace || core.createPresenceTrace({
          limit: hookOptions.traceLimit ?? 32,
        });
        return Object.freeze({
          adapter: activeAdapters.createVercelAISDKAdapter(
            activeRuntime,
            hookOptions.adapterOptions || {},
          ),
          trace,
        });
      });

      React.useEffect(() => {
        if (hookOptions.attachTrace === false) return undefined;
        return controller.trace.attach(activeRuntime, {
          includeInitial: hookOptions.includeInitialTrace !== false,
        });
      }, [activeRuntime, controller]);

      React.useEffect(() => {
        if (hookOptions.autoUpdate === false || chatState === null || chatState === undefined) return;
        controller.adapter.update(chatState);
      }, [chatState, controller]);

      const snapshot = usePresenceSnapshot(activeRuntime);
      const controlInputs = usePresenceControlInputs(activeRuntime, {
        trace: controller.trace,
        now: hookOptions.now,
      });
      const traceSummary = core.summarizePresenceTrace(controller.trace);
      const evidence = vercelAIPresenceEvidence({
        chatState,
        controlInputs,
        snapshot,
        traceSummary,
      });

      return Object.freeze({
        adapter: controller.adapter,
        controlInputs,
        evidence,
        evidenceAttributes: evidence.attributes,
        onError: controller.adapter.onError,
        onFinish: controller.adapter.onFinish,
        onInput: controller.adapter.onInput,
        onSubmit: controller.adapter.onSubmit,
        runtime: activeRuntime,
        snapshot,
        trace: controller.trace,
        traceSummary,
        update: controller.adapter.update,
      });
    }

    return Object.freeze({
      PresenceContext,
      PresenceProvider,
      PresenceRenderer,
      PresenceRendererSlot,
      defaultRuntime,
      usePresenceControlInputs,
      usePresenceFrameTime,
      usePresenceRuntime,
      usePresenceSnapshot,
      usePresenceState,
      useVercelAIPresence,
      vercelAIPresenceEvidence,
    });
  }

  const api = Object.freeze({
    createPresenceReactBindings,
    vercelAIPresenceEvidence,
  });

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (globalScope.React && core) {
    globalScope.AIPresenceReact = createPresenceReactBindings(globalScope.React);
  } else {
    globalScope.AIPresenceReact = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
