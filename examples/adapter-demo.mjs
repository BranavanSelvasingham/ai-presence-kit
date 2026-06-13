import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  createPresenceRuntime,
  createPresenceTrace,
  presenceControlInputsForSnapshot,
} = require("../packages/core/src/presence-core.js");
const {
  createChatEventAdapter,
  createOpenAIRealtimeAdapter,
  createVercelAISDKAdapter,
} = require("../packages/adapters/src/runtime-adapter.js");
const {
  FACE_CONTROL_CHANNELS,
  faceControllerFrameForPresence,
} = require("../packages/face/src/presence-face.js");

function collect(label) {
  let time = 0;
  const runtime = createPresenceRuntime({
    now: () => {
      time += 18;
      return time;
    },
  });
  const trace = createPresenceTrace({ limit: 16 });
  trace.attach(runtime, { includeInitial: false });
  return {
    label,
    runtime,
    trace,
    options: {
      onSignal: () => {},
    },
  };
}

function renderTrace(collected) {
  return collected.trace
    .getEntries()
    .map((entry) => {
      const inputs = presenceControlInputsForSnapshot(entry, {
        trace: collected.trace,
        now: entry.updatedAt,
      });
      const frameReport = faceControllerFrameForPresence(entry, {
        trace: collected.trace,
        now: entry.updatedAt,
        timeMs: entry.updatedAt,
      });

      return [
        `${collected.label}:${entry.event}->${entry.state}+${entry.elapsedMs}ms`,
        `phase=${inputs.latencyPhase}`,
        `attention=${inputs.attentionTarget}`,
        `face=${frameReport.expression}`,
        `channels=${FACE_CONTROL_CHANNELS.join(",")}`,
        `mouth=${frameReport.frame.mouth.shape}`,
        `motion=${frameReport.frame.motion.energy.toFixed(2)}`,
      ].join(" ");
    });
}

const vercel = collect("vercel");
const vercelAdapter = createVercelAISDKAdapter(vercel.runtime, vercel.options);
vercelAdapter.onSubmit("Why does this feel faster?");
vercelAdapter.update({ status: "streaming", messages: [] });
vercelAdapter.update({
  status: "streaming",
  messages: [{ role: "assistant", parts: [{ type: "text", text: "Because presence moves first." }] }],
});
vercelAdapter.onFinish({ finishReason: "stop" });

const realtime = collect("realtime");
const realtimeAdapter = createOpenAIRealtimeAdapter(realtime.runtime, realtime.options);
realtimeAdapter.handleEvent({ type: "input_audio_buffer.speech_started" });
realtimeAdapter.handleEvent({ type: "input_audio_buffer.speech_stopped" });
realtimeAdapter.handleEvent({ type: "response.output_audio.delta", delta: "..." });
realtimeAdapter.handleEvent({ type: "response.done" });

const chat = collect("chat");
const chatAdapter = createChatEventAdapter(chat.runtime, chat.options);
chatAdapter.handleEvent({ type: "submit", text: "Hello" });
chatAdapter.handleEvent({ type: "stream-open" });
chatAdapter.handleEvent({ type: "delta", delta: "Hi" });
chatAdapter.handleEvent({ type: "finish" });

console.log([...renderTrace(vercel), ...renderTrace(realtime), ...renderTrace(chat)].join("\n"));
