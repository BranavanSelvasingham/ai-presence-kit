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
}

export interface PresenceReactBindingOptions {
  runtime?: PresenceRuntime;
  runtimeOptions?: PresenceRuntimeOptions;
}

export declare function createPresenceReactBindings(
  React: ReactLike,
  options?: PresenceReactBindingOptions,
): PresenceReactBindings;
