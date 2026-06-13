const faceShell = document.querySelector("#faceShell");
const faceSvg = document.querySelector(".face");
const browLeft = document.querySelector("#browLeft");
const browRight = document.querySelector("#browRight");
const eyeLeft = document.querySelector("#eyeLeft");
const eyeRight = document.querySelector("#eyeRight");
const pupilLeft = document.querySelector("#pupilLeft");
const pupilRight = document.querySelector("#pupilRight");
const eyeLeftGroup = document.querySelector("#eyeLeftGroup");
const eyeRightGroup = document.querySelector("#eyeRightGroup");
const mouthGroup = document.querySelector("#mouthGroup");
const mouth = document.querySelector("#mouth");
const breath = document.querySelector("#breath");
const visionPreview = document.querySelector("#visionPreview");
const faceVideo = document.querySelector("#faceVideo");
const faceBox = document.querySelector("#faceBox");
const visionStatus = document.querySelector("#visionStatus");
const trackingDot = document.querySelector("#trackingDot");
const composer = document.querySelector("#composer");
const inputRow = document.querySelector("#inputRow");
const input = document.querySelector("#messageInput");
const sendButton = document.querySelector("#sendButton");
const responseText = document.querySelector("#responseText");
const micToggle = document.querySelector("#micToggle");
const speakerToggle = document.querySelector("#speakerToggle");
const faceToggle = document.querySelector("#faceToggle");
const metricsToggle = document.querySelector("#metricsToggle");
const compareToggle = document.querySelector("#compareToggle");
const benchmarkButton = document.querySelector("#benchmarkButton");
const presenceButtons = Array.from(document.querySelectorAll("button[data-presence]"));
const metricsPanel = document.querySelector("#metricsPanel");
const comparisonDemo = document.querySelector("#comparisonDemo");
const controllerGallery = document.querySelector("#controllerGallery");
const controllerGalleryGrid = document.querySelector("#controllerGalleryGrid");
const compareBack = document.querySelector("#compareBack");
const compareForm = document.querySelector("#compareForm");
const compareInput = document.querySelector("#compareInput");
const compareRun = document.querySelector("#compareRun");
const compareLatency = document.querySelector("#compareLatency");
const compareSpinnerState = document.querySelector("#compareSpinnerState");
const compareSpinnerUser = document.querySelector("#compareSpinnerUser");
const compareSpinnerIndicator = document.querySelector("#compareSpinnerIndicator");
const compareSpinnerResponse = document.querySelector("#compareSpinnerResponse");
const compareSpinnerTimeline = document.querySelector("#compareSpinnerTimeline");
const comparePresenceState = document.querySelector("#comparePresenceState");
const comparePresenceUser = document.querySelector("#comparePresenceUser");
const compareFace = document.querySelector("#compareFace");
const compareMouth = document.querySelector(".compare-mouth");
const comparePresenceRenderer = document.querySelector("#comparePresenceRenderer");
const comparePresenceResponse = document.querySelector("#comparePresenceResponse");
const comparePresenceTimeline = document.querySelector("#comparePresenceTimeline");
const compareVoteSpinner = document.querySelector("#compareVoteSpinner");
const compareVotePresence = document.querySelector("#compareVotePresence");
const compareVoteResult = document.querySelector("#compareVoteResult");
const DEFAULT_INPUT_PLACEHOLDER = input.getAttribute("placeholder") || "Type...";
const PresenceCore = window.AIPresenceCore;
const PresenceFace = window.AIPresenceFace;
const PresenceAdapters = window.AIPresenceAdapters;

if (!PresenceCore) {
  throw new Error("AI Presence core did not load.");
}

if (!PresenceFace) {
  throw new Error("AI Presence face renderer did not load.");
}

if (!PresenceAdapters) {
  throw new Error("AI Presence adapters did not load.");
}

const { PresenceEvent, PresenceState, createPresenceRuntime, createPresenceTrace } = PresenceCore;
const { RuntimeSignal, createRuntimeSignalAdapter } = PresenceAdapters;
const FACE_CONTROL_CHANNELS = Array.isArray(PresenceFace.FACE_CONTROL_CHANNELS)
  ? PresenceFace.FACE_CONTROL_CHANNELS
  : ["gaze", "blink", "brows", "mouth", "posture", "motion"];

const metricState = document.querySelector("#metricState");
const metricRenderer = document.querySelector("#metricRenderer");
const metricPresence = document.querySelector("#metricPresence");
const metricSource = document.querySelector("#metricSource");
const metricExpression = document.querySelector("#metricExpression");
const metricLocal = document.querySelector("#metricLocal");
const metricEvents = document.querySelector("#metricEvents");
const metricApi = document.querySelector("#metricApi");
const metricVoice = document.querySelector("#metricVoice");
const metricLane = document.querySelector("#metricLane");
const metricStream = document.querySelector("#metricStream");
const metricToken = document.querySelector("#metricToken");
const metricAudio = document.querySelector("#metricAudio");
const metricSpeculate = document.querySelector("#metricSpeculate");
const metricResponse = document.querySelector("#metricResponse");
const metricTokenP50 = document.querySelector("#metricTokenP50");
const metricTokenP90 = document.querySelector("#metricTokenP90");
const metricTurns = document.querySelector("#metricTurns");
const metricAttention = document.querySelector("#metricAttention");
const metricArousal = document.querySelector("#metricArousal");
const metricComplete = document.querySelector("#metricComplete");
const metricCanceled = document.querySelector("#metricCanceled");
const metricPrepared = document.querySelector("#metricPrepared");
const metricFace = document.querySelector("#metricFace");
const metricControls = document.querySelector("#metricControls");
const metricTrace = document.querySelector("#metricTrace");
const metricBenchmark = document.querySelector("#metricBenchmark");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const FACE_TRACKING_MIRROR_X = true;
const FACE_TRACKING_INTERVAL_MS = 90;
const FACE_TRACKING_STALE_MS = 900;
const FACE_DETECTION_TIMEOUT_MS = 260;
const FACE_GAZE_DEADZONE = 0.035;
const FACE_GAZE_MAX_X = 11.5;
const FACE_GAZE_MAX_Y = 6.4;
const MEDIAPIPE_TASKS_VERSION = "0.10.35";
const MEDIAPIPE_TASKS_VISION_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_TASKS_VERSION}/vision_bundle.mjs`;
const MEDIAPIPE_WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_TASKS_VERSION}/wasm`;
const MEDIAPIPE_FACE_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

const runtime = {
  presenceState: PresenceState.IDLE,
  presenceReason: PresenceEvent.RESET,
  presenceSnapshot: null,
  presenceTrace: null,
  presenceRuntime: null,
  faceControllerRuntime: null,
  faceControls: null,
  faceDecisionReport: null,
  faceFrameReport: null,
  faceFrameAnimation: null,
  defaultRendererState: "idle",
  state: "idle",
  expressionSource: "idle",
  presence: "attentive",
  lastText: "",
  lastFeatures: null,
  apiAvailable: false,
  apiLabel: "local",
  realtimeModel: "",
  realtimeVoice: "",
  voiceLabel: "off",
  responseLane: "idle",
  trace: [],
  prefetch: null,
  benchmark: {
    running: false,
    summary: "--",
  },
  motionOk: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  currentEyes: null,
  mouthTimer: null,
  mouthBeat: 0,
  blinkScale: 1,
  microGaze: { x: 0, y: 0 },
  visionGaze: { x: 0, y: 0 },
  faceTrackingOn: false,
  faceDetector: null,
  mediaPipeDetector: null,
  mediaPipeLoading: false,
  mediaPipeFailed: false,
  mediaPipePromise: null,
  mediaPipeLastVideoTime: -1,
  faceMode: "off",
  faceStream: null,
  faceCanvas: null,
  faceContext: null,
  faceLoopTimer: null,
  faceDetecting: false,
  faceEstimateMode: "off",
  faceFrameCount: 0,
  faceHitCount: 0,
  faceMissCount: 0,
  faceErrorCount: 0,
  faceLoopStartedAt: 0,
  faceLastLoopAt: 0,
  faceLastFrameMs: null,
  faceLastSeenAt: 0,
  faceLabel: "off",
  faceBoxVisible: false,
  trackingDotVisible: false,
  microTimer: null,
  blinkTimer: null,
  cancelMarkerUntil: 0,
  activeTurnId: 0,
  events: 0,
  deletes: 0,
  staleJobs: 0,
  speculationId: 0,
  speculationTimer: null,
  speculationAbort: null,
  responseAbort: null,
  pauseTimer: null,
  localStreamTimer: null,
  expressionSettleTimer: null,
  lastExpressionAt: 0,
  prepared: null,
  lastInputAt: 0,
  speaking: false,
  activeAudio: null,
  activeAudioUrl: null,
  responseStreaming: false,
  speechBusy: false,
  speechPlaying: false,
  speechStartedForTurn: false,
  speechQueue: [],
  speechCursor: 0,
  speechRequestId: 0,
  speechSegmentId: 0,
  syncedTextTimer: null,
  syncedTextSegmentId: null,
  micOn: false,
  micListening: false,
  micStarting: false,
  micPausedForResponse: false,
  micRestartTimer: null,
  micAutoSubmitTimer: null,
  micWatchTimer: null,
  micResumeTimer: null,
  micBaseText: "",
  micFinalText: "",
  micInterimText: "",
  micHasSpeech: false,
  micSubmitting: false,
  micVirtualMode: false,
  micLastTranscript: "",
  micSpeechStartedAt: 0,
  micTranscriptStableSince: 0,
  micLastError: "",
  speakerOn: false,
  audioContext: null,
  audioUnlocked: false,
  activeUtterance: null,
  realtime: null,
  realtimeOn: false,
  realtimeConnecting: false,
  realtimeStartedAt: 0,
  realtimeTurnStartedAt: 0,
  realtimePreviousSpeakerOn: false,
  realtimeTranscript: "",
  realtimeVisibleTranscript: "",
  realtimeAudioSeen: false,
  realtimeDoneMarked: false,
  realtimeResponseDonePending: false,
  realtimeWordBuffer: "",
  realtimeWordFlushTimer: null,
  realtimeSpeechQueue: [],
  realtimeSpeechTimer: null,
  realtimeSpeechFinishTimer: null,
  realtimeSpeechEye: { x: 0, y: 0 },
  realtimeAudioEye: { x: 0, y: 0 },
  realtimeSpeechActive: false,
  realtimeSpeechCanStartAt: 0,
  realtimeAudioSource: null,
  realtimeAudioAnalyser: null,
  realtimeAudioLoop: null,
  realtimeAudioTimeData: null,
  realtimeAudioFreqData: null,
  realtimeAudioActive: false,
  realtimeAudioLevel: 0,
  realtimeAudioPreviousLevel: 0,
  realtimeAudioNoiseFloor: 0.006,
  realtimeAudioFrameCount: 0,
  realtimeAudioLastFrameAt: 0,
  realtimeLastError: "",
  recognition: null,
  samples: {
    firstToken: [],
    firstAudio: [],
    speculation: [],
    response: [],
  },
  metrics: {
    firstExpressionMs: null,
    localReadMs: null,
    streamOpenMs: null,
    firstTokenMs: null,
    firstAudioMs: null,
    speculationMs: null,
    responseMs: null,
    turns: 0,
    attention: 0,
    arousal: 0,
    completion: 0,
  },
};

runtime.presenceRuntime = createPresenceRuntime({
  initialState: PresenceState.IDLE,
  now: () => performance.now(),
});
runtime.presenceTrace = createPresenceTrace({ limit: 24 });
runtime.presenceTrace.attach(runtime.presenceRuntime);
runtime.faceControllerRuntime = PresenceFace.createFaceControllerRuntime();
runtime.presenceSnapshot = runtime.presenceRuntime.getSnapshot();

const comparisonRuntime = createPresenceRuntime({
  initialState: PresenceState.IDLE,
  now: () => performance.now(),
});
const comparisonAdapter = createRuntimeSignalAdapter(comparisonRuntime, {
  onSignal: () => renderComparisonPresence(),
});
const comparisonTiming = Object.freeze({
  pause: 360,
  streamOpen: 900,
  firstToken: 1400,
  done: 2600,
});
const comparisonResponse = "The presence side shows what is happening before the first token, while the generic side waits on the same latency.";
const comparisonMouths = Object.freeze({
  idle: "M58 88 C68 94 92 94 102 88",
  listening: "M60 88 C70 92 90 92 100 88",
  reading: "M60 88 C70 92 90 92 100 88",
  thinking: "M61 88 C71 85 89 85 99 88",
  curious: "M57 86 C68 96 92 96 103 86",
  amused: "M54 84 C66 100 94 100 106 84",
  delighted: "M52 82 C66 102 94 102 108 82",
  uncertain: "M61 88 C71 85 89 91 99 88",
  concerned: "M56 94 C68 84 92 84 104 94",
  ready: "M54 84 C66 100 94 100 106 84",
  speaking: "M58 86 L102 86 C100 102 60 102 58 86",
});
const comparisonState = {
  timers: [],
  runId: 0,
  startedAt: 0,
  beforeTokenStates: [],
  beforeTokenRenderers: [],
  beforeTokenFrameSummary: "none",
  beforeTokenFrameChannels: "",
  genericBeforeTokenState: "idle",
};

const runtimeTestOptions = new URLSearchParams(window.location.search);
const runtimeTestMode = runtimeTestOptions.get("test") === "1" || runtimeTestOptions.get("test") === "true";
const controllerGalleryStates = Object.freeze([
  PresenceState.IDLE,
  PresenceState.USER_TYPING,
  PresenceState.READING,
  PresenceState.THINKING,
  PresenceState.WAITING,
  PresenceState.STREAMING,
  PresenceState.SPEAKING,
  PresenceState.READY,
  PresenceState.INTERRUPTED,
  PresenceState.ERROR,
]);
const CONTROLLER_FRAME_SAMPLE_OFFSETS = Object.freeze([0, 240, 480, 720]);

const presenceProfiles = {
  still: {
    label: "Still",
    gain: 0.34,
    tilt: 0.24,
    color: 0.38,
    line: 0.92,
    breath: 0.32,
    fast: 210,
    slow: 620,
    settle: 260,
    micro: 0.22,
    blinkMin: 6200,
    blinkMax: 9800,
  },
  attentive: {
    label: "Attentive",
    gain: 1,
    tilt: 1,
    color: 1,
    line: 1,
    breath: 1,
    fast: 120,
    slow: 420,
    settle: 170,
    micro: 0.78,
    blinkMin: 3600,
    blinkMax: 7200,
  },
  expressive: {
    label: "Expressive",
    gain: 1.42,
    tilt: 1.34,
    color: 1.38,
    line: 1.05,
    breath: 1.22,
    fast: 88,
    slow: 310,
    settle: 95,
    micro: 1.12,
    blinkMin: 2600,
    blinkMax: 5200,
  },
};

const expressionTilts = {
  idle: 0,
  listening: -1.2,
  reading: -1.2,
  thinking: -1.8,
  curious: -2.6,
  amused: 1.1,
  delighted: 1.1,
  uncertain: -2.6,
  concerned: 1.6,
  ready: 0,
  speaking: 0.8,
};

const expressions = {
  idle: {
    brows: ["M132 133 C151 122 174 122 193 133", "M227 133 C246 122 269 122 288 133"],
    eyes: { rx: 17, ry: 18, lx: 0, ly: 0, rxp: 0, ryp: 0, scaleY: 1 },
    mouth: { d: "M166 238 C185 248 235 248 254 238", width: 7.1 },
    breath: "M112 298 C164 330 256 330 308 298",
    color: "#171717",
  },
  listening: {
    brows: ["M130 129 C151 119 176 120 195 132", "M225 132 C244 120 270 119 290 129"],
    eyes: { rx: 19, ry: 21, lx: -3, ly: -1, rxp: -3, ryp: -1, scaleY: 1 },
    mouth: { d: "M176 239 C195 244 225 244 244 239", width: 6.9, scaleX: 0.98 },
    breath: "M108 300 C164 333 256 333 312 300",
    color: "#315e8a",
  },
  reading: {
    brows: ["M131 132 C151 123 174 124 193 134", "M227 134 C246 124 269 123 289 132"],
    eyes: { rx: 18, ry: 16, lx: -2, ly: 3, rxp: -2, ryp: 3, scaleY: 0.92 },
    mouth: { d: "M173 240 C193 244 227 244 247 240", width: 6.8, scaleX: 0.96 },
    breath: "M112 299 C164 329 256 329 308 299",
    color: "#315e8a",
  },
  thinking: {
    brows: ["M132 137 C153 126 174 129 193 141", "M227 141 C246 129 267 126 288 137"],
    eyes: { rx: 18, ry: 10, lx: 2, ly: 1, rxp: 2, ryp: 1, scaleY: 0.76 },
    mouth: { d: "M183 241 C198 238 222 238 237 241", width: 6.6, scaleX: 0.9, y: 1 },
    breath: "M118 302 C168 326 252 326 302 302",
    color: "#6a5a8f",
  },
  curious: {
    brows: ["M129 124 C151 116 176 119 195 135", "M227 138 C248 124 270 119 291 126"],
    eyes: { rx: 20, ry: 21, lx: -4, ly: -2, rxp: -4, ryp: -2, scaleY: 1.05 },
    mouth: { d: "M177 238 C196 249 226 248 244 236", width: 7.2, scaleX: 0.98, y: -0.4 },
    breath: "M108 299 C162 336 258 336 312 299",
    color: "#2f7a67",
  },
  amused: {
    brows: ["M132 129 C152 121 175 123 194 136", "M226 136 C246 122 270 120 290 129"],
    eyes: { rx: 19, ry: 12, lx: 1, ly: 0, rxp: 1, ryp: 0, scaleY: 0.82 },
    mouth: { d: "M162 235 C184 257 234 257 258 233", width: 7.5, scaleX: 1.02 },
    breath: "M111 300 C164 334 256 334 309 300",
    color: "#b66858",
  },
  delighted: {
    brows: ["M128 126 C151 115 178 116 198 130", "M222 130 C242 116 269 115 292 126"],
    eyes: { rx: 21, ry: 22, lx: 0, ly: -1, rxp: 0, ryp: -1, scaleY: 1.08 },
    mouth: { d: "M156 232 C181 265 239 265 264 232", width: 7.8, scaleX: 1.04, y: -1 },
    breath: "M101 296 C159 340 261 340 319 296",
    color: "#b66858",
  },
  uncertain: {
    brows: ["M128 121 C151 112 176 117 197 137", "M225 144 C246 132 269 132 291 143"],
    eyes: { rx: 19, ry: 18, lx: -5, ly: 1, rxp: -5, ryp: 1, scaleY: 0.96 },
    mouth: { d: "M176 241 C195 237 223 245 244 239", width: 6.8, scaleX: 0.96, y: 0.7 },
    breath: "M119 302 C166 325 254 325 301 302",
    color: "#6a5a8f",
  },
  concerned: {
    brows: ["M130 143 C151 128 174 126 195 136", "M225 136 C246 126 269 128 290 143"],
    eyes: { rx: 18, ry: 17, lx: 0, ly: 2, rxp: 0, ryp: 2, scaleY: 0.9 },
    mouth: { d: "M166 246 C188 234 232 234 254 246", width: 7.2, scaleX: 0.98, y: 1 },
    breath: "M122 304 C169 322 251 322 298 304",
    color: "#b66858",
  },
  ready: {
    brows: ["M132 130 C152 120 176 120 196 131", "M224 131 C244 120 268 120 288 130"],
    eyes: { rx: 19, ry: 20, lx: 0, ly: 0, rxp: 0, ryp: 0, scaleY: 1 },
    mouth: { d: "M162 236 C184 253 236 253 258 236", width: 7.4, scaleX: 1.01 },
    breath: "M108 298 C163 333 257 333 312 298",
    color: "#2f7a67",
  },
  speaking: {
    brows: ["M131 130 C151 120 175 121 194 133", "M226 133 C245 121 269 120 289 130"],
    eyes: { rx: 18, ry: 18, lx: 0, ly: 0, rxp: 0, ryp: 0, scaleY: 0.98 },
    mouth: { d: "M174 237 L246 237 C244 255 176 255 174 237", width: 7.35, scaleX: 0.98 },
    breath: "M106 298 C162 337 258 337 314 298",
    color: "#315e8a",
  },
};

const speakingMouths = [
  { d: "M174 237 L246 237 C244 255 176 255 174 237", width: 7.35, scaleX: 0.98, scaleY: 0.96 },
  { d: "M179 235 L241 235 C239 262 181 262 179 235", width: 7.55, scaleX: 0.9, scaleY: 1.06, y: 1 },
  { d: "M168 239 L252 239 C247 250 173 250 168 239", width: 7.1, scaleX: 1.03, scaleY: 0.9, y: -0.4 },
  { d: "M184 236 L236 236 C234 259 186 259 184 236", width: 7.35, scaleX: 0.82, scaleY: 1.08, y: 1.4 },
  { d: "M176 237 L244 237 C241 253 179 253 176 237", width: 7.2, scaleX: 0.95, scaleY: 0.98 },
];

const realtimeMouthShapes = {
  rest: { d: "M174 239 C193 245 227 245 246 239", width: 7.1, scaleX: 0.98, scaleY: 0.94 },
  closed: { d: "M176 240 C194 240 226 240 244 240", width: 7.4, scaleX: 0.92, scaleY: 0.72, y: 0.5 },
  open: { d: "M176 234 L244 234 C242 263 178 263 176 234", width: 7.55, scaleX: 0.86, scaleY: 1.08, y: 1.1 },
  wide: { d: "M164 238 L256 238 C251 255 169 255 164 238", width: 7.35, scaleX: 1.08, scaleY: 0.88, y: -0.2 },
  round: { d: "M184 235 L236 235 C234 262 186 262 184 235", width: 7.55, scaleX: 0.72, scaleY: 1.1, y: 1.1 },
  teeth: { d: "M168 238 L252 238 C248 247 172 247 168 238", width: 7.15, scaleX: 1.02, scaleY: 0.68, y: -0.1 },
  soft: { d: "M171 237 L249 237 C245 251 175 251 171 237", width: 7.08, scaleX: 0.96, scaleY: 0.94 },
};

const REALTIME_ARTICULATION_DELAY_MS = 120;
const REALTIME_TRANSCRIPT_MAX_LEAD_MS = 260;
const REALTIME_PARTIAL_WORD_FLUSH_MS = 170;
const REALTIME_MAX_WORD_QUEUE = 18;
const REALTIME_FINISH_GRACE_MS = 820;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function percent(value) {
  return `${Math.round(clamp(value, 0, 1) * 100)}%`;
}

function ms(value) {
  if (value === null || Number.isNaN(value)) return "--";
  return `${Math.round(value)}ms`;
}

function trace(label, value = null) {
  runtime.trace.push(value === null ? label : `${label} ${ms(value)}`);
  if (runtime.trace.length > 14) {
    runtime.trace.shift();
  }
}

function recordSample(name, value) {
  if (!Number.isFinite(value)) return;
  const samples = runtime.samples[name];
  if (!samples) return;
  samples.push(value);
  if (samples.length > 24) {
    samples.shift();
  }
}

function percentile(samples, percentileValue) {
  if (!samples.length) return null;
  const sorted = [...samples].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * percentileValue) - 1);
  return sorted[Math.max(0, index)];
}

