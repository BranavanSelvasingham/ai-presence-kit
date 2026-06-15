import adapters from "../src/runtime-adapter.js";

export const OPENAI_RESPONSES_EVENT_MAP = adapters.OPENAI_RESPONSES_EVENT_MAP;
export const VercelAIStatus = adapters.VercelAIStatus;
export const OPENAI_REALTIME_EVENT_MAP = adapters.OPENAI_REALTIME_EVENT_MAP;
export const RuntimeSignal = adapters.RuntimeSignal;
export const RUNTIME_SIGNALS = adapters.RUNTIME_SIGNALS;
export const applyRuntimeSignal = adapters.applyRuntimeSignal;
export const chatEventToRuntimeSignal = adapters.chatEventToRuntimeSignal;
export const createChatEventAdapter = adapters.createChatEventAdapter;
export const createOpenAIResponsesAdapter = adapters.createOpenAIResponsesAdapter;
export const createOpenAIRealtimeAdapter = adapters.createOpenAIRealtimeAdapter;
export const createRuntimeSignalAdapter = adapters.createRuntimeSignalAdapter;
export const createVercelAISDKAdapter = adapters.createVercelAISDKAdapter;
export const isRuntimeSignal = adapters.isRuntimeSignal;
export const lastAssistantText = adapters.lastAssistantText;
export const normalizeRuntimeSignal = adapters.normalizeRuntimeSignal;
export const openAIResponsesEventToRuntimeSignal = adapters.openAIResponsesEventToRuntimeSignal;
export const openAIRealtimeEventToRuntimeSignal = adapters.openAIRealtimeEventToRuntimeSignal;
export const presenceEventForRuntimeSignal = adapters.presenceEventForRuntimeSignal;
export const textFromOpenAIResponsesEvent = adapters.textFromOpenAIResponsesEvent;
export const textFromMessage = adapters.textFromMessage;
export const vercelAIStatusToRuntimeSignal = adapters.vercelAIStatusToRuntimeSignal;

export default adapters;
