import type { PresenceControlInputs, PresenceSnapshot, PresenceStateValue } from "@ai-presence/core";

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
  /**
   * Scales temporal micro-motion in generated frames and SVG output.
   * Use 1 for live motion, 0 for deterministic still/reduced-motion output.
   * Values outside 0..1 are clamped.
   */
  motionScale?: number;
  now?: number | (() => number);
  profile?: FaceControlProfile;
  timeMs?: number | (() => number);
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

export interface FaceGazeFrame extends FaceGazeControl {
  driftX: number;
  driftY: number;
}

export interface FaceBlinkFrame extends FaceBlinkControl {
  phase: number;
}

export interface FaceBrowsFrame extends FaceBrowsControl {}

export interface FaceMouthFrame extends FaceMouthControl {
  beat: number;
}

export interface FacePostureFrame extends FacePostureControl {
  breath: number;
}

export interface FaceMotionFrame extends FaceMotionControl {
  offsetX: number;
  offsetY: number;
}

export interface FaceControllerFrame {
  gaze: FaceGazeFrame;
  blink: FaceBlinkFrame;
  brows: FaceBrowsFrame;
  mouth: FaceMouthFrame;
  posture: FacePostureFrame;
  motion: FaceMotionFrame;
}

export type FaceControlChannel = "gaze" | "blink" | "brows" | "mouth" | "posture" | "motion";

export interface FaceControllerChannelCoherence {
  channel: FaceControlChannel;
  present: boolean;
  bounded: boolean;
  summary: Readonly<Record<string, string | number | boolean | null>>;
  warnings: readonly string[];
}

export interface FaceControllerCoherence {
  channels: readonly FaceControlChannel[];
  complete: boolean;
  bounded: boolean;
  rendererSafe: boolean;
  summary: Readonly<{
    channelCount: number;
    presentChannelCount: number;
    boundedChannelCount: number;
    gazeTarget: FaceGazeFrame["target"] | null;
    gazeFocus: number | null;
    blinkOpenness: number | null;
    mouthShape: FaceMouthFrame["shape"] | null;
    mouthActivity: number | null;
    postureLean: number | null;
    motionEnergy: number | null;
    motionRecovery: number | null;
  }>;
  channelReports: Readonly<Record<FaceControlChannel, FaceControllerChannelCoherence>>;
  warnings: readonly string[];
}

export type FaceControllerDecisionTraceSummaryValue = string | number | boolean | null;

export interface FaceControllerDecisionTraceChannel {
  channel: FaceControlChannel;
  controller: string | null;
  reads: readonly string[];
  control: Readonly<Record<string, FaceControllerDecisionTraceSummaryValue>>;
  frame: Readonly<Record<string, FaceControllerDecisionTraceSummaryValue>>;
  present: boolean;
  bounded: boolean;
  rendererSafe: boolean;
  warningCount: number;
  warnings: readonly string[];
}

export interface FaceControllerDecisionTrace {
  channels: readonly FaceControlChannel[];
  decisionCount: number;
  complete: boolean;
  rendererSafe: boolean;
  warningCount: number;
  warnings: readonly string[];
  decisions: Readonly<Record<FaceControlChannel, FaceControllerDecisionTraceChannel>>;
}

export interface FaceControllerDecision<TControl> {
  channel: FaceControlChannel;
  controller: string;
  reads: readonly string[];
  control: TControl;
}

export interface FaceControllerDecisions {
  gaze: FaceControllerDecision<FaceGazeControl>;
  blink: FaceControllerDecision<FaceBlinkControl>;
  brows: FaceControllerDecision<FaceBrowsControl>;
  mouth: FaceControllerDecision<FaceMouthControl>;
  posture: FaceControllerDecision<FacePostureControl>;
  motion: FaceControllerDecision<FaceMotionControl>;
}

export interface FaceControllerDecisionReport {
  state: PresenceStateValue;
  expression: FaceExpressionValue;
  sharedInputs: PresenceControlInputs | null;
  decisions: FaceControllerDecisions;
}

