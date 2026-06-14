import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  createPresenceRuntime,
  createPresenceTrace,
  presenceControlInputsForSnapshot,
  summarizePresenceTrace,
} = require("../packages/core/src/presence-core.js");
const {
  createChatEventAdapter,
  createOpenAIRealtimeAdapter,
  createVercelAISDKAdapter,
} = require("../packages/adapters/src/runtime-adapter.js");
const {
  FACE_CONTROL_CHANNELS,
  faceControllerDecisionTraceForFrame,
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

function formatMs(value) {
  return Number.isFinite(value) ? `${Math.round(value)}ms` : "none";
}

function renderTraceSummary(collected) {
  const summary = summarizePresenceTrace(collected.trace);
  return [
    `${collected.label}:summary`,
    `traceSummary=entries:${summary.entryCount}`,
    `states=${summary.states.join(",") || "none"}`,
    `events=${summary.events.join(",") || "none"}`,
    `firstStateMs=${formatMs(summary.firstStateMs)}`,
    `streamOpenMs=${formatMs(summary.streamOpenMs)}`,
    `firstTokenMs=${formatMs(summary.firstTokenMs)}`,
    `speechStartMs=${formatMs(summary.speechStartMs)}`,
    `firstOutputMs=${formatMs(summary.firstOutputMs)}`,
    `firstOutput=${summary.firstOutputEvent || "none"}`,
    `interruptMs=${formatMs(summary.interruptMs)}`,
    `interrupted=${summary.interrupted}`,
    `leadMs=${formatMs(summary.presenceBeforeOutputMs)}`,
    `finalState=${summary.finalState || "none"}`,
    `hasOutput=${summary.hasOutput}`,
    `complete=${summary.complete}`,
  ].join(" ");
}

function renderTrace(collected) {
  const entryLines = collected.trace
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
      const decisionTrace = faceControllerDecisionTraceForFrame(frameReport);
      const allChannelsReadState = FACE_CONTROL_CHANNELS.every((channel) =>
        decisionTrace.decisions[channel].reads.includes("state"));
      const transitionReadCount = FACE_CONTROL_CHANNELS.filter((channel) => {
        const reads = decisionTrace.decisions[channel].reads;
        return reads.includes("transitionEvent") && reads.includes("transitionAgeMs");
      }).length;
      const allChannelsReadTransition = transitionReadCount === FACE_CONTROL_CHANNELS.length;
      const context = decisionTrace.transitionContext || {};
      const transitionAgeMs = Number.isFinite(Number(context.transitionAgeMs))
        ? Math.round(Number(context.transitionAgeMs))
        : "none";
      const reads = [
        allChannelsReadState ? "state" : "partial",
        allChannelsReadTransition ? "transitionEvent" : "transitionEvent:partial",
        allChannelsReadTransition ? "transitionAgeMs" : "transitionAgeMs:partial",
      ].join(",");

      return [
        `${collected.label}:${entry.event}->${entry.state}+${entry.elapsedMs}ms`,
        `phase=${inputs.latencyPhase}`,
        `attention=${inputs.attentionTarget}`,
        `face=${frameReport.expression}`,
        `channels=${FACE_CONTROL_CHANNELS.join(",")}`,
        `trace=${decisionTrace.complete ? "complete" : "incomplete"}`,
        `decisions=${decisionTrace.decisionCount}`,
        `safe=${decisionTrace.rendererSafe}`,
        `warnings=${decisionTrace.warningCount}`,
        `transition=${context.previousState || "none"}:${context.transitionEvent || "none"}+${transitionAgeMs}ms`,
        `transitionReads=${transitionReadCount}/${FACE_CONTROL_CHANNELS.length}`,
        `reads=${reads}`,
        `mouth=${frameReport.frame.mouth.shape}`,
        `motion=${frameReport.frame.motion.energy.toFixed(2)}`,
      ].join(" ");
    });

  return [renderTraceSummary(collected), ...entryLines];
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

const interrupted = collect("interrupt");
const interruptedAdapter = createChatEventAdapter(interrupted.runtime, interrupted.options);
interruptedAdapter.handleEvent({ type: "submit", text: "Stop this turn" });
interruptedAdapter.handleEvent({ type: "stream-open" });
interruptedAdapter.handleEvent({ type: "delta", delta: "Working" });
interruptedAdapter.handleEvent({ type: "interrupt", reason: "user-started-new-turn" });

console.log([
  ...renderTrace(vercel),
  ...renderTrace(realtime),
  ...renderTrace(chat),
  ...renderTrace(interrupted),
].join("\n"));
