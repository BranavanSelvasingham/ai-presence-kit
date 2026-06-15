# Integration Quickstart

Use this when you already have an AI chat or runtime and want a minimal path from published packages to observable presence-before-output evidence.

AI Presence Kit is a renderer-agnostic presence state layer. It maps runtime facts such as user input, submit, stream open, first token, complete, interruption, and error into interaction posture: reading, waiting, thinking, streaming, speaking, interrupted, ready, and error. It is not emotion detection or private emotion inference.

From this repo, run the no-network proof with `node examples/quickstart-presence.mjs`; it prints `statePath`, `eventPath`, `firstOutputMs`, `leadMs`, `finalState`, `hasOutput`, `complete`, and `interrupted` trace evidence for the same generic chat lifecycle. To see a framework-free non-face renderer consume the same handoff, run `node examples/status-surface-presence.mjs`; it prints `renderer=status-surface`, `phasePath`, `beforeOutput=true`, `firstOutputMs`, `leadMs`, `finalState`, `hasOutput`, `complete`, and `interrupted`. To see a real-app-style composer lane, run `node examples/composer-lane-presence.mjs`; it prints `renderer=composer-lane`, status/progress/timeline evidence, and the same before-output summary without importing the SVG face renderer.

## Install

```bash
npm install @ai-presence/core @ai-presence/adapters
```

Add renderer packages only when you need them:

```bash
npm install @ai-presence/react @ai-presence/face
```

## Create A Presence Runtime

`@ai-presence/core` owns the state machine, trace primitive, trace summary, and renderer-agnostic control inputs.

```js
import {
  PresenceEvent,
  createPresenceRuntime,
  createPresenceTrace,
  presenceControlInputsForSnapshot,
  summarizePresenceTrace,
} from "@ai-presence/core";

const presence = createPresenceRuntime();
const trace = createPresenceTrace({ limit: 32 });
const detachTrace = trace.attach(presence, { includeInitial: false });

function readPresence() {
  const snapshot = presence.getSnapshot();
  const controlInputs = presenceControlInputsForSnapshot(snapshot);

  return {
    snapshot,
    controlInputs,
    summary: summarizePresenceTrace(trace),
  };
}
```

The `snapshot` tells you the current canonical state. The `controlInputs` object is the shared handoff to any renderer: attention target, latency phase, tension, speech activity, interruption, transition event, and transition age.

## Map A Generic Chat Lifecycle

Wire the events you already have. The important wedge is that submit and stream-open happen before the first visible token.

```js
function onUserInput(text) {
  presence.send(PresenceEvent.USER_INPUT, { text });
}

function onUserPause(text, completion = 0.4) {
  presence.send(PresenceEvent.USER_PAUSE, { text, completion });
}

function onSubmit(text) {
  presence.send(PresenceEvent.SUBMIT, { text });
}

function onStreamOpen() {
  presence.send(PresenceEvent.STREAM_OPEN);
}

function onFirstToken(text) {
  presence.send(PresenceEvent.TOKEN, { text });
}

function onComplete() {
  presence.send(PresenceEvent.RESPONSE_COMPLETE);
}

function onInterrupt(reason = "user") {
  presence.send(PresenceEvent.INTERRUPT, { reason });
}

function onError(error) {
  presence.send(PresenceEvent.ERROR, {
    message: error instanceof Error ? error.message : String(error),
  });
}
```

Expected posture path for a normal text turn:

```text
user input -> user-typing
user pause -> reading or thinking
submit -> thinking
stream open -> waiting
first token -> streaming
complete -> ready
```

That gives renderers something visible to show while the model is still opening a stream.

## Use The Generic Adapter

If your runtime already emits small lifecycle events, use `@ai-presence/adapters` to keep the mapping plain-object based.

```js
import { createChatEventAdapter } from "@ai-presence/adapters";

const chatPresence = createChatEventAdapter(presence);

chatPresence.handleEvent({ type: "input", text: "What should I build?" });
chatPresence.handleEvent({ type: "pause", text: "What should I build?", completion: 0.4 });
chatPresence.handleEvent({ type: "submit", text: "What should I build?" });
chatPresence.handleEvent({ type: "stream-open" });
chatPresence.handleEvent({ type: "token", text: "Start with a narrow slice." });
chatPresence.handleEvent({ type: "done" });
```

