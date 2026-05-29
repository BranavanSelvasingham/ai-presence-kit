import { createReadStream, existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
loadEnv(join(ROOT, ".env"));

const PORT = Number(process.env.PORT || 8058);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const OPENAI_SPECULATE_MODEL = process.env.OPENAI_SPECULATE_MODEL || "gpt-5.4-nano";
const OPENAI_RESPONSE_REASONING_EFFORT = process.env.OPENAI_RESPONSE_REASONING_EFFORT || "none";
const OPENAI_SPECULATE_REASONING_EFFORT = process.env.OPENAI_SPECULATE_REASONING_EFFORT || "none";
const OPENAI_TEXT_VERBOSITY = process.env.OPENAI_TEXT_VERBOSITY || "low";
const OPENAI_RESPONSE_MAX_OUTPUT_TOKENS = Number(process.env.OPENAI_RESPONSE_MAX_OUTPUT_TOKENS || 260);
const OPENAI_SPECULATE_MAX_OUTPUT_TOKENS = Number(process.env.OPENAI_SPECULATE_MAX_OUTPUT_TOKENS || 120);
const OPENAI_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2";
const OPENAI_REALTIME_VOICE = process.env.OPENAI_REALTIME_VOICE || "marin";
const OPENAI_REALTIME_CALL_TIMEOUT_MS = Number(process.env.OPENAI_REALTIME_CALL_TIMEOUT_MS || 14000);
const OPENAI_TTS_MODEL = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
const OPENAI_TTS_VOICE = process.env.OPENAI_TTS_VOICE || "marin";
const OPENAI_TTS_FORMAT = process.env.OPENAI_TTS_FORMAT || "wav";

const MIME_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
]);

const EXPRESSIONS = new Set([
  "idle",
  "listening",
  "reading",
  "thinking",
  "curious",
  "amused",
  "delighted",
  "uncertain",
  "concerned",
  "ready",
  "speaking",
]);

const SPECULATION_INSTRUCTIONS = [
  "You are the slow speculative perception lane for a minimal expressive AI face.",
  "The user may still be typing. Do not answer them.",
  "Infer only leading-edge UI control signals for the face.",
  "Keep labels short and conservative; the face can react to uncertainty, but must not overcommit.",
].join(" ");

const SPECULATION_TEXT_FORMAT = {
  type: "json_schema",
  name: "face_speculation",
  strict: true,
  schema: {
    type: "object",
    properties: {
      intent: {
        type: "string",
        description: "Short label for the likely user intent, such as question, request, idea, or still_forming.",
      },
      tone: {
        type: "string",
        description: "Short label for the user's apparent tone, such as steady, curious, uncertain, bright, or frustrated.",
      },
      completion: {
        type: "number",
        description: "Likelihood from 0 to 1 that the user has finished the thought.",
      },
      expression: {
        type: "string",
        enum: ["listening", "reading", "thinking", "curious", "amused", "delighted", "uncertain", "concerned", "ready"],
        description: "The best face expression for this partial input.",
      },
      confidence: {
        type: "number",
        description: "Confidence from 0 to 1 in this speculative read.",
      },
      prepared: {
        type: "string",
        description: "Brief response-direction phrase, not a user-facing reply.",
      },
    },
    required: ["intent", "tone", "completion", "expression", "confidence", "prepared"],
    additionalProperties: false,
  },
};

