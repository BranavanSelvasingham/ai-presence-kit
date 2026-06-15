import type { PresenceEventValue, PresenceRuntime, PresenceSnapshot } from "@ai-presence/core";

export declare const RuntimeSignal: Readonly<{
  RESET: "reset";
  USER_INPUT: "user-input";
  USER_PAUSE: "user-pause";
  LOCAL_READ: "local-read";
  MODEL_WAITING: "model-waiting";
  STREAM_OPEN: "stream-open";
  TOKEN: "token";
  RESPONSE_COMPLETE: "response-complete";
  SPEECH_START: "speech-start";
  SPEECH_END: "speech-end";
  VOICE_WAITING: "voice-waiting";
  INTERRUPT: "interrupt";
  ERROR: "error";
}>;

export type RuntimeSignalValue = typeof RuntimeSignal[keyof typeof RuntimeSignal];

export declare const VercelAIStatus: Readonly<{
  SUBMITTED: "submitted";
  STREAMING: "streaming";
  READY: "ready";
  ERROR: "error";
}>;

export type VercelAIStatusValue = typeof VercelAIStatus[keyof typeof VercelAIStatus];

export declare const AssistantLifecycleStatus: Readonly<{
  SUBMITTED: "submitted";
  QUEUED: "queued";
  RUNNING: "running";
  STREAMING: "streaming";
  READY: "ready";
  COMPLETED: "completed";
  CANCELLED: "cancelled";
  CANCELED: "canceled";
  ERROR: "error";
  FAILED: "failed";
}>;

export type AssistantLifecycleStatusValue =
  typeof AssistantLifecycleStatus[keyof typeof AssistantLifecycleStatus];

export interface RuntimeSignalObject {
  type: RuntimeSignalValue;
  detail?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface NormalizedRuntimeSignal {
  type: RuntimeSignalValue;
  detail: Record<string, unknown>;
}

export interface RuntimeSignalAdapter {
  send(signal: RuntimeSignalValue | RuntimeSignalObject): PresenceSnapshot;
}

export interface AdapterOptions {
  onSignal?: (signal: NormalizedRuntimeSignal, snapshot: PresenceSnapshot) => void;
}

export interface VercelChatState {
  status: VercelAIStatusValue | string;
  messages?: Array<Record<string, unknown>>;
  assistantText?: string;
  completion?: string;
  [key: string]: unknown;
}

export interface VercelAISDKAdapter {
  onInput(text: string, detail?: Record<string, unknown>): PresenceSnapshot;
  onSubmit(text: string, detail?: Record<string, unknown>): PresenceSnapshot;
  update(chatState: VercelChatState | VercelAIStatusValue): PresenceSnapshot;
  onData(dataPart: Record<string, unknown>, detail?: Record<string, unknown>): PresenceSnapshot;
  onFinish(result?: Record<string, unknown>): PresenceSnapshot;
  onError(error: unknown, detail?: Record<string, unknown>): PresenceSnapshot;
}

export interface EventAdapter {
  handleEvent(event: string | Record<string, unknown>): PresenceSnapshot;
}

export interface AssistantLifecycleEvent {
  type?: string;
  event?: string;
  status?: AssistantLifecycleStatusValue | string;
  threadId?: string;
  runId?: string;
  messageId?: string;
  delta?: unknown;
  text?: unknown;
  content?: unknown;
  assistantText?: unknown;
  message?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AssistantLifecycleAdapter extends EventAdapter {
  update(event: string | AssistantLifecycleEvent): PresenceSnapshot;
  onInput(text: string, detail?: Record<string, unknown>): PresenceSnapshot;
  onPause(text: string, detail?: Record<string, unknown>): PresenceSnapshot;
  onRunStart(detail?: Record<string, unknown>): PresenceSnapshot;
  onStreamOpen(detail?: Record<string, unknown>): PresenceSnapshot;
  onOutput(delta: string, detail?: Record<string, unknown>): PresenceSnapshot;
  onComplete(detail?: Record<string, unknown>): PresenceSnapshot;
  onInterrupt(detail?: Record<string, unknown>): PresenceSnapshot;
  onError(error: unknown, detail?: Record<string, unknown>): PresenceSnapshot;
}

export declare const RUNTIME_SIGNALS: readonly RuntimeSignalValue[];
export declare const OPENAI_REALTIME_EVENT_MAP: Readonly<Record<string, RuntimeSignalValue>>;
export declare const OPENAI_RESPONSES_EVENT_MAP: Readonly<Record<string, RuntimeSignalValue>>;

export declare function applyRuntimeSignal(
  presenceRuntime: PresenceRuntime,
  signal: RuntimeSignalValue | RuntimeSignalObject,
): PresenceSnapshot;
export declare function assistantLifecycleEventToRuntimeSignal(
  event?: string | AssistantLifecycleEvent,
): NormalizedRuntimeSignal;
export declare function chatEventToRuntimeSignal(event?: string | Record<string, unknown>): NormalizedRuntimeSignal;
export declare function createAssistantLifecycleAdapter(
  presenceRuntime: PresenceRuntime,
  options?: AdapterOptions,
): AssistantLifecycleAdapter;
export declare function createChatEventAdapter(presenceRuntime: PresenceRuntime, options?: AdapterOptions): EventAdapter;
export declare function createOpenAIResponsesAdapter(presenceRuntime: PresenceRuntime, options?: AdapterOptions): EventAdapter;
export declare function createOpenAIRealtimeAdapter(presenceRuntime: PresenceRuntime, options?: AdapterOptions): EventAdapter;
export declare function createRuntimeSignalAdapter(presenceRuntime: PresenceRuntime, options?: AdapterOptions): RuntimeSignalAdapter;
export declare function createVercelAISDKAdapter(presenceRuntime: PresenceRuntime, options?: AdapterOptions): VercelAISDKAdapter;
export declare function isRuntimeSignal(value: unknown): value is RuntimeSignalValue;
export declare function lastAssistantText(messages?: Array<Record<string, unknown>>): string;
export declare function normalizeRuntimeSignal(signal: RuntimeSignalValue | RuntimeSignalObject): NormalizedRuntimeSignal;
export declare function openAIResponsesEventToRuntimeSignal(event?: string | Record<string, unknown>): NormalizedRuntimeSignal;
export declare function openAIRealtimeEventToRuntimeSignal(event?: string | Record<string, unknown>): NormalizedRuntimeSignal;
export declare function presenceEventForRuntimeSignal(signal: RuntimeSignalValue | RuntimeSignalObject): {
  event: PresenceEventValue;
  detail: Record<string, unknown>;
};
export declare function textFromAssistantLifecycleEvent(event?: string | AssistantLifecycleEvent): string;
export declare function textFromOpenAIResponsesEvent(event?: string | Record<string, unknown>): string;
export declare function textFromMessage(message: Record<string, unknown>): string;
export declare function vercelAIStatusToRuntimeSignal(chatState?: VercelChatState | VercelAIStatusValue): NormalizedRuntimeSignal;
