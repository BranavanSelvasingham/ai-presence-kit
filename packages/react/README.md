# @ai-presence/react

React binding helpers for AI Presence Kit. The package depends on the renderer-agnostic core runtime and adapter helpers, and leaves React itself as a peer dependency.

For Vercel AI SDK `useChat`, use the package-shaped hook to map `status`, `messages`, and assistant text into presence state, trace evidence, and DOM attributes:

```js
import { createPresenceReactBindings } from "@ai-presence/react";

const {
  PresenceProvider,
  useVercelAIPresence,
} = createPresenceReactBindings(React);

function ChatShell({ chat }) {
  const presence = useVercelAIPresence(chat);

  return React.createElement(
    PresenceProvider,
    { runtime: presence.runtime },
    React.createElement("section", presence.evidenceAttributes, chat.status),
  );
}
```

During a healthy before-output wait, `presence.evidenceAttributes` includes `data-ai-presence-framework="vercel-ai-sdk"`, `data-ai-presence-status="streaming"`, `data-presence-state="waiting"`, `data-presence-phase="before-output"`, `data-assistant-text-empty="true"`, `data-presence-before-output="true"`, and `data-first-output-ms="none"`. This proves the surface moved before assistant text existed, without importing the SVG face renderer.

The lower-level factory still exposes renderer-agnostic React primitives:

```js
import { createPresenceReactBindings } from "@ai-presence/react";

const {
  PresenceProvider,
  PresenceRenderer,
  PresenceRendererSlot,
  usePresenceControlInputs,
  usePresenceFrameTime,
  usePresenceSnapshot,
  usePresenceState,
  useVercelAIPresence,
  vercelAIPresenceEvidence,
} =
  createPresenceReactBindings(React);
```

The factory expects React to provide `createContext`, `createElement`, `useContext`, `useEffect`, `useState`, and `useSyncExternalStore`. The presence runtime itself comes from `@ai-presence/core`, so renderers remain replaceable. Use `vercelAIPresenceEvidence()` when you need to format the same Vercel AI SDK evidence outside a hook, including browser-global builds.

Use `PresenceRendererSlot` when a renderer needs the current snapshot, shared control inputs, live frame time, and runtime together:

```js
function CustomPresenceSurface() {
  return React.createElement(
    PresenceRendererSlot,
    null,
    ({ snapshot, controlInputs, frameTimeMs }) => React.createElement(
      "output",
      {
        "data-presence-state": snapshot.state,
        "data-presence-phase": controlInputs.latencyPhase,
      },
      `${snapshot.state} / ${controlInputs.attentionTarget} / ${frameTimeMs}`,
    ),
  );
}
```

By default, the slot uses `frameTimeMs` as the `now` value for control inputs. Pass `controlOptions.now` or `frameOptions.now` for deterministic tests or custom clocks.

Use `usePresenceControlInputs()` when a React surface needs the shared renderer-agnostic control layer:

```js
function PresenceStatus() {
  const inputs = usePresenceControlInputs();
  return `${inputs.latencyPhase} / ${inputs.attentionTarget}`;
}
```

For before-output postures such as `thinking` and `waiting`, the hook exposes inputs like `latencyPhase: "before-output"` and `attentionTarget: "response"` without importing the face renderer.

Use `usePresenceFrameTime()` when a React renderer needs a live millisecond clock for temporal frames between presence state changes:

```js
function PresenceSurface() {
  const snapshot = usePresenceSnapshot();
  const frameTimeMs = usePresenceFrameTime();

  return render(snapshot, { now: frameTimeMs, timeMs: frameTimeMs });
}
```

The hook defaults to `Date.now()` so it shares the same epoch as presence runtime snapshots. Pass `{ now }` in tests or deterministic renderers.

The local browser example at `examples/react-browser.html` uses actual React and ReactDOM UMD builds to exercise the provider, renderer slot component, AI SDK adapter, face renderer mapping, and a non-face status surface driven by the same slot payload. Open `examples/react-browser.html?autorun=1` for deterministic before-output evidence in browser smoke tests and release media checks, including `data-nonface-renderer="status-surface"` and `data-nonface-phase="before-output"`.