const RESPONSE_INSTRUCTIONS = [
  "You are a concise AI agent inside a low-latency expressive face prototype.",
  "Respond naturally to the user's message.",
  "Default to one or two short sentences.",
  "Keep responses concrete and conversational.",
  "If a typing-time speculative read is supplied, use it only as weak context.",
  "Do not add unsolicited follow-up offers or implementation details.",
  "Do not mention implementation details unless the user asks.",
].join(" ");

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);

    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, {
        ok: true,
        openaiConfigured: Boolean(OPENAI_API_KEY),
        api: "responses",
        model: OPENAI_MODEL,
        speculateModel: OPENAI_SPECULATE_MODEL,
        responseReasoningEffort: OPENAI_RESPONSE_REASONING_EFFORT,
        speculateReasoningEffort: OPENAI_SPECULATE_REASONING_EFFORT,
        textVerbosity: OPENAI_TEXT_VERBOSITY,
        responseMaxOutputTokens: OPENAI_RESPONSE_MAX_OUTPUT_TOKENS,
        speculateMaxOutputTokens: OPENAI_SPECULATE_MAX_OUTPUT_TOKENS,
        realtimeModel: OPENAI_REALTIME_MODEL,
        realtimeVoice: OPENAI_REALTIME_VOICE,
        realtimeCallTimeoutMs: OPENAI_REALTIME_CALL_TIMEOUT_MS,
        ttsModel: OPENAI_TTS_MODEL,
        ttsVoice: OPENAI_TTS_VOICE,
        ttsFormat: OPENAI_TTS_FORMAT,
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/speculate") {
      await handleSpeculate(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/respond") {
      await handleRespond(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/speech") {
      await handleSpeech(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/realtime/call") {
      await handleRealtimeCall(request, response);
      return;
    }

    if (request.method === "GET" || request.method === "HEAD") {
      await serveStatic(url.pathname, request, response);
      return;
    }

    sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    if (!response.headersSent) {
      sendJson(response, error.status || 500, { error: error.message || "Internal server error" });
    } else {
      response.end();
    }
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Low-latency face runtime on http://127.0.0.1:${PORT}`);
  console.log(`OpenAI configured: ${OPENAI_API_KEY ? "yes" : "no"}`);
});

function loadEnv(filePath) {
  if (!existsSync(filePath)) return;

  const contents = readFileSync(filePath, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equalsAt = line.indexOf("=");
    if (equalsAt === -1) continue;

    const key = line.slice(0, equalsAt).trim();
    const value = parseEnvValue(line.slice(equalsAt + 1).trim());
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function parseEnvValue(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

async function handleSpeculate(request, response) {
  requireOpenAI();
  const { text = "", features = {} } = await readJson(request);

  const payload = await createResponse({
    model: OPENAI_SPECULATE_MODEL,
    instructions: SPECULATION_INSTRUCTIONS,
    input: [
      {
        role: "user",
        content: JSON.stringify({
          partialText: String(text).slice(0, 1200),
          localFeatures: compactFeatures(features),
        }),
      },
    ],
    max_output_tokens: OPENAI_SPECULATE_MAX_OUTPUT_TOKENS,
    reasoning: { effort: OPENAI_SPECULATE_REASONING_EFFORT },
    text: {
      verbosity: OPENAI_TEXT_VERBOSITY,
      format: SPECULATION_TEXT_FORMAT,
    },
    signal: abortSignalFor(request, response),
  });

  sendJson(response, 200, normalizeSpeculation(extractOutputText(payload)));
}

async function handleRespond(request, response) {
  requireOpenAI();
  const { text = "", features = {}, prepared = null } = await readJson(request);
  const signal = abortSignalFor(request, response);
  const preparedRead = compactPrepared(prepared);
  const responseContext = [
    String(text).slice(0, 6000),
    "",
    "Local leading-edge features:",
    JSON.stringify(compactFeatures(features)),
  ];

  if (preparedRead) {
    responseContext.push("", "Typing-time speculative read:", JSON.stringify(preparedRead));
  }

  response.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  sendSse(response, "meta", {
    model: OPENAI_MODEL,
    endpoint: "/v1/responses",
    startedAt: Date.now(),
    prepared: Boolean(preparedRead),
    preparedIntent: preparedRead ? preparedRead.intent : null,
  });

  const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: openAIHeaders(),
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: RESPONSE_INSTRUCTIONS,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: responseContext.join("\n"),
            },
          ],
        },
      ],
      max_output_tokens: OPENAI_RESPONSE_MAX_OUTPUT_TOKENS,
      reasoning: { effort: OPENAI_RESPONSE_REASONING_EFFORT },
      text: { verbosity: OPENAI_TEXT_VERBOSITY },
      stream: true,
      stream_options: {
        include_obfuscation: false,
      },
    }),
    signal,
  });

  if (!openaiResponse.ok || !openaiResponse.body) {
    sendSse(response, "error", {
      status: openaiResponse.status,
      error: await openaiResponse.text(),
    });
    response.end();
    return;
  }

  const reader = openaiResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sentDone = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || "";

    for (const block of blocks) {
      const event = parseSseBlock(block);
      if (!event.data || event.data === "[DONE]") continue;

      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        continue;
      }

      const type = data.type || event.event;
      if (type === "response.output_text.delta" && typeof data.delta === "string") {
        sendSse(response, "token", { delta: data.delta });
      } else if (type === "response.completed") {
        sendSse(response, "done", { ok: true });
        sentDone = true;
      } else if (type === "error" || type === "response.failed") {
        sendSse(response, "error", { error: data.error || data });
      }
    }
  }

  if (!sentDone) {
    sendSse(response, "done", { ok: true });
  }
  response.end();
}

