# @ai-presence/adapters

Starter adapter utilities for converting AI runtime events into AI Presence Kit events.

Adapters should stay upstream of any renderer. Their job is to translate signals like user input, stream open, first token, speech start, interruption, and errors into the canonical state machine exposed by `@ai-presence/core`.

Current adapters:

- `createRuntimeSignalAdapter`: generic signal-to-presence bridge.
- `createAssistantLifecycleAdapter`: maps framework-style thread/run/message lifecycle objects to presence.
- `createVercelAISDKAdapter`: maps AI SDK chat statuses and callbacks to presence.
- `createOpenAIResponsesAdapter`: maps OpenAI Responses streaming event objects to presence.
- `createOpenAIRealtimeAdapter`: maps OpenAI Realtime server events to presence.
- `createChatEventAdapter`: maps small generic chat lifecycle events to presence.

The adapters intentionally avoid importing framework packages. They accept plain objects so they can be wrapped by React, Svelte, Vue, server streams, WebRTC handlers, or custom chat runtimes later.

```js
import { createVercelAISDKAdapter } from "@ai-presence/adapters";

const aiSdkPresence = createVercelAISDKAdapter(presenceRuntime);
aiSdkPresence.update({ status: "streaming", messages: [] });
```

Run the local adapter trace demo with:

```bash
npm run demo:adapters
```

The trace demo prints each adapter transition with the shared core control inputs, reference face frame evidence, and bounded six-channel decision-trace evidence that a renderer can consume, for example `phase=before-output`, `attention=response`, `face=thinking`, `channels=gaze,blink,brows,mouth,posture,motion`, `trace=complete`, `decisions=6`, `safe=true`, `warnings=0`, `transition=thinking:stream-open+0ms`, `transitionReads=6/6`, and `reads=state,transitionEvent,transitionAgeMs`.

## Vercel AI SDK

The current AI SDK `useChat` status values are:

```text
submitted
streaming
ready
error
```

Adapter mapping:

```text
submitted -> model-waiting -> thinking
streaming with no assistant content -> stream-open -> waiting
streaming with assistant content -> token -> streaming
ready -> response-complete -> ready
error -> error -> error
```

This preserves the important distinction from the AI SDK docs and troubleshooting notes: `streaming` can begin before user-visible assistant text exists, so the presence state should be `waiting` until content arrives.

## Assistant Lifecycle

`createAssistantLifecycleAdapter` is a framework-package-free bridge for assistant app shapes that already have threads, runs, messages, and streaming text deltas. It does not claim an exact external package event contract. Pass plain lifecycle objects from your app layer, or wrap framework callbacks into these names:

```js
import { createAssistantLifecycleAdapter } from "@ai-presence/adapters";

const assistantPresence = createAssistantLifecycleAdapter(presenceRuntime);

assistantPresence.handleEvent({ type: "run-created", threadId, runId });
assistantPresence.handleEvent({ type: "message-created", threadId, runId, messageId });
assistantPresence.handleEvent({ type: "text-delta", threadId, runId, messageId, delta: "Hello" });
assistantPresence.handleEvent({ type: "run-completed", threadId, runId });
```

Adapter mapping:

```text
composer-input -> user-input -> user-typing
composer-pause -> user-pause -> reading/thinking
run-created / run-started / submitted / running -> model-waiting -> thinking
message-created / content-block-start / stream-open -> stream-open -> waiting
streaming with no assistant content -> stream-open -> waiting
text-delta / message-delta / output -> token -> streaming
run-completed / message-completed / ready -> response-complete -> ready
run-cancelled / abort / interrupt -> interrupt -> interrupted
run-failed / error -> error -> error
```

Run `node examples/assistant-lifecycle-presence.mjs` for the no-network proof. It simulates a thread/run opening and an assistant message shell existing before text arrives, then prints `statePath`, `eventPath`, `frameworkEventPath`, `streamOpenMs`, `firstOutputMs`, `leadMs`, `presenceBeforeOutputMs`, `finalState`, `hasOutput`, `complete`, and `interrupted`.

## OpenAI Responses

`createOpenAIResponsesAdapter` is an event-mapping helper, not an SDK wrapper. Pass each typed streaming event object from your Responses stream consumer to `handleEvent(event)`. The adapter branches on `event.type`, copies text or function-call argument chunks into `detail.delta` and `detail.text` when present, and never imports the OpenAI SDK, calls the network, or reads environment config.

Adapter mapping:

```text
response.created -> model-waiting -> thinking
response.in_progress -> stream-open -> waiting
response.output_item.added -> stream-open -> waiting
response.content_part.added -> stream-open -> waiting
response.output_text.delta -> token -> streaming
response.function_call_arguments.delta -> token -> streaming
response.output_text.done -> response-complete -> ready
response.function_call_arguments.done -> response-complete -> ready
response.completed -> response-complete -> ready
response.failed / error -> error -> error
response.incomplete -> interrupt -> interrupted
```

This preserves presence-before-output: `response.created` can move the runtime into `thinking`, stream-opening events can move it into `waiting`, and the first `response.output_text.delta` moves it into `streaming`.

## OpenAI Realtime

Adapter mapping:

```text
input_audio_buffer.speech_started -> local-read -> reading
input_audio_buffer.speech_stopped -> model-waiting -> thinking
response.created -> model-waiting -> thinking
response.output_item.created -> stream-open -> waiting
response.content_part.added -> stream-open -> waiting
response.output_text.delta -> token -> streaming
response.output_audio_transcript.delta -> token -> streaming
response.output_audio.delta -> speech-start -> speaking
response.output_audio.done -> speech-end -> ready
response.done -> response-complete -> ready
error / response.failed -> error -> error
```

Older alias events already used by the prototype, such as `response.audio.delta` and `response.text.delta`, are also accepted.
