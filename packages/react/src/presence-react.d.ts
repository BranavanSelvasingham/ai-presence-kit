import type {
  PresenceControlInputOptions,
  PresenceControlInputs,
  PresenceRuntime,
  PresenceRuntimeOptions,
  PresenceSnapshot,
  PresenceStateValue,
} from "@ai-presence/core";

export interface ReactLike {
  createContext(defaultValue: PresenceRuntime): unknown;
  createElement(type: unknown, props: Record<string, unknown>, children: unknown): unknown;
  useEffect(effect: () => void | (() => void), deps?: ReadonlyArray<unknown>): void;
  useContext(context: unknown): PresenceRuntime;
  useState<T>(initialState: T | (() => T)): [T, (value: T) => void];
  useSyncExternalStore(
    subscribe: (listener: () => void) => () => void,
    getSnapshot: () => PresenceSnapshot,
    getServerSnapshot?: () => PresenceSnapshot,
  ): PresenceSnapshot;
}

export interface PresenceProviderProps {
  runtime?: PresenceRuntime;
  children?: unknown;
}

export interface PresenceRendererProps {
  runtime?: PresenceRuntime;
  children?: (snapshot: PresenceSnapshot) => unknown;
}

export interface PresenceFrameTimeOptions {
  now?: () => number;
}

export interface PresenceRendererSlotValue {
  snapshot: PresenceSnapshot;
  controlInputs: PresenceControlInputs;
  frameTimeMs: number;
  runtime: PresenceRuntime;
}

export interface PresenceRendererSlotProps {
  runtime?: PresenceRuntime;
  controlOptions?: PresenceControlInputOptions;
  frameOptions?: PresenceFrameTimeOptions;
  children?: (slot: PresenceRendererSlotValue) => unknown;
}

export interface VercelAIPresenceChatState {
  status?: string;
  messages?: Array<Record<string, unknown>>;
  assistantText?: string;
  completion?: string;
  [key: string]: unknown;
}

export interface VercelAIPresenceEvidence {
  assistantText: string;
  assistantTextEmpty: boolean;
  attributes: Readonly<Record<string, string>>;
  beforeOutput: boolean;
  framework: "vercel-ai-sdk";
  status: string;
}

export interface VercelAIPresenceEvidenceInput {
  chatState?: VercelAIPresenceChatState | string;
  controlInputs?: PresenceControlInputs;
  snapshot?: PresenceSnapshot;
  traceSummary?: Record<string, unknown>;
}

export interface VercelAIPresenceHookOptions {
  adapterOptions?: Record<string, unknown>;
  adapters?: {
    createVercelAISDKAdapter(runtime: PresenceRuntime, options?: Record<string, unknown>): {
      onInput(text: string, detail?: Record<string, unknown>): PresenceSnapshot;
      onSubmit(text: string, detail?: Record<string, unknown>): PresenceSnapshot;
      update(chatState: VercelAIPresenceChatState | string): PresenceSnapshot;
      onData(dataPart: Record<string, unknown>, detail?: Record<string, unknown>): PresenceSnapshot;
      onFinish(result?: Record<string, unknown>): PresenceSnapshot;
      onError(error: unknown, detail?: Record<string, unknown>): PresenceSnapshot;
    };
  };
  attachTrace?: boolean;
  autoUpdate?: boolean;
  includeInitialTrace?: boolean;
  now?: number;
  runtime?: PresenceRuntime;
  trace?: {
    attach(runtime: PresenceRuntime, options?: Record<string, unknown>): () => void;
    clear(): void;
    getEntries(): Array<Record<string, unknown>>;
    record(snapshot: PresenceSnapshot): Record<string, unknown>;
  };
  traceLimit?: number;
}

export interface VercelAIPresenceHookValue {
  adapter: Record<string, unknown>;
  controlInputs: PresenceControlInputs;
  evidence: VercelAIPresenceEvidence;
  evidenceAttributes: Readonly<Record<string, string>>;
  onError(error: unknown, detail?: Record<string, unknown>): PresenceSnapshot;
  onFinish(result?: Record<string, unknown>): PresenceSnapshot;
  onInput(text: string, detail?: Record<string, unknown>): PresenceSnapshot;
  onSubmit(text: string, detail?: Record<string, unknown>): PresenceSnapshot;
  runtime: PresenceRuntime;
  snapshot: PresenceSnapshot;
  trace: NonNullable<VercelAIPresenceHookOptions["trace"]>;
  traceSummary: Record<string, unknown>;
  update(chatState: VercelAIPresenceChatState | string): PresenceSnapshot;
}

export interface PresenceReactBindings {
  PresenceContext: unknown;
  PresenceProvider(props: PresenceProviderProps): unknown;
  PresenceRenderer(props: PresenceRendererProps): unknown;
  PresenceRendererSlot(props: PresenceRendererSlotProps): unknown;
  defaultRuntime: PresenceRuntime;
  usePresenceControlInputs(
    runtime?: PresenceRuntime | null,
    options?: PresenceControlInputOptions,
  ): PresenceControlInputs;
  usePresenceFrameTime(options?: PresenceFrameTimeOptions): number;
  usePresenceRuntime(): PresenceRuntime;
  usePresenceSnapshot(runtime?: PresenceRuntime | null): PresenceSnapshot;
  usePresenceState(runtime?: PresenceRuntime | null): PresenceStateValue;
  useVercelAIPresence(
    chatState?: VercelAIPresenceChatState | string,
    options?: VercelAIPresenceHookOptions,
  ): VercelAIPresenceHookValue;
  vercelAIPresenceEvidence(input?: VercelAIPresenceEvidenceInput): VercelAIPresenceEvidence;
}

export interface PresenceReactBindingOptions {
  runtime?: PresenceRuntime;
  runtimeOptions?: PresenceRuntimeOptions;
}

export declare function createPresenceReactBindings(
  React: ReactLike,
  options?: PresenceReactBindingOptions,
): PresenceReactBindings;

export declare function vercelAIPresenceEvidence(
  input?: VercelAIPresenceEvidenceInput,
): VercelAIPresenceEvidence;
