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

    function PresenceRenderer({ runtime = null, children }) {
      const snapshot = usePresenceSnapshot(runtime);
      return typeof children === "function" ? children(snapshot) : null;
    }

    return Object.freeze({
      PresenceContext,
      PresenceProvider,
      PresenceRenderer,
      defaultRuntime,
      usePresenceControlInputs,
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