function median(values) {
  return percentile(values.filter(Number.isFinite), 0.5);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function setPressed(button, pressed) {
  button.setAttribute("aria-pressed", String(pressed));
}

function currentPresenceProfile() {
  return presenceProfiles[runtime.presence] || presenceProfiles.attentive;
}

function faceControlProfile() {
  const profile = currentPresenceProfile();
  return {
    blinkCadenceMs: (profile.blinkMin + profile.blinkMax) / 2,
    drift: 0.1 + profile.micro * 0.1,
    settleMs: profile.settle,
  };
}

function faceControllerOptions(now = performance.now()) {
  return {
    trace: runtime.presenceTrace,
    now,
    timeMs: now,
    profile: faceControlProfile(),
  };
}

function updateFaceControls(snapshot) {
  if (!runtime.faceControllerRuntime) return null;
  const options = faceControllerOptions();
  const controls = runtime.faceControllerRuntime.update(snapshot, options);
  runtime.faceDecisionReport = typeof PresenceFace.faceControllerDecisionsForPresence === "function"
    ? PresenceFace.faceControllerDecisionsForPresence(snapshot, options)
    : null;
  runtime.faceFrameReport = typeof PresenceFace.faceControllerFrameForPresence === "function"
    ? PresenceFace.faceControllerFrameForPresence(snapshot, options)
    : null;
  runtime.faceControls = controls;
  return controls;
}

function updateFaceFrameReport(snapshot = runtime.presenceSnapshot) {
  if (!snapshot || typeof PresenceFace.faceControllerFrameForPresence !== "function") return null;
  runtime.faceFrameReport = PresenceFace.faceControllerFrameForPresence(snapshot, faceControllerOptions());
  return runtime.faceFrameReport;
}

function activeFaceControls() {
  return runtime.faceControls || runtime.faceControllerRuntime?.getControls() || null;
}

function activeFaceDecisionReport() {
  return runtime.faceDecisionReport || null;
}

function activeFaceFrameReport() {
  return runtime.faceFrameReport || null;
}

function activeFaceFrame() {
  return activeFaceFrameReport()?.frame || null;
}

function controlsFromDecisionReport(report) {
  if (!report?.decisions) return null;
  const controls = { expression: report.expression };
  for (const channel of FACE_CONTROL_CHANNELS) {
    controls[channel] = report.decisions[channel]?.control;
  }
  return controls;
}

function controlsSummary(controls = activeFaceControls()) {
  if (!controls) return "none";
  return [
    `gaze:${controls.gaze.target}`,
    `blink:${Math.round(controls.blink.cadenceMs)}ms`,
    `brows:${Math.round(controls.brows.pinch * 100)}`,
    `mouth:${controls.mouth.shape}`,
    `posture:${Math.round(controls.posture.lean * 100)}`,
    `motion:${Math.round(controls.motion.energy * 100)}`,
  ].join(" ");
}

function shortPercent(value) {
  return `${Math.round(clamp(value, 0, 1) * 100)}`;
}

function signedNumber(value) {
  const rounded = Number(value || 0).toFixed(2);
  return rounded === "-0.00" ? "0.00" : rounded;
}

function frameChannelText(channel, frameControl) {
  if (!frameControl) return "none";
  switch (channel) {
    case "gaze":
      return `target ${frameControl.target} x ${signedNumber(frameControl.x)} y ${signedNumber(frameControl.y)} focus ${shortPercent(frameControl.focus)}% drift ${signedNumber(frameControl.driftX)},${signedNumber(frameControl.driftY)}`;
    case "blink":
      return `open ${shortPercent(frameControl.openness)}% phase ${shortPercent(frameControl.phase)}% pulse ${frameControl.pulse ? "yes" : "no"}`;
    case "brows":
      return `lift ${signedNumber(frameControl.lift)} pinch ${signedNumber(frameControl.pinch)} asym ${signedNumber(frameControl.asymmetry)}`;
    case "mouth":
      return `${frameControl.shape} open ${shortPercent(frameControl.openness)}% activity ${shortPercent(frameControl.activity)}% beat ${shortPercent(frameControl.beat)}%`;
    case "posture":
      return `lean ${signedNumber(frameControl.lean)} turn ${signedNumber(frameControl.turn)} breath ${shortPercent(frameControl.breath)}%`;
    case "motion":
      return `offset ${signedNumber(frameControl.offsetX)},${signedNumber(frameControl.offsetY)} energy ${shortPercent(frameControl.energy)}% recovery ${shortPercent(frameControl.recovery)}%`;
    default:
      return JSON.stringify(frameControl);
  }
}

function frameSummary(report = activeFaceFrameReport()) {
  if (!report?.frame) return "none";
  return FACE_CONTROL_CHANNELS
    .map((channel) => `${channel}:${frameChannelText(channel, report.frame[channel])}`)
    .join(" | ");
}

function controllerCoherenceForFrame(report = activeFaceFrameReport()) {
  if (report?.coherence) return report.coherence;
  if (report && typeof PresenceFace.faceControllerCoherenceForFrame === "function") {
    return PresenceFace.faceControllerCoherenceForFrame(report);
  }
  return null;
}

function controllerCoherenceEvidence(report = activeFaceFrameReport()) {
  const coherence = controllerCoherenceForFrame(report);
  const channels = Array.isArray(coherence?.channels) && coherence.channels.length
    ? coherence.channels
    : FACE_CONTROL_CHANNELS;
  const channelText = channels.join(" ");
  const warningCount = Array.isArray(coherence?.warnings) ? coherence.warnings.length : 0;
  const rendererSafe = Boolean(coherence?.rendererSafe);
  const warningFree = Boolean(coherence) && warningCount === 0;
  const hasAllChannels = FACE_CONTROL_CHANNELS.every((channel) => channels.includes(channel));
  const safe = rendererSafe && warningFree && hasAllChannels;
  const summary = coherence?.summary || {};
  const channelCount = summary.channelCount || FACE_CONTROL_CHANNELS.length;
  const presentCount = summary.presentChannelCount || 0;
  const boundedCount = summary.boundedChannelCount || 0;

  return {
    status: safe ? "safe" : "unsafe",
    channels: channelText,
    warningCount: String(warningCount),
    rendererSafe: String(rendererSafe),
    warningFree: String(warningFree),
    summary: coherence
      ? `rendererSafe:${rendererSafe ? "yes" : "no"} warnings:${warningCount} channels:${presentCount}/${channelCount} bounded:${boundedCount}/${channelCount}`
      : "none",
  };
}

function applyControllerCoherenceDataset(element, report = activeFaceFrameReport()) {
  if (!element) return null;
  const evidence = controllerCoherenceEvidence(report);
  element.dataset.controllerCoherence = evidence.status;
  element.dataset.controllerCoherenceChannels = evidence.channels;
  element.dataset.controllerCoherenceWarnings = evidence.warningCount;
  element.dataset.controllerCoherenceRendererSafe = evidence.rendererSafe;
  element.dataset.controllerCoherenceWarningFree = evidence.warningFree;
  element.dataset.controllerCoherenceSummary = evidence.summary;
  return evidence;
}

function controllerDecisionTraceForFrame(report = activeFaceFrameReport()) {
  if (!report || typeof PresenceFace.faceControllerDecisionTraceForFrame !== "function") return null;
  return PresenceFace.faceControllerDecisionTraceForFrame(report);
}

function controllerDecisionTraceEvidence(report = activeFaceFrameReport()) {
  const trace = controllerDecisionTraceForFrame(report);
  const channels = Array.isArray(trace?.channels) && trace.channels.length
    ? trace.channels
    : FACE_CONTROL_CHANNELS;
  const channelText = channels.join(" ");
  const decisionCount = Number.isFinite(Number(trace?.decisionCount)) ? Number(trace.decisionCount) : 0;
  const warningCount = Number.isFinite(Number(trace?.warningCount))
    ? Number(trace.warningCount)
    : Array.isArray(trace?.warnings)
      ? trace.warnings.length
      : 0;
  const rendererSafe = Boolean(trace?.rendererSafe);
  const hasAllChannels = FACE_CONTROL_CHANNELS.every((channel) => channels.includes(channel));
  const complete = Boolean(trace?.complete && hasAllChannels);

  return {
    status: complete ? "complete" : "incomplete",
    channels: channelText,
    decisionCount: String(decisionCount),
    warningCount: String(warningCount),
    rendererSafe: String(rendererSafe),
    summary: trace
      ? `rendererSafe:${rendererSafe ? "yes" : "no"} warnings:${warningCount} decisions:${decisionCount}/${FACE_CONTROL_CHANNELS.length} channels:${channels.length}/${FACE_CONTROL_CHANNELS.length}`
      : "none",
  };
}

function applyControllerDecisionTraceDataset(element, report = activeFaceFrameReport()) {
  if (!element) return null;
  const evidence = controllerDecisionTraceEvidence(report);
  element.dataset.controllerDecisionTrace = evidence.status;
  element.dataset.controllerDecisionTraceChannels = evidence.channels;
  element.dataset.controllerDecisionTraceDecisions = evidence.decisionCount;
  element.dataset.controllerDecisionTraceWarnings = evidence.warningCount;
  element.dataset.controllerDecisionTraceRendererSafe = evidence.rendererSafe;
  element.dataset.controllerDecisionTraceSummary = evidence.summary;
  return evidence;
}

function decisionForChannel(report, channel) {
  return report?.decisions?.[channel] || null;
}

function controllerReadsText(decision) {
  return Array.isArray(decision?.reads) ? decision.reads.join(",") : "none";
}

function controllerCompositionText(report = activeFaceDecisionReport()) {
  if (!report?.decisions) return "none";
  return FACE_CONTROL_CHANNELS
    .map((channel) => `${channel}:${decisionForChannel(report, channel)?.controller || "none"}`)
    .join(" ");
}

function controllerChannelControlText(channel, control) {
  switch (channel) {
    case "gaze":
      return `target ${control.target} focus ${shortPercent(control.focus)}%`;
    case "blink":
      return `open ${shortPercent(control.openness)}% cadence ${Math.round(control.cadenceMs)}ms pulse ${control.pulse ? "yes" : "no"}`;
    case "brows":
      return `lift ${signedNumber(control.lift)} pinch ${signedNumber(control.pinch)}`;
    case "mouth":
      return `${control.shape} open ${shortPercent(control.openness)}% activity ${shortPercent(control.activity)}%`;
    case "posture":
      return `lean ${signedNumber(control.lean)} recovery ${shortPercent(control.recovery)}%`;
    case "motion":
      return `energy ${shortPercent(control.energy)}% anticipation ${shortPercent(control.anticipation)}% recovery ${shortPercent(control.recovery)}%`;
    default:
      return JSON.stringify(control);
  }
}

function controllerEvidenceText(controls, report = null) {
  if (!controls) return "none";
  return FACE_CONTROL_CHANNELS
    .map((channel) => {
      const decision = decisionForChannel(report, channel);
      const controller = decision?.controller || `${channel}-control`;
      const reads = controllerReadsText(decision);
      return `${channel} ${controller} reads ${reads} -> ${controllerChannelControlText(channel, controls[channel])}`;
    })
    .join(" | ");
}

function syncPresenceSnapshot(snapshot) {
  runtime.presenceSnapshot = snapshot;
  runtime.presenceState = snapshot.state;
  runtime.presenceReason = snapshot.event;
  const controls = updateFaceControls(snapshot);
  runtime.defaultRendererState = controls?.expression || PresenceFace.faceExpressionForPresence(snapshot);
  faceShell.dataset.presenceState = snapshot.state;
  faceShell.dataset.defaultRendererState = runtime.defaultRendererState;
  faceShell.dataset.faceControls = controls ? controlsSummary(controls) : "none";
  faceShell.dataset.controllerComposition = controllerCompositionText();
  faceShell.dataset.controllerEvidence = controllerEvidenceText(controls, activeFaceDecisionReport());
  faceShell.dataset.controllerFrame = frameSummary();
  applyControllerCoherenceDataset(faceShell);
  applyControllerDecisionTraceDataset(faceShell);
  applyControllerDecisionTraceDataset(faceSvg);
  if (controls?.expression && controls.expression !== runtime.state) {
    setExpression(controls.expression, null, "face-controller", {
      immediate: snapshot.changed || controls.motion.settleMs <= 140,
    });
  }
  if (runtime.motionOk && controls) {
    scheduleMicroGaze(controls.motion.settleMs);
    if (controls.blink.pulse) {
      pulseFaceBlink(0.06, 74);
    } else {
      scheduleBlink();
    }
  }
  return snapshot;
}

function sendPresenceEvent(event, detail = {}) {
  if (!runtime.presenceRuntime) return null;
  return syncPresenceSnapshot(runtime.presenceRuntime.send(event, detail));
}

function setPresenceState(state, detail = {}) {
  if (!runtime.presenceRuntime) return null;
  return syncPresenceSnapshot(runtime.presenceRuntime.setState(state, detail));
}

function syncComposerInput() {
  const hasText = input.value.trim().length > 0;
  inputRow.classList.toggle("has-text", hasText);
  sendButton.disabled = !hasText;
  sendButton.setAttribute("aria-disabled", String(!hasText));
  resizeComposerInput();
}

function resizeComposerInput() {
  input.style.height = "auto";
  const maxHeight = Math.min(window.innerHeight * 0.24, 172);
  const nextHeight = Math.max(44, Math.min(input.scrollHeight, maxHeight));

  input.style.height = `${Math.round(nextHeight)}px`;
  input.style.overflowY = input.scrollHeight > maxHeight ? "auto" : "hidden";
  inputRow.classList.toggle("is-multiline", nextHeight > 56);
}

function setPresence(level) {
  if (!presenceProfiles[level]) return;
  runtime.presence = level;

  for (const button of presenceButtons) {
    const selected = button.dataset.presence === level;
    button.setAttribute("aria-checked", String(selected));
  }

  faceShell.dataset.presence = level;
  if (runtime.presenceSnapshot) {
    const controls = updateFaceControls(runtime.presenceSnapshot);
    if (controls) {
      runtime.defaultRendererState = controls.expression;
      faceShell.dataset.defaultRendererState = runtime.defaultRendererState;
      faceShell.dataset.faceControls = controlsSummary(controls);
      faceShell.dataset.controllerComposition = controllerCompositionText();
      faceShell.dataset.controllerEvidence = controllerEvidenceText(controls, activeFaceDecisionReport());
      faceShell.dataset.controllerFrame = frameSummary();
      applyControllerCoherenceDataset(faceShell);
      applyControllerDecisionTraceDataset(faceShell);
      applyControllerDecisionTraceDataset(faceSvg);
    }
  }
  setExpression(runtime.state, null, runtime.expressionSource, { immediate: true });
  if (runtime.motionOk) {
    scheduleMicroGaze(240);
    scheduleBlink();
  }
}

function setExpression(name, eventStartedAt = null, source = runtime.expressionSource, options = {}) {
  const profile = currentPresenceProfile();
  const urgent =
    options.immediate ||
    source === "local-reflex" ||
    source === "response-pending" ||
    source === "response-speaking" ||
    source === "response-ready" ||
    source === "mic" ||
    source === "realtime" ||
    name === "speaking" ||
    name === "concerned";
  const now = performance.now();
  const settleMs = profile.settle;
  const elapsed = runtime.lastExpressionAt ? now - runtime.lastExpressionAt : settleMs;

  if (!urgent && elapsed < settleMs) {
    window.clearTimeout(runtime.expressionSettleTimer);
    runtime.expressionSettleTimer = window.setTimeout(() => {
      runtime.expressionSettleTimer = null;
      applyExpression(name, eventStartedAt, source);
    }, settleMs - elapsed);
    return;
  }

  window.clearTimeout(runtime.expressionSettleTimer);
  runtime.expressionSettleTimer = null;
  applyExpression(name, eventStartedAt, source);
}

function applyExpression(name, eventStartedAt = null, source = runtime.expressionSource) {
  const expression = expressions[name] || expressions.idle;
  const profile = currentPresenceProfile();
  const controls = activeFaceControls();
  const frame = runtime.motionOk ? updateFaceFrameReport()?.frame : null;
  const posture = frame?.posture || controls?.posture;
  const motion = frame?.motion || controls?.motion;
  const eyes = scaleEyes(expression.eyes, profile.gain);
  const postureTilt = posture && motion
    ? (posture.turn * 12) - (posture.lean * 4) + (motion.recovery * 1.5)
    : 0;
  const tilt = scaleValue((expressionTilts[name] || 0) + postureTilt, profile.tilt);
  const breathFactor = motion
    ? clamp(0.84 + motion.energy * 0.38 + motion.anticipation * 0.12 + (posture?.breath || 0) * 0.16 - motion.recovery * 0.08, 0.7, 1.38)
    : 1;
  const frameOffsetX = frame ? scaleValue(frame.motion.offsetX * 8.4, profile.tilt) : 0;
  const frameOffsetY = frame ? scaleValue(frame.motion.offsetY * 5.8, profile.tilt) : 0;

  runtime.state = name;
  runtime.expressionSource = source;
  runtime.lastExpressionAt = performance.now();
  faceShell.dataset.state = name;
  faceShell.dataset.rendererState = name;
  faceShell.dataset.presence = runtime.presence;
  faceShell.dataset.controllerFrame = frameSummary();
  applyControllerCoherenceDataset(faceShell);
  applyControllerDecisionTraceDataset(faceShell);
  applyControllerDecisionTraceDataset(faceSvg);
  faceShell.style.setProperty("--face-tilt", `${tilt.toFixed(2)}deg`);
  faceShell.style.setProperty("--face-offset-x", `${frameOffsetX.toFixed(2)}px`);
  faceShell.style.setProperty("--face-offset-y", `${frameOffsetY.toFixed(2)}px`);
  faceShell.style.setProperty("--breath-duration", `${(4.8 / (profile.breath * breathFactor)).toFixed(2)}s`);
  document.documentElement.style.setProperty("--fast", `${profile.fast}ms cubic-bezier(0.2, 0.8, 0.2, 1)`);
  document.documentElement.style.setProperty("--slow", `${profile.slow}ms cubic-bezier(0.2, 0.8, 0.2, 1)`);

  faceSvg.style.color = expression.color;
  browLeft.setAttribute("d", expression.brows[0]);
  browRight.setAttribute("d", expression.brows[1]);
  applyBrowControls(frame ? { brows: frame.brows } : controls, profile);
  renderMouth(expression.mouth, profile, frame);
  breath.setAttribute("d", expression.breath);

  eyeLeft.setAttribute("rx", formatSvgNumber(eyes.rx));
  eyeLeft.setAttribute("ry", formatSvgNumber(eyes.ry));
  eyeRight.setAttribute("rx", formatSvgNumber(eyes.rx));
  eyeRight.setAttribute("ry", formatSvgNumber(eyes.ry));
  runtime.currentEyes = eyes;
  renderEyeMotion(frame);
  browLeft.style.strokeWidth = formatSvgNumber(6.5 * profile.line);
  browRight.style.strokeWidth = formatSvgNumber(6.5 * profile.line);
  breath.style.strokeWidth = formatSvgNumber(3 * profile.line);
  breath.style.opacity = formatSvgNumber(0.18 * profile.breath);

  const faceFramePath = document.querySelector(".face-frame");
  faceFramePath.style.stroke = expression.color;
  faceFramePath.style.fill = colorWash(expression.color, profile.color);
  breath.style.stroke = expression.color;

  if (eventStartedAt !== null) {
    runtime.metrics.firstExpressionMs = performance.now() - eventStartedAt;
  }

  if (name === "speaking") {
    startMouthMotion();
  } else {
    stopMouthMotion();
  }

  renderMetrics();
}

function normalizeMouth(shape) {
  if (typeof shape === "string") {
    return { d: shape };
  }

  return shape || { d: expressions.idle.mouth.d };
}

function applyBrowControls(controls, profile = currentPresenceProfile()) {
  const brows = controls?.brows;
  if (!brows) {
    browLeft.style.transform = "";
    browRight.style.transform = "";
    return;
  }

  const lift = scaleValue(-8 * brows.lift + 2.5 * brows.pinch, profile.gain);
  const pinch = scaleValue(4.8 * brows.pinch, profile.gain);
  const asymmetry = scaleValue(5 * brows.asymmetry, profile.gain);

  browLeft.style.transform = `translate(${formatSvgNumber(-pinch)}px, ${formatSvgNumber(lift - asymmetry)}px)`;
  browRight.style.transform = `translate(${formatSvgNumber(pinch)}px, ${formatSvgNumber(lift + asymmetry)}px)`;
}

function renderMouth(shape, profile = currentPresenceProfile(), frame = runtime.motionOk ? activeFaceFrame() : null) {
  const mouthShape = normalizeMouth(shape);
  const controls = activeFaceControls();
  const mouthControl = frame?.mouth || controls?.mouth;
  const controlOpen = mouthControl ? mouthControl.openness : 0;
  const controlActivity = mouthControl ? mouthControl.activity : 0;
  const controlTension = mouthControl ? mouthControl.tension : 0;
  const controlBeat = mouthControl?.beat || 0;
  const x = scaleValue(mouthShape.x || 0, profile.gain);
  const y = scaleValue((mouthShape.y || 0) + controlTension * 1.4 - controlOpen * 0.9 - controlBeat * 0.45, profile.gain);
  const scaleX = scaleFromNeutral(
    (mouthShape.scaleX || 1) + controlActivity * 0.035 + controlBeat * 0.025 - controlTension * 0.035,
    1,
    profile.gain,
  );
  const scaleY = scaleFromNeutral(
    (mouthShape.scaleY || 1) + controlOpen * 0.52 + controlActivity * 0.06 + controlBeat * 0.18 - controlTension * 0.09,
    1,
    profile.gain,
  );

  mouth.setAttribute("d", mouthShape.d);
  mouthGroup.style.transform = `translate(${formatSvgNumber(x)}px, ${formatSvgNumber(y)}px) scale(${formatSvgNumber(scaleX)}, ${formatSvgNumber(scaleY)})`;
  mouth.style.strokeWidth = formatSvgNumber((mouthShape.width || 7.2) * profile.line);
  mouth.style.opacity = formatSvgNumber(mouthShape.opacity ?? 1);
}

function startMouthMotion() {
  window.clearTimeout(runtime.mouthTimer);
  runtime.mouthTimer = null;

  if (!runtime.motionOk) return;
  if (
    runtime.realtimeOn &&
    (runtime.realtimeAudioActive || runtime.realtimeSpeechActive || runtime.realtimeSpeechQueue.length || runtime.realtimeWordBuffer)
  ) {
    return;
  }

  const step = () => {
    if (runtime.state !== "speaking" || !runtime.speaking) {
      runtime.mouthTimer = null;
      return;
    }

    if (
      runtime.realtimeOn &&
      (runtime.realtimeAudioActive || runtime.realtimeSpeechActive || runtime.realtimeSpeechQueue.length || runtime.realtimeWordBuffer)
    ) {
      runtime.mouthTimer = null;
      return;
    }

    const profile = currentPresenceProfile();
    const levelStep = runtime.presence === "still" ? 2 : 1;
    runtime.mouthBeat = (runtime.mouthBeat + levelStep) % speakingMouths.length;
    renderMouth(speakingMouths[runtime.mouthBeat], profile);

    const cadence = randomBetween(88, 154) / Math.max(profile.micro, 0.5);
    runtime.mouthTimer = window.setTimeout(step, cadence);
  };

  step();
}

function stopMouthMotion() {
  window.clearTimeout(runtime.mouthTimer);
  runtime.mouthTimer = null;
}

function averageFrequencyRange(data, startRatio, endRatio) {
  if (!data?.length) return 0;

  const start = Math.max(1, Math.floor(data.length * startRatio));
  const end = clamp(Math.ceil(data.length * endRatio), start + 1, data.length);
  let sum = 0;

  for (let index = start; index < end; index += 1) {
    sum += data[index] / 255;
  }

  return sum / Math.max(end - start, 1);
}

function estimateRealtimeAudioFeatures() {
  const analyser = runtime.realtimeAudioAnalyser;
  if (!analyser || !runtime.realtimeAudioTimeData || !runtime.realtimeAudioFreqData) return null;

  analyser.getByteTimeDomainData(runtime.realtimeAudioTimeData);
  analyser.getByteFrequencyData(runtime.realtimeAudioFreqData);

  let sumSquares = 0;
  for (const sample of runtime.realtimeAudioTimeData) {
    const centered = (sample - 128) / 128;
    sumSquares += centered * centered;
  }

  const rms = Math.sqrt(sumSquares / runtime.realtimeAudioTimeData.length);
  const floorTarget = rms < runtime.realtimeAudioNoiseFloor * 2.6
    ? rms
    : runtime.realtimeAudioNoiseFloor;
  runtime.realtimeAudioNoiseFloor = clamp(
    runtime.realtimeAudioNoiseFloor * 0.985 + floorTarget * 0.015,
    0.002,
    0.04
  );

  const normalized = clamp((rms - runtime.realtimeAudioNoiseFloor * 1.35) * 9.5, 0, 1);
  const previous = runtime.realtimeAudioLevel;
  const attack = normalized > previous ? 0.62 : 0.24;
  const level = previous + (normalized - previous) * attack;

  const low = averageFrequencyRange(runtime.realtimeAudioFreqData, 0.01, 0.12);
  const mid = averageFrequencyRange(runtime.realtimeAudioFreqData, 0.12, 0.36);
  const high = averageFrequencyRange(runtime.realtimeAudioFreqData, 0.36, 0.78);
  const total = low + mid + high + 0.001;
  const centroid = clamp((mid * 0.52 + high * 0.92 + low * 0.18) / total, 0, 1);
  const sibilance = high / Math.max(mid + low, 0.001);
  const onset = level - runtime.realtimeAudioPreviousLevel;

  runtime.realtimeAudioPreviousLevel = level;
  runtime.realtimeAudioLevel = level;

  return {
    rms,
    level,
    low,
    mid,
    high,
    centroid,
    sibilance,
    onset,
  };
}

function audioDrivenMouthShape(features) {
  const open = clamp(features.level, 0, 1);
  if (open < 0.035) {
    return {
      ...realtimeMouthShapes.rest,
      scaleY: 0.86,
      opacity: 0.92,
    };
  }

  let base = realtimeMouthShapes.open;
  if (features.sibilance > 0.72 && features.centroid > 0.46) {
    base = realtimeMouthShapes.teeth;
  } else if (features.centroid < 0.33 && features.low > features.mid * 0.74) {
    base = realtimeMouthShapes.round;
  } else if (features.centroid > 0.58) {
    base = realtimeMouthShapes.wide;
  } else if (open < 0.18 && features.onset < 0.02) {
    base = realtimeMouthShapes.soft;
  }

  return {
    ...base,
    width: (base.width || 7.2) + open * 0.38,
    y: (base.y || 0) + open * 0.82,
    scaleX: (base.scaleX || 1) + (base === realtimeMouthShapes.wide ? open * 0.1 : -open * 0.03),
    scaleY: (base.scaleY || 1) * (0.72 + open * 0.56),
  };
}

function renderRealtimeAudioPerformance(features) {
  if (!features) return;

  runtime.realtimeAudioActive = features.level > 0.045 || runtime.realtimeAudioActive && features.level > 0.018;

  if (!runtime.realtimeAudioActive) {
    runtime.realtimeAudioEye = { x: 0, y: 0 };
    if (runtime.speaking || runtime.speechPlaying) {
      renderMouth(realtimeMouthShapes.rest);
      renderEyeMotion();
    }
    return;
  }

  ensureRealtimeSpeaking({ allowFallbackMouth: false });
  renderMouth(audioDrivenMouthShape(features));

  const profile = presenceProfiles[runtime.presence] || presenceProfiles.attentive;
  const gain = clamp(profile.micro, 0.2, 1.2);
  const shimmer = runtime.presence === "expressive"
    ? Math.sin(performance.now() / 240) * 0.18 * features.level
    : 0;
  runtime.realtimeAudioEye = {
    x: shimmer * gain,
    y: -features.level * 0.52 * gain,
  };
  renderEyeMotion();
}

function runRealtimeAudioPerformanceLoop(timestamp = performance.now()) {
  if (!runtime.realtimeAudioAnalyser) {
    runtime.realtimeAudioLoop = null;
    return;
  }

  runtime.realtimeAudioFrameCount += 1;
  runtime.realtimeAudioLastFrameAt = timestamp;
  renderRealtimeAudioPerformance(estimateRealtimeAudioFeatures());
  runtime.realtimeAudioLoop = window.requestAnimationFrame(runRealtimeAudioPerformanceLoop);
}

async function startRealtimeAudioPerformance(stream) {
  stopRealtimeAudioPerformance();
  if (!stream || !runtime.motionOk) return false;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;

    if (!runtime.audioContext) {
      runtime.audioContext = new AudioContextClass();
    }

    if (runtime.audioContext.state === "suspended") {
      await runtime.audioContext.resume();
    }

    const source = runtime.audioContext.createMediaStreamSource(stream);
    const analyser = runtime.audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.28;
    analyser.minDecibels = -82;
    analyser.maxDecibels = -12;
    source.connect(analyser);

    runtime.realtimeAudioSource = source;
    runtime.realtimeAudioAnalyser = analyser;
    runtime.realtimeAudioTimeData = new Uint8Array(analyser.fftSize);
    runtime.realtimeAudioFreqData = new Uint8Array(analyser.frequencyBinCount);
    runtime.realtimeAudioActive = false;
    runtime.realtimeAudioLevel = 0;
    runtime.realtimeAudioPreviousLevel = 0;
    runtime.realtimeAudioNoiseFloor = 0.006;
    runtime.realtimeAudioFrameCount = 0;
    runtime.realtimeAudioLastFrameAt = performance.now();
    runtime.realtimeAudioLoop = window.requestAnimationFrame(runRealtimeAudioPerformanceLoop);
    trace("audio pipe");
    renderMetrics();
    return true;
  } catch {
    stopRealtimeAudioPerformance();
    trace("audio pipe fail");
    renderMetrics();
    return false;
  }
}