async function handleSpeech(request, response) {
  requireOpenAI();
  const { text = "" } = await readJson(request);
  const input = String(text).trim().slice(0, 4000);

  if (!input) {
    sendJson(response, 400, { error: "Missing text" });
    return;
  }

  const openaiResponse = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: openAIHeaders(),
    body: JSON.stringify({
      model: OPENAI_TTS_MODEL,
      voice: OPENAI_TTS_VOICE,
      input,
      response_format: OPENAI_TTS_FORMAT,
    }),
    signal: abortSignalFor(request, response),
  });

  if (!openaiResponse.ok || !openaiResponse.body) {
    sendJson(response, openaiResponse.status || 502, { error: await openaiResponse.text() });
    return;
  }

  response.writeHead(200, {
    "Content-Type": openaiResponse.headers.get("content-type") || "audio/mpeg",
    "Cache-Control": "no-store",
  });

  await streamWebBody(openaiResponse.body, response);
}

async function handleRealtimeCall(request, response) {
  requireOpenAI();
  const sdp = await readText(request);

  if (!sdp.trim()) {
    sendJson(response, 400, { error: "Missing SDP offer" });
    return;
  }

  const formData = new FormData();
  formData.set("sdp", sdp);
  formData.set("session", JSON.stringify(realtimeSessionConfig()));

  let openaiResponse;
  try {
    openaiResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: openAIHeaders({ contentType: false }),
      body: formData,
      signal: abortSignalFor(request, response, OPENAI_REALTIME_CALL_TIMEOUT_MS),
    });
  } catch (error) {
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      sendJson(response, 504, { error: "Realtime call setup timed out" });
      return;
    }
    throw error;
  }

  const answerSdp = await openaiResponse.text();

  if (!openaiResponse.ok) {
    console.error("Realtime call rejected", openaiResponse.status, answerSdp);
    sendJson(response, openaiResponse.status || 502, { error: answerSdp });
    return;
  }

  response.writeHead(201, {
    "Content-Type": openaiResponse.headers.get("content-type") || "application/sdp",
    "Cache-Control": "no-store",
  });
  response.end(answerSdp);
}

function realtimeSessionConfig() {
  return {
    type: "realtime",
    model: OPENAI_REALTIME_MODEL,
    output_modalities: ["audio"],
    instructions: RESPONSE_INSTRUCTIONS,
    reasoning: { effort: "low" },
    audio: {
      input: {
        noise_reduction: { type: "near_field" },
        turn_detection: {
          type: "server_vad",
          threshold: 0.48,
          prefix_padding_ms: 280,
          silence_duration_ms: 360,
          create_response: true,
          interrupt_response: true,
        },
      },
      output: {
        voice: OPENAI_REALTIME_VOICE,
      },
    },
  };
}

function requireOpenAI() {
  if (!OPENAI_API_KEY) {
    const error = new Error("OPENAI_API_KEY is missing. Add it to .env and restart server.mjs.");
    error.status = 503;
    throw error;
  }
}

