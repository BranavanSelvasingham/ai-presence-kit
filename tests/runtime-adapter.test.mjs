import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  PresenceEvent,
  PresenceState,
  createPresenceRuntime,
  createPresenceTrace,
  summarizePresenceTrace,
} = require("../packages/core/src/presence-core.js");
const {
  AssistantLifecycleStatus,
  OPENAI_RESPONSES_EVENT_MAP,
  RuntimeSignal,
  VercelAIStatus,
  assistantLifecycleEventToRuntimeSignal,
  chatEventToRuntimeSignal,
  createAssistantLifecycleAdapter,
  createChatEventAdapter,
  createOpenAIResponsesAdapter,
  createOpenAIRealtimeAdapter,
  createRuntimeSignalAdapter,
  createVercelAISDKAdapter,
  lastAssistantText,
  openAIResponsesEventToRuntimeSignal,
  openAIRealtimeEventToRuntimeSignal,
  presenceEventForRuntimeSignal,
  textFromAssistantLifecycleEvent,
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

assert.equal(
  textFromAssistantLifecycleEvent({ message: { role: "assistant", parts: [{ type: "text", text: "Hello" }] } }),
  "Hello",
);

assert.equal(
  assistantLifecycleEventToRuntimeSignal({ type: "run-created", threadId: "thread_1", runId: "run_1" }).type,
  RuntimeSignal.MODEL_WAITING,
);

assert.equal(
  assistantLifecycleEventToRuntimeSignal({
    type: "message-created",
    threadId: "thread_1",
    runId: "run_1",
    messageId: "msg_1",
  }).type,
  RuntimeSignal.STREAM_OPEN,
);

assert.deepEqual(
  assistantLifecycleEventToRuntimeSignal({
    type: "text-delta",
    threadId: "thread_1",
    runId: "run_1",
    messageId: "msg_1",
    delta: "Hi",
  }),
  {
    type: RuntimeSignal.TOKEN,
    detail: {
      type: "text-delta",
      threadId: "thread_1",
      runId: "run_1",
      messageId: "msg_1",
      delta: "Hi",
      eventType: "text-delta",
      text: "Hi",
    },
  },
);

assert.equal(
  assistantLifecycleEventToRuntimeSignal({ status: AssistantLifecycleStatus.STREAMING, assistantText: "" }).type,
  RuntimeSignal.STREAM_OPEN,
);

assert.equal(
  assistantLifecycleEventToRuntimeSignal({ status: AssistantLifecycleStatus.STREAMING, assistantText: "Visible" }).type,
  RuntimeSignal.TOKEN,
);

assert.equal(
  assistantLifecycleEventToRuntimeSignal({ type: "run-completed" }).type,
  RuntimeSignal.RESPONSE_COMPLETE,
);

assert.equal(
  assistantLifecycleEventToRuntimeSignal({ type: "run-cancelled", reason: "user" }).type,
  RuntimeSignal.INTERRUPT,
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

let assistantLifecycleTime = 0;
const assistantLifecycleRuntime = createPresenceRuntime({
  initialState: PresenceState.IDLE,
  now: () => {
    assistantLifecycleTime += 24;
    return assistantLifecycleTime;
  },
});
const assistantLifecycleTrace = createPresenceTrace({ limit: 8 });
assistantLifecycleTrace.attach(assistantLifecycleRuntime, { includeInitial: false });
const assistantLifecycleAdapter = createAssistantLifecycleAdapter(assistantLifecycleRuntime);
assistantLifecycleAdapter.handleEvent({ type: "run-created", threadId: "thread_1", runId: "run_1" });
assert.equal(assistantLifecycleRuntime.getSnapshot().state, PresenceState.THINKING);
assistantLifecycleAdapter.handleEvent({
  type: "message-created",
  threadId: "thread_1",
  runId: "run_1",
  messageId: "msg_1",
});
assert.equal(assistantLifecycleRuntime.getSnapshot().state, PresenceState.WAITING);
assistantLifecycleAdapter.handleEvent({
  type: "text-delta",
  threadId: "thread_1",
  runId: "run_1",
  messageId: "msg_1",
  delta: "Visible output",
});
assert.equal(assistantLifecycleRuntime.getSnapshot().state, PresenceState.STREAMING);
assistantLifecycleAdapter.handleEvent({ type: "run-completed", threadId: "thread_1", runId: "run_1" });
assert.equal(assistantLifecycleRuntime.getSnapshot().state, PresenceState.READY);
const assistantLifecycleSummary = summarizePresenceTrace(assistantLifecycleTrace);
assert.deepEqual(assistantLifecycleSummary.events, [
  PresenceEvent.SUBMIT,
  PresenceEvent.STREAM_OPEN,
  PresenceEvent.TOKEN,
  PresenceEvent.RESPONSE_COMPLETE,
]);
assert.ok(assistantLifecycleSummary.presenceBeforeOutputMs > 0);
assert.equal(assistantLifecycleSummary.streamOpenMs, 24);
assert.equal(assistantLifecycleSummary.firstOutputMs, 48);
assert.equal(assistantLifecycleSummary.finalState, PresenceState.READY);
assert.equal(assistantLifecycleSummary.hasOutput, true);
assert.equal(assistantLifecycleSummary.complete, true);
assert.equal(assistantLifecycleSummary.interrupted, false);

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

assert.equal(OPENAI_RESPONSES_EVENT_MAP["response.created"], RuntimeSignal.MODEL_WAITING);

assert.equal(
  openAIResponsesEventToRuntimeSignal({ type: "response.created", response: { id: "resp_1" } }).type,
  RuntimeSignal.MODEL_WAITING,
);

assert.deepEqual(
  openAIResponsesEventToRuntimeSignal({ type: "response.output_text.delta", delta: "Hello" }),
  {
    type: RuntimeSignal.TOKEN,
    detail: {
      type: "response.output_text.delta",
      delta: "Hello",
      eventType: "response.output_text.delta",
      text: "Hello",
    },
  },
);

assert.deepEqual(
  openAIResponsesEventToRuntimeSignal({
    type: "response.function_call_arguments.delta",
    arguments: "{\"city\"",
  }),
  {
    type: RuntimeSignal.TOKEN,
    detail: {
      type: "response.function_call_arguments.delta",
      arguments: "{\"city\"",
      eventType: "response.function_call_arguments.delta",
      delta: "{\"city\"",
      text: "{\"city\"",
    },
  },
);

assert.equal(
  openAIResponsesEventToRuntimeSignal({ type: "response.function_call_arguments.done" }).type,
  RuntimeSignal.RESPONSE_COMPLETE,
);

assert.equal(
  openAIResponsesEventToRuntimeSignal({ type: "response.completed" }).type,
  RuntimeSignal.RESPONSE_COMPLETE,
);

assert.equal(
  openAIResponsesEventToRuntimeSignal({ type: "response.failed", error: { message: "stream failed" } }).type,
  RuntimeSignal.ERROR,
);

assert.equal(
  openAIResponsesEventToRuntimeSignal({ type: "error", message: "transport failed" }).detail.message,
  "transport failed",
);

assert.deepEqual(
  openAIResponsesEventToRuntimeSignal({ type: "response.incomplete" }),
  {
    type: RuntimeSignal.INTERRUPT,
    detail: {
      type: "response.incomplete",
      eventType: "response.incomplete",
      reason: "incomplete",
    },
  },
);

let responsesTime = 0;
const responsesRuntime = createPresenceRuntime({
  initialState: PresenceState.IDLE,
  now: () => {
    responsesTime += 24;
    return responsesTime;
  },
});
const responsesTrace = createPresenceTrace({ limit: 8 });
responsesTrace.attach(responsesRuntime, { includeInitial: false });
const responsesAdapter = createOpenAIResponsesAdapter(responsesRuntime);
responsesAdapter.handleEvent({ type: "response.created", response: { id: "resp_1" } });
assert.equal(responsesRuntime.getSnapshot().state, PresenceState.THINKING);
responsesAdapter.handleEvent({ type: "response.output_item.added", item: { type: "message" } });
assert.equal(responsesRuntime.getSnapshot().state, PresenceState.WAITING);
responsesAdapter.handleEvent({ type: "response.output_text.delta", delta: "Visible output" });
assert.equal(responsesRuntime.getSnapshot().state, PresenceState.STREAMING);
responsesAdapter.handleEvent({ type: "response.completed" });
assert.equal(responsesRuntime.getSnapshot().state, PresenceState.READY);
const responsesSummary = summarizePresenceTrace(responsesTrace);
assert.deepEqual(responsesSummary.events, [
  PresenceEvent.SUBMIT,
  PresenceEvent.STREAM_OPEN,
  PresenceEvent.TOKEN,
  PresenceEvent.RESPONSE_COMPLETE,
]);
assert.ok(responsesSummary.presenceBeforeOutputMs > 0);
assert.equal(responsesSummary.finalState, PresenceState.READY);
assert.equal(responsesSummary.hasOutput, true);
assert.equal(responsesSummary.complete, true);
assert.equal(responsesSummary.interrupted, false);

const responsesErrorRuntime = createPresenceRuntime({ initialState: PresenceState.IDLE });
const responsesErrorAdapter = createOpenAIResponsesAdapter(responsesErrorRuntime);
responsesErrorAdapter.handleEvent({ type: "response.created" });
responsesErrorAdapter.handleEvent({ type: "response.failed", error: { message: "failed" } });
assert.equal(responsesErrorRuntime.getSnapshot().state, PresenceState.ERROR);

const responsesIncompleteRuntime = createPresenceRuntime({ initialState: PresenceState.IDLE });
const responsesIncompleteAdapter = createOpenAIResponsesAdapter(responsesIncompleteRuntime);
responsesIncompleteAdapter.handleEvent({ type: "response.created" });
responsesIncompleteAdapter.handleEvent({ type: "response.incomplete", incomplete_details: { reason: "max_output_tokens" } });
assert.equal(responsesIncompleteRuntime.getSnapshot().state, PresenceState.INTERRUPTED);

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