function stopRealtimeAudioPerformance() {
  if (runtime.realtimeAudioLoop) {
    window.cancelAnimationFrame(runtime.realtimeAudioLoop);
  }

  try {
    runtime.realtimeAudioSource?.disconnect();
  } catch {
    // Already disconnected.
  }

  try {
    runtime.realtimeAudioAnalyser?.disconnect();
  } catch {
    // Already disconnected.
  }

  runtime.realtimeAudioSource = null;
  runtime.realtimeAudioAnalyser = null;
  runtime.realtimeAudioLoop = null;
  runtime.realtimeAudioTimeData = null;
  runtime.realtimeAudioFreqData = null;
  runtime.realtimeAudioActive = false;
  runtime.realtimeAudioLevel = 0;
  runtime.realtimeAudioPreviousLevel = 0;
  runtime.realtimeAudioFrameCount = 0;
  runtime.realtimeAudioLastFrameAt = 0;
  runtime.realtimeAudioEye = { x: 0, y: 0 };
}

function cleanSpeechWord(word) {
  return String(word || "").toLowerCase().replace(/^[^\w']+|[^\w']+$/g, "");
}

function wordPunctuation(word) {
  const match = String(word || "").match(/[.!?,;:]+$/);
  return match ? match[0] : "";
}

function visemeSequenceForWord(word) {
  const clean = cleanSpeechWord(word);
  if (!clean) return ["rest"];

  const sequence = [];
  if (/^[bmp]/.test(clean)) {
    sequence.push("closed");
  } else if (/^(f|v|th)/.test(clean)) {
    sequence.push("teeth");
  }

  if (/(oo|ou|ow|oa|aw|qu|w|r|u)/.test(clean)) {
    sequence.push("round");
  } else if (/(ee|ea|ie|ei|i|y|e$)/.test(clean)) {
    sequence.push("wide");
  } else if (/(a|o|ah|ai|ay)/.test(clean)) {
    sequence.push("open");
  } else {
    sequence.push("soft");
  }

  if (/[bmp]$/.test(clean) && sequence[sequence.length - 1] !== "closed") {
    sequence.push("closed");
  } else if (/(f|v|th)$/.test(clean) && sequence[sequence.length - 1] !== "teeth") {
    sequence.push("teeth");
  }

  if (sequence.length === 1) {
    sequence.push("rest");
  }

  return sequence.slice(0, 3);
}

function realtimeWordDuration(word) {
  const clean = cleanSpeechWord(word);
  const vowelGroups = clean.match(/[aeiouy]+/g) || [];
  const punctuation = wordPunctuation(word);
  const punctuationPause = /[.!?]/.test(punctuation) ? 100 : /[,;:]/.test(punctuation) ? 58 : 0;
  const base = 86 + clean.length * 17 + vowelGroups.length * 24 + punctuationPause;
  const profile = presenceProfiles[runtime.presence] || presenceProfiles.attentive;
  return clamp(base / Math.max(profile.micro, 0.76), 95, 390);
}

function realtimeEyeForWord(word) {
  const clean = cleanSpeechWord(word);
  const punctuation = wordPunctuation(word);
  const profile = presenceProfiles[runtime.presence] || presenceProfiles.attentive;
  const gain = clamp(profile.micro, 0.2, 1.25);

  if (punctuation.includes("?") || /^(what|why|how|who|where|when|can|could|should|would|do|does|is|are)$/.test(clean)) {
    return { x: -1.45 * gain, y: -0.82 * gain };
  }

  if (punctuation.includes("!")) {
    return { x: 0.36 * gain, y: -1.1 * gain };
  }

  if (/[,:;]/.test(punctuation)) {
    return { x: randomBetween(-0.82, 0.82) * gain, y: 0.24 * gain };
  }

  if (clean.length > 8) {
    return { x: 0.76 * gain, y: -0.18 * gain };
  }

  if (runtime.presence === "expressive") {
    return { x: randomBetween(-0.42, 0.42) * gain, y: randomBetween(-0.22, 0.18) * gain };
  }

  return { x: 0, y: 0 };
}

function pulseFaceBlink(closedScale = 0.16, duration = 78) {
  if (!runtime.motionOk || runtime.blinkScale < 1) return;

  runtime.blinkScale = closedScale;
  renderEyeMotion();
  window.setTimeout(() => {
    runtime.blinkScale = 1;
    renderEyeMotion();
  }, duration);
}

function pulseRealtimeBlink() {
  pulseFaceBlink(0.16, 78);
}

function resetRealtimeSpeechPerformance() {
  window.clearTimeout(runtime.realtimeWordFlushTimer);
  window.clearTimeout(runtime.realtimeSpeechTimer);
  window.clearTimeout(runtime.realtimeSpeechFinishTimer);
  runtime.realtimeWordFlushTimer = null;
  runtime.realtimeSpeechTimer = null;
  runtime.realtimeSpeechFinishTimer = null;
  runtime.realtimeWordBuffer = "";
  runtime.realtimeVisibleTranscript = "";
  runtime.realtimeSpeechQueue = [];
  runtime.realtimeSpeechEye = { x: 0, y: 0 };
  runtime.realtimeSpeechActive = false;
  runtime.realtimeSpeechCanStartAt = 0;
  runtime.realtimeAudioSeen = false;
  runtime.realtimeResponseDonePending = false;
  runtime.realtimeDoneMarked = false;
  renderEyeMotion();
}

function stopRealtimeSpeechPerformance() {
  resetRealtimeSpeechPerformance();
  stopMouthMotion();
}

function ensureRealtimeSpeaking(options = {}) {
  runtime.speaking = true;
  runtime.speechPlaying = true;
  sendPresenceEvent(PresenceEvent.SPEECH_START, { source: "realtime" });

  if (runtime.state !== "speaking") {
    setExpression("speaking", null, "realtime");
  }

  if (!options.allowFallbackMouth) {
    stopMouthMotion();
  }
}

function scheduleRealtimeWordFlush() {
  window.clearTimeout(runtime.realtimeWordFlushTimer);
  runtime.realtimeWordFlushTimer = window.setTimeout(() => {
    runtime.realtimeWordFlushTimer = null;
    flushRealtimeWordBuffer();
    scheduleRealtimeSpeechPerformance();
  }, REALTIME_PARTIAL_WORD_FLUSH_MS);
}

function flushRealtimeWordBuffer() {
  const word = runtime.realtimeWordBuffer.trim();
  runtime.realtimeWordBuffer = "";
  if (!word) return false;

  queueRealtimeSpeechWord(word);
  return true;
}

function queueRealtimeSpeechWord(word) {
  const clean = cleanSpeechWord(word);
  if (!clean && !wordPunctuation(word)) return;

  runtime.realtimeSpeechQueue.push({
    word,
    createdAt: performance.now(),
    readyAt: performance.now() + REALTIME_ARTICULATION_DELAY_MS,
    duration: realtimeWordDuration(word),
  });

  if (runtime.realtimeSpeechQueue.length > REALTIME_MAX_WORD_QUEUE) {
    runtime.realtimeSpeechQueue.splice(0, runtime.realtimeSpeechQueue.length - REALTIME_MAX_WORD_QUEUE);
  }
}

function appendRealtimeVisibleWord(word) {
  const display = String(word || "").trim();
  if (!display) return;

  const joinsToPrevious = /^[.!?,;:]/.test(display);
  const separator = runtime.realtimeVisibleTranscript && !joinsToPrevious ? " " : "";
  runtime.realtimeVisibleTranscript = `${runtime.realtimeVisibleTranscript}${separator}${display}`;
  responseText.textContent = runtime.realtimeVisibleTranscript;
}

function driveRealtimeSpeechFromDelta(delta) {
  if (!delta) return;

  const parts = String(delta).match(/\s+|[^\s]+/g) || [];
  for (const part of parts) {
    if (/^\s+$/.test(part)) {
      flushRealtimeWordBuffer();
    } else {
      runtime.realtimeWordBuffer += part;
      if (/[.!?,;:]$/.test(runtime.realtimeWordBuffer)) {
        flushRealtimeWordBuffer();
      }
    }
  }

  if (runtime.realtimeWordBuffer) {
    scheduleRealtimeWordFlush();
  }

  scheduleRealtimeSpeechPerformance();
}

function markRealtimeAudioDelta() {
  if (!runtime.realtimeAudioSeen) {
    runtime.realtimeAudioSeen = true;
    runtime.realtimeSpeechCanStartAt = performance.now() + REALTIME_ARTICULATION_DELAY_MS;
  }
  scheduleRealtimeSpeechPerformance();
}

function scheduleRealtimeSpeechPerformance(delay = 0) {
  if (runtime.realtimeSpeechTimer) return;

  runtime.realtimeSpeechTimer = window.setTimeout(() => {
    runtime.realtimeSpeechTimer = null;
    playNextRealtimeSpeechWord();
  }, delay);
}

function playNextRealtimeSpeechWord() {
  runtime.realtimeSpeechTimer = null;

  if (!runtime.realtimeSpeechQueue.length) {
    runtime.realtimeSpeechActive = false;
    runtime.realtimeSpeechEye = { x: 0, y: 0 };
    renderEyeMotion();
    if (runtime.realtimeResponseDonePending) {
      scheduleRealtimeResponseFinish(140);
    }
    return;
  }

  const next = runtime.realtimeSpeechQueue[0];
  const now = performance.now();
  const maxLeadReached = now - next.createdAt >= REALTIME_TRANSCRIPT_MAX_LEAD_MS;
  const gateAt = runtime.realtimeAudioSeen
    ? Math.max(next.readyAt, runtime.realtimeSpeechCanStartAt)
    : next.createdAt + REALTIME_TRANSCRIPT_MAX_LEAD_MS;

  if (!maxLeadReached && now < gateAt) {
    scheduleRealtimeSpeechPerformance(gateAt - now);
    return;
  }

  runtime.realtimeSpeechQueue.shift();
  renderRealtimeSpeechWord(next);
}

function renderRealtimeSpeechWord(entry) {
  const profile = currentPresenceProfile();
  const visemes = visemeSequenceForWord(entry.word);
  const punctuation = wordPunctuation(entry.word);
  const duration = entry.duration;
  const stepMs = clamp(duration / Math.max(visemes.length, 1), 54, 138);
  const audioDriven = Boolean(runtime.realtimeAudioAnalyser);
  let index = 0;

  ensureRealtimeSpeaking({ allowFallbackMouth: false });
  appendRealtimeVisibleWord(entry.word);
  runtime.realtimeSpeechActive = true;
  runtime.realtimeSpeechEye = realtimeEyeForWord(entry.word);
  renderEyeMotion();

  const renderStep = () => {
    const shapeName = visemes[index] || "rest";
    if (!audioDriven) {
      renderMouth(realtimeMouthShapes[shapeName] || realtimeMouthShapes.soft, profile);
    }
    index += 1;

    if (index < visemes.length) {
      runtime.realtimeSpeechTimer = window.setTimeout(renderStep, stepMs);
      return;
    }

    const pause = /[.!?]/.test(punctuation) ? 108 : /[,;:]/.test(punctuation) ? 64 : 24;
    if (/[.!?]/.test(punctuation)) {
      pulseRealtimeBlink();
    }

    runtime.realtimeSpeechTimer = window.setTimeout(() => {
      if (!audioDriven) {
        renderMouth(realtimeMouthShapes.rest, profile);
      }
      runtime.realtimeSpeechActive = false;
      runtime.realtimeSpeechEye = { x: 0, y: 0 };
      renderEyeMotion();
      runtime.realtimeSpeechTimer = null;
      playNextRealtimeSpeechWord();
    }, pause);
  };

  renderStep();
}

function scheduleRealtimeResponseFinish(delay = 180) {
  window.clearTimeout(runtime.realtimeSpeechFinishTimer);
  runtime.realtimeSpeechFinishTimer = window.setTimeout(() => {
    runtime.realtimeSpeechFinishTimer = null;
    finishRealtimeResponse();
  }, delay);
}

function finishRealtimeResponse() {
  if (!runtime.realtimeResponseDonePending) return;

  stopRealtimeSpeechPerformance();
  if (runtime.realtimeTranscript.trim()) {
    responseText.textContent = runtime.realtimeTranscript.trim();
  }
  runtime.speaking = false;
  runtime.speechPlaying = false;
  runtime.realtimeTranscript = "";
  runtime.realtimeVisibleTranscript = "";
  runtime.responseLane = "realtime-live";
  sendPresenceEvent(PresenceEvent.VOICE_WAITING, { source: "realtime" });
  setExpression("listening", null, "realtime");
  renderMetrics();
}

function scaleEyes(eyes, gain) {
  const neutral = expressions.idle.eyes;
  return {
    rx: scaleFromNeutral(eyes.rx, neutral.rx, gain),
    ry: scaleFromNeutral(eyes.ry, neutral.ry, gain),
    lx: scaleValue(eyes.lx, gain),
    ly: scaleValue(eyes.ly, gain),
    rxp: scaleValue(eyes.rxp, gain),
    ryp: scaleValue(eyes.ryp, gain),
    scaleY: scaleFromNeutral(eyes.scaleY, neutral.scaleY, gain),
  };
}

function blinkPhaseScale(frameBlink) {
  if (!frameBlink) return 1;
  const phase = clamp(frameBlink.phase, 0, 1);
  const closure = phase < 0.08
    ? 1 - Math.abs(phase - 0.04) / 0.04
    : phase > 0.92
      ? (phase - 0.92) / 0.08
      : 0;
  return clamp(1 - closure * (frameBlink.pulse ? 0.36 : 0.18), 0.08, 1);
}

function renderEyeMotion(frame = runtime.motionOk ? activeFaceFrame() : null) {
  const eyes = runtime.currentEyes;
  if (!eyes) return;

  const controls = activeFaceControls();
  const controllerGaze = runtime.motionOk ? (frame?.gaze || controls?.gaze) : null;
  const controllerBlink = runtime.motionOk ? (frame?.blink || controls?.blink) : null;
  const blink = runtime.motionOk ? runtime.blinkScale : 1;
  const microX = runtime.motionOk ? runtime.microGaze.x : 0;
  const microY = runtime.motionOk ? runtime.microGaze.y : 0;
  const visionX = runtime.motionOk ? runtime.visionGaze.x : 0;
  const visionY = runtime.motionOk ? runtime.visionGaze.y : 0;
  const speechX = runtime.motionOk ? runtime.realtimeSpeechEye.x : 0;
  const speechY = runtime.motionOk ? runtime.realtimeSpeechEye.y : 0;
  const audioX = runtime.motionOk ? runtime.realtimeAudioEye.x : 0;
  const audioY = runtime.motionOk ? runtime.realtimeAudioEye.y : 0;
  const driftX = frame?.gaze ? frame.gaze.driftX * 4.2 : 0;
  const driftY = frame?.gaze ? frame.gaze.driftY * 3.2 : 0;
  const gazeX = controllerGaze ? controllerGaze.x * 9.6 + driftX : 0;
  const gazeY = controllerGaze ? controllerGaze.y * 6.2 + driftY : 0;
  const blinkOpenness = controllerBlink ? controllerBlink.openness : 1;
  const scaleY = clamp(eyes.scaleY * blink * blinkOpenness * blinkPhaseScale(frame?.blink), 0.08, 1.4);
  const trackingActive = Math.abs(visionX) + Math.abs(visionY) > 0.1;
  const speechShare = trackingActive ? 0.34 : 1;
  const focus = controllerGaze ? controllerGaze.focus : 0.62;
  const eyeShare = trackingActive ? 0.72 : clamp(0.16 + focus * 0.16, 0.18, 0.32);
  const glintShare = trackingActive ? 0.26 : clamp(0.62 + focus * 0.34, 0.72, 0.9);
  const leftLook = {
    x: eyes.lx + gazeX + microX + visionX + (speechX + audioX) * speechShare,
    y: eyes.ly + gazeY + microY + visionY + (speechY + audioY) * speechShare,
  };
  const rightLook = {
    x: eyes.rxp + gazeX + microX + visionX + (speechX + audioX) * speechShare,
    y: eyes.ryp + gazeY + microY + visionY + (speechY + audioY) * speechShare,
  };

  eyeLeftGroup.style.transform = `translate(${formatSvgNumber(clamp(leftLook.x * eyeShare, -8.8, 8.8))}px, ${formatSvgNumber(clamp(leftLook.y * eyeShare, -5.2, 5.2))}px) scaleY(${formatSvgNumber(scaleY)})`;
  eyeRightGroup.style.transform = `translate(${formatSvgNumber(clamp(rightLook.x * eyeShare, -8.8, 8.8))}px, ${formatSvgNumber(clamp(rightLook.y * eyeShare, -5.2, 5.2))}px) scaleY(${formatSvgNumber(scaleY)})`;
  pupilLeft.style.transform = `translate(${formatSvgNumber(clamp(leftLook.x * glintShare, -4.2, 4.2))}px, ${formatSvgNumber(clamp(leftLook.y * glintShare, -2.8, 2.8))}px)`;
  pupilRight.style.transform = `translate(${formatSvgNumber(clamp(rightLook.x * glintShare, -4.2, 4.2))}px, ${formatSvgNumber(clamp(rightLook.y * glintShare, -2.8, 2.8))}px)`;
}

function renderFaceFrameMotion() {
  if (!runtime.motionOk) return;
  const frame = updateFaceFrameReport()?.frame;
  if (!frame) return;

  const profile = currentPresenceProfile();
  const expression = expressions[runtime.state] || expressions.idle;
  const postureTilt = (frame.posture.turn * 12) - (frame.posture.lean * 4) + (frame.motion.recovery * 1.5);
  const tilt = scaleValue((expressionTilts[runtime.state] || 0) + postureTilt, profile.tilt);
  const frameOffsetX = scaleValue(frame.motion.offsetX * 8.4, profile.tilt);
  const frameOffsetY = scaleValue(frame.motion.offsetY * 5.8, profile.tilt);
  const breathFactor = clamp(
    0.84 + frame.motion.energy * 0.38 + frame.motion.anticipation * 0.12 + frame.posture.breath * 0.16 - frame.motion.recovery * 0.08,
    0.7,
    1.38,
  );

  faceShell.dataset.controllerFrame = frameSummary();
  applyControllerCoherenceDataset(faceShell);
  applyControllerDecisionTraceDataset(faceShell);
  applyControllerDecisionTraceDataset(faceSvg);
  faceShell.style.setProperty("--face-tilt", `${tilt.toFixed(2)}deg`);
  faceShell.style.setProperty("--face-offset-x", `${frameOffsetX.toFixed(2)}px`);
  faceShell.style.setProperty("--face-offset-y", `${frameOffsetY.toFixed(2)}px`);
  faceShell.style.setProperty("--breath-duration", `${(4.8 / (profile.breath * breathFactor)).toFixed(2)}s`);
  applyBrowControls({ brows: frame.brows }, profile);
  renderEyeMotion(frame);
  if (runtime.state !== "speaking" && !runtime.speechPlaying && !runtime.realtimeAudioActive && !runtime.realtimeSpeechActive) {
    renderMouth(expression.mouth, profile, frame);
  }
}

function startFaceFrameLoop() {
  if (!runtime.motionOk || runtime.faceFrameAnimation) return;

  const step = () => {
    runtime.faceFrameAnimation = null;
    renderFaceFrameMotion();
    if (runtime.motionOk) {
      runtime.faceFrameAnimation = window.requestAnimationFrame(step);
    }
  };

  runtime.faceFrameAnimation = window.requestAnimationFrame(step);
}

function startMicroPresence() {
  if (!runtime.motionOk) return;
  scheduleMicroGaze(650);
  scheduleBlink();
  startFaceFrameLoop();
}

function scheduleMicroGaze(delay = null) {
  window.clearTimeout(runtime.microTimer);
  if (!runtime.motionOk) return;

  const profile = currentPresenceProfile();
  const controls = activeFaceControls();
  const motion = controls?.motion;
  const wait = delay ?? randomBetween(1300, 2600) / Math.max(profile.micro * (0.7 + (motion?.energy ?? 0.2)), 0.18);
  runtime.microTimer = window.setTimeout(() => {
    const active = runtime.state !== "speaking" && !runtime.speechPlaying;
    const range = active ? profile.micro * clamp((motion?.drift ?? 0.18) * 4.2, 0.36, 1.6) : 0;
    runtime.microGaze = {
      x: randomBetween(-1.15, 1.15) * range,
      y: randomBetween(-0.65, 0.65) * range,
    };
    renderEyeMotion();
    scheduleMicroGaze();
  }, wait);
}

function scheduleBlink() {
  window.clearTimeout(runtime.blinkTimer);
  if (!runtime.motionOk) return;

  const profile = currentPresenceProfile();
  const controls = activeFaceControls();
  const blinkControl = controls?.blink;
  const profileCadence = (profile.blinkMin + profile.blinkMax) / 2;
  const controllerCadence = blinkControl ? blinkControl.cadenceMs * (profileCadence / 4600) : null;
  const wait = controllerCadence
    ? randomBetween(controllerCadence * 0.78, controllerCadence * 1.22)
    : randomBetween(profile.blinkMin, profile.blinkMax);
  runtime.blinkTimer = window.setTimeout(() => {
    if (runtime.state === "speaking" || runtime.speechPlaying) {
      scheduleBlink();
      return;
    }

    runtime.blinkScale = blinkControl?.pulse ? 0.06 : 0.11;
    renderEyeMotion();
    window.setTimeout(() => {
      runtime.blinkScale = 1;
      renderEyeMotion();
      scheduleBlink();
    }, Math.max(64, (blinkControl?.pulse ? 82 : 104) / Math.max(profile.micro, 0.5)));
  }, wait);
}

function scaleFromNeutral(value, neutral, gain) {
  return neutral + (value - neutral) * gain;
}

function scaleValue(value, gain) {
  return value * gain;
}

function formatSvgNumber(value) {
  return String(Number(value.toFixed(3)));
}

function colorWash(color, gain = 1) {
  const washes = {
    "#171717": [255, 255, 255, 0.36],
    "#315e8a": [49, 94, 138, 0.045],
    "#2f7a67": [47, 122, 103, 0.05],
    "#b66858": [182, 104, 88, 0.055],
    "#6a5a8f": [106, 90, 143, 0.045],
  };
  const [red, green, blue, alpha] = washes[color] || washes["#171717"];
  return `rgba(${red}, ${green}, ${blue}, ${clamp(alpha * gain, 0.015, 0.12)})`;
}

