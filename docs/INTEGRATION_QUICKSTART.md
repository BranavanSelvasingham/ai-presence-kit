# Integration Quickstart

Use this when you already have an AI chat or runtime and want a minimal path from published packages to observable presence-before-output evidence.

AI Presence Kit is a renderer-agnostic presence state layer. It maps runtime facts such as user input, submit, stream open, first token, complete, interruption, and error into interaction posture: reading, waiting, thinking, streaming, speaking, interrupted, ready, and error. It is not emotion detection or private emotion inference.

From this repo, run the no-network proof with `node examples/quickstart-presence.mjs`; it prints `statePath`, `eventPath`, `firstOutputMs`, `leadMs`, `finalState`, `hasOutput`, `complete`, and `interrupted` trace evidence for the same generic chat lifecycle. To see a framework-free non-face renderer consume the same handoff, run `node examples/status-surface-presence.mjs`; it prints `renderer=status-surface`, `phasePath`, `beforeOutput=true`, `firstOutputMs`, `leadMs`, `finalState`, `hasOutput`, `complete`, and `interrupted`. To see a real-app-style composer lane, run `node examples/composer-lane-presence.mjs`; it prints `renderer=composer-lane`, status/progress/timeline evidence, and the same before-output summary without importing the SVG face renderer. To see a named Vercel AI SDK route, run `node examples/vercel-ai-sdk-presence.mjs`; it maps the documented `useChat` `status`, `messages`, assistant `parts`, `onFinish.isAbort`, and `onError` shape into `framework=vercel-ai-sdk` before-output evidence. To see an assistant app lifecycle shape, run `node examples/assistant-lifecycle-presence.mjs`; it prints thread/run/message evidence with `frameworkEventPath`, `streamOpenMs`, `firstOutputMs`, `presenceBeforeOutputMs`, `finalState`, `hasOutput`, `complete`, and `interrupted`. To see a named assistant-ui route, run `node examples/assistant-ui-external-store-presence.mjs`; it maps the documented ExternalStoreRuntime `onNew`, `isRunning`, and assistant message `status.type` path into the same adapter evidence.

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

## Map An Assistant App Lifecycle

If your app framework exposes threads, runs, assistant message shells, and text deltas, use `createAssistantLifecycleAdapter`. It stays framework-package-free and accepts plain objects, so wrap your actual callbacks into the lifecycle names you control.

```js
import { createAssistantLifecycleAdapter } from "@ai-presence/adapters";

const assistantPresence = createAssistantLifecycleAdapter(presence);

assistantPresence.handleEvent({
  type: "run-created",
  threadId,
  runId,
});

assistantPresence.handleEvent({
  type: "message-created",
  threadId,
  runId,
  messageId,
});

assistantPresence.handleEvent({
  type: "text-delta",
  threadId,
  runId,
  messageId,
  delta: "Start with a narrow lifecycle proof.",
});

assistantPresence.handleEvent({
  type: "run-completed",
  threadId,
  runId,
});
```

The adapter maps:

```text
composer-input -> user-typing
composer-pause -> reading or thinking
run-created / run-started / submitted / running -> thinking
message-created / content-block-start / stream-open -> waiting
streaming with no assistant content -> waiting
text-delta / message-delta / output -> streaming
run-completed / message-completed / ready -> ready
run-cancelled / abort / interrupt -> interrupted
run-failed / error -> error
```

This captures the assistant-app wedge where the run and assistant message exist before visible assistant text exists.

## OpenAI Responses Streaming Mapping

If your app already consumes OpenAI Responses streaming events, use `createOpenAIResponsesAdapter` to map those typed event objects into the same runtime. This is only an event adapter: it does not import the OpenAI SDK, call the network, or read environment config.

