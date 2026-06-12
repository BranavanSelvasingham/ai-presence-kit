# @ai-presence/adapters

Starter adapter utilities for converting AI runtime events into AI Presence Kit events.

Adapters should stay upstream of any renderer. Their job is to translate signals like user input, stream open, first token, speech start, interruption, and errors into the canonical state machine exposed by `@ai-presence/core`.

Current adapters:

- `createRuntimeSignalAdapter`: generic signal-to-presence bridge.
- `createVercelAISDKAdapter`: maps AI SDK chat statuses and callbacks to presence.
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

The trace demo prints each adapter transition with the shared core control inputs that a renderer can consume, for example `phase=before-output` and `attention=response`.

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