// Local reflex sensing: deterministic body-language signals, not tone inference.
function analyzeText(text, previousText, previousInputAt = runtime.lastInputAt, options = {}) {
  const started = performance.now();
  const record = options.record !== false;
  const clean = text.trim();
  const lower = clean.toLowerCase();
  const words = clean.match(/\b[\w']+\b/g) || [];
  const charDelta = text.length - previousText.length;
  const deleted = charDelta < 0;
  const inserted = charDelta > 0;
  const inputGapMs = previousInputAt ? started - previousInputAt : null;
  const fastCadence = inputGapMs !== null && inputGapMs < 110 && inserted;
  const slowCadence = inputGapMs !== null && inputGapMs > 420;
  const question = /\?$/.test(clean) || /^(what|why|how|should|could|can|would|do|does|is|are)\b/.test(lower);
  const terminal = /[.!?]$/.test(clean);
  const trailingConnector = /\b(and|or|but|with|to|for|of|the|a|an|because|when|while|that)$/i.test(clean);
  const hedge = /\b(maybe|not sure|i think|could|should|might|wonder|unsure|possibly|probably)\b/.test(lower);
  const intensity = (clean.match(/[!?]/g) || []).length + (clean.match(/\b(very|really|super|extremely)\b/g) || []).length;
  const revision = deleted || charDelta < -2;

  let attention = clamp(0.2 + words.length * 0.035 + (inserted ? 0.08 : 0) + (question ? 0.12 : 0) + (revision ? 0.16 : 0), 0, 0.96);
  let arousal = clamp((fastCadence ? 0.18 : 0) + (revision ? 0.26 : 0) + (question ? 0.12 : 0) + (hedge ? 0.12 : 0) + intensity * 0.08, 0, 0.9);
  let completion = clamp((terminal ? 0.72 : 0.16) + words.length * 0.028 + (question ? 0.1 : 0) - (trailingConnector ? 0.36 : 0) - (hedge ? 0.12 : 0), 0, 0.96);

  if (!clean) {
    attention = 0;
    arousal = 0;
    completion = 0;
  }

  const features = {
    text,
    clean,
    words,
    charDelta,
    deleted,
    inserted,
    revision,
    inputGapMs,
    fastCadence,
    slowCadence,
    question,
    terminal,
    trailingConnector,
    hedge,
    intensity,
    attention,
    arousal,
    completion,
  };

  if (record) {
    runtime.metrics.localReadMs = performance.now() - started;
    runtime.metrics.attention = attention;
    runtime.metrics.arousal = arousal;
    runtime.metrics.completion = completion;
    runtime.lastFeatures = features;
  }
  return features;
}

function chooseImmediateState(features) {
  if (!features.clean) return "idle";
  if (features.revision) return "uncertain";
  if (features.trailingConnector) return "listening";
  if (features.question) return "curious";
  if (features.terminal && features.completion > 0.72) return "ready";
  if (features.slowCadence || features.hedge) return "thinking";
  return "reading";
}

function onInput() {
  const started = performance.now();
  syncComposerInput();
  const interruptedTurn = cancelActiveTurn();
  if (interruptedTurn) {
    runtime.cancelMarkerUntil = started + 1400;
  }
  runtime.events += 1;
  const text = input.value;
  sendPresenceEvent(PresenceEvent.USER_INPUT, { text, source: "composer" });
  const features = analyzeText(text, runtime.lastText, runtime.lastInputAt);
  features.eventStartedAt = started;
  runtime.lastInputAt = started;

  if (features.deleted) {
    runtime.deletes += 1;
  }

  runtime.lastText = text;
  runtime.responseLane = "typing";
  cancelResponsePrefetch();
  runtime.trace = [];
  runtime.metrics.firstTokenMs = null;
  runtime.metrics.firstAudioMs = null;
  runtime.metrics.streamOpenMs = null;
  runtime.metrics.speculationMs = null;
  runtime.metrics.responseMs = null;
  responseText.textContent = "";
  trace(`input #${runtime.events}`);
  if (interruptedTurn || started < runtime.cancelMarkerUntil) {
    trace("cancel old");
  }

  const immediateState = chooseImmediateState(features);
  if (interruptedTurn || started < runtime.cancelMarkerUntil) {
    sendPresenceEvent(PresenceEvent.INTERRUPT, { text, source: "composer" });
  } else {
    sendPresenceEvent(PresenceEvent.LOCAL_READ, {
      text,
      features,
      completion: features.completion,
      ready: immediateState === "ready",
    });
  }
  setExpression(immediateState, started, "local-reflex");
  trace("local", runtime.metrics.firstExpressionMs);

  window.clearTimeout(runtime.pauseTimer);
  runtime.pauseTimer = window.setTimeout(() => {
    if (!input.value.trim() || runtime.speaking) return;
    const latest = runtime.lastFeatures || features;
    const next = latest.completion > 0.68 ? "ready" : "thinking";
    sendPresenceEvent(PresenceEvent.USER_PAUSE, {
      text: input.value,
      features: latest,
      completion: latest.completion,
      ready: next === "ready",
    });
    setExpression(next, null, "local-pause");
  }, 520);

  scheduleSpeculation(text, features);
  renderMetrics();
}

function scheduleSpeculation(text, features) {
  if (runtime.speculationTimer) {
    window.clearTimeout(runtime.speculationTimer);
    runtime.staleJobs += 1;
  }

  if (runtime.speculationAbort) {
    runtime.speculationAbort.abort();
    runtime.speculationAbort = null;
    runtime.staleJobs += 1;
  }

  runtime.prepared = null;

  if (!text.trim()) {
    sendPresenceEvent(PresenceEvent.RESET, { text });
    trace("spec idle");
    return;
  }

  const id = runtime.speculationId + 1;
  runtime.speculationId = id;
  trace(`spec #${id}`);
  sendPresenceEvent(PresenceEvent.SPECULATION_START, { text, features });
  const delay = clamp(150 + text.length * 4, 180, 520);

  runtime.speculationTimer = window.setTimeout(async () => {
    if (id !== runtime.speculationId) {
      runtime.staleJobs += 1;
      return;
    }

    if (runtime.apiAvailable) {
      const apiPlan = await requestSpeculation(id, text, features);
      if (apiPlan) {
        runtime.prepared = apiPlan;
        sendPresenceEvent(PresenceEvent.SPECULATION_READY, {
          text,
          features,
          completion: apiPlan.completion,
          ready: apiPlan.completion > 0.72,
        });
        if (apiPlan.completion > 0.72 && !runtime.speaking) {
          setExpression("ready", null, "openai-speculation");
        } else if (apiPlan.expression && !runtime.speaking) {
            setExpression(apiPlan.expression, null, "openai-speculation");
        }
        maybeStartResponsePrefetch(text, features, apiPlan);
        renderMetrics();
        return;
      }
    }

    runtime.prepared = localPlan(text, features);
    trace("spec local");
    sendPresenceEvent(PresenceEvent.SPECULATION_READY, {
      text,
      features,
      completion: features.completion,
      ready: features.completion > 0.72,
    });

    if (features.completion > 0.72 && !runtime.speaking) {
      setExpression("ready", null, "local-reflex");
    }

    renderMetrics();
  }, delay);
}

async function requestSpeculation(id, text, features) {
  const controller = new AbortController();
  runtime.speculationAbort = controller;
  const requestStartedAt = performance.now();
  trace(`spec #${id} send`);
  renderMetrics();

  try {
    const response = await fetch("/api/speculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, features }),
      signal: controller.signal,
    });

    if (id !== runtime.speculationId) return null;
    if (!response.ok) throw new Error(`Speculation failed ${response.status}`);

    const plan = await response.json();
    const speculationMs = performance.now() - (features.eventStartedAt || requestStartedAt);
    runtime.metrics.speculationMs = speculationMs;
    recordSample("speculation", speculationMs);
    trace("spec", speculationMs);
    runtime.metrics.attention = clamp(features.attention, 0, 1);
    runtime.metrics.arousal = clamp(features.arousal, 0, 1);
    runtime.metrics.completion = clamp(Number(plan.completion ?? features.completion), 0, 1);

    return {
      text,
      at: performance.now(),
      intent: plan.intent || labelIntent(features),
      tone: plan.tone || labelPosture(features),
      completion: runtime.metrics.completion,
      presenceState: PresenceCore.normalizePresenceState(
        plan.presenceState,
        runtime.metrics.completion > 0.72 ? PresenceState.READY : PresenceState.THINKING,
      ),
      expression: plan.expression || chooseImmediateState(features),
      confidence: clamp(Number(plan.confidence ?? 0.4), 0, 1),
      prepared: plan.prepared || "response direction",
      source: "openai",
    };
  } catch (error) {
    if (error.name !== "AbortError") {
      runtime.apiLabel = "fallback";
      trace(`spec #${id} fail`);
    }
    return null;
  } finally {
    if (runtime.speculationAbort === controller) {
      runtime.speculationAbort = null;
    }
  }
}

function localPlan(text, features) {
  return {
    text,
    at: performance.now(),
    intent: labelIntent(features),
    tone: labelPosture(features),
    completion: features.completion,
    presenceState: features.completion > 0.72 ? PresenceState.READY : PresenceState.READING,
    expression: chooseImmediateState(features),
    prepared: "local reflex fallback",
    source: "local-reflex",
  };
}

function preparedForText(text) {
  const plan = runtime.prepared;
  if (!plan || plan.text !== text || plan.source !== "openai") return null;

  return preparedPayload(plan);
}

function preparedPayload(plan) {
  return {
    intent: plan.intent,
    tone: plan.tone,
    completion: plan.completion,
    presenceState: plan.presenceState,
    expression: plan.expression,
    confidence: plan.confidence,
    prepared: plan.prepared,
  };
}

function labelIntent(features) {
  if (!features.clean) return "idle";
  if (features.question) return "question";
  if (features.trailingConnector) return "forming";
  if (features.completion > 0.7) return "ask";
  return "thought";
}

function labelPosture(features) {
  if (features.revision) return "repair";
  if (features.hedge || features.slowCadence) return "hesitating";
  if (features.question) return "inquiring";
  if (features.trailingConnector) return "forming";
  if (features.terminal) return "settled";
  return "steady";
}

function makeResponse(text) {
  const features = analyzeText(text, text, runtime.lastInputAt, { record: false });
  const plan = runtime.prepared && runtime.prepared.text === text ? runtime.prepared : null;
  const intent = plan ? plan.intent : labelIntent(features);
  const posture = plan ? plan.tone : labelPosture(features);

  if (intent === "question") {
    return "I was already tracking the shape of that question while you typed. The useful next test is whether the face can show attention immediately without interrupting.";
  }

  if (posture === "repair") {
    return "I noticed the revision and kept the face in a light repair posture while waiting for the thought to settle.";
  }

  if (posture === "hesitating") {
    return "I treated that as still forming: the face can hold attention without claiming it understands too early.";
  }

  if (posture === "forming") {
    return "I kept the face listening because the sentence shape looked unfinished.";
  }

  return "I followed the leading edge while you typed: local reflexes moved first, then the slower lane handled interpretation.";
}

function streamText(text, sendStartedAt, onDone = null) {
  responseText.textContent = "";
  runtime.responseStreaming = true;
  sendPresenceEvent(PresenceEvent.STREAM_OPEN, { source: "local-fallback" });
  const turnId = runtime.activeTurnId;
  const tokens = text.split(/(\s+)/);
  let index = 0;

  const tick = () => {
    if (turnId !== runtime.activeTurnId) return;

    if (index === 0) {
      sendPresenceEvent(PresenceEvent.TOKEN, { source: "local-fallback" });
      runtime.metrics.firstTokenMs = performance.now() - sendStartedAt;
      recordSample("firstToken", runtime.metrics.firstTokenMs);
      trace("token", runtime.metrics.firstTokenMs);
      renderMetrics();
    }

    responseText.textContent += tokens[index] || "";
    index += 1;

    if (index < tokens.length) {
      runtime.localStreamTimer = window.setTimeout(tick, 24);
    } else {
      runtime.localStreamTimer = null;
      markResponseComplete(sendStartedAt);
      runtime.responseStreaming = false;
      onDone?.();
    }
  };

  tick();
}

function markResponseComplete(sendStartedAt, responseMs = performance.now() - sendStartedAt) {
  runtime.metrics.responseMs = responseMs;
  runtime.metrics.turns += 1;
  recordSample("response", responseMs);
  trace("done", responseMs);
}

function finishTextResponse() {
  runtime.speaking = false;
  sendPresenceEvent(PresenceEvent.RESPONSE_COMPLETE, { source: "text-response" });
  setExpression("ready", null, "response-ready");
  maybeResumeMicAfterResponse();
  renderMetrics();
}

function revealFullResponseWithSpeech(text, sendStartedAt, responseMs = performance.now() - sendStartedAt) {
  responseText.textContent = "";
  runtime.responseStreaming = false;
  markResponseComplete(sendStartedAt, responseMs);
  enqueueCompletedSpeech(text, sendStartedAt, true);

  if (!runtime.speechBusy && !runtime.speechQueue.length && !runtime.speechPlaying) {
    responseText.textContent = text;
    runtime.speaking = false;
    sendPresenceEvent(PresenceEvent.RESPONSE_COMPLETE, { source: "speech-response-empty" });
    setExpression("ready", null, "response-ready");
    maybeResumeMicAfterResponse();
  }
}

function hasActiveTurnWork() {
  return Boolean(
    runtime.responseAbort ||
      runtime.responseStreaming ||
      runtime.localStreamTimer ||
      runtime.speaking ||
      runtime.speechBusy ||
      runtime.speechPlaying ||
      runtime.speechQueue.length ||
      runtime.activeAudio
  );
}

function cancelActiveTurn() {
  const hadWork = hasActiveTurnWork();
  if (!hadWork) return false;

  runtime.activeTurnId += 1;
  runtime.staleJobs += 1;

  if (runtime.responseAbort) {
    runtime.responseAbort.abort();
    runtime.responseAbort = null;
  }

  if (runtime.localStreamTimer) {
    window.clearTimeout(runtime.localStreamTimer);
    runtime.localStreamTimer = null;
  }

  runtime.responseStreaming = false;
  runtime.speaking = false;
  cancelSpeechPlayback();
  sendPresenceEvent(PresenceEvent.INTERRUPT, { source: "cancel-active-turn" });
  return true;
}

function cancelResponsePrefetch() {
  if (!runtime.prefetch) return;

  if (runtime.prefetch.promise && !runtime.prefetch.result) {
    runtime.staleJobs += 1;
  }

  if (runtime.prefetch.abort) {
    runtime.prefetch.abort.abort();
  }

  runtime.prefetch = null;
}

function matchingResponsePrefetch(text) {
  if (!runtime.prefetch || runtime.prefetch.text !== text) return null;
  return runtime.prefetch;
}

function featuresForSubmit(text) {
  if (runtime.lastFeatures && runtime.lastText.trim() === text) {
    return runtime.lastFeatures;
  }

  return analyzeText(text, text, runtime.lastInputAt, { record: false });
}

function clearSubmittedComposer() {
  input.value = "";
  runtime.lastText = "";
  runtime.lastFeatures = null;
  runtime.lastInputAt = 0;
  syncComposerInput();
  input.focus({ preventScroll: true });
}

function maybeStartResponsePrefetch(text, features, plan) {
  if (!runtime.apiAvailable || runtime.speaking || runtime.responseStreaming) return;
  if (!text.trim() || text.trim().length < 12) return;
  if (plan.source !== "openai") return;
  if (plan.completion < 0.82 && !(features.terminal && plan.completion > 0.66)) return;
  if (plan.confidence < 0.35) return;
  if (runtime.prefetch?.text === text) return;

  cancelResponsePrefetch();

  const controller = new AbortController();
  const prefetch = {
    text,
    abort: controller,
    result: null,
    promise: null,
    startedAt: performance.now(),
  };

  runtime.prefetch = prefetch;
  runtime.responseLane = "prefetching";
  trace("prefetch");
  renderMetrics();

  prefetch.promise = fetchPreparedResponse(text, features, preparedPayload(plan), controller.signal)
    .then((result) => {
      if (runtime.prefetch !== prefetch) return null;
      prefetch.result = result;
      runtime.responseLane = "prefetch-ready";
      trace("prefetch ready", result.responseMs);
      renderMetrics();
      return result;
    })
    .catch((error) => {
      if (runtime.prefetch !== prefetch || error.name === "AbortError") return null;
      runtime.prefetch = null;
      trace("prefetch fail");
      renderMetrics();
      return null;
    });
}

async function fetchPreparedResponse(text, features, prepared, signal) {
  const startedAt = performance.now();
  const response = await fetch("/api/respond", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, features, prepared }),
    signal,
  });

  const streamOpenMs = performance.now() - startedAt;
  if (!response.ok || !response.body) throw new Error(`Prefetch failed ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let firstTokenMs = null;
  let preparedAck = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || "";

    for (const block of blocks) {
      const event = parseSseBlock(block);
      if (event.event === "meta") {
        const payload = JSON.parse(event.data);
        preparedAck = Boolean(payload.prepared);
      } else if (event.event === "token") {
        const payload = JSON.parse(event.data);
        const delta = payload.delta || "";
        if (delta && firstTokenMs === null) {
          firstTokenMs = performance.now() - startedAt;
        }
        fullText += delta;
      } else if (event.event === "error") {
        throw new Error(event.data);
      }
    }
  }

  if (!fullText.trim()) throw new Error("Prefetch returned no text");

  return {
    text: fullText,
    streamOpenMs,
    firstTokenMs,
    responseMs: performance.now() - startedAt,
    preparedAck,
  };
}

async function useResponsePrefetch(prefetch, text, sendStartedAt) {
  if (!prefetch || prefetch.text !== text) return false;

  const turnId = runtime.activeTurnId;
  runtime.responseLane = prefetch.result ? "prefetch-hit" : "prefetch-wait";
  trace(prefetch.result ? "prefetch hit" : "prefetch wait");
  renderMetrics();

  const result = prefetch.result || (await prefetch.promise);
  if (turnId !== runtime.activeTurnId) return true;
  if (prefetch !== runtime.prefetch || !result || text !== prefetch.text) return false;
  if (prefetch.abort) {
    prefetch.abort = null;
  }
  runtime.prefetch = null;

  runtime.metrics.streamOpenMs = 0;
  if (result.preparedAck) {
    trace("prep ack");
  }
  runtime.responseLane = "prefetch-hit";
  trace("prefetch use");
  if (runtime.speakerOn) {
    revealFullResponseWithSpeech(result.text, sendStartedAt, result.responseMs);
  } else {
    streamText(result.text, sendStartedAt, finishTextResponse);
  }
  renderMetrics();
  return true;
}

function enqueueCompletedSpeech(fullText, sendStartedAt, final = false) {
  if (!runtime.speakerOn) return false;

  let queued = false;
  while (true) {
    const segment = nextSpeechSegment(fullText, final);
    if (!segment) break;
    runtime.speechCursor += segment.advance;
    enqueueSpeechSegment(segment.text, sendStartedAt);
    queued = true;
  }
  return queued;
}

function nextSpeechSegment(fullText, final = false) {
  let start = runtime.speechCursor;
  while (start < fullText.length && /\s/.test(fullText[start])) {
    start += 1;
  }

  const remaining = fullText.slice(start);
  if (!remaining.trim()) return null;

  const sentence = remaining.match(/^(.{2,280}?[.!?])(?=\s|$)/s);
  if (sentence) {
    return {
      text: sentence[1].trim(),
      advance: start - runtime.speechCursor + sentence[1].length,
    };
  }

  if (!final) return null;

  return {
    text: remaining.trim(),
    advance: fullText.length - runtime.speechCursor,
  };
}

function enqueueSpeechSegment(text, sendStartedAt) {
  const clean = text.trim();
  if (!clean) return;

  const firstSegment = !runtime.speechStartedForTurn;
  runtime.speechStartedForTurn = true;
  runtime.speechQueue.push({
    id: runtime.speechSegmentId + 1,
    text: clean,
    sendStartedAt,
    turnId: runtime.activeTurnId,
  });
  runtime.speechSegmentId += 1;
  trace(firstSegment ? "tts early" : "tts next");
  playNextSpeechSegment();
  renderMetrics();
}

function playNextSpeechSegment() {
  if (!runtime.speakerOn || runtime.speechBusy || !runtime.speechQueue.length) return;

  const segment = runtime.speechQueue.shift();
  if (segment.turnId !== runtime.activeTurnId) {
    playNextSpeechSegment();
    return;
  }

  runtime.speechBusy = true;
  trace("tts req");
  renderMetrics();

  if (runtime.apiAvailable) {
    speakWithOpenAI(segment).then((didPlay) => {
      if (!didPlay) {
        speakWithBrowser(segment);
      }
    });
    return;
  }

  speakWithBrowser(segment);
}

function markAudioStarted(segment) {
  runtime.speaking = true;
  runtime.speechPlaying = true;
  sendPresenceEvent(PresenceEvent.SPEECH_START, { source: "speech", text: segment.text });
  if (runtime.metrics.firstAudioMs === null) {
    runtime.metrics.firstAudioMs = performance.now() - segment.sendStartedAt;
    recordSample("firstAudio", runtime.metrics.firstAudioMs);
    trace("audio", runtime.metrics.firstAudioMs);
  }
  startSyncedTranscript(segment);
  setExpression("speaking", null, "response-speaking");
}

function finishSpeechSegment(url = null, requestId = null, segment = null) {
  const turnId = segment ? segment.turnId : runtime.activeTurnId;
  if (url) {
    cleanupActiveAudio(url, runtime.activeAudioUrl === url ? runtime.activeAudio : null);
  }

  if (turnId !== runtime.activeTurnId) return;
  if (requestId !== null && requestId !== runtime.speechRequestId) return;

  if (segment) {
    finishSyncedTranscript(segment);
  }

  runtime.speechBusy = false;
  runtime.speechPlaying = false;

  if (runtime.speechQueue.length) {
    playNextSpeechSegment();
    return;
  }

  if (!runtime.responseStreaming) {
    runtime.speaking = false;
    sendPresenceEvent(PresenceEvent.SPEECH_END, { source: "speech" });
    setExpression("ready", null, "response-ready");
    maybeResumeMicAfterResponse();
  }

  renderMetrics();
}

function cleanupActiveAudio(url = null, audio = null) {
  const targetAudio = audio || runtime.activeAudio;
  if (targetAudio) {
    targetAudio.onloadedmetadata = null;
    targetAudio.onplaying = null;
    targetAudio.onended = null;
    targetAudio.onerror = null;
    targetAudio.pause();
  }

  if (url) {
    URL.revokeObjectURL(url);
  }

  if (!url || runtime.activeAudioUrl === url) {
    runtime.activeAudioUrl = null;
  }
  if (audio && runtime.activeAudio === audio) {
    runtime.activeAudio = null;
  }
}

function cancelSpeechPlayback() {
  runtime.speechRequestId += 1;
  runtime.speechQueue = [];
  runtime.speechBusy = false;
  runtime.speechPlaying = false;
  runtime.speechStartedForTurn = false;
  runtime.speechCursor = 0;
  runtime.syncedTextSegmentId = null;
  window.clearTimeout(runtime.syncedTextTimer);
  runtime.syncedTextTimer = null;

  if (runtime.activeAudio) {
    cleanupActiveAudio(runtime.activeAudioUrl, runtime.activeAudio);
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  runtime.activeUtterance = null;
}

async function speak(text, sendStartedAt) {
  if (!runtime.speakerOn) {
    runtime.speaking = false;
    sendPresenceEvent(PresenceEvent.RESPONSE_COMPLETE, { source: "speech-disabled" });
    setExpression("ready", null, "response-ready");
    return false;
  }

  enqueueSpeechSegment(text, sendStartedAt);
  return true;
}

function appendTranscriptSegment(text) {
  const current = responseText.textContent;
  const separator = current && !/\s$/.test(current) ? " " : "";
  return `${current}${separator}${text}`;
}

function estimateSpeechDurationMs(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const byWords = (words / 2.6) * 1000;
  const byChars = text.length * 42;
  return clamp(Math.max(byWords, byChars), 720, 7200);
}

function startSyncedTranscript(segment) {
  window.clearTimeout(runtime.syncedTextTimer);
  runtime.syncedTextTimer = null;
  runtime.syncedTextSegmentId = segment.id;

  const pieces = segment.text.match(/\S+\s*/g) || [segment.text];
  const duration = segment.durationMs || estimateSpeechDurationMs(segment.text);
  const interval = clamp(duration / Math.max(pieces.length, 1), 50, 420);
  const baseText = responseText.textContent;
  const separator = baseText && !/\s$/.test(baseText) ? " " : "";
  let index = 0;

  segment.revealBase = `${baseText}${separator}`;
  segment.revealDone = false;

  const tick = () => {
    if (
      segment.turnId !== runtime.activeTurnId ||
      runtime.syncedTextSegmentId !== segment.id
    ) {
      return;
    }

    index += 1;
    responseText.textContent = `${segment.revealBase}${pieces.slice(0, index).join("")}`;

    if (index < pieces.length) {
      runtime.syncedTextTimer = window.setTimeout(tick, interval);
      return;
    }

    segment.revealDone = true;
    runtime.syncedTextTimer = null;
  };

  tick();
}

function finishSyncedTranscript(segment) {
  if (runtime.syncedTextSegmentId === segment.id) {
    window.clearTimeout(runtime.syncedTextTimer);
    runtime.syncedTextTimer = null;
    runtime.syncedTextSegmentId = null;
  }

  if (segment.revealDone) return;

  if (segment.revealBase !== undefined) {
    responseText.textContent = `${segment.revealBase}${segment.text}`;
  } else {
    responseText.textContent = appendTranscriptSegment(segment.text);
  }
  segment.revealDone = true;
}

async function speakWithOpenAI(segment) {
  const requestId = runtime.speechRequestId + 1;
  runtime.speechRequestId = requestId;
  let url = null;
  let audio = null;
  let started = false;

  try {
    const response = await fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: segment.text }),
    });

    if (!response.ok) throw new Error(`Speech failed ${response.status}`);

    const blob = await response.blob();
    if (requestId !== runtime.speechRequestId || segment.turnId !== runtime.activeTurnId) {
      runtime.speechBusy = false;
      return true;
    }

    url = URL.createObjectURL(blob);
    audio = new Audio(url);
    runtime.activeAudio = audio;
    runtime.activeAudioUrl = url;
    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        segment.durationMs = audio.duration * 1000;
      }
    };
    audio.onplaying = () => {
      if (requestId !== runtime.speechRequestId || segment.turnId !== runtime.activeTurnId) return;
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        segment.durationMs = audio.duration * 1000;
      }
      started = true;
      markAudioStarted(segment);
    };
    audio.onended = () => {
      finishSpeechSegment(url, requestId, segment);
    };
    audio.onerror = () => {
      if (!started && requestId === runtime.speechRequestId && segment.turnId === runtime.activeTurnId) {
        cleanupActiveAudio(url, audio);
        runtime.speechBusy = false;
        trace("tts fallback");
        speakWithBrowser(segment);
        return;
      }
      finishSpeechSegment(url, requestId, segment);
    };
    await audio.play();
    return true;
  } catch (error) {
    if (url) {
      cleanupActiveAudio(url, audio);
    }
    runtime.speechBusy = false;
    trace(error?.name === "NotAllowedError" ? "audio blocked" : "tts fail");
    return false;
  }
}

function speakWithBrowser(segment) {
  runtime.speechBusy = true;

  if (!("speechSynthesis" in window)) {
    finishSpeechSegment(null, null, segment);
    return false;
  }

  const utterance = new SpeechSynthesisUtterance(segment.text);
  runtime.activeUtterance = utterance;
  utterance.rate = 1.02;
  utterance.pitch = 1.04;
  utterance.volume = 0.84;
  utterance.onstart = () => {
    if (segment.turnId !== runtime.activeTurnId) return;
    markAudioStarted(segment);
  };
  utterance.onend = () => {
    if (runtime.activeUtterance === utterance) {
      runtime.activeUtterance = null;
    }
    finishSpeechSegment(null, null, segment);
  };
  utterance.onerror = () => {
    if (runtime.activeUtterance === utterance) {
      runtime.activeUtterance = null;
    }
    finishSpeechSegment(null, null, segment);
  };
  window.speechSynthesis.speak(utterance);
  return true;
}

async function onSubmit(event) {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    setExpression("listening", null, "local-reflex");
    input.focus();
    return;
  }

  await submitMessageText(text);
}

async function submitMessageText(text, options = {}) {
  const cleanText = String(text || "").trim();
  if (!cleanText) return false;

  if (runtime.micOn) {
    pauseMicForResponse();
  }

  const started = performance.now();
  const submittedFeatures = featuresForSubmit(cleanText);
  clearSubmittedComposer();
  cancelActiveTurn();
  runtime.activeTurnId += 1;
  cancelSpeechPlayback();
  runtime.speaking = true;
  runtime.responseStreaming = false;
  runtime.responseLane = runtime.apiAvailable ? "openai-pending" : "local-fallback";
  sendPresenceEvent(PresenceEvent.SUBMIT, { text: cleanText, features: submittedFeatures });
  trace(`turn #${runtime.activeTurnId}`);
  trace("send");
  setExpression("thinking", null, "response-pending");
  runtime.metrics.streamOpenMs = null;
  runtime.metrics.firstTokenMs = null;
  runtime.metrics.firstAudioMs = null;
  runtime.metrics.responseMs = null;

  if (runtime.apiAvailable) {
    const prefetch = matchingResponsePrefetch(cleanText);
    if (prefetch && (await useResponsePrefetch(prefetch, cleanText, started))) {
      return true;
    }

    const streamed = await streamApiResponse(cleanText, submittedFeatures, started);
    if (streamed) {
      return true;
    }
  }

  runtime.responseLane = "local-fallback";
  trace("fallback");
  const response = makeResponse(cleanText);
  if (runtime.speakerOn) {
    revealFullResponseWithSpeech(response, started);
  } else {
    streamText(response, started, finishTextResponse);
  }
  renderMetrics();
  return true;
}

