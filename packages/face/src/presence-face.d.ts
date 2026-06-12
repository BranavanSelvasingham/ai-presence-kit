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

export interface FaceRenderer {
  getExpression(): FaceExpressionValue | null;
  render(snapshot: PresenceSnapshot): FaceExpressionValue;
}

export interface FaceRendererOptions {
  map?: Partial<Record<PresenceStateValue, FaceExpressionValue>>;
  render?: (expression: FaceExpressionValue, snapshot: PresenceSnapshot) => void;
}

export declare const FACE_EXPRESSIONS: readonly FaceExpressionValue[];
export declare const DEFAULT_FACE_MAP: Readonly<Record<PresenceStateValue, FaceExpressionValue>>;

export declare function createFaceRenderer(options?: FaceRendererOptions): FaceRenderer;
export declare function faceExpressionForPresence(
  snapshotOrState: PresenceSnapshot | PresenceStateValue,
  options?: FaceRendererOptions & { detail?: Record<string, unknown> },
): FaceExpressionValue;
export declare function isFaceExpression(value: unknown): value is FaceExpressionValue;
export declare function normalizeFaceExpression(value: unknown, fallback?: FaceExpressionValue): FaceExpressionValue;