export interface FaceControllerFrameReport extends FaceControllerDecisionReport {
  frame: FaceControllerFrame;
  coherence: FaceControllerCoherence;
}

export interface PresenceFaceSvgOptions extends FaceControlOptions {
  className?: string;
  height?: number;
  title?: string;
  width?: number;
}

export interface PresenceFaceSvgChannelEvidence<TFrame> {
  controller: string;
  reads: readonly string[];
  frame: TFrame;
}

export interface PresenceFaceSvgChannelEvidenceMap {
  gaze: PresenceFaceSvgChannelEvidence<FaceGazeFrame>;
  blink: PresenceFaceSvgChannelEvidence<FaceBlinkFrame>;
  brows: PresenceFaceSvgChannelEvidence<FaceBrowsFrame>;
  mouth: PresenceFaceSvgChannelEvidence<FaceMouthFrame>;
  posture: PresenceFaceSvgChannelEvidence<FacePostureFrame>;
  motion: PresenceFaceSvgChannelEvidence<FaceMotionFrame>;
}

export interface PresenceFaceSvgAttributes {
  state: PresenceStateValue;
  expression: FaceExpressionValue;
  channels: string;
  gazeTarget: FaceGazeFrame["target"];
  blinkOpenness: string;
  browsPinch: string;
  mouthShape: FaceMouthFrame["shape"];
  postureLean: string;
  motionEnergy: string;
  motionScale: string;
}

export interface PresenceFaceSvgRenderResult {
  svg: string;
  state: PresenceStateValue;
  expression: FaceExpressionValue;
  frame: FaceControllerFrame;
  frameReport: FaceControllerFrameReport;
  attributes: PresenceFaceSvgAttributes;
  channelEvidence: PresenceFaceSvgChannelEvidenceMap;
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

export interface FaceControllerFrameRuntime {
  getFrame(): FaceControllerFrameReport | null;
  update(snapshot: PresenceSnapshot | PresenceStateValue, options?: FaceControlOptions & {
    update?: (frame: FaceControllerFrameReport, snapshot: PresenceSnapshot | PresenceStateValue) => void;
  }): FaceControllerFrameReport;
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
export declare const FACE_CONTROL_CHANNELS: readonly FaceControlChannel[];
export declare const DEFAULT_FACE_MAP: Readonly<Record<PresenceStateValue, FaceExpressionValue>>;

export declare function createFaceControllerRuntime(options?: FaceControlOptions & {
  update?: (controls: FaceControls, snapshot: PresenceSnapshot | PresenceStateValue) => void;
}): FaceControllerRuntime;
export declare function createFaceControllerFrameRuntime(options?: FaceControlOptions & {
  update?: (frame: FaceControllerFrameReport, snapshot: PresenceSnapshot | PresenceStateValue) => void;
}): FaceControllerFrameRuntime;
export declare function createFaceRenderer(options?: FaceRendererOptions): FaceRenderer;
export declare function faceControllerDecisionsForPresence(
  snapshotOrState: PresenceSnapshot | PresenceStateValue,
  options?: FaceControlOptions,
): FaceControllerDecisionReport;
export declare function faceControllerCoherenceForFrame(
  frameReport?: Partial<FaceControllerFrameReport> & Record<string, unknown>,
): FaceControllerCoherence;
export declare function faceControllerDecisionTraceForFrame(
  frameReport?: Partial<FaceControllerFrameReport> & Record<string, unknown>,
): FaceControllerDecisionTrace;
export declare function faceControllerFrameForPresence(
  snapshotOrState: PresenceSnapshot | PresenceStateValue,
  options?: FaceControlOptions,
): FaceControllerFrameReport;
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
export declare function renderPresenceFaceSvg(
  snapshotOrState: PresenceSnapshot | PresenceStateValue,
  options?: PresenceFaceSvgOptions,
): PresenceFaceSvgRenderResult;