async function streamApiResponse(text, features, sendStartedAt) {
  responseText.textContent = "";
  let fullText = "";
  const turnId = runtime.activeTurnId;
  const controller = new AbortController();
  runtime.responseAbort = controller;

  try {
    const prepared = preparedForText(text);
    if (prepared) {
      trace("prep used");
    }

    const response = await fetch("/api/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, features, prepared }),
      signal: controller.signal,
    });

    if (turnId !== runtime.activeTurnId) return true;
    if (!response.ok || !response.body) throw new Error(`Respond failed ${response.status}`);

    runtime.metrics.streamOpenMs = performance.now() - sendStartedAt;
    runtime.responseLane = "openai-stream";
    runtime.responseStreaming = true;
    sendPresenceEvent(PresenceEvent.STREAM_OPEN, { text, source: "openai" });
    trace("open", runtime.metrics.streamOpenMs);
    renderMetrics();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      if (turnId !== runtime.activeTurnId) {
        controller.abort();
        return true;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() || "";

      for (const block of blocks) {
        if (turnId !== runtime.activeTurnId) return true;

        const event = parseSseBlock(block);
        if (event.event === "meta") {
          const payload = JSON.parse(event.data);
          runtime.responseLane = payload.model ? `openai:${payload.model}` : "openai";
          if (payload.prepared) {
            trace("prep ack");
          }
          renderMetrics();
        } else if (event.event === "token") {
          const payload = JSON.parse(event.data);
          const delta = payload.delta || "";
          if (delta && runtime.metrics.firstTokenMs === null) {
            sendPresenceEvent(PresenceEvent.TOKEN, { text, source: "openai" });
            runtime.metrics.firstTokenMs = performance.now() - sendStartedAt;
            recordSample("firstToken", runtime.metrics.firstTokenMs);
            trace("token", runtime.metrics.firstTokenMs);
          }
          fullText += delta;
          if (runtime.speakerOn) {
            enqueueCompletedSpeech(fullText, sendStartedAt);
          } else {
            responseText.textContent = fullText;
          }
          renderMetrics();
        } else if (event.event === "error") {
          throw new Error(event.data);
        }
      }
    }

    if (turnId !== runtime.activeTurnId) return true;
    if (!fullText.trim()) throw new Error("No response text");
    markResponseComplete(sendStartedAt);
    runtime.responseStreaming = false;
    if (runtime.speakerOn) {
      enqueueCompletedSpeech(fullText, sendStartedAt, true);
      if (!runtime.speechBusy && !runtime.speechQueue.length) {
        responseText.textContent = fullText;
        runtime.speaking = false;
        sendPresenceEvent(PresenceEvent.RESPONSE_COMPLETE, { source: "openai-text" });
        setExpression("ready", null, "response-ready");
        maybeResumeMicAfterResponse();
      }
    } else {
      finishTextResponse();
    }
    return true;
  } catch (error) {
    if (controller.signal.aborted || error.name === "AbortError" || turnId !== runtime.activeTurnId) {
      runtime.responseStreaming = false;
      return true;
    }

    runtime.responseStreaming = false;
    runtime.apiLabel = "fallback";
    runtime.responseLane = "local-fallback";
    trace("fallback");
    responseText.textContent = "";
    return false;
  } finally {
    if (runtime.responseAbort === controller) {
      runtime.responseAbort = null;
    }
  }
}

function parseSseBlock(block) {
  const event = { event: "message", data: "" };
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith("event:")) {
      event.event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      event.data += line.slice(5).trim();
    }
  }
  return event;
}

async function runBenchmark() {
  if (runtime.benchmark.running) return;

  runtime.benchmark.running = true;
  runtime.benchmark.summary = "running";
  benchmarkButton.disabled = true;
  benchmarkButton.textContent = "...";
  trace("probe");
  renderMetrics();

  const probeTexts = [
    "maybe because the face should listen first",
    "what should it do when the user changes direction?",
    "answer in one short sentence: should the face breathe before it speaks?",
  ];
  const runs = [];

  try {
    for (const text of probeTexts) {
      runs.push(await runBenchmarkSample(text));
    }

    const local = median(runs.map((run) => run.localMs));
    const speculate = median(runs.map((run) => run.speculateMs));
    const open = median(runs.map((run) => run.streamOpenMs));
    const token = median(runs.map((run) => run.firstTokenMs));
    const response = median(runs.map((run) => run.responseMs));
    runtime.benchmark.summary = [
      `local ${ms(local)}`,
      `spec ${ms(speculate)}`,
      `open ${ms(open)}`,
      `token ${ms(token)}`,
      `done ${ms(response)}`,
    ].join(" / ");
    trace("probe done");
  } catch {
    runtime.benchmark.summary = "probe failed";
    trace("probe fail");
  } finally {
    runtime.benchmark.running = false;
    benchmarkButton.disabled = false;
    benchmarkButton.textContent = "Run";
    renderMetrics();
  }
}

async function runBenchmarkSample(text) {
  const localStartedAt = performance.now();
  const features = analyzeText(text, "", 0, { record: false });
  const localMs = performance.now() - localStartedAt;
  const result = {
    localMs,
    speculateMs: null,
    streamOpenMs: null,
    firstTokenMs: null,
    responseMs: null,
  };

  if (runtime.apiAvailable) {
    const speculateStartedAt = performance.now();
    const speculateResponse = await fetch("/api/speculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, features }),
    });
    if (!speculateResponse.ok) throw new Error("Speculation probe failed");
    await speculateResponse.json();
    result.speculateMs = performance.now() - speculateStartedAt;

    const responseStartedAt = performance.now();
    const response = await fetch("/api/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, features }),
    });
    result.streamOpenMs = performance.now() - responseStartedAt;
    if (!response.ok || !response.body) throw new Error("Response probe failed");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() || "";

      for (const block of blocks) {
        const event = parseSseBlock(block);
        if (event.event === "token") {
          const payload = JSON.parse(event.data);
          if (payload.delta && result.firstTokenMs === null) {
            result.firstTokenMs = performance.now() - responseStartedAt;
          }
        }
      }
    }

    result.responseMs = performance.now() - responseStartedAt;
    return result;
  }

  const fallbackStartedAt = performance.now();
  makeResponse(text);
  result.speculateMs = 0;
  result.streamOpenMs = 0;
  result.firstTokenMs = performance.now() - fallbackStartedAt;
  result.responseMs = result.firstTokenMs;
  return result;
}

function toggleMetrics() {
  const next = metricsPanel.hidden;
  metricsPanel.hidden = !next;
  setPressed(metricsToggle, next);
  renderMetrics();
}

function createSvgElement(tagName, attributes = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, String(value));
  }
  return element;
}

function createControllerFaceSvg(state, controls, options = {}) {
  const expression = expressions[controls.expression] || expressions.idle;
  const profile = currentPresenceProfile();
  const eyes = scaleEyes(expression.eyes, profile.gain);
  const color = expression.color;
  const postureTilt = (controls.posture.turn * 12) - (controls.posture.lean * 4) + (controls.motion.recovery * 1.5);
  const tilt = scaleValue((expressionTilts[controls.expression] || 0) + postureTilt, profile.tilt);
  const offsetX = Number.isFinite(Number(controls.motion.offsetX)) ? controls.motion.offsetX : 0;
  const offsetY = Number.isFinite(Number(controls.motion.offsetY)) ? controls.motion.offsetY : 0;
  const lift = scaleValue(-8 * controls.brows.lift + 2.5 * controls.brows.pinch, profile.gain);
  const pinch = scaleValue(4.8 * controls.brows.pinch, profile.gain);
  const asymmetry = scaleValue(5 * controls.brows.asymmetry, profile.gain);
  const gazeX = controls.gaze.x * 9.6;
  const gazeY = controls.gaze.y * 6.2;
  const scaleY = clamp(eyes.scaleY * controls.blink.openness, 0.08, 1.4);
  const focus = controls.gaze.focus;
  const eyeShare = clamp(0.16 + focus * 0.16, 0.18, 0.32);
  const glintShare = clamp(0.62 + focus * 0.34, 0.72, 0.9);
  const leftLook = { x: eyes.lx + gazeX, y: eyes.ly + gazeY };
  const rightLook = { x: eyes.rxp + gazeX, y: eyes.ryp + gazeY };
  const mouthShape = normalizeMouth(expression.mouth);
  const mouthX = scaleValue(mouthShape.x || 0, profile.gain);
  const mouthY = scaleValue((mouthShape.y || 0) + controls.mouth.tension * 1.4 - controls.mouth.openness * 0.9, profile.gain);
  const mouthScaleX = scaleFromNeutral(
    (mouthShape.scaleX || 1) + controls.mouth.activity * 0.035 - controls.mouth.tension * 0.035,
    1,
    profile.gain,
  );
  const mouthScaleY = scaleFromNeutral(
    (mouthShape.scaleY || 1) + controls.mouth.openness * 0.52 + controls.mouth.activity * 0.06 - controls.mouth.tension * 0.09,
    1,
    profile.gain,
  );

  const svg = createSvgElement("svg", {
    class: options.className ? `controller-face ${options.className}` : "controller-face",
    viewBox: "0 0 420 360",
    role: "img",
    "aria-label": options.label || `${state} reference face controls`,
  });
  svg.dataset.presenceState = state;
  svg.dataset.rendererState = controls.expression;
  svg.style.color = color;
  svg.style.setProperty("--controller-face-tilt", `${tilt.toFixed(2)}deg`);
  svg.style.setProperty("--controller-face-offset-x", `${(offsetX * 14).toFixed(2)}px`);
  svg.style.setProperty("--controller-face-offset-y", `${(offsetY * 10).toFixed(2)}px`);

  const frame = createSvgElement("path", {
    class: "face-frame controller-face-frame",
    d: "M100 72 C146 36 274 36 320 72 C358 102 366 241 319 288 C272 335 148 335 101 288 C54 241 62 102 100 72 Z",
  });
  frame.style.stroke = color;
  frame.style.fill = colorWash(color, profile.color);
  svg.append(frame);

  const browLeftGroup = createSvgElement("g", { class: "brow-group brow-left-group" });
  browLeftGroup.style.transform = `translate(${formatSvgNumber(-pinch)}px, ${formatSvgNumber(lift - asymmetry)}px)`;
  browLeftGroup.append(createSvgElement("path", {
    class: "brow",
    d: expression.brows[0],
    "stroke-width": formatSvgNumber(6.5 * profile.line),
  }));

  const browRightGroup = createSvgElement("g", { class: "brow-group brow-right-group" });
  browRightGroup.style.transform = `translate(${formatSvgNumber(pinch)}px, ${formatSvgNumber(lift + asymmetry)}px)`;
  browRightGroup.append(createSvgElement("path", {
    class: "brow",
    d: expression.brows[1],
    "stroke-width": formatSvgNumber(6.5 * profile.line),
  }));

  const eyeLeftGalleryGroup = createSvgElement("g", { class: "eye-group eye-left-group" });
  eyeLeftGalleryGroup.style.transform = `translate(${formatSvgNumber(clamp(leftLook.x * eyeShare, -8.8, 8.8))}px, ${formatSvgNumber(clamp(leftLook.y * eyeShare, -5.2, 5.2))}px) scaleY(${formatSvgNumber(scaleY)})`;
  eyeLeftGalleryGroup.append(
    createSvgElement("ellipse", { class: "eye", cx: 162, cy: 165, rx: formatSvgNumber(eyes.rx), ry: formatSvgNumber(eyes.ry) }),
    createSvgElement("circle", { class: "pupil", cx: 162, cy: 165, r: 5 }),
  );
  eyeLeftGalleryGroup.querySelector(".pupil").style.transform = `translate(${formatSvgNumber(clamp(leftLook.x * glintShare, -4.2, 4.2))}px, ${formatSvgNumber(clamp(leftLook.y * glintShare, -2.8, 2.8))}px)`;

  const eyeRightGalleryGroup = createSvgElement("g", { class: "eye-group eye-right-group" });
  eyeRightGalleryGroup.style.transform = `translate(${formatSvgNumber(clamp(rightLook.x * eyeShare, -8.8, 8.8))}px, ${formatSvgNumber(clamp(rightLook.y * eyeShare, -5.2, 5.2))}px) scaleY(${formatSvgNumber(scaleY)})`;
  eyeRightGalleryGroup.append(
    createSvgElement("ellipse", { class: "eye", cx: 258, cy: 165, rx: formatSvgNumber(eyes.rx), ry: formatSvgNumber(eyes.ry) }),
    createSvgElement("circle", { class: "pupil", cx: 258, cy: 165, r: 5 }),
  );
  eyeRightGalleryGroup.querySelector(".pupil").style.transform = `translate(${formatSvgNumber(clamp(rightLook.x * glintShare, -4.2, 4.2))}px, ${formatSvgNumber(clamp(rightLook.y * glintShare, -2.8, 2.8))}px)`;

  const mouthGalleryGroup = createSvgElement("g", { class: "mouth-group" });
  mouthGalleryGroup.style.transform = `translate(${formatSvgNumber(mouthX)}px, ${formatSvgNumber(mouthY)}px) scale(${formatSvgNumber(mouthScaleX)}, ${formatSvgNumber(mouthScaleY)})`;
  mouthGalleryGroup.append(createSvgElement("path", {
    class: "mouth",
    d: mouthShape.d,
    "stroke-width": formatSvgNumber((mouthShape.width || 7.2) * profile.line),
  }));

  const breathPath = createSvgElement("path", {
    class: "breath",
    d: expression.breath,
    "stroke-width": formatSvgNumber(3 * profile.line),
  });
  breathPath.style.stroke = color;

  svg.append(browLeftGroup, browRightGroup, eyeLeftGalleryGroup, eyeRightGalleryGroup, mouthGalleryGroup, breathPath);
  return svg;
}

function createControllerChannelRow(channel, label, value, meterValue = null, decision = null, decisionTrace = null) {
  const row = document.createElement("div");
  row.className = "controller-channel";
  row.dataset.channel = channel;
  if (decision) {
    row.dataset.controller = decision.controller;
    row.dataset.reads = controllerReadsText(decision);
  }
  if (decisionTrace) {
    row.dataset.controllerDecisionTrace = decisionTrace.present && decisionTrace.bounded ? "complete" : "incomplete";
    row.dataset.controllerDecisionTraceController = decisionTrace.controller || "none";
    row.dataset.controllerDecisionTraceReads = controllerReadsText(decisionTrace);
    row.dataset.controllerDecisionTraceWarnings = String(decisionTrace.warningCount || 0);
    row.dataset.controllerDecisionTraceRendererSafe = String(Boolean(decisionTrace.rendererSafe));
  }

  const name = document.createElement("span");
  name.textContent = label;
  const output = document.createElement("output");
  output.textContent = value;

  row.append(name, output);
  if (meterValue !== null) {
    const meter = document.createElement("span");
    meter.className = "controller-meter";
    meter.style.setProperty("--value", String(clamp(meterValue, 0, 1)));
    row.append(meter);
  }
  return row;
}

function controlsFromFrameReport(report) {
  if (!report?.frame) return null;
  return {
    expression: report.expression,
    gaze: report.frame.gaze,
    blink: report.frame.blink,
    brows: report.frame.brows,
    mouth: report.frame.mouth,
    posture: report.frame.posture,
    motion: report.frame.motion,
  };
}

function createControllerFrameSequence(snapshot, history, options = {}) {
  if (typeof PresenceFace.faceControllerFrameForPresence !== "function") return [];
  const baseNow = Number.isFinite(Number(options.now)) ? Number(options.now) : snapshot.updatedAt + 120;
  return CONTROLLER_FRAME_SAMPLE_OFFSETS.map((offsetMs) => {
    const sampleAt = snapshot.updatedAt + offsetMs;
    return {
      offsetMs,
      report: PresenceFace.faceControllerFrameForPresence(snapshot, {
        history,
        now: baseNow,
        timeMs: sampleAt,
        profile: faceControlProfile(),
      }),
    };
  });
}

function frameSequenceSummary(samples) {
  if (!samples.length) return "none";
  return samples
    .map((sample) => `+${sample.offsetMs}ms ${frameSummary(sample.report)}`)
    .join(" || ");
}

function frameSampleText(report) {
  const frame = report?.frame;
  if (!frame) return "none";
  return [
    `gaze ${signedNumber(frame.gaze.driftX)},${signedNumber(frame.gaze.driftY)}`,
    `blink ${shortPercent(frame.blink.openness)}%`,
    `brows ${signedNumber(frame.brows.pinch)}`,
    `mouth ${frame.mouth.shape}/${shortPercent(frame.mouth.beat)}%`,
    `posture ${signedNumber(frame.posture.lean)}`,
    `motion ${signedNumber(frame.motion.offsetX)},${signedNumber(frame.motion.offsetY)}`,
  ].join(" ");
}

function createControllerFrameStrip(state, samples) {
  const strip = document.createElement("div");
  strip.className = "controller-frame-strip";
  strip.dataset.frameSamples = samples.map((sample) => String(sample.offsetMs)).join(",");
  strip.dataset.frameChannels = FACE_CONTROL_CHANNELS.join(",");
  strip.dataset.frameSequence = frameSequenceSummary(samples);
  applyControllerCoherenceDataset(strip, samples[0]?.report);
  applyControllerDecisionTraceDataset(strip, samples[0]?.report);

  for (const [index, sample] of samples.entries()) {
    const controls = controlsFromFrameReport(sample.report);
    if (!controls) continue;

    const item = document.createElement("div");
    item.className = "controller-frame-sample";
    item.dataset.frameIndex = String(index);
    item.dataset.frameOffsetMs = String(sample.offsetMs);
    item.dataset.controllerFrame = frameSummary(sample.report);
    item.dataset.frameChannels = FACE_CONTROL_CHANNELS.join(",");
    applyControllerCoherenceDataset(item, sample.report);
    applyControllerDecisionTraceDataset(item, sample.report);

    const time = document.createElement("span");
    time.className = "controller-frame-time";
    time.textContent = `+${sample.offsetMs}ms`;

    const output = document.createElement("output");
    output.textContent = frameSampleText(sample.report);

    item.append(
      time,
      createControllerFaceSvg(state, controls, {
        className: "controller-face-sample",
        label: `${state} controller frame at ${sample.offsetMs}ms`,
      }),
      output,
    );
    strip.append(item);
  }

  return strip;
}

function createControllerGalleryCard(state, report, frameSamples = []) {
  const controls = controlsFromDecisionReport(report);
  const decisionTrace = controllerDecisionTraceForFrame(frameSamples[0]?.report);
  const card = document.createElement("article");
  card.className = "controller-card";
  card.dataset.presenceState = state;
  card.dataset.decisionState = report.state;
  card.dataset.rendererState = controls.expression;
  card.dataset.faceControls = controlsSummary(controls);
  card.dataset.controllerComposition = controllerCompositionText(report);
  card.dataset.controllerEvidence = controllerEvidenceText(controls, report);
  card.dataset.frameSamples = frameSamples.map((sample) => String(sample.offsetMs)).join(",");
  card.dataset.frameChannels = FACE_CONTROL_CHANNELS.join(",");
  card.dataset.frameSequence = frameSequenceSummary(frameSamples);
  if (frameSamples[0]?.report) {
    card.dataset.controllerFrame = frameSummary(frameSamples[0].report);
    applyControllerCoherenceDataset(card, frameSamples[0].report);
    applyControllerDecisionTraceDataset(card, frameSamples[0].report);
  }

  const title = document.createElement("h2");
  title.textContent = state;
  const renderer = document.createElement("output");
  renderer.className = "controller-renderer";
  renderer.textContent = controls.expression;

  const heading = document.createElement("div");
  heading.className = "controller-card-heading";
  heading.append(title, renderer);

  const channels = document.createElement("div");
  channels.className = "controller-channels";
  channels.append(
    createControllerChannelRow(
      "gaze",
      "Gaze",
      `${controls.gaze.target} x ${signedNumber(controls.gaze.x)} y ${signedNumber(controls.gaze.y)} focus ${shortPercent(controls.gaze.focus)}%`,
      controls.gaze.focus,
      decisionForChannel(report, "gaze"),
      decisionTrace?.decisions?.gaze,
    ),
    createControllerChannelRow(
      "blink",
      "Blink",
      `open ${shortPercent(controls.blink.openness)}% cadence ${Math.round(controls.blink.cadenceMs)}ms pulse ${controls.blink.pulse ? "yes" : "no"}`,
      controls.blink.openness,
      decisionForChannel(report, "blink"),
      decisionTrace?.decisions?.blink,
    ),
    createControllerChannelRow(
      "brows",
      "Brows",
      `lift ${signedNumber(controls.brows.lift)} pinch ${signedNumber(controls.brows.pinch)} asym ${signedNumber(controls.brows.asymmetry)}`,
      clamp((controls.brows.pinch + 0.1) / 0.7, 0, 1),
      decisionForChannel(report, "brows"),
      decisionTrace?.decisions?.brows,
    ),
    createControllerChannelRow(
      "mouth",
      "Mouth",
      `${controls.mouth.shape} open ${shortPercent(controls.mouth.openness)}% activity ${shortPercent(controls.mouth.activity)}% tension ${shortPercent(controls.mouth.tension)}%`,
      controls.mouth.activity || controls.mouth.openness,
      decisionForChannel(report, "mouth"),
      decisionTrace?.decisions?.mouth,
    ),
    createControllerChannelRow(
      "posture",
      "Posture",
      `lean ${signedNumber(controls.posture.lean)} turn ${signedNumber(controls.posture.turn)} recovery ${shortPercent(controls.posture.recovery)}%`,
      Math.abs(controls.posture.lean),
      decisionForChannel(report, "posture"),
      decisionTrace?.decisions?.posture,
    ),
    createControllerChannelRow(
      "motion",
      "Motion",
      `energy ${shortPercent(controls.motion.energy)}% anticipation ${shortPercent(controls.motion.anticipation)}% recovery ${shortPercent(controls.motion.recovery)}%`,
      controls.motion.energy,
      decisionForChannel(report, "motion"),
      decisionTrace?.decisions?.motion,
    ),
  );

  card.append(heading, createControllerFaceSvg(state, controls), createControllerFrameStrip(state, frameSamples), channels);
  return card;
}

function renderControllerGallery() {
  if (!controllerGalleryGrid) return;

  controllerGalleryGrid.textContent = "";
  const history = [];
  for (const [index, state] of controllerGalleryStates.entries()) {
    const snapshot = {
      state,
      previousState: history.at(-1)?.state || null,
      event: "controller-gallery",
      detail: { source: "controller-gallery" },
      changed: true,
      updatedAt: 1000 + index * 180,
      version: index + 1,
    };
    const report = PresenceFace.faceControllerDecisionsForPresence(snapshot, {
      history,
      now: snapshot.updatedAt + 120,
      profile: faceControlProfile(),
    });
    const frameSamples = createControllerFrameSequence(snapshot, history, {
      now: snapshot.updatedAt + 120,
    });
    controllerGalleryGrid.append(createControllerGalleryCard(state, report, frameSamples));
    history.push(snapshot);
  }
}

function setControllerGalleryMode(enabled, options = {}) {
  const active = Boolean(enabled);
  if (!controllerGallery) return;

  controllerGallery.hidden = !active;
  document.body.classList.toggle("controller-gallery-mode", active);
  if (active) {
    comparisonDemo.hidden = true;
    document.body.classList.remove("comparison-mode");
    setPressed(compareToggle, false);
    renderControllerGallery();
  }
  if (!active && options.focus !== false) {
    input.focus({ preventScroll: true });
  }
  if (options.updateUrl !== false) {
    const url = new URL(window.location.href);
    if (active) {
      url.searchParams.set("controls", "1");
    } else {
      url.searchParams.delete("controls");
      url.searchParams.delete("controllerGallery");
    }
    window.history.replaceState({}, "", url);
  }
}

function applyInitialViewState() {
  const params = new URLSearchParams(window.location.search);
  const initialPresence = params.get("presence");
  if (presenceProfiles[initialPresence]) {
    setPresence(initialPresence);
  }

  if (params.get("metrics") === "1" || params.get("metrics") === "true") {
    metricsPanel.hidden = false;
    setPressed(metricsToggle, true);
  }

  if (params.get("controls") === "1" || params.get("controls") === "true" || params.get("controllerGallery") === "1") {
    setControllerGalleryMode(true, { updateUrl: false, focus: false });
    return;
  }

  if (params.get("compare") === "1" || params.get("compare") === "true") {
    setComparisonMode(true, { updateUrl: false, focus: false });
  }

  if (params.get("autorunCompare") === "1") {
    window.setTimeout(() => runComparisonDemo(), 180);
  }
}

function setComparisonMode(enabled, options = {}) {
  const active = Boolean(enabled);
  comparisonDemo.hidden = !active;
  document.body.classList.toggle("comparison-mode", active);
  setPressed(compareToggle, active);
  if (active) {
    renderComparisonPresence();
    if (options.focus !== false) {
      compareInput.focus({ preventScroll: true });
    }
  }
  if (!active && options.focus !== false) {
    input.focus({ preventScroll: true });
  }
  if (options.updateUrl !== false) {
    const url = new URL(window.location.href);
    if (active) {
      url.searchParams.set("compare", "1");
    } else {
      url.searchParams.delete("compare");
      url.searchParams.delete("autorunCompare");
    }
    window.history.replaceState({}, "", url);
  }
}

function toggleComparisonMode() {
  setComparisonMode(comparisonDemo.hidden);
}

function clearComparisonTimers() {
  for (const timer of comparisonState.timers) {
    window.clearTimeout(timer);
  }
  comparisonState.timers = [];
}

function scheduleComparison(delay, callback) {
  const runId = comparisonState.runId;
  const timer = window.setTimeout(() => {
    comparisonState.timers = comparisonState.timers.filter((item) => item !== timer);
    if (runId !== comparisonState.runId) return;
    callback();
  }, delay);
  comparisonState.timers.push(timer);
}

function appendComparisonTimeline(output, label) {
  output.textContent = output.textContent === "--" ? label : `${output.textContent} -> ${label}`;
}

function uniqueComparisonValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function resetComparisonEvidence() {
  comparisonState.beforeTokenStates = [];
  comparisonState.beforeTokenRenderers = [];
  comparisonState.beforeTokenFrameSummary = "none";
  comparisonState.beforeTokenFrameChannels = "";
  comparisonState.genericBeforeTokenState = "idle";
  if (!comparisonDemo) return;

  comparisonDemo.dataset.equalLatency = "true";
  comparisonDemo.dataset.spinnerFirstTokenMs = String(comparisonTiming.firstToken);
  comparisonDemo.dataset.presenceFirstTokenMs = String(comparisonTiming.firstToken);
  comparisonDemo.dataset.firstTokenMs = String(comparisonTiming.firstToken);
  comparisonDemo.dataset.genericBeforeToken = "idle";
  comparisonDemo.dataset.genericBeforeTokenState = "idle";
  comparisonDemo.dataset.genericBeforeTokenLoading = "false";
  comparisonDemo.dataset.presenceBeforeToken = "false";
  comparisonDemo.dataset.presenceBeforeTokenStates = "";
  comparisonDemo.dataset.presenceRendererBeforeToken = "";
  comparisonDemo.dataset.presenceFrameBeforeToken = "false";
  comparisonDemo.dataset.presenceFrameBeforeTokenChannels = "";
  comparisonDemo.dataset.presenceFrameBeforeTokenSummary = "none";
  if (compareFace) {
    compareFace.dataset.presenceBeforeTokenStates = "";
    compareFace.dataset.controllerFrameBeforeToken = "none";
    compareFace.dataset.controllerFrameBeforeTokenChannels = "";
  }
}

function comparisonFrameReport(snapshot) {
  if (!snapshot || typeof PresenceFace.faceControllerFrameForPresence !== "function") return null;
  return PresenceFace.faceControllerFrameForPresence(snapshot, {
    history: [],
    now: performance.now(),
    timeMs: performance.now(),
  });
}

