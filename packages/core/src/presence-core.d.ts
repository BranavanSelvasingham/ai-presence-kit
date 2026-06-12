export declare const PresenceState: Readonly<{
  IDLE: "idle";
  USER_TYPING: "user-typing";
  READING: "reading";
  WAITING: "waiting";
  THINKING: "thinking";
  STREAMING: "streaming";
  SPEAKING: "speaking";
  INTERRUPTED: "interrupted";
  READY: "ready";
  ERROR: "error";
}>;

export type PresenceStateValue = typeof PresenceState[keyof typeof PresenceState];

export declare const PresenceEvent: Readonly<{
  RESET: "reset";
  USER_INPUT: "user-input";
  LOCAL_READ: "local-read";
  USER_PAUSE: "user-pause";
  SPECULATION_START: "speculation-start";
  SPECULATION_READY: "speculation-ready";
  SUBMIT: "submit";
  STREAM_OPEN: "stream-open";
  TOKEN: "token";
  RESPONSE_COMPLETE: "response-complete";
  SPEECH_START: "speech-start";
  SPEECH_END: "speech-end";
  VOICE_WAITING: "voice-waiting";
  INTERRUPT: "interrupt";
  ERROR: "error";
}>;

export type PresenceEventValue = typeof PresenceEvent[keyof typeof PresenceEvent];

export interface PresenceSnapshot {
  state: PresenceStateValue;
  previousState: PresenceStateValue | null;
  event: PresenceEventValue | "set-state";
  detail: Record<string, unknown>;
  changed: boolean;
  updatedAt: number;
  version: number;
}

export interface PresenceRuntime {
  getSnapshot(): PresenceSnapshot;
  subscribe(listener: (snapshot: PresenceSnapshot) => void): () => void;
  setState(nextState: PresenceStateValue, detail?: Record<string, unknown>): PresenceSnapshot;
  send(event: PresenceEventValue, detail?: Record<string, unknown>): PresenceSnapshot;
}

export interface PresenceRuntimeOptions {
  initialState?: PresenceStateValue;
  now?: () => number;
  onTransition?: (snapshot: PresenceSnapshot) => void;
}

export interface PresenceTraceEntry extends PresenceSnapshot {
  index: number;
  elapsedMs: number;
  sincePreviousMs: number;
}

export interface PresenceTraceOptions {
  limit?: number;
}

export interface PresenceTraceAttachOptions {
  includeInitial?: boolean;
}

export interface PresenceTrace {
  attach(runtime: PresenceRuntime, options?: PresenceTraceAttachOptions): () => void;
  clear(): void;
  getEntries(): PresenceTraceEntry[];
  record(snapshot: PresenceSnapshot): PresenceTraceEntry;
  toJSON(): PresenceTraceEntry[];
}

export type PresenceAttentionTarget = "audience" | "content" | "input" | "response" | "status" | "user";
export type PresenceLatencyPhase = "before-output" | "error" | "input" | "interrupted" | "output" | "recovery" | "settled";

export interface PresenceControlInputs {
  state: PresenceStateValue;
  attentionTarget: PresenceAttentionTarget;
  attentionX: number;
  attentionY: number;
  focus: number;
  tension: number;
  energy: number;
  anticipation: number;
  recovery: number;
  speechActivity: number;
  interruption: number;
  latencyPhase: PresenceLatencyPhase;
  ageMs: number;
  recentStates: readonly PresenceStateValue[];
}

export interface PresenceControlInputOptions {
  detail?: Record<string, unknown>;
  history?: ReadonlyArray<Partial<PresenceSnapshot> & Record<string, unknown>>;
  now?: number | (() => number);
  trace?: ReadonlyArray<Partial<PresenceSnapshot> & Record<string, unknown>> | {
    getEntries(): ReadonlyArray<Partial<PresenceSnapshot> & Record<string, unknown>>;
  };
}

export interface PresenceControlInputRuntime {
  getInputs(): PresenceControlInputs | null;
  update(snapshot: PresenceSnapshot | PresenceStateValue, options?: PresenceControlInputOptions & {
    update?: (inputs: PresenceControlInputs, snapshot: PresenceSnapshot | PresenceStateValue) => void;
  }): PresenceControlInputs;
}

export declare const PRESENCE_STATES: readonly PresenceStateValue[];
export declare const PRESENCE_EVENTS: readonly PresenceEventValue[];

export declare function createPresenceControlInputRuntime(options?: PresenceControlInputOptions & {
  update?: (inputs: PresenceControlInputs, snapshot: PresenceSnapshot | PresenceStateValue) => void;
}): PresenceControlInputRuntime;
export declare function createPresenceTrace(options?: PresenceTraceOptions): PresenceTrace;
export declare function createPresenceRuntime(options?: PresenceRuntimeOptions): PresenceRuntime;
export declare function isPresenceState(value: unknown): value is PresenceStateValue;
export declare function normalizePresenceState(value: unknown, fallback?: PresenceStateValue): PresenceStateValue;
export declare function presenceControlInputsForSnapshot(
  snapshotOrState: PresenceSnapshot | PresenceStateValue,
  options?: PresenceControlInputOptions,
): PresenceControlInputs;
export declare function reducePresenceState(
  currentState: PresenceStateValue,
  event: PresenceEventValue,
  payload?: Record<string, unknown>,
): PresenceStateValue;
