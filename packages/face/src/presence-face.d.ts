import type { PresenceSnapshot, PresenceStateValue } from "@ai-presence/core";

export declare const FaceExpression: Readonly<{
  IDLE: "idle";
  LISTENING: "listening";
  READING: "reading";
  THINKING: "thinking";
  CURIOUS: "curious";
  AMUSED: "amused";
  DELIGHTED: "delighted";
  UNCERTAIN: "uncertain";
  CONCERNED: "concerned";
  READY: "ready";
  SPEAKING: "speaking";
}>;

export type FaceExpressionValue = typeof FaceExpression[keyof typeof FaceExpression];

export interface FaceControlProfile {
  blinkCadenceMs?: number;
  drift?: number;
  settleMs?: number;
}

export interface FaceControlOptions extends FaceRendererOptions {
  detail?: Record<string, unknown>;
  history?: ReadonlyArray<Partial<PresenceSnapshot> & Record<string, unknown>>;
  now?: number | (() => number);
  profile?: FaceControlProfile;
  trace?: ReadonlyArray<Partial<PresenceSnapshot> & Record<string, unknown>> | {
    getEntries(): ReadonlyArray<Partial<PresenceSnapshot> & Record<string, unknown>>;
  };
}

export interface FaceGazeControl {
  target: "audience" | "content" | "input" | "middle-distance" | "question" | "response-origin" | "status" | "user";
  x: number;
  y: number;
  focus: number;
}

export interface FaceBlinkControl {
  openness: number;
  cadenceMs: number;
  pulse: boolean;
}

export interface FaceBrowsControl {
  lift: number;
  pinch: number;
  asymmetry: number;
}

export interface FaceMouthControl {
  shape: "curious" | "downturned" | "held" | "listening" | "preparing" | "pressed" | "release" | "rest" | "soft-smile" | "speaking";
  openness: number;
  activity: number;
  tension: number;
}

export interface FacePostureControl {
  lean: number;
  turn: number;
  energy: number;
  recovery: number;
}

export interface FaceMotionControl {
  energy: number;
  drift: number;
  anticipation: number;
  recovery: number;
  settleMs: number;
}

export interface FaceControls {
  expression: FaceExpressionValue;
  gaze: FaceGazeControl;
  blink: FaceBlinkControl;
  brows: FaceBrowsControl;
  mouth: FaceMouthControl;
  posture: FacePostureControl;
  motion: FaceMotionControl;
}

export interface FaceControllerRuntime {
  getControls(): FaceControls | null;
  update(snapshot: PresenceSnapshot | PresenceStateValue, options?: FaceControlOptions & {
    update?: (controls: FaceControls, snapshot: PresenceSnapshot | PresenceStateValue) => void;
  }): FaceControls;
}

export interface FaceRenderer {
  getExpression(): FaceExpressionValue | null;
  render(snapshot: PresenceSnapshot): FaceExpressionValue;
}

export interface FaceRendererOptions {
  map?: Partial<Record<PresenceStateValue, FaceExpressionValue>>;
  render?: (expression: FaceExpressionValue, snapshot: PresenceSnapshot) => void;
}

export declare const FACE_EXPRESSIONS: readonly FaceExpressionValue[];
export declare const DEFAULT_FACE_CONTROL_PROFILE: Readonly<{
  blinkCadenceMs: number;
  drift: number;
  settleMs: number;
}>;
export declare const DEFAULT_FACE_MAP: Readonly<Record<PresenceStateValue, FaceExpressionValue>>;

export declare function createFaceControllerRuntime(options?: FaceControlOptions & {
  update?: (controls: FaceControls, snapshot: PresenceSnapshot | PresenceStateValue) => void;
}): FaceControllerRuntime;
export declare function createFaceRenderer(options?: FaceRendererOptions): FaceRenderer;
export declare function faceControlsForPresence(
  snapshotOrState: PresenceSnapshot | PresenceStateValue,
  options?: FaceControlOptions,
): FaceControls;
export declare function faceExpressionForPresence(
  snapshotOrState: PresenceSnapshot | PresenceStateValue,
  options?: FaceRendererOptions & { detail?: Record<string, unknown> },
): FaceExpressionValue;
export declare function isFaceExpression(value: unknown): value is FaceExpressionValue;
export declare function normalizeFaceExpression(value: unknown, fallback?: FaceExpressionValue): FaceExpressionValue;