function recordComparisonBeforeTokenEvidence() {
  if (!comparisonDemo || compareSpinnerResponse.textContent) return;

  const snapshot = comparisonRuntime.getSnapshot();
  const expression = PresenceFace.faceExpressionForPresence(snapshot);
  const state = snapshot.state;
  if (
    state === PresenceState.READING
    || state === PresenceState.THINKING
    || state === PresenceState.WAITING
  ) {
    comparisonState.beforeTokenStates = uniqueComparisonValues([...comparisonState.beforeTokenStates, state]);
    comparisonState.beforeTokenRenderers = uniqueComparisonValues([...comparisonState.beforeTokenRenderers, expression]);
  }

  const frameReport = comparisonFrameReport(snapshot);
  const frameChannels = Object.keys(frameReport?.frame || {});
  if (frameChannels.length) {
    comparisonState.beforeTokenFrameSummary = frameSummary(frameReport);
    comparisonState.beforeTokenFrameChannels = frameChannels.join(" ");
  }

  const genericState = compareSpinnerState.textContent || "idle";
  const genericLoading = compareSpinnerIndicator.classList.contains("is-visible");
  comparisonState.genericBeforeTokenState = genericState;
  comparisonDemo.dataset.genericBeforeToken = genericLoading ? "loading" : genericState;
  comparisonDemo.dataset.genericBeforeTokenState = genericState;
  comparisonDemo.dataset.genericBeforeTokenLoading = String(genericLoading);
  comparisonDemo.dataset.presenceBeforeToken = String(comparisonState.beforeTokenStates.length > 0);
  comparisonDemo.dataset.presenceBeforeTokenStates = comparisonState.beforeTokenStates.join(" ");
  comparisonDemo.dataset.presenceRendererBeforeToken = comparisonState.beforeTokenRenderers.join(" ");
  comparisonDemo.dataset.presenceFrameBeforeToken = String(frameChannels.length > 0);
  comparisonDemo.dataset.presenceFrameBeforeTokenChannels = comparisonState.beforeTokenFrameChannels;
  comparisonDemo.dataset.presenceFrameBeforeTokenSummary = comparisonState.beforeTokenFrameSummary;
  if (compareFace) {
    compareFace.dataset.presenceBeforeTokenStates = comparisonState.beforeTokenStates.join(" ");
    compareFace.dataset.controllerFrameBeforeToken = comparisonState.beforeTokenFrameSummary;
    compareFace.dataset.controllerFrameBeforeTokenChannels = comparisonState.beforeTokenFrameChannels;
  }
}

function renderComparisonPresence() {
  if (!comparePresenceState || !compareFace) return;

  const snapshot = comparisonRuntime.getSnapshot();
  const expression = PresenceFace.faceExpressionForPresence(snapshot);
  comparePresenceState.textContent = snapshot.state;
  comparePresenceRenderer.textContent = expression;
  compareFace.dataset.presenceState = snapshot.state;
  compareFace.dataset.rendererState = expression;
  compareMouth.setAttribute("d", comparisonMouths[expression] || comparisonMouths.idle);
}

function resetComparisonDemo(message) {
  clearComparisonTimers();
  comparisonState.runId += 1;
  comparisonAdapter.send({ type: RuntimeSignal.RESET });
  resetComparisonEvidence();
  compareLatency.textContent = `First token ${comparisonTiming.firstToken}ms`;
  compareSpinnerState.textContent = "idle";
  compareSpinnerUser.textContent = message;
  compareSpinnerIndicator.classList.remove("is-visible");
  compareSpinnerResponse.textContent = "";
  compareSpinnerTimeline.textContent = "--";
  comparePresenceUser.textContent = message;
  comparePresenceResponse.textContent = "";
  comparePresenceTimeline.textContent = "--";
  compareVoteResult.textContent = "--";
  compareRun.disabled = false;
  renderComparisonPresence();
}

function revealComparisonText(target, fraction) {
  const nextLength = Math.ceil(comparisonResponse.length * fraction);
  target.textContent = comparisonResponse.slice(0, nextLength);
}

function runComparisonDemo(event = null) {
  event?.preventDefault();
  const message = compareInput.value.trim() || "Why does this feel faster?";

  resetComparisonDemo(message);
  comparisonState.startedAt = performance.now();
  comparisonState.runId += 1;
  compareRun.disabled = true;
  compareSpinnerState.textContent = "waiting";
  compareSpinnerIndicator.classList.add("is-visible");
  compareSpinnerTimeline.textContent = "0ms submit";
  comparePresenceTimeline.textContent = "0ms reading";
  comparisonAdapter.send({
    type: RuntimeSignal.USER_INPUT,
    text: message,
    source: "comparison",
  });
  comparisonAdapter.send({
    type: RuntimeSignal.LOCAL_READ,
    text: message,
    completion: 0.28,
    source: "comparison",
  });
  recordComparisonBeforeTokenEvidence();

  scheduleComparison(comparisonTiming.pause, () => {
    comparisonAdapter.send({
      type: RuntimeSignal.USER_PAUSE,
      text: message,
      completion: 0.46,
      source: "comparison",
    });
    appendComparisonTimeline(comparePresenceTimeline, `${comparisonTiming.pause}ms thinking`);
    recordComparisonBeforeTokenEvidence();
  });

  scheduleComparison(comparisonTiming.streamOpen, () => {
    comparisonAdapter.send({ type: RuntimeSignal.STREAM_OPEN, source: "comparison" });
    appendComparisonTimeline(compareSpinnerTimeline, `${comparisonTiming.streamOpen}ms stream open`);
    appendComparisonTimeline(comparePresenceTimeline, `${comparisonTiming.streamOpen}ms waiting`);
    recordComparisonBeforeTokenEvidence();
  });

  scheduleComparison(comparisonTiming.firstToken, () => {
    recordComparisonBeforeTokenEvidence();
    comparisonAdapter.send({ type: RuntimeSignal.TOKEN, source: "comparison" });
    compareSpinnerState.textContent = "streaming";
    compareSpinnerIndicator.classList.remove("is-visible");
    revealComparisonText(compareSpinnerResponse, 0.42);
    revealComparisonText(comparePresenceResponse, 0.42);
    appendComparisonTimeline(compareSpinnerTimeline, `${comparisonTiming.firstToken}ms first token`);
    appendComparisonTimeline(comparePresenceTimeline, `${comparisonTiming.firstToken}ms first token`);
  });

  scheduleComparison(comparisonTiming.done, () => {
    comparisonAdapter.send({ type: RuntimeSignal.RESPONSE_COMPLETE, source: "comparison" });
    compareSpinnerState.textContent = "ready";
    compareSpinnerResponse.textContent = comparisonResponse;
    comparePresenceResponse.textContent = comparisonResponse;
    appendComparisonTimeline(compareSpinnerTimeline, `${comparisonTiming.done}ms done`);
    appendComparisonTimeline(comparePresenceTimeline, `${comparisonTiming.done}ms done`);
    compareRun.disabled = false;
  });
}

function setComparisonVote(choice) {
  compareVoteResult.textContent = choice;
}

function primeAudioOutput() {
  if (runtime.audioUnlocked) return;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!runtime.audioContext) {
      runtime.audioContext = new AudioContextClass();
    }

    const resume = runtime.audioContext.state === "suspended"
      ? runtime.audioContext.resume()
      : Promise.resolve();
    resume
      .then(() => {
        runtime.audioUnlocked = true;
      })
      .catch(() => {
        runtime.audioUnlocked = false;
      });
  } catch {
    runtime.audioUnlocked = false;
  }
}

function toggleSpeaker() {
  runtime.speakerOn = !runtime.speakerOn;
  setPressed(speakerToggle, runtime.speakerOn);
  speakerToggle.title = runtime.realtimeOn
    ? (runtime.speakerOn ? "Realtime voice output is on." : "Realtime voice output is muted.")
    : (runtime.speakerOn ? "Speaker is on. Responses will play locally in this browser." : "Speaker is off. Responses will stay silent.");
  speakerToggle.setAttribute("aria-label", runtime.speakerOn ? "Turn speaker off" : "Turn speaker on");

  if (runtime.realtime?.remoteAudio) {
    runtime.realtime.remoteAudio.muted = !runtime.speakerOn;
  }

  if (runtime.speakerOn) {
    primeAudioOutput();
    trace(runtime.realtimeOn ? "voice unmute" : "speaker on");
  } else {
    trace(runtime.realtimeOn ? "voice mute" : "speaker off");
    cancelSpeechPlayback();
    if (runtime.speaking && !runtime.realtimeOn) {
      runtime.speaking = false;
      setExpression("ready", null, "response-ready");
    }
  }

  renderMetrics();
}

function setupFaceTracking() {
  const cameraOk = Boolean(navigator.mediaDevices?.getUserMedia);
  const detectorOk = "FaceDetector" in window;

  if (!cameraOk) {
    faceToggle.classList.add("is-unavailable");
    faceToggle.title = "Camera access is unavailable in this browser.";
    runtime.faceLabel = "no camera";
    renderMetrics();
    return;
  }

  runtime.faceMode = "model";
  faceToggle.title = "Face-tracking (local only). The detector runs in this browser; video stays local.";

  if (detectorOk) {
    try {
      runtime.faceDetector = new window.FaceDetector({
        fastMode: true,
        maxDetectedFaces: 1,
      });
      return;
    } catch {
      runtime.faceDetector = null;
    }
  }
}

function ensureFaceCanvas() {
  if (!runtime.faceCanvas) {
    runtime.faceCanvas = document.createElement("canvas");
    runtime.faceCanvas.width = 96;
    runtime.faceCanvas.height = 72;
    runtime.faceContext = runtime.faceCanvas.getContext("2d", {
      alpha: false,
      willReadFrequently: true,
    });
  }

  return runtime.faceContext;
}

function faceTrackingModeLabel() {
  if (runtime.mediaPipeDetector) return "model";
  if (runtime.mediaPipeLoading) return "model load";
  if (runtime.faceMode === "model" && !runtime.mediaPipeFailed) return "model";
  if (runtime.faceDetector) return "native";
  return runtime.faceMode === "coarse" ? "coarse" : "off";
}

async function initializeMediaPipeFaceDetector() {
  if (runtime.mediaPipeDetector) return true;
  if (runtime.mediaPipeFailed) return false;
  if (runtime.mediaPipePromise) return runtime.mediaPipePromise;

  runtime.mediaPipeLoading = true;
  runtime.faceEstimateMode = "model load";
  runtime.faceLabel = "model load";
  renderVisionStatus();
  renderMetrics();

  runtime.mediaPipePromise = (async () => {
    try {
      const vision = await import(MEDIAPIPE_TASKS_VISION_URL);
      const wasmFileset = await vision.FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
      runtime.mediaPipeDetector = await vision.FaceDetector.createFromOptions(wasmFileset, {
        baseOptions: {
          modelAssetPath: MEDIAPIPE_FACE_MODEL_URL,
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        minDetectionConfidence: 0.35,
        minSuppressionThreshold: 0.3,
      });
      runtime.mediaPipeLastVideoTime = -1;
      runtime.faceMode = "model";
      runtime.faceEstimateMode = "model";
      runtime.faceLabel = "model ready";
      trace("face model ready");
      return true;
    } catch (error) {
      runtime.mediaPipeFailed = true;
      runtime.faceMode = runtime.faceDetector ? "native" : "coarse";
      runtime.faceEstimateMode = faceTrackingModeLabel();
      runtime.faceLabel = runtime.faceDetector ? "model fallback native" : "model fallback coarse";
      faceToggle.title = runtime.faceDetector
        ? "Face-tracking (local only). Browser face model could not load; using native FaceDetector fallback."
        : "Face-tracking (local only). Browser face model could not load; using coarse camera fallback.";
      trace(`face model unavailable ${error?.name || "error"}`);
      return false;
    } finally {
      runtime.mediaPipeLoading = false;
      runtime.mediaPipePromise = null;
      renderVisionStatus();
      renderMetrics();
    }
  })();

  return runtime.mediaPipePromise;
}

async function toggleFaceTracking() {
  if (runtime.faceTrackingOn) {
    stopFaceTracking();
    return;
  }

  await startFaceTracking();
}

async function startFaceTracking() {
  if (!navigator.mediaDevices?.getUserMedia || faceTrackingModeLabel() === "off") return;

  faceToggle.disabled = true;
  runtime.faceLabel = `${faceTrackingModeLabel()} request`;
  renderMetrics();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 320 },
        height: { ideal: 240 },
        frameRate: { ideal: 15, max: 24 },
      },
    });

    runtime.faceStream = stream;
    faceVideo.srcObject = stream;
    visionPreview.hidden = false;
    await faceVideo.play();
    runtime.faceTrackingOn = true;
    runtime.faceEstimateMode = faceTrackingModeLabel();
    runtime.faceFrameCount = 0;
    runtime.faceHitCount = 0;
    runtime.faceMissCount = 0;
    runtime.faceErrorCount = 0;
    runtime.faceLoopStartedAt = performance.now();
    runtime.faceLastLoopAt = 0;
    runtime.faceLastFrameMs = null;
    runtime.faceLastSeenAt = 0;
    setPressed(faceToggle, true);
    await initializeMediaPipeFaceDetector();
    runtime.faceEstimateMode = faceTrackingModeLabel();
    runtime.faceLabel = `${faceTrackingModeLabel()} search`;
    renderVisionStatus();
    scheduleFaceTrackingLoop(0);
  } catch (error) {
    stopFaceTracking();
    markFaceTrackingBlocked(error);
  } finally {
    faceToggle.disabled = false;
    renderMetrics();
  }
}

function markFaceTrackingBlocked(error) {
  const name = error?.name || "";
  const permissionBlocked = name === "NotAllowedError" || name === "SecurityError";
  const noCamera = name === "NotFoundError" || name === "OverconstrainedError";
  runtime.faceLabel = permissionBlocked ? "permission blocked" : noCamera ? "no camera" : "browser blocked";
  faceToggle.title = permissionBlocked
    ? "Face-tracking is blocked by this browser's camera permission."
    : noCamera
      ? "No usable camera was found for local face-tracking."
      : "This browser could not start local face-tracking.";
  faceToggle.classList.toggle("is-unavailable", !permissionBlocked);
  trace(`face ${runtime.faceLabel}`);
}

function stopFaceTracking() {
  window.clearTimeout(runtime.faceLoopTimer);
  runtime.faceLoopTimer = null;
  runtime.faceDetecting = false;
  runtime.faceTrackingOn = false;
  runtime.faceEstimateMode = "off";
  runtime.faceLabel = "off";
  runtime.faceFrameCount = 0;
  runtime.faceHitCount = 0;
  runtime.faceMissCount = 0;
  runtime.faceErrorCount = 0;
  runtime.faceLoopStartedAt = 0;
  runtime.faceLastLoopAt = 0;
  runtime.faceLastFrameMs = null;
  runtime.faceLastSeenAt = 0;
  runtime.mediaPipeLastVideoTime = -1;
  runtime.visionGaze = { x: 0, y: 0 };
  setPressed(faceToggle, false);
  hideTrackingDot();
  hideFaceBox();
  visionPreview.hidden = true;
  renderVisionStatus();

  if (runtime.faceStream) {
    for (const track of runtime.faceStream.getTracks()) {
      track.stop();
    }
    runtime.faceStream = null;
  }

  faceVideo.pause();
  faceVideo.srcObject = null;
  renderEyeMotion();
  renderMetrics();
}

function renderTrackingDot(centerX, centerY, lost = false) {
  const dotX = clamp(centerX, 0.08, 0.92);
  const dotY = clamp(centerY, 0.12, 0.78);

  trackingDot.style.setProperty("--track-x", `${Math.round(dotX * 1000) / 10}%`);
  trackingDot.style.setProperty("--track-y", `${Math.round(dotY * 1000) / 10}%`);
  trackingDot.classList.add("is-visible");
  trackingDot.classList.toggle("is-lost", lost);
  runtime.trackingDotVisible = true;
}

function hideTrackingDot(lost = false) {
  trackingDot.classList.toggle("is-visible", lost);
  trackingDot.classList.toggle("is-lost", lost);
  runtime.trackingDotVisible = lost;
}

function renderFaceBox(box, lost = false) {
  const videoWidth = faceVideo.videoWidth || 1;
  const videoHeight = faceVideo.videoHeight || 1;
  const rawLeft = box.x / videoWidth;
  const rawRight = (box.x + box.width) / videoWidth;
  const left = FACE_TRACKING_MIRROR_X ? 1 - rawRight : rawLeft;
  const top = box.y / videoHeight;
  const width = box.width / videoWidth;
  const height = box.height / videoHeight;

  faceBox.style.setProperty("--box-x", `${formatPercent(left)}`);
  faceBox.style.setProperty("--box-y", `${formatPercent(top)}`);
  faceBox.style.setProperty("--box-w", `${formatPercent(width)}`);
  faceBox.style.setProperty("--box-h", `${formatPercent(height)}`);
  faceBox.classList.add("is-visible");
  faceBox.classList.toggle("is-lost", lost);
  runtime.faceBoxVisible = true;
}

function hideFaceBox(lost = false) {
  faceBox.classList.toggle("is-visible", lost);
  faceBox.classList.toggle("is-lost", lost);
  runtime.faceBoxVisible = lost;
}

function formatPercent(value) {
  return `${Math.round(clamp(value, 0, 1) * 1000) / 10}%`;
}

function renderVisionStatus() {
  if (!visionStatus) return;
  if (!runtime.faceTrackingOn) {
    visionStatus.textContent = runtime.faceLabel || "off";
    return;
  }

  const now = performance.now();
  const elapsedSeconds = Math.max((now - runtime.faceLoopStartedAt) / 1000, 0.1);
  const hz = Math.round((runtime.faceFrameCount / elapsedSeconds) * 10) / 10;
  const age = runtime.faceLastSeenAt ? Math.round(now - runtime.faceLastSeenAt) : "--";
  const frameMs = runtime.faceLastFrameMs === null ? "--" : `${Math.round(runtime.faceLastFrameMs)}ms`;
  visionStatus.textContent = `${runtime.faceEstimateMode} ${hz}hz age ${age}ms frame ${frameMs}`;
}

function scheduleFaceTrackingLoop(delay = FACE_TRACKING_INTERVAL_MS) {
  window.clearTimeout(runtime.faceLoopTimer);
  if (!runtime.faceTrackingOn) return;
  runtime.faceLoopTimer = window.setTimeout(runFaceTrackingLoop, delay);
}

function detectFaceWithMediaPipe(timestamp) {
  if (!runtime.mediaPipeDetector) return null;

  const videoTime = faceVideo.currentTime;
  if (videoTime === runtime.mediaPipeLastVideoTime) {
    return { skipped: true };
  }

  runtime.mediaPipeLastVideoTime = videoTime;
  const result = runtime.mediaPipeDetector.detectForVideo(faceVideo, timestamp);
  const face = chooseLargestDetection(result?.detections || []);
  const box = face ? mediaPipeDetectionToBox(face) : null;

  return box ? { box } : null;
}

function chooseLargestDetection(detections) {
  let largest = null;
  let largestArea = 0;

  for (const detection of detections) {
    const box = detection?.boundingBox;
    if (!box) continue;
    const width = firstFinite(box.width, Number(box.xMax) - Number(box.xMin));
    const height = firstFinite(box.height, Number(box.yMax) - Number(box.yMin));
    const area = Math.max(width || 0, 0) * Math.max(height || 0, 0);
    if (area > largestArea) {
      largest = detection;
      largestArea = area;
    }
  }

  return largest;
}

function mediaPipeDetectionToBox(detection) {
  const source = detection?.boundingBox;
  if (!source) return null;

  const videoWidth = faceVideo.videoWidth || 1;
  const videoHeight = faceVideo.videoHeight || 1;
  let x = firstFinite(source.originX, source.x, source.xMin, source.left);
  let y = firstFinite(source.originY, source.y, source.yMin, source.top);
  let width = firstFinite(source.width);
  let height = firstFinite(source.height);

  if (width === null) {
    const right = firstFinite(source.xMax, source.right);
    width = right === null || x === null ? null : right - x;
  }
  if (height === null) {
    const bottom = firstFinite(source.yMax, source.bottom);
    height = bottom === null || y === null ? null : bottom - y;
  }
  if (x === null || y === null || width === null || height === null || width <= 0 || height <= 0) {
    return null;
  }

  if (x <= 1 && y <= 1 && width <= 1 && height <= 1) {
    x *= videoWidth;
    y *= videoHeight;
    width *= videoWidth;
    height *= videoHeight;
  }

  return {
    x: clamp(x, 0, videoWidth - 1),
    y: clamp(y, 0, videoHeight - 1),
    width: clamp(width, 1, videoWidth),
    height: clamp(height, 1, videoHeight),
  };
}

function firstFinite(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }

  return null;
}

async function runFaceTrackingLoop() {
  if (!runtime.faceTrackingOn || runtime.faceDetecting) return;
  if (faceVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    scheduleFaceTrackingLoop(120);
    return;
  }

  const loopStartedAt = performance.now();
  runtime.faceFrameCount += 1;
  runtime.faceLastLoopAt = loopStartedAt;
  runtime.faceDetecting = true;

  try {
    if (runtime.mediaPipeDetector) {
      const detection = detectFaceWithMediaPipe(loopStartedAt);
      if (detection?.skipped) {
        renderEyeMotion();
      } else if (detection?.box) {
        updateFaceGaze(detection.box, "model");
        runtime.faceHitCount += 1;
      } else {
        runtime.faceMissCount += 1;
        settleFaceGaze();
      }
    } else if (runtime.faceDetector) {
      const faces = await withTimeout(
        runtime.faceDetector.detect(faceVideo),
        FACE_DETECTION_TIMEOUT_MS,
        "Face detection timed out"
      );
      if (faces.length) {
        const face = faces.reduce((largest, candidate) => {
          const largestArea = largest.boundingBox.width * largest.boundingBox.height;
          const candidateArea = candidate.boundingBox.width * candidate.boundingBox.height;
          return candidateArea > largestArea ? candidate : largest;
        });
        updateFaceGaze(face.boundingBox, "native");
        runtime.faceHitCount += 1;
      } else {
        runtime.faceMissCount += 1;
        settleFaceGaze();
      }
    } else {
      const estimate = estimateFaceFromVideoFrame();
      if (estimate) {
        updateFaceGaze(estimate.box, estimate.mode);
        runtime.faceHitCount += 1;
      } else {
        runtime.faceMissCount += 1;
        settleFaceGaze();
      }
    }
  } catch (error) {
    runtime.faceErrorCount += 1;
    if (runtime.mediaPipeDetector) {
      runtime.faceLabel = `model retry ${runtime.faceErrorCount}`;
      runtime.faceEstimateMode = "model retry";
      if (runtime.faceErrorCount >= 3) {
        runtime.mediaPipeDetector = null;
        runtime.mediaPipeFailed = true;
        runtime.faceMode = runtime.faceDetector ? "native" : "coarse";
        runtime.faceLabel = runtime.faceDetector ? "model fallback native" : "model fallback coarse";
        runtime.faceEstimateMode = faceTrackingModeLabel();
      }
      settleFaceGaze();
    } else if (runtime.faceDetector) {
      runtime.faceLabel = `native retry ${runtime.faceErrorCount}`;
      runtime.faceEstimateMode = "native retry";
      settleFaceGaze();
    } else {
      runtime.faceLabel = "error";
      runtime.faceEstimateMode = "error";
      settleFaceGaze();
    }
  } finally {
    runtime.faceLastFrameMs = performance.now() - loopStartedAt;
    runtime.faceDetecting = false;
    renderVisionStatus();
    renderMetrics();
    scheduleFaceTrackingLoop(FACE_TRACKING_INTERVAL_MS);
  }
}

function withTimeout(promise, timeoutMs, message) {
  let timeoutId = null;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function estimateFaceFromVideoFrame() {
  const context = ensureFaceCanvas();
  if (!context) return null;

  const width = runtime.faceCanvas.width;
  const height = runtime.faceCanvas.height;
  context.drawImage(faceVideo, 0, 0, width, height);

  const pixels = context.getImageData(0, 0, width, height).data;
  const skinBox = estimateSkinFaceBox(pixels, width, height);
  if (skinBox) {
    return {
      box: scaleCanvasBoxToVideo(skinBox, width, height),
      mode: "skin",
    };
  }

  const edgeBox = estimateEdgeFaceBox(pixels, width, height);
  if (edgeBox) {
    return {
      box: scaleCanvasBoxToVideo(edgeBox, width, height),
      mode: "edge",
    };
  }

  return null;
}

function estimateSkinFaceBox(pixels, width, height) {
  const mask = new Uint8Array(width * height);

  for (let y = 2; y < height * 0.86; y += 1) {
    for (let x = 2; x < width - 2; x += 1) {
      const index = (y * width + x) * 4;
      if (isSkinPixel(pixels[index], pixels[index + 1], pixels[index + 2])) {
        mask[y * width + x] = 1;
      }
    }
  }

  const visited = new Uint8Array(width * height);
  const stack = [];
  let best = null;
  let bestScore = 0;

  for (let y = 2; y < height * 0.86; y += 1) {
    for (let x = 2; x < width - 2; x += 1) {
      const start = y * width + x;
      if (!mask[start] || visited[start]) continue;

      let count = 0;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let sumX = 0;
      let sumY = 0;

      visited[start] = 1;
      stack.push(start);

      while (stack.length) {
        const current = stack.pop();
        const cx = current % width;
        const cy = Math.floor(current / width);
        count += 1;
        sumX += cx;
        sumY += cy;
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);

        const neighbors = [current - 1, current + 1, current - width, current + width];
        for (const next of neighbors) {
          if (next < 0 || next >= mask.length || visited[next] || !mask[next]) continue;
          const nx = next % width;
          const ny = Math.floor(next / width);
          if (Math.abs(nx - cx) + Math.abs(ny - cy) !== 1) continue;
          visited[next] = 1;
          stack.push(next);
        }
      }

      const componentWidth = maxX - minX + 1;
      const componentHeight = maxY - minY + 1;
      if (count < 18 || componentWidth < 4 || componentHeight < 5) continue;

      const centerX = sumX / count / width;
      const centerY = sumY / count / height;
      const aspect = componentWidth / Math.max(componentHeight, 1);
      const faceAspectScore = clamp(1 - Math.abs(aspect - 0.72), 0.22, 1);
      const verticalScore = clamp(1 - Math.abs(centerY - 0.42) * 1.9, 0.24, 1);
      const sizeScore = clamp(count / 320, 0.22, 1.35);
      const score = count * faceAspectScore * verticalScore * sizeScore;

      if (score > bestScore) {
        bestScore = score;
        const paddedWidth = componentWidth * 1.42;
        const paddedHeight = componentHeight * 1.32;
        best = {
          x: clamp((sumX / count) - paddedWidth / 2, 0, width - paddedWidth),
          y: clamp((sumY / count) - paddedHeight * 0.48, 0, height - paddedHeight),
          width: clamp(paddedWidth, 6, width),
          height: clamp(paddedHeight, 7, height),
        };
      }
    }
  }

  return best;
}