Use `"interrupt"` for user cancellation and `"error"` for failed turns.

## Vercel AI SDK-Style Mapping

`createVercelAISDKAdapter` does not import framework packages. Pass the plain status and message shape from your chat layer.

```js
import { createVercelAISDKAdapter } from "@ai-presence/adapters";

const aiSdkPresence = createVercelAISDKAdapter(presence);

function onInputChange(text) {
  aiSdkPresence.onInput(text);
}

function onSubmit(text) {
  aiSdkPresence.onSubmit(text);
}

function onChatStatusChange(chat) {
  aiSdkPresence.update({
    status: chat.status,
    messages: chat.messages,
  });
}

function onFinish(result) {
  aiSdkPresence.onFinish(result);
}

function onError(error) {
  aiSdkPresence.onError(error);
}
```

The adapter maps:

```text
submitted -> thinking
streaming with no assistant content -> waiting
streaming with assistant content -> streaming
ready -> ready
error -> error
aborted finish -> interrupted
```

This keeps the difference between "stream is open" and "the first visible assistant token exists".

## Prove Presence Before Output

Use the trace summary as integration evidence. It is renderer-agnostic and does not require the SVG face.

```js
const summary = summarizePresenceTrace(trace);

console.log({
  states: summary.states,
  firstOutputMs: summary.firstOutputMs,
  presenceBeforeOutputMs: summary.presenceBeforeOutputMs,
  finalState: summary.finalState,
  hasOutput: summary.hasOutput,
  complete: summary.complete,
  interrupted: summary.interrupted,
});
```

A healthy completed turn should have `presenceBeforeOutputMs` greater than `0`, `hasOutput: true`, `complete: true`, and `finalState: "ready"`. An interrupted turn should expose `interrupted: true` and `interruptMs`.

## Hand Off To Any Renderer

Renderers should consume the snapshot and control inputs without pushing renderer decisions back into `@ai-presence/core`.

```js
function renderPresenceSurface() {
  const { snapshot, controlInputs, summary } = readPresence();

  return {
    state: snapshot.state,
    phase: controlInputs.latencyPhase,
    attention: controlInputs.attentionTarget,
    transition: controlInputs.transitionEvent,
    leadMs: summary.presenceBeforeOutputMs,
  };
}
```

The framework-free status-surface proof in `examples/status-surface-presence.mjs` uses the same values without React or the SVG face. Its renderer model is just a plain object with `data-renderer="status-surface"`, `data-presence-state`, `data-presence-phase`, `data-presence-attention`, `data-presence-event`, and `data-presence-before-output`.

The real-app-style composer lane proof in `examples/composer-lane-presence.mjs` simulates Vercel AI SDK-style `submitted`, `streaming`, and `ready` updates. It uses the same package-shaped handoff to render `data-renderer="composer-lane"`, `data-presence-state`, `data-presence-phase`, `data-composer-lock`, `data-assistant-text-empty`, and `data-progress-step` so an app can replace passive waiting while assistant text is still empty.

For React, use `@ai-presence/react` to subscribe and pass the same renderer-agnostic payload into your surface. The SVG face is optional proof, not a required product dependency.

```js
import { createPresenceReactBindings } from "@ai-presence/react";

const {
  PresenceProvider,
  PresenceRendererSlot,
} = createPresenceReactBindings(React, { runtime: presence });

function PresenceSurface() {
  return React.createElement(
    PresenceProvider,
    { runtime: presence },
    React.createElement(
      PresenceRendererSlot,
      null,
      ({ snapshot, controlInputs }) => React.createElement(
        "output",
        { "data-presence-state": snapshot.state },
        `${snapshot.state} / ${controlInputs.latencyPhase}`,
      ),
    ),
  );
}
```

If you want the reference proof surface:

```js
import { renderPresenceFaceSvg } from "@ai-presence/face";

const renderedFace = renderPresenceFaceSvg(presence.getSnapshot(), {
  timeMs: Date.now(),
});

console.log(renderedFace.attributes.decisionTrace); // "complete"
```

At shutdown or route teardown, detach the trace listener:

```js
detachTrace();
```
