import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PresenceEvent, PresenceState, createPresenceRuntime } = require("../packages/core/src/presence-core.js");
const {
  RuntimeSignal,
  VercelAIStatus,
  chatEventToRuntimeSignal,
  createChatEventAdapter,
  createOpenAIRealtimeAdapter,
  createRuntimeSignalAdapter,
  createVercelAISDKAdapter,
  lastAssistantText,
  openAIRealtimeEventToRuntimeSignal,
  presenceEventForRuntimeSignal,
  vercelAIStatusToRuntimeSignal,
} = require("../packages/adapters/src/runtime-adapter.js");

assert.deepEqual(
  presenceEventForRuntimeSignal({ type: RuntimeSignal.STREAM_OPEN, source: "test" }),
  {
    event: PresenceEvent.STREAM_OPEN,
    detail: { source: "test" },
  },
);

const runtime = createPresenceRuntime({ initialState: PresenceState.IDLE });
const signals = [];
const adapter = createRuntimeSignalAdapter(runtime, {
  onSignal: (signal, snapshot) => signals.push({ signal: signal.type, state: snapshot.state }),
});

adapter.send({ type: RuntimeSignal.USER_INPUT, text: "Hello" });
adapter.send({ type: RuntimeSignal.LOCAL_READ, text: "Hello", completion: 0.2 });
adapter.send({ type: RuntimeSignal.MODEL_WAITING });
adapter.send({ type: RuntimeSignal.STREAM_OPEN });
adapter.send({ type: RuntimeSignal.TOKEN });
adapter.send({ type: RuntimeSignal.RESPONSE_COMPLETE });

assert.equal(runtime.getSnapshot().state, PresenceState.READY);
assert.deepEqual(
  signals.map((entry) => entry.state),
  [
    PresenceState.USER_TYPING,
    PresenceState.READING,
    PresenceState.THINKING,
    PresenceState.WAITING,
    PresenceState.STREAMING,
    PresenceState.READY,
  ],
);

assert.equal(
  lastAssistantText([
    { role: "user", parts: [{ type: "text", text: "Hello" }] },
    { role: "assistant", parts: [{ type: "text", text: "Hi" }, { type: "text", text: " there" }] },
  ]),
  "Hi there",
);

assert.equal(
  vercelAIStatusToRuntimeSignal({ status: VercelAIStatus.SUBMITTED }).type,
  RuntimeSignal.MODEL_WAITING,
);

assert.equal(
  vercelAIStatusToRuntimeSignal({ status: VercelAIStatus.STREAMING, messages: [] }).type,
  RuntimeSignal.STREAM_OPEN,
);

assert.equal(
  vercelAIStatusToRuntimeSignal({
    status: VercelAIStatus.STREAMING,
    messages: [{ role: "assistant", parts: [{ type: "text", text: "T" }] }],
  }).type,
  RuntimeSignal.TOKEN,
);

const vercelRuntime = createPresenceRuntime({ initialState: PresenceState.IDLE });
const vercelAdapter = createVercelAISDKAdapter(vercelRuntime);
vercelAdapter.onSubmit("Hello");
assert.equal(vercelRuntime.getSnapshot().state, PresenceState.THINKING);
vercelAdapter.update({ status: VercelAIStatus.STREAMING, messages: [] });
assert.equal(vercelRuntime.getSnapshot().state, PresenceState.WAITING);
vercelAdapter.update({
  status: VercelAIStatus.STREAMING,
  messages: [{ role: "assistant", parts: [{ type: "text", text: "A" }] }],
});
assert.equal(vercelRuntime.getSnapshot().state, PresenceState.STREAMING);
vercelAdapter.onFinish({ finishReason: "stop" });
assert.equal(vercelRuntime.getSnapshot().state, PresenceState.READY);

assert.equal(
  openAIRealtimeEventToRuntimeSignal({ type: "input_audio_buffer.speech_started" }).type,
  RuntimeSignal.LOCAL_READ,
);

assert.equal(
  openAIRealtimeEventToRuntimeSignal({ type: "response.output_audio.delta", delta: "..." }).type,
  RuntimeSignal.SPEECH_START,
);

assert.equal(
  openAIRealtimeEventToRuntimeSignal({ type: "response.done" }).type,
  RuntimeSignal.RESPONSE_COMPLETE,
);

const realtimeRuntime = createPresenceRuntime({ initialState: PresenceState.IDLE });
const realtimeAdapter = createOpenAIRealtimeAdapter(realtimeRuntime);
realtimeAdapter.handleEvent({ type: "input_audio_buffer.speech_started" });
assert.equal(realtimeRuntime.getSnapshot().state, PresenceState.READING);
realtimeAdapter.handleEvent({ type: "input_audio_buffer.speech_stopped" });
assert.equal(realtimeRuntime.getSnapshot().state, PresenceState.THINKING);
realtimeAdapter.handleEvent({ type: "response.output_audio.delta", delta: "abc" });
assert.equal(realtimeRuntime.getSnapshot().state, PresenceState.SPEAKING);
realtimeAdapter.handleEvent({ type: "response.done" });
assert.equal(realtimeRuntime.getSnapshot().state, PresenceState.READY);

assert.equal(chatEventToRuntimeSignal({ type: "delta", delta: "a" }).type, RuntimeSignal.TOKEN);
assert.equal(chatEventToRuntimeSignal({ type: "abort" }).type, RuntimeSignal.INTERRUPT);

const chatRuntime = createPresenceRuntime({ initialState: PresenceState.IDLE });
const chatAdapter = createChatEventAdapter(chatRuntime);
chatAdapter.handleEvent({ type: "submit", text: "Hello" });
chatAdapter.handleEvent({ type: "stream-open" });
chatAdapter.handleEvent({ type: "delta", delta: "Hi" });
chatAdapter.handleEvent({ type: "finish" });
assert.equal(chatRuntime.getSnapshot().state, PresenceState.READY);

console.log("runtime-adapter ok");
