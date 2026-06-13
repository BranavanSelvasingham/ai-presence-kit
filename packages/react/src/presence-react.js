(function initPresenceReact(globalScope) {
  "use strict";

  const core = resolveCore(globalScope);

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
    if (!core?.createPresenceRuntime || !core?.presenceControlInputsForSnapshot) {
      throw new Error("AI Presence core is required before creating React bindings.");
    }
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
    });
  }

  const api = Object.freeze({
    createPresenceReactBindings,
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