async function createResponse({ model, instructions, input, max_output_tokens, reasoning, text, signal }) {
  const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: openAIHeaders(),
    body: JSON.stringify({
      model,
      instructions,
      input,
      max_output_tokens,
      reasoning,
      text,
    }),
    signal,
  });

  if (!openaiResponse.ok) {
    throw new Error(`OpenAI response failed ${openaiResponse.status}: ${await openaiResponse.text()}`);
  }

  return openaiResponse.json();
}

function openAIHeaders(options = {}) {
  const headers = {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
  };
  if (options.contentType !== false) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

function abortSignalFor(request, response, timeoutMs = 0) {
  const controller = new AbortController();
  let timeout = null;
  if (timeoutMs > 0) {
    timeout = setTimeout(() => controller.abort(), timeoutMs);
  }
  request.on("aborted", () => controller.abort());
  response.on("close", () => {
    if (timeout) clearTimeout(timeout);
    controller.abort();
  });
  return controller.signal;
}

function normalizeSpeculation(rawText) {
  const parsed = parseFirstJsonObject(rawText) || {};
  const expression = EXPRESSIONS.has(parsed.expression) ? parsed.expression : "thinking";

  return {
    intent: typeof parsed.intent === "string" ? parsed.intent.slice(0, 40) : "thought",
    tone: typeof parsed.tone === "string" ? parsed.tone.slice(0, 40) : "steady",
    completion: clampNumber(parsed.completion, 0, 1, 0.4),
    expression,
    confidence: clampNumber(parsed.confidence, 0, 1, 0.4),
    prepared: typeof parsed.prepared === "string" ? parsed.prepared.slice(0, 80) : "response direction",
  };
}

function parseFirstJsonObject(text) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function extractOutputText(payload) {
  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  const chunks = [];
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") chunks.push(content.text);
    }
  }
  return chunks.join("");
}

function compactFeatures(features) {
  return {
    attention: clampNumber(features.attention ?? features.intent, 0, 1, 0),
    arousal: clampNumber(features.arousal ?? features.emotion, 0, 1, 0),
    completion: clampNumber(features.completion, 0, 1, 0),
    question: Boolean(features.question),
    hedge: Boolean(features.hedge ?? features.uncertainty),
    revision: Boolean(features.revision),
    trailingConnector: Boolean(features.trailingConnector),
    terminal: Boolean(features.terminal),
    deleted: Boolean(features.deleted),
    fastCadence: Boolean(features.fastCadence),
    slowCadence: Boolean(features.slowCadence),
    words: Array.isArray(features.words) ? features.words.length : 0,
    chars: typeof features.clean === "string" ? features.clean.length : 0,
  };
}

function compactPrepared(prepared) {
  if (!prepared || typeof prepared !== "object") return null;

  return {
    intent: typeof prepared.intent === "string" ? prepared.intent.slice(0, 40) : "thought",
    tone: typeof prepared.tone === "string" ? prepared.tone.slice(0, 40) : "steady",
    completion: clampNumber(prepared.completion, 0, 1, 0),
    expression: EXPRESSIONS.has(prepared.expression) ? prepared.expression : "thinking",
    confidence: clampNumber(prepared.confidence, 0, 1, 0),
    prepared: typeof prepared.prepared === "string" ? prepared.prepared.slice(0, 80) : "response direction",
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

async function readJson(request) {
  const text = await readText(request);
  if (!text) return {};
  return JSON.parse(text);
}

async function readText(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) return "";
  return Buffer.concat(chunks).toString("utf8");
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendSse(response, event, data) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
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

async function streamWebBody(body, response) {
  const reader = body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    response.write(Buffer.from(value));
  }
  response.end();
}

async function serveStatic(pathname, request, response) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const decodedPath = decodeURIComponent(requestedPath);
  const filePath = normalize(join(ROOT, decodedPath));

  if (!filePath.startsWith(ROOT) || !existsSync(filePath)) {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  const type = MIME_TYPES.get(extname(filePath)) || "application/octet-stream";
  response.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  createReadStream(filePath).pipe(response);
}
