# @ai-presence/react

React binding helpers for AI Presence Kit.

The current prototype keeps this package dependency-free by exposing a factory:

```js
import { createPresenceReactBindings } from "@ai-presence/react";

const {
  PresenceProvider,
  PresenceRenderer,
  usePresenceControlInputs,
  usePresenceSnapshot,
  usePresenceState,
} =
  createPresenceReactBindings(React);
```

The factory expects React to provide `createContext`, `createElement`, `useContext`, and `useSyncExternalStore`. The presence runtime itself comes from `@ai-presence/core`, so renderers remain replaceable.

Use `usePresenceControlInputs()` when a React surface needs the shared renderer-agnostic control layer:

```js
function PresenceStatus() {
  const inputs = usePresenceControlInputs();
  return `${inputs.latencyPhase} / ${inputs.attentionTarget}`;
}
```

For before-output postures such as `thinking` and `waiting`, the hook exposes inputs like `latencyPhase: "before-output"` and `attentionTarget: "response"` without importing the face renderer.

The local browser example at `examples/react-browser.html` uses actual React and ReactDOM UMD builds to exercise the provider, snapshot hook, renderer slot, AI SDK adapter, and face renderer mapping.