```js
import { createOpenAIResponsesAdapter } from "@ai-presence/adapters";

const responsesPresence = createOpenAIResponsesAdapter(presence);

responsesPresence.handleEvent({ type: "response.created" });
responsesPresence.handleEvent({ type: "response.output_item.added" });
responsesPresence.handleEvent({
  type: "response.output_text.delta",
  delta: "Start with the smallest useful adapter.",
});
responsesPresence.handleEvent({ type: "response.completed" });
```

The adapter maps:

```text
response.created -> thinking
response.in_progress / response.output_item.added / response.content_part.added -> waiting
response.output_text.delta -> streaming
response.function_call_arguments.delta -> streaming
response.output_text.done / response.function_call_arguments.done / response.completed -> ready
response.failed / error -> error
response.incomplete -> interrupted
```

That keeps the stream-open posture visible before the first `response.output_text.delta`; text and function-call argument deltas are copied into the runtime signal detail as `delta` and `text` when present.

## Vercel AI SDK Mapping

Primary AI SDK docs checked for this route:

```text
https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
```

The current `useChat` reference documents `status` as `submitted`, `streaming`, `ready`, or `error`; `messages` as `UIMessage[]`; message `role` as `system`, `user`, or `assistant`; message `parts` as the UI rendering path; `onFinish.isAbort`; `onFinish.isError`; and `onError`. The chatbot guide renders text from `message.parts` when `part.type === "text"`.

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

This keeps the difference between "the response stream is active" and "the first visible assistant token exists".

Run the named no-network proof:

```bash
node examples/vercel-ai-sdk-presence.mjs
```

It prints `framework=vercel-ai-sdk`, `statePath`, `eventPath`, `statusPath`, `frameworkEventPath`, `streamOpenMs`, `firstOutputMs`, `leadMs`, `presenceBeforeOutputMs`, `finalState=ready`, `hasOutput=true`, `complete=true`, `interrupted=false`, plus `abortState=interrupted` and `errorState=error`.

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

The named Vercel AI SDK proof in `examples/vercel-ai-sdk-presence.mjs` simulates documented `submitted`, `streaming`, `ready`, `error`, `messages`, assistant text `parts`, and aborted finish shapes. Its plain surface exposes `data-framework="vercel-ai-sdk"`, `data-status="streaming"`, `data-presence-state="waiting"`, `data-presence-phase="before-output"`, `data-assistant-text-empty="true"`, `data-presence-before-output="true"`, and `data-first-output-ms="none"` while the stream is active but assistant text is still empty.

The real-app-style composer lane proof in `examples/composer-lane-presence.mjs` uses the same Vercel AI SDK adapter path for `submitted`, `streaming`, and `ready` updates. It maps the package-shaped handoff to `data-renderer="composer-lane"`, `data-presence-state`, `data-presence-phase`, `data-composer-lock`, `data-assistant-text-empty`, and `data-progress-step` so an app can replace passive waiting while assistant text is still empty.

The assistant lifecycle proof in `examples/assistant-lifecycle-presence.mjs` simulates a thread/run/message lifecycle. Its plain object surface exposes `data-surface="assistant-lifecycle"`, `data-run-id`, `data-message-id`, `data-presence-state="waiting"`, `data-presence-phase="before-output"`, `data-assistant-output-empty="true"`, and `data-presence-before-output="true"` while assistant text is still empty.

The assistant-ui ExternalStoreRuntime proof in `examples/assistant-ui-external-store-presence.mjs` stays package-free and follows primary assistant-ui docs for the custom runtime route. It maps `onNew` and `isRunning=true` to run start posture, an empty assistant message with `status.type="running"` to stream-open waiting posture, the first text chunk to streaming, and `status.type="complete"` to ready. It prints `framework=assistant-ui`, `route=ExternalStoreRuntime`, `frameworkEventPath`, `frameworkStatusPath`, `streamOpenMs`, `firstOutputMs`, `leadMs`, `presenceBeforeOutputMs`, `finalState`, `hasOutput`, `complete`, and `interrupted`.

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