function isSkinPixel(red, green, blue) {
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const chroma = max - min;
  const brightness = max / 255;
  const saturation = max === 0 ? 0 : chroma / max;
  const cb = 128 - 0.168736 * red - 0.331264 * green + 0.5 * blue;
  const cr = 128 + 0.5 * red - 0.418688 * green - 0.081312 * blue;
  const hue = rgbHue(red, green, blue);
  const ycbcrSkin = cb >= 72 && cb <= 145 && cr >= 128 && cr <= 190;
  const hueSkin = (hue <= 58 || hue >= 338) && saturation >= 0.13 && saturation <= 0.82;
  const plausibleRgb = red > 28 && green > 20 && blue > 16 && chroma > 8 && red >= blue * 0.82;

  return plausibleRgb && brightness > 0.13 && (ycbcrSkin || hueSkin);
}

function rgbHue(red, green, blue) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;

  let hue = 0;
  if (max === r) {
    hue = ((g - b) / delta) % 6;
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }

  return (hue * 60 + 360) % 360;
}

function estimateEdgeFaceBox(pixels, width, height) {
  let total = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (let y = 2; y < height * 0.84; y += 1) {
    for (let x = 2; x < width - 2; x += 1) {
      const index = (y * width + x) * 4;
      const right = (y * width + x + 1) * 4;
      const down = ((y + 1) * width + x) * 4;
      const gray = pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114;
      const grayRight = pixels[right] * 0.299 + pixels[right + 1] * 0.587 + pixels[right + 2] * 0.114;
      const grayDown = pixels[down] * 0.299 + pixels[down + 1] * 0.587 + pixels[down + 2] * 0.114;
      const edge = Math.abs(gray - grayRight) + Math.abs(gray - grayDown);
      const verticalBias = 1 - Math.abs(y / height - 0.42) * 1.35;
      const centerBias = 1 - Math.abs(x / width - 0.5) * 0.28;
      const weight = Math.max(0, edge - 18) * clamp(verticalBias, 0.28, 1) * clamp(centerBias, 0.82, 1);

      if (!weight) continue;
      total += weight;
      weightedX += x * weight;
      weightedY += y * weight;
    }
  }

  if (total < 180) return null;

  const centerX = weightedX / total / width;
  const centerY = weightedY / total / height;
  const boxWidth = width * 0.28;
  const boxHeight = height * 0.34;

  return {
    x: clamp(centerX * width - boxWidth / 2, 0, width - boxWidth),
    y: clamp(centerY * height - boxHeight / 2, 0, height - boxHeight),
    width: boxWidth,
    height: boxHeight,
  };
}

function scaleCanvasBoxToVideo(box, canvasWidth, canvasHeight) {
  const videoWidth = faceVideo.videoWidth || canvasWidth;
  const videoHeight = faceVideo.videoHeight || canvasHeight;

  return {
    x: box.x * (videoWidth / canvasWidth),
    y: box.y * (videoHeight / canvasHeight),
    width: box.width * (videoWidth / canvasWidth),
    height: box.height * (videoHeight / canvasHeight),
  };
}

function updateFaceGaze(box, mode = faceTrackingModeLabel()) {
  const videoWidth = faceVideo.videoWidth || 1;
  const videoHeight = faceVideo.videoHeight || 1;
  const rawCenterX = (box.x + box.width / 2) / videoWidth;
  const centerY = (box.y + box.height / 2) / videoHeight;
  const centerX = FACE_TRACKING_MIRROR_X ? 1 - rawCenterX : rawCenterX;
  const profile = presenceProfiles[runtime.presence] || presenceProfiles.attentive;
  const gain = runtime.presence === "still" ? 0.68 : runtime.presence === "expressive" ? 1.46 : 1.16;
  const gazeX = Math.abs(centerX - 0.5) < FACE_GAZE_DEADZONE ? 0 : centerX - 0.5;
  const gazeY = Math.abs(centerY - 0.5) < FACE_GAZE_DEADZONE ? 0 : centerY - 0.5;
  const target = {
    x: clamp(gazeX * 30 * gain, -FACE_GAZE_MAX_X, FACE_GAZE_MAX_X),
    y: clamp(gazeY * 17 * gain, -FACE_GAZE_MAX_Y, FACE_GAZE_MAX_Y),
  };
  const smoothing = clamp(0.48 * profile.micro, 0.18, 0.62);

  runtime.visionGaze = {
    x: runtime.visionGaze.x + (target.x - runtime.visionGaze.x) * smoothing,
    y: runtime.visionGaze.y + (target.y - runtime.visionGaze.y) * smoothing,
  };
  runtime.faceLastSeenAt = performance.now();
  runtime.faceEstimateMode = mode;
  runtime.faceLabel = `${mode} ${Math.round(centerX * 100)},${Math.round(centerY * 100)} eye ${Math.round(runtime.visionGaze.x * 10) / 10}`;
  renderTrackingDot(centerX, centerY);
  renderFaceBox(box);
  renderEyeMotion();
}

function settleFaceGaze(force = false) {
  const recentlySeen = performance.now() - runtime.faceLastSeenAt < FACE_TRACKING_STALE_MS;
  if (recentlySeen && !force) return;

  runtime.visionGaze = {
    x: runtime.visionGaze.x * 0.72,
    y: runtime.visionGaze.y * 0.72,
  };
  if (Math.abs(runtime.visionGaze.x) < 0.08) runtime.visionGaze.x = 0;
  if (Math.abs(runtime.visionGaze.y) < 0.08) runtime.visionGaze.y = 0;
  if (!force && runtime.faceTrackingOn) {
    runtime.faceEstimateMode = runtime.visionGaze.x || runtime.visionGaze.y ? "lost" : faceTrackingModeLabel();
    runtime.faceLabel = runtime.visionGaze.x || runtime.visionGaze.y ? "lost" : `${faceTrackingModeLabel()} search`;
  }
  if (runtime.faceTrackingOn) {
    hideTrackingDot(Boolean(runtime.visionGaze.x || runtime.visionGaze.y));
    hideFaceBox(Boolean(runtime.visionGaze.x || runtime.visionGaze.y));
  }
  renderEyeMotion();
}

function canUseRealtimeVoice() {
  return Boolean(window.RTCPeerConnection && navigator.mediaDevices?.getUserMedia);
}

function setVoiceButtonIdle() {
  const realtimeOk = canUseRealtimeVoice();
  setPressed(micToggle, false);
  micToggle.title = realtimeOk
    ? "Voice is off. Start a direct speech-to-speech session."
    : "Mic is off. Speak a message and pause to send.";
  micToggle.setAttribute("aria-label", realtimeOk ? "Start voice session" : "Turn microphone on");
  input.setAttribute("placeholder", DEFAULT_INPUT_PLACEHOLDER);
}

function setupMic() {
  const realtimeOk = canUseRealtimeVoice();

  if (!realtimeOk && !SpeechRecognition) {
    micToggle.classList.add("is-unavailable");
    micToggle.title = "Voice input is unavailable in this browser.";
    micToggle.setAttribute("aria-label", "Voice unavailable");
    return;
  }

  micToggle.title = realtimeOk
    ? "Voice is off. Start a direct speech-to-speech session."
    : "Mic is off. Speak a message and pause to send.";
  micToggle.setAttribute("aria-label", realtimeOk ? "Start voice session" : "Turn microphone on");

  if (!SpeechRecognition) {
    return;
  }

  runtime.recognition = new SpeechRecognition();
  runtime.recognition.continuous = true;
  runtime.recognition.interimResults = true;
  runtime.recognition.lang = "en-US";

  runtime.recognition.onstart = () => {
    runtime.micStarting = false;
    runtime.micListening = true;
    runtime.micLastError = "";
    setPressed(micToggle, true);
    micToggle.title = "Mic is listening. Speak, then pause to send.";
    micToggle.setAttribute("aria-label", "Turn microphone off");
    input.setAttribute("placeholder", "Speak, then pause...");
    sendPresenceEvent(PresenceEvent.VOICE_WAITING, { source: "mic" });
    setExpression("listening", null, "mic");
    trace("mic live");
    renderMetrics();
  };

  runtime.recognition.onresult = (event) => {
    if (runtime.micPausedForResponse || runtime.micSubmitting) return;

    let finalText = "";
    let interimText = "";
    let hasFinal = false;

    for (let i = 0; i < event.results.length; i += 1) {
      const result = event.results[i];
      const transcript = result[0]?.transcript || "";
      if (result.isFinal) {
        finalText = `${finalText}${transcript}`;
        hasFinal = true;
      } else {
        interimText = `${interimText}${transcript}`;
      }
    }

    runtime.micFinalText = finalText;
    runtime.micInterimText = interimText;
    applyMicTranscript();
    onInput();
    if (input.value.trim()) {
      const transcript = input.value.trim();
      const changed = transcript !== runtime.micLastTranscript;
      const now = performance.now();
      runtime.micLastTranscript = transcript;
      runtime.micHasSpeech = true;
      if (!runtime.micSpeechStartedAt) {
        runtime.micSpeechStartedAt = now;
        runtime.micTranscriptStableSince = now;
      } else if (changed) {
        runtime.micTranscriptStableSince = now;
      }
      if (hasFinal) {
        scheduleMicAutoSubmit(240, "final");
      } else if (changed) {
        scheduleMicAutoSubmit(620, "pause");
      } else if (now - runtime.micSpeechStartedAt > 2200) {
        scheduleMicAutoSubmit(80, "stable");
      }
    }
  };

  runtime.recognition.onerror = (event) => {
    const name = event.error || "error";
    if (runtime.micPausedForResponse && (name === "aborted" || name === "no-speech")) {
      return;
    }

    runtime.micLastError = name;
    trace(`mic ${name}`);

    if (name === "not-allowed" || name === "service-not-allowed" || name === "audio-capture") {
      stopMicRecognition("blocked");
    }
  };

  runtime.recognition.onend = () => {
    runtime.micStarting = false;
    runtime.micListening = false;

    if (runtime.micPausedForResponse) {
      setPressed(micToggle, true);
      micToggle.title = "Mic is paused while the agent responds.";
      micToggle.setAttribute("aria-label", "Turn microphone off");
      input.setAttribute("placeholder", DEFAULT_INPUT_PLACEHOLDER);
      renderMetrics();
      return;
    }

    if (runtime.micOn) {
      if (runtime.micHasSpeech && input.value.trim()) {
        scheduleMicAutoSubmit(80, "stable");
        return;
      }
      scheduleMicRestart();
    } else {
      setVoiceButtonIdle();
    }
  };
}

function applyMicTranscript() {
  const dictated = `${runtime.micFinalText}${runtime.micInterimText}`.trimStart();
  const base = runtime.micBaseText.trimEnd();
  input.value = base && dictated ? `${base} ${dictated}` : base || dictated;
}

function resetMicTurnBuffer() {
  runtime.micBaseText = input.value;
  runtime.micFinalText = "";
  runtime.micInterimText = "";
  runtime.micHasSpeech = false;
  runtime.micSubmitting = false;
  runtime.micLastTranscript = "";
  runtime.micSpeechStartedAt = 0;
  runtime.micTranscriptStableSince = 0;
  runtime.micLastError = "";
}

function scheduleMicAutoSubmit(delay, reason = "pause") {
  window.clearTimeout(runtime.micAutoSubmitTimer);
  if (!runtime.micOn || runtime.micPausedForResponse || !input.value.trim()) return;

  micToggle.title = reason === "final" ? "Mic heard a complete phrase. Sending now." : "Mic heard you. Sending after this pause.";
  input.setAttribute("placeholder", "Sending...");
  runtime.micAutoSubmitTimer = window.setTimeout(() => {
    runtime.micAutoSubmitTimer = null;
    submitMicTranscript();
  }, delay);
}

async function submitMicTranscript() {
  const text = input.value.trim();
  if (!runtime.micOn || runtime.micPausedForResponse || !text || runtime.micSubmitting) return false;

  runtime.micSubmitting = true;
  window.clearInterval(runtime.micWatchTimer);
  runtime.micWatchTimer = null;
  window.clearTimeout(runtime.micAutoSubmitTimer);
  runtime.micAutoSubmitTimer = null;
  micToggle.title = "Mic heard you. Sending now.";
  input.setAttribute("placeholder", "Sending...");
  trace("mic send");
  try {
    return await submitMessageText(text, { source: "mic" });
  } finally {
    runtime.micSubmitting = false;
  }
}

function startMicTranscriptWatcher() {
  window.clearInterval(runtime.micWatchTimer);
  runtime.micWatchTimer = window.setInterval(watchMicTranscript, 120);
}

function watchMicTranscript() {
  if (!runtime.micOn || runtime.micPausedForResponse || runtime.micSubmitting) return;

  const transcript = input.value.trim();
  if (!transcript) return;

  const now = performance.now();
  if (!runtime.micHasSpeech) {
    runtime.micHasSpeech = true;
    runtime.micSpeechStartedAt = now;
    runtime.micTranscriptStableSince = now;
    runtime.micLastTranscript = transcript;
    return;
  }

  if (transcript !== runtime.micLastTranscript) {
    runtime.micLastTranscript = transcript;
    runtime.micTranscriptStableSince = now;
    micToggle.title = "Mic heard you. Sending after this pause.";
    input.setAttribute("placeholder", "Sending...");
    return;
  }

  const stableMs = now - runtime.micTranscriptStableSince;
  const voiceTurnMs = now - runtime.micSpeechStartedAt;
  if (stableMs >= 520 || voiceTurnMs >= 1800) {
    submitMicTranscript();
  }
}

function scheduleMicRestart() {
  if (runtime.micPausedForResponse) return;

  if (runtime.micHasSpeech && input.value.trim()) {
    scheduleMicAutoSubmit(80, "stable");
    return;
  }

  window.clearTimeout(runtime.micRestartTimer);
  runtime.micRestartTimer = window.setTimeout(() => {
    runtime.micRestartTimer = null;
    startMicRecognition();
  }, runtime.micLastError === "no-speech" ? 120 : 320);
}

function startMicRecognition() {
  if (runtime.micVirtualMode) return;
  if (!runtime.recognition || runtime.micPausedForResponse || runtime.micStarting || runtime.micListening) return;

  runtime.micStarting = true;
  try {
    runtime.recognition.start();
  } catch (error) {
    runtime.micStarting = false;
    if (error?.name !== "InvalidStateError") {
      runtime.micOn = false;
      runtime.micPausedForResponse = false;
      setPressed(micToggle, false);
      micToggle.title = "Mic could not start in this browser.";
      micToggle.setAttribute("aria-label", "Turn microphone on");
      input.setAttribute("placeholder", DEFAULT_INPUT_PLACEHOLDER);
      trace("mic start fail");
      renderMetrics();
    }
  }
}

function clearMicTimers() {
  window.clearTimeout(runtime.micRestartTimer);
  window.clearTimeout(runtime.micAutoSubmitTimer);
  window.clearInterval(runtime.micWatchTimer);
  runtime.micRestartTimer = null;
  runtime.micAutoSubmitTimer = null;
  runtime.micWatchTimer = null;
}

function pauseMicForResponse() {
  if (!runtime.micOn) return;

  clearMicTimers();
  runtime.micStarting = false;
  runtime.micListening = false;
  runtime.micSubmitting = false;
  runtime.micPausedForResponse = true;
  runtime.micSpeechStartedAt = 0;
  runtime.micTranscriptStableSince = 0;
  setPressed(micToggle, true);
  micToggle.title = "Mic is paused while the agent responds.";
  micToggle.setAttribute("aria-label", "Turn microphone off");
  input.setAttribute("placeholder", DEFAULT_INPUT_PLACEHOLDER);

  if (runtime.recognition) {
    try {
      runtime.recognition.stop();
    } catch {
      // Already stopped.
    }
  }

  renderMetrics();
}

function maybeResumeMicAfterResponse() {
  window.clearTimeout(runtime.micResumeTimer);
  if (!runtime.micOn || !runtime.micPausedForResponse) return;
  if (runtime.responseStreaming || runtime.speaking || runtime.speechBusy || runtime.speechPlaying || runtime.speechQueue.length || runtime.activeAudio) return;

  runtime.micResumeTimer = window.setTimeout(() => {
    runtime.micResumeTimer = null;
    if (!runtime.micOn || !runtime.micPausedForResponse || hasActiveTurnWork()) return;
    runtime.micPausedForResponse = false;
    resetMicTurnBuffer();
    setPressed(micToggle, true);
    micToggle.title = "Mic is listening. Speak, then pause to send.";
    micToggle.setAttribute("aria-label", "Turn microphone off");
    input.setAttribute("placeholder", "Speak, then pause...");
    trace("mic resume");
    startMicTranscriptWatcher();
    startMicRecognition();
    renderMetrics();
  }, runtime.speakerOn ? 420 : 180);
}

function stopMicRecognition(reason = "off") {
  clearMicTimers();
  window.clearTimeout(runtime.micResumeTimer);
  runtime.micResumeTimer = null;
  runtime.micOn = false;
  runtime.micStarting = false;
  runtime.micListening = false;
  runtime.micSubmitting = false;
  runtime.micPausedForResponse = false;
  runtime.micSpeechStartedAt = 0;
  runtime.micTranscriptStableSince = 0;
  if (reason === "blocked") {
    setPressed(micToggle, false);
    micToggle.title = "Mic is blocked by browser permission.";
    micToggle.setAttribute("aria-label", "Turn microphone on");
    input.setAttribute("placeholder", DEFAULT_INPUT_PLACEHOLDER);
  } else {
    setVoiceButtonIdle();
  }

  if (runtime.recognition) {
    try {
      runtime.recognition.stop();
    } catch {
      // Already stopped.
    }
  }

  if (reason !== "submit" && reason !== "voice") {
    setExpression(input.value.trim() ? "ready" : "idle", null, "mic");
  }
  renderMetrics();
}

async function startRealtimeVoiceSession() {
  if (runtime.realtimeOn || runtime.realtimeConnecting) return;

  if (!canUseRealtimeVoice()) {
    micToggle.title = "Realtime voice is unavailable in this browser.";
    return;
  }

  if (!runtime.apiAvailable) {
    await loadHealth();
  }

  if (!runtime.apiAvailable) {
    runtime.voiceLabel = "no api";
    micToggle.title = "OpenAI is not configured for realtime voice.";
    renderMetrics();
    return;
  }

  const startedAt = performance.now();
  stopMicRecognition("voice");
  cancelSpeechPlayback();
  runtime.realtimeConnecting = true;
  runtime.realtimeStartedAt = startedAt;
  runtime.realtimeTurnStartedAt = 0;
  runtime.realtimeTranscript = "";
  runtime.realtimeVisibleTranscript = "";
  resetRealtimeSpeechPerformance();
  runtime.voiceLabel = runtime.realtimeVoice ? `connecting ${runtime.realtimeVoice}` : "connecting";
  runtime.responseLane = "realtime-connect";
  runtime.metrics.streamOpenMs = null;
  runtime.metrics.firstTokenMs = null;
  runtime.metrics.firstAudioMs = null;
  runtime.metrics.responseMs = null;
  responseText.textContent = "";
  trace("voice connect");
  sendPresenceEvent(PresenceEvent.VOICE_WAITING, { source: "realtime-connect" });
  setPressed(micToggle, true);
  micToggle.title = "Starting direct speech-to-speech...";
  micToggle.setAttribute("aria-label", "Stop voice session");
  input.setAttribute("placeholder", "Voice session...");
  setExpression("listening", startedAt, "realtime");

  runtime.realtimePreviousSpeakerOn = runtime.speakerOn;
  runtime.speakerOn = true;
  setPressed(speakerToggle, true);
  speakerToggle.title = "Realtime voice output is on.";
  speakerToggle.setAttribute("aria-label", "Mute voice output");
  primeAudioOutput();

  let peerConnection = null;
  let dataChannel = null;
  let localStream = null;
  let remoteAudio = null;

  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    peerConnection = new RTCPeerConnection();
    remoteAudio = new Audio();
    remoteAudio.autoplay = true;
    remoteAudio.playsInline = true;
    remoteAudio.muted = !runtime.speakerOn;

    peerConnection.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        remoteAudio.srcObject = stream;
        startRealtimeAudioPerformance(stream);
      }
      remoteAudio.play().catch(() => {
        trace("audio blocked");
        runtime.voiceLabel = "audio blocked";
        renderMetrics();
      });
    };

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      runtime.voiceLabel = state === "connected"
        ? `live ${runtime.realtimeVoice || "voice"}`
        : state;
      if (state === "connected") {
        runtime.responseLane = "realtime-live";
        runtime.metrics.streamOpenMs = performance.now() - startedAt;
        trace("voice live", runtime.metrics.streamOpenMs);
      } else if (state === "failed" || state === "closed" || state === "disconnected") {
        trace(`voice ${state}`);
      }
      renderMetrics();
    };

    dataChannel = peerConnection.createDataChannel("oai-events");
    dataChannel.addEventListener("open", () => {
      runtime.responseLane = "realtime-open";
      trace("events open");
      renderMetrics();
    });
    dataChannel.addEventListener("message", (event) => {
      handleRealtimeEvent(event.data);
    });
    dataChannel.addEventListener("close", () => {
      if (runtime.realtimeOn) {
        trace("events closed");
        renderMetrics();
      }
    });

    for (const track of localStream.getAudioTracks()) {
      peerConnection.addTrack(track, localStream);
    }

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 14000);
    const response = await fetch("/api/realtime/call", {
      method: "POST",
      headers: { "Content-Type": "application/sdp" },
      body: offer.sdp,
      signal: controller.signal,
    });
    window.clearTimeout(timeout);

    const answerSdp = await response.text();
    if (!response.ok) {
      const error = new Error(describeRealtimeApiError(answerSdp) || `Realtime setup failed with ${response.status}`);
      error.realtimeStatus = response.status;
      throw error;
    }

    await peerConnection.setRemoteDescription({ type: "answer", sdp: answerSdp });

    runtime.realtime = {
      peerConnection,
      dataChannel,
      localStream,
      remoteAudio,
    };
    runtime.realtimeOn = true;
    runtime.realtimeConnecting = false;
    runtime.micOn = true;
    runtime.micListening = true;
    runtime.voiceLabel = runtime.realtimeVoice ? `live ${runtime.realtimeVoice}` : "live";
    runtime.responseLane = "realtime-live";
    setPressed(micToggle, true);
    micToggle.title = "Voice is live. Speak naturally; pause to let it answer.";
    micToggle.setAttribute("aria-label", "Stop voice session");
    input.setAttribute("placeholder", "Speak naturally...");
    sendPresenceEvent(PresenceEvent.VOICE_WAITING, { source: "realtime-live" });
    setExpression("listening", null, "realtime");
    trace("voice ready");
    renderMetrics();
  } catch (error) {
    const failure = describeRealtimeStartFailure(error);
    cleanupRealtimeResources({ peerConnection, dataChannel, localStream, remoteAudio });
    runtime.realtime = null;
    runtime.realtimeOn = false;
    runtime.realtimeConnecting = false;
    runtime.micOn = false;
    runtime.micListening = false;
    runtime.speakerOn = runtime.realtimePreviousSpeakerOn;
    runtime.voiceLabel = failure.label;
    runtime.realtimeLastError = failure.detail;
    runtime.responseLane = "realtime-failed";
    setPressed(speakerToggle, runtime.speakerOn);
    setVoiceButtonIdle();
    micToggle.title = failure.detail;
    responseText.textContent = failure.detail === failure.message
      ? failure.message
      : `${failure.message} ${failure.detail}`;
    sendPresenceEvent(PresenceEvent.ERROR, { source: "realtime", detail: failure.detail });
    setExpression("concerned", null, "realtime");
    trace(failure.trace);
    renderMetrics();
  }
}

function describeRealtimeApiError(rawText) {
  if (!rawText) return "";

  try {
    const parsed = JSON.parse(rawText);
    const error = parsed.error;
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
  } catch {
    // The Realtime API sometimes returns plain text for transport errors.
  }

  return rawText.slice(0, 260);
}

function describeRealtimeStartFailure(error) {
  const name = error?.name || "";
  const message = error?.message || "";

  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") {
    return {
      label: "mic blocked",
      trace: "mic blocked",
      message: "Microphone permission is blocked for this browser.",
      detail: "Allow microphone access, or open this app in Safari/Chrome where mic permission is available.",
    };
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return {
      label: "no mic",
      trace: "no mic",
      message: "No microphone was found.",
      detail: "Connect or enable a microphone, then start Voice again.",
    };
  }

  if (name === "AbortError" || message.toLowerCase().includes("timed out")) {
    return {
      label: "timeout",
      trace: "voice timeout",
      message: "Realtime voice setup timed out.",
      detail: "The WebRTC session did not finish connecting before the timeout.",
    };
  }

  if (error?.realtimeStatus) {
    return {
      label: `api ${error.realtimeStatus}`,
      trace: "voice api fail",
      message: "OpenAI Realtime rejected the voice session.",
      detail: message || `Realtime API returned ${error.realtimeStatus}.`,
    };
  }

  return {
    label: "failed",
    trace: "voice fail",
    message: "Realtime voice could not start.",
    detail: message || "The browser could not start the Realtime voice session.",
  };
}

function stopRealtimeVoiceSession(reason = "off") {
  if (!runtime.realtime && !runtime.realtimeConnecting && !runtime.realtimeOn) return;

  const session = runtime.realtime;
  runtime.realtime = null;
  cleanupRealtimeResources(session);
  runtime.realtimeOn = false;
  runtime.realtimeConnecting = false;
  runtime.micOn = false;
  runtime.micListening = false;
  runtime.speaking = false;
  runtime.speechPlaying = false;
  runtime.responseStreaming = false;
  runtime.responseLane = reason === "error" ? "realtime-error" : "idle";
  runtime.voiceLabel = reason === "error" ? "error" : (runtime.realtimeVoice ? `ready ${runtime.realtimeVoice}` : "ready");
  stopRealtimeSpeechPerformance();
  runtime.speakerOn = runtime.realtimePreviousSpeakerOn;
  setPressed(speakerToggle, runtime.speakerOn);
  speakerToggle.title = runtime.speakerOn
    ? "Speaker is on. Responses will play locally in this browser."
    : "Speaker is off. Responses will stay silent.";
  speakerToggle.setAttribute("aria-label", runtime.speakerOn ? "Turn speaker off" : "Turn speaker on");
  setVoiceButtonIdle();
  if (reason === "error") {
    sendPresenceEvent(PresenceEvent.ERROR, { source: "realtime" });
  } else {
    sendPresenceEvent(PresenceEvent.RESET, { text: input.value });
  }
  setExpression(input.value.trim() ? "ready" : "idle", null, "realtime");
  trace(reason === "error" ? "voice error" : "voice off");
  renderMetrics();
}

function cleanupRealtimeResources(session = null) {
  stopRealtimeAudioPerformance();

  if (!session) return;

  try {
    session.dataChannel?.close();
  } catch {
    // Already closed.
  }

  try {
    session.peerConnection?.getSenders?.().forEach((sender) => sender.track?.stop());
    session.peerConnection?.close();
  } catch {
    // Already closed.
  }

  for (const track of session.localStream?.getTracks?.() || []) {
    track.stop();
  }

  if (session.remoteAudio) {
    session.remoteAudio.pause();
    session.remoteAudio.srcObject = null;
  }
}

function handleRealtimeEvent(rawData) {
  let event;
  try {
    event = JSON.parse(rawData);
  } catch {
    return;
  }

  const type = event.type || "";
  runtime.voiceLabel = type.startsWith("error") ? "error" : runtime.voiceLabel;

  if (type === "session.created" || type === "session.updated") {
    trace(type === "session.created" ? "session" : "session update");
  } else if (type === "input_audio_buffer.speech_started") {
    runtime.realtimeTurnStartedAt = performance.now();
    resetRealtimeSpeechPerformance();
    runtime.metrics.attention = 1;
    runtime.metrics.completion = 0.2;
    runtime.responseLane = "realtime-listen";
    responseText.textContent = "";
    trace("heard");
    setPresenceState(PresenceState.READING, { source: "realtime-audio" });
    setExpression("listening", null, "realtime");
  } else if (type === "input_audio_buffer.speech_stopped") {
    runtime.metrics.completion = 0.78;
    runtime.responseLane = "realtime-think";
    trace("pause");
    sendPresenceEvent(PresenceEvent.USER_PAUSE, {
      text: runtime.realtimeTranscript || "voice input",
      completion: runtime.metrics.completion,
    });
    setExpression("thinking", null, "realtime");
  } else if (type === "response.created") {
    resetRealtimeSpeechPerformance();
    runtime.realtimeTranscript = "";
    runtime.realtimeVisibleTranscript = "";
    responseText.textContent = "";
    runtime.responseLane = "realtime-response";
    runtime.speaking = false;
    runtime.speechPlaying = false;
    trace("response");
    sendPresenceEvent(PresenceEvent.SUBMIT, { source: "realtime" });
    setExpression("thinking", null, "realtime");
  } else if (
    type === "response.output_audio_transcript.delta" ||
    type === "response.audio_transcript.delta" ||
    type === "response.output_text.delta" ||
    type === "response.text.delta"
  ) {
    const delta = event.delta || "";
    if (delta) {
      if (runtime.metrics.firstTokenMs === null && runtime.realtimeTurnStartedAt) {
        sendPresenceEvent(PresenceEvent.TOKEN, { source: "realtime" });
        runtime.metrics.firstTokenMs = performance.now() - runtime.realtimeTurnStartedAt;
        recordSample("firstToken", runtime.metrics.firstTokenMs);
        trace("token", runtime.metrics.firstTokenMs);
      }
      runtime.realtimeTranscript += delta;
      driveRealtimeSpeechFromDelta(delta);
    }
  } else if (type === "response.output_audio.delta" || type === "response.audio.delta") {
    if (runtime.metrics.firstAudioMs === null && runtime.realtimeTurnStartedAt) {
      runtime.metrics.firstAudioMs = performance.now() - runtime.realtimeTurnStartedAt;
      recordSample("firstAudio", runtime.metrics.firstAudioMs);
      trace("audio", runtime.metrics.firstAudioMs);
    }
    markRealtimeAudioDelta();
    ensureRealtimeSpeaking({
      allowFallbackMouth: !runtime.realtimeSpeechQueue.length && !runtime.realtimeWordBuffer,
    });
  } else if (
    type === "response.output_audio.done" ||
    type === "response.audio.done" ||
    type === "response.done" ||
    type === "response.completed"
  ) {
    flushRealtimeWordBuffer();
    if (runtime.realtimeTurnStartedAt && !runtime.realtimeDoneMarked) {
      const responseMs = performance.now() - runtime.realtimeTurnStartedAt;
      runtime.metrics.responseMs = responseMs;
      runtime.metrics.turns += 1;
      recordSample("response", responseMs);
      trace("done", responseMs);
      runtime.realtimeDoneMarked = true;
    } else if (!runtime.realtimeDoneMarked) {
      trace("done");
      runtime.realtimeDoneMarked = true;
    }
    runtime.realtimeResponseDonePending = true;
    if (runtime.realtimeSpeechQueue.length || runtime.realtimeSpeechTimer) {
      scheduleRealtimeResponseFinish(REALTIME_FINISH_GRACE_MS);
    } else {
      scheduleRealtimeResponseFinish(180);
    }
  } else if (type === "error") {
    trace("voice error");
    runtime.voiceLabel = "error";
    stopRealtimeSpeechPerformance();
    sendPresenceEvent(PresenceEvent.ERROR, { source: "realtime" });
    setExpression("concerned", null, "realtime");
  }

  renderMetrics();
}

async function toggleMic() {
  if (runtime.realtimeOn || runtime.realtimeConnecting) {
    stopRealtimeVoiceSession();
    return;
  }

  if (canUseRealtimeVoice()) {
    await startRealtimeVoiceSession();
    return;
  }

  if (!runtime.recognition) return;

  if (runtime.micOn) {
    stopMicRecognition();
    trace("mic off");
    return;
  }

  window.clearTimeout(runtime.micResumeTimer);
  runtime.micResumeTimer = null;
  runtime.micOn = true;
  runtime.micPausedForResponse = false;
  resetMicTurnBuffer();
  setPressed(micToggle, true);
  micToggle.title = "Mic is starting...";
  micToggle.setAttribute("aria-label", "Turn microphone off");
  input.setAttribute("placeholder", "Starting mic...");
  trace("mic start");
  startMicTranscriptWatcher();
  startMicRecognition();
  renderMetrics();
}

function waitForTestFrame(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitForTestCondition(check, timeoutMs = 5000, intervalMs = 40) {
  const startedAt = performance.now();
  while (performance.now() - startedAt < timeoutMs) {
    if (check()) return true;
    await waitForTestFrame(intervalMs);
  }

  return false;
}

function testTranscriptChunks(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return words.map((_, index) => words.slice(0, index + 1).join(" "));
}

async function simulateMicTurn(text = "Hey how's it going", options = {}) {
  const previousApiAvailable = runtime.apiAvailable;
  const previousApiLabel = runtime.apiLabel;
  const previousSpeakerOn = runtime.speakerOn;
  const previousMicOn = runtime.micOn;
  const previousMicVirtualMode = runtime.micVirtualMode;
  const startedTurns = runtime.metrics.turns;
  const chunks = options.chunks || testTranscriptChunks(text);
  const chunkDelay = Number(options.chunkDelay || 140);

  cancelActiveTurn();
  cancelResponsePrefetch();
  cancelSpeechPlayback();
  stopMicRecognition("test");
  runtime.apiAvailable = false;
  runtime.apiLabel = "test-local";
  runtime.speakerOn = false;
  setPressed(speakerToggle, false);
  speakerToggle.setAttribute("aria-label", "Turn speaker on");
  speakerToggle.title = "Speaker is off. Responses will stay silent.";
  responseText.textContent = "";
  input.value = "";
  syncComposerInput();

  runtime.micVirtualMode = true;
  runtime.micOn = true;
  runtime.micBaseText = "";
  runtime.micFinalText = "";
  runtime.micInterimText = "";
  runtime.micHasSpeech = false;
  runtime.micLastTranscript = "";
  runtime.micSpeechStartedAt = 0;
  runtime.micTranscriptStableSince = 0;
  setPressed(micToggle, true);
  micToggle.title = "Mic test is feeding a simulated transcript.";
  micToggle.setAttribute("aria-label", "Turn microphone off");
  input.setAttribute("placeholder", "Mic test...");
  trace("mic test");
  startMicTranscriptWatcher();

  for (const chunk of chunks) {
    if (!runtime.micOn) break;
    input.value = chunk;
    onInput();
    await waitForTestFrame(chunkDelay);
  }

  const submitted = await waitForTestCondition(() => runtime.metrics.turns > startedTurns, Number(options.timeoutMs || 5200));
  await waitForTestCondition(() => !runtime.responseStreaming && !runtime.localStreamTimer && !runtime.speaking, 2500);
  await waitForTestCondition(() => runtime.micOn && !runtime.micPausedForResponse, 1500);

  const result = {
    submitted,
    micOn: runtime.micOn,
    micPausedForResponse: runtime.micPausedForResponse,
    micListening: runtime.micListening,
    persistentMic: runtime.micOn && !runtime.micPausedForResponse,
    turnsDelta: runtime.metrics.turns - startedTurns,
    inputValue: input.value,
    responseText: responseText.textContent,
    trace: [...runtime.trace],
  };

  runtime.apiAvailable = previousApiAvailable;
  runtime.apiLabel = previousApiLabel;
  runtime.speakerOn = previousSpeakerOn;
  runtime.micVirtualMode = previousMicVirtualMode;
  setPressed(speakerToggle, previousSpeakerOn);
  speakerToggle.setAttribute("aria-label", previousSpeakerOn ? "Turn speaker off" : "Turn speaker on");
  speakerToggle.title = previousSpeakerOn
    ? "Speaker is on. Responses will play locally in this browser."
    : "Speaker is off. Responses will stay silent.";

  if (!previousMicOn) {
    stopMicRecognition("test");
  } else {
    runtime.micOn = true;
    runtime.micPausedForResponse = false;
    resetMicTurnBuffer();
    setPressed(micToggle, true);
    micToggle.title = "Mic is listening. Speak, then pause to send.";
    micToggle.setAttribute("aria-label", "Turn microphone off");
    input.setAttribute("placeholder", "Speak, then pause...");
    startMicTranscriptWatcher();
    startMicRecognition();
  }

  renderMetrics();

  return result;
}

async function simulateRealtimeConnect(options = {}) {
  const timeoutMs = Number(options.timeoutMs || 8000);
  await startRealtimeVoiceSession();
  await waitForTestCondition(() => {
    const state = runtime.realtime?.peerConnection?.connectionState || "";
    return state === "connected" || runtime.realtimeOn || runtime.voiceLabel === "failed" || runtime.voiceLabel === "error";
  }, timeoutMs, 80);

  const state = runtime.realtime?.peerConnection?.connectionState || "none";
  const result = {
    realtimeOn: runtime.realtimeOn,
    connectionState: state,
    voiceLabel: runtime.voiceLabel,
    lane: runtime.responseLane,
    trace: [...runtime.trace],
  };

  stopRealtimeVoiceSession("test");
  return result;
}

async function simulateRealtimeSpeechStream(text = "Maybe the face should listen before it answers.", options = {}) {
  const previousRealtimeOn = runtime.realtimeOn;
  const previousVoiceLabel = runtime.voiceLabel;
  const previousLane = runtime.responseLane;
  const chunkDelay = Number(options.chunkDelay || 74);
  const audioDelay = Number(options.audioDelay || 120);
  const chunks = options.chunks || (text.match(/\S+\s*/g) || [text]);
  const mouthSamples = [];

  cancelSpeechPlayback();
  resetRealtimeSpeechPerformance();
  runtime.realtimeOn = true;
  runtime.realtimeTurnStartedAt = performance.now();
  runtime.realtimeTranscript = "";
  responseText.textContent = "";

  handleRealtimeEvent(JSON.stringify({ type: "response.created" }));
  await waitForTestFrame(audioDelay);
  handleRealtimeEvent(JSON.stringify({ type: "response.output_audio.delta", delta: "test-audio" }));

  for (const chunk of chunks) {
    handleRealtimeEvent(JSON.stringify({ type: "response.output_audio_transcript.delta", delta: chunk }));
    mouthSamples.push({
      chunk,
      mouth: mouth.getAttribute("d"),
      eye: eyeLeftGroup.style.transform,
    });
    await waitForTestFrame(chunkDelay);
    handleRealtimeEvent(JSON.stringify({ type: "response.output_audio.delta", delta: "test-audio" }));
  }

  handleRealtimeEvent(JSON.stringify({ type: "response.output_audio.done" }));
  await waitForTestCondition(() => runtime.state === "listening" && !runtime.speaking, 1800, 50);

  const result = {
    text,
    responseText: responseText.textContent,
    state: runtime.state,
    speaking: runtime.speaking,
    mouth: mouth.getAttribute("d"),
    eye: eyeLeftGroup.style.transform,
    mouthSamples,
    trace: [...runtime.trace],
  };

  runtime.realtimeOn = previousRealtimeOn;
  runtime.voiceLabel = previousVoiceLabel;
  runtime.responseLane = previousLane;
  if (!previousRealtimeOn) {
    stopRealtimeSpeechPerformance();
  }
  renderMetrics();

  return result;
}

async function simulateRealtimeAudioPerformance(options = {}) {
  const previousRealtimeOn = runtime.realtimeOn;
  const previousVoiceLabel = runtime.voiceLabel;
  const previousLane = runtime.responseLane;
  const samples = [];
  const frames = options.frames || [
    { level: 0.04, centroid: 0.34, sibilance: 0.16, low: 0.14, mid: 0.16, high: 0.04, onset: 0.04 },
    { level: 0.48, centroid: 0.42, sibilance: 0.2, low: 0.36, mid: 0.42, high: 0.11, onset: 0.44 },
    { level: 0.74, centroid: 0.28, sibilance: 0.12, low: 0.64, mid: 0.38, high: 0.07, onset: 0.26 },
    { level: 0.4, centroid: 0.68, sibilance: 0.9, low: 0.08, mid: 0.18, high: 0.34, onset: -0.34 },
    { level: 0.14, centroid: 0.52, sibilance: 0.4, low: 0.08, mid: 0.14, high: 0.09, onset: -0.26 },
    { level: 0.02, centroid: 0.35, sibilance: 0.1, low: 0.02, mid: 0.02, high: 0.01, onset: -0.12 },
  ];

  cancelSpeechPlayback();
  resetRealtimeSpeechPerformance();
  stopRealtimeAudioPerformance();
  runtime.realtimeOn = true;
  runtime.realtimeTurnStartedAt = performance.now();
  runtime.realtimeTranscript = "";
  runtime.realtimeVisibleTranscript = "";
  responseText.textContent = "";
  handleRealtimeEvent(JSON.stringify({ type: "response.created" }));
  handleRealtimeEvent(JSON.stringify({ type: "response.output_audio.delta", delta: "test-audio" }));

  for (const frame of frames) {
    renderRealtimeAudioPerformance(frame);
    samples.push({
      level: frame.level,
      centroid: frame.centroid,
      mouth: mouth.getAttribute("d"),
      eye: eyeLeftGroup.style.transform,
    });
    await waitForTestFrame(Number(options.frameDelay || 52));
  }

  runtime.realtimeAudioActive = false;
  runtime.realtimeAudioEye = { x: 0, y: 0 };
  renderMouth(realtimeMouthShapes.rest);
  runtime.speaking = false;
  runtime.speechPlaying = false;
  runtime.responseLane = "realtime-live";
  setExpression("listening", null, "realtime");

  const uniqueMouths = new Set(samples.map((sample) => sample.mouth));
  const result = {
    moved: uniqueMouths.size > 2,
    uniqueMouths: uniqueMouths.size,
    samples,
    mouth: mouth.getAttribute("d"),
    eye: eyeLeftGroup.style.transform,
    trace: [...runtime.trace],
  };

  runtime.realtimeOn = previousRealtimeOn;
  runtime.voiceLabel = previousVoiceLabel;
  runtime.responseLane = previousLane;
  if (!previousRealtimeOn) {
    stopRealtimeSpeechPerformance();
  }
  renderMetrics();

  return result;
}

function installRuntimeTestHarness() {
  const localHost = ["127.0.0.1", "localhost", "::1"].includes(window.location.hostname);
  if (!localHost) return;

  window.__faceRuntimeTest = {
    simulateMicTurn,
    simulateRealtimeConnect,
    simulateRealtimeSpeechStream,
    simulateRealtimeAudioPerformance,
    state: () => ({
      presenceState: runtime.presenceState,
      state: runtime.state,
      micOn: runtime.micOn,
      micListening: runtime.micListening,
      realtimeOn: runtime.realtimeOn,
      realtimeConnecting: runtime.realtimeConnecting,
      voiceLabel: runtime.voiceLabel,
      speakerOn: runtime.speakerOn,
      inputValue: input.value,
      responseText: responseText.textContent,
      mouth: mouth.getAttribute("d"),
      eye: eyeLeftGroup.style.transform,
      controls: controlsSummary(),
      controllerComposition: controllerCompositionText(),
      controllerCoherence: controllerCoherenceEvidence(),
      controllerDecisionTrace: controllerDecisionTraceEvidence(),
      faceControls: runtime.faceControls,
      faceDecisionReport: runtime.faceDecisionReport,
      faceFrameReport: runtime.faceFrameReport,
      turns: runtime.metrics.turns,
      trace: [...runtime.trace],
    }),
  };

  if (!runtimeTestMode) return;

  const panel = document.createElement("div");
  panel.className = "dev-test-panel";
  panel.innerHTML = `
    <button class="dev-test-button" id="voiceTestButton" type="button">Voice test</button>
    <output class="dev-test-output" id="voiceTestStatus">ready</output>
    <button class="dev-test-button" id="realtimeTestButton" type="button">Realtime test</button>
    <output class="dev-test-output" id="realtimeTestStatus">ready</output>
    <button class="dev-test-button" id="speechSyncTestButton" type="button">Speech sync test</button>
    <output class="dev-test-output" id="speechSyncTestStatus">ready</output>
    <button class="dev-test-button" id="audioPipeTestButton" type="button">Audio pipe test</button>
    <output class="dev-test-output" id="audioPipeTestStatus">ready</output>
  `;
  document.body.append(panel);

  const button = panel.querySelector("#voiceTestButton");
  const status = panel.querySelector("#voiceTestStatus");
  const realtimeButton = panel.querySelector("#realtimeTestButton");
  const realtimeStatus = panel.querySelector("#realtimeTestStatus");
  const speechSyncButton = panel.querySelector("#speechSyncTestButton");
  const speechSyncStatus = panel.querySelector("#speechSyncTestStatus");
  const audioPipeButton = panel.querySelector("#audioPipeTestButton");
  const audioPipeStatus = panel.querySelector("#audioPipeTestStatus");
  const runVoiceTest = async () => {
    button.disabled = true;
    status.textContent = "running";
    const result = await simulateMicTurn();
    status.textContent = result.submitted && result.persistentMic ? `sent ${result.turnsDelta}` : "failed";
    document.documentElement.dataset.voiceTestStatus = status.textContent;
    document.documentElement.dataset.voiceTestMic = result.persistentMic ? "persistent" : "stopped";
    document.documentElement.dataset.voiceTestTrace = result.trace.join(" -> ");
    document.documentElement.dataset.voiceTestResponse = result.responseText;
    button.disabled = false;
    return result;
  };

  const runRealtimeTest = async () => {
    realtimeButton.disabled = true;
    realtimeStatus.textContent = "running";
    const result = await simulateRealtimeConnect();
    const ok = result.realtimeOn || result.connectionState === "connected" || result.connectionState === "connecting";
    realtimeStatus.textContent = ok ? result.connectionState || "connected" : "failed";
    document.documentElement.dataset.realtimeTestStatus = realtimeStatus.textContent;
    document.documentElement.dataset.realtimeTestVoice = result.voiceLabel;
    document.documentElement.dataset.realtimeTestTrace = result.trace.join(" -> ");
    realtimeButton.disabled = false;
    return result;
  };

  const runSpeechSyncTest = async () => {
    speechSyncButton.disabled = true;
    speechSyncStatus.textContent = "running";
    const result = await simulateRealtimeSpeechStream();
    const moved = result.mouthSamples.some((sample) => sample.mouth !== result.mouth);
    speechSyncStatus.textContent = moved && result.state === "listening" ? "synced" : "check";
    document.documentElement.dataset.speechSyncTestStatus = speechSyncStatus.textContent;
    document.documentElement.dataset.speechSyncTestTrace = result.trace.join(" -> ");
    document.documentElement.dataset.speechSyncTestResponse = result.responseText;
    document.documentElement.dataset.speechSyncTestSamples = JSON.stringify(result.mouthSamples.slice(0, 5));
    speechSyncButton.disabled = false;
    return result;
  };

  const runAudioPipeTest = async () => {
    audioPipeButton.disabled = true;
    audioPipeStatus.textContent = "running";
    const result = await simulateRealtimeAudioPerformance();
    audioPipeStatus.textContent = result.moved ? `moved ${result.uniqueMouths}` : "check";
    document.documentElement.dataset.audioPipeTestStatus = audioPipeStatus.textContent;
    document.documentElement.dataset.audioPipeTestTrace = result.trace.join(" -> ");
    document.documentElement.dataset.audioPipeTestSamples = JSON.stringify(result.samples);
    audioPipeButton.disabled = false;
    return result;
  };

  button.addEventListener("click", runVoiceTest);
  realtimeButton.addEventListener("click", runRealtimeTest);
  speechSyncButton.addEventListener("click", runSpeechSyncTest);
  audioPipeButton.addEventListener("click", runAudioPipeTest);

  if (runtimeTestOptions.get("autorunVoiceTest") === "1") {
    window.setTimeout(runVoiceTest, 120);
  }
  if (runtimeTestOptions.get("autorunRealtimeTest") === "1") {
    window.setTimeout(runRealtimeTest, 240);
  }
  if (runtimeTestOptions.get("autorunSpeechSyncTest") === "1") {
    window.setTimeout(runSpeechSyncTest, 240);
  }
  if (runtimeTestOptions.get("autorunAudioPipeTest") === "1") {
    window.setTimeout(runAudioPipeTest, 240);
  }
}

function renderMetrics() {
  metricState.textContent = runtime.presenceState;
  metricRenderer.textContent = runtime.state;
  metricPresence.textContent = runtime.presence;
  metricSource.textContent = runtime.expressionSource;
  metricExpression.textContent = ms(runtime.metrics.firstExpressionMs);
  metricLocal.textContent = ms(runtime.metrics.localReadMs);
  metricEvents.textContent = String(runtime.events);
  metricApi.textContent = runtime.apiLabel;
  metricVoice.textContent = runtime.voiceLabel;
  metricLane.textContent = runtime.responseLane;
  metricStream.textContent = ms(runtime.metrics.streamOpenMs);
  metricToken.textContent = ms(runtime.metrics.firstTokenMs);
  metricAudio.textContent = ms(runtime.metrics.firstAudioMs);
  metricSpeculate.textContent = ms(runtime.metrics.speculationMs);
  metricResponse.textContent = ms(runtime.metrics.responseMs);
  metricTokenP50.textContent = ms(percentile(runtime.samples.firstToken, 0.5));
  metricTokenP90.textContent = ms(percentile(runtime.samples.firstToken, 0.9));
  metricTurns.textContent = String(runtime.metrics.turns);
  metricAttention.textContent = percent(runtime.metrics.attention);
  metricArousal.textContent = percent(runtime.metrics.arousal);
  metricComplete.textContent = percent(runtime.metrics.completion);
  metricCanceled.textContent = String(runtime.staleJobs);
  metricPrepared.textContent = runtime.prepared ? runtime.prepared.intent : "no";
  metricFace.textContent = runtime.faceLabel;
  metricControls.textContent = controlsSummary();
  metricControls.dataset.controllerComposition = controllerCompositionText();
  metricControls.dataset.controllerEvidence = controllerEvidenceText(activeFaceControls(), activeFaceDecisionReport());
  metricControls.dataset.controllerFrame = frameSummary();
  applyControllerCoherenceDataset(metricControls);
  applyControllerDecisionTraceDataset(metricControls);
  metricTrace.textContent = runtime.trace.length ? runtime.trace.join(" -> ") : "--";
  metricBenchmark.textContent = runtime.benchmark.summary;
}

function handleComposerKeys(event) {
  if (event.isComposing || event.keyCode === 229) return;

  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    syncComposerInput();
    if (input.value.trim()) {
      composer.requestSubmit();
    } else {
      setExpression("listening", null, "local-reflex");
    }
  }
}

async function loadHealth() {
  try {
    const response = await fetch("/api/health", { cache: "no-store" });
    if (!response.ok) return;
    const health = await response.json();
    runtime.apiAvailable = Boolean(health.openaiConfigured);
    runtime.apiLabel = runtime.apiAvailable ? health.model : "local";
    runtime.realtimeModel = health.realtimeModel || "";
    runtime.realtimeVoice = health.realtimeVoice || "";
    if (!runtime.realtimeOn && !runtime.realtimeConnecting) {
      runtime.voiceLabel = runtime.apiAvailable && runtime.realtimeVoice ? `ready ${runtime.realtimeVoice}` : "off";
    }
  } catch {
    runtime.apiAvailable = false;
    runtime.apiLabel = "local";
    runtime.voiceLabel = "off";
  } finally {
    renderMetrics();
  }
}

function boot() {
  setupMic();
  setupFaceTracking();
  setPresenceState(PresenceState.IDLE, { source: "boot" });
  setPresence(runtime.presence);
  setExpression("idle", null, "idle", { immediate: true });
  setVoiceButtonIdle();
  setPressed(speakerToggle, false);
  speakerToggle.title = "Speaker is off. Responses will stay silent.";
  speakerToggle.setAttribute("aria-label", "Turn speaker on");
  setPressed(faceToggle, false);
  setPressed(metricsToggle, false);
  setPressed(compareToggle, false);
  applyInitialViewState();

  input.addEventListener("input", onInput);
  input.addEventListener("keydown", handleComposerKeys);
  window.addEventListener("resize", syncComposerInput);
  composer.addEventListener("submit", onSubmit);
  for (const button of presenceButtons) {
    button.addEventListener("click", () => setPresence(button.dataset.presence));
  }
  micToggle.addEventListener("click", toggleMic);
  speakerToggle.addEventListener("click", toggleSpeaker);
  faceToggle.addEventListener("click", toggleFaceTracking);
  metricsToggle.addEventListener("click", toggleMetrics);
  compareToggle.addEventListener("click", toggleComparisonMode);
  compareBack.addEventListener("click", () => setComparisonMode(false));
  compareForm.addEventListener("submit", runComparisonDemo);
  compareVoteSpinner.addEventListener("click", () => setComparisonVote("spinner"));
  compareVotePresence.addEventListener("click", () => setComparisonVote("presence"));
  benchmarkButton.addEventListener("click", runBenchmark);
  syncComposerInput();
  loadHealth();
  installRuntimeTestHarness();
  startMicroPresence();
}

boot();
