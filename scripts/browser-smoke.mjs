import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { connect as connectSocket, createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const routeTimeoutMs = 20_000;
const routeEvidence = [];
const cleanupTasks = [];

const routes = [
  {
    label: "reference",
    path: "/",
    budgetMs: 1600,
    assert: assertReferenceRoute,
  },
  {
    label: "metrics-controller",
    path: "/?metrics=1&presence=expressive",
    budgetMs: 1600,
    assert: assertMetricsRoute,
  },
  {
    label: "controller-gallery",
    path: "/?controllerGallery=1",
    budgetMs: 1600,
    assert: assertControllerGalleryRoute,
  },
  {
    label: "comparison",
    path: "/?compare=1&autorunCompare=1",
    budgetMs: 4200,
    assert: assertComparisonRoute,
  },
  {
    label: "react-browser-before-output",
    path: "/examples/react-browser.html?autorun=1",
    budgetMs: 760,
    assert: assertReactBeforeOutputRoute,
    evidenceOnly: true,
  },
  {
    label: "react-browser",
    path: "/examples/react-browser.html?autorun=1",
    budgetMs: 2900,
    assert: assertReactCompleteRoute,
  },
  {
    label: "react-composer-lane",
    path: "/examples/react-browser-composer-lane.html?autorun=1",
    budgetMs: 760,
    assert: assertReactComposerLaneRoute,
  },
];

async function main() {
  let serverProcess = null;

  try {
    const port = await findAvailablePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    serverProcess = startServer(port);
    await waitForHealth(baseUrl, serverProcess);

    const reactBeforeOutput = new Map();
    for (const route of routes) {
      const dom = await dumpRouteDom(baseUrl, route);
      const evidence = route.assert(dom, { reactBeforeOutput });
      if (!route.evidenceOnly) {
        routeEvidence.push(`${route.label}: ${evidence}`);
      }
    }

    for (const line of routeEvidence) {
      console.log(line);
    }
    console.log("browser smoke ok");
  } catch (error) {
    console.error(`browser smoke failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await stopServer(serverProcess);
    await runCleanupTasks();
  }
}

function startServer(port) {
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: root,
    env: {
      NODE_ENV: "test",
      OPENAI_API_KEY: "",
      PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdoutText = "";
  child.stderrText = "";
  child.stdout.on("data", (chunk) => {
    child.stdoutText += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    child.stderrText += chunk.toString();
  });
  return child;
}

async function stopServer(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGTERM");
  await new Promise((resolveStop) => {
    const timer = setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill("SIGKILL");
      }
      resolveStop();
    }, 1200);
    child.once("exit", () => {
      clearTimeout(timer);
      resolveStop();
    });
  });
}

async function runCleanupTasks() {
  for (const cleanup of cleanupTasks.reverse()) {
    try {
      await cleanup();
    } catch {
      // Temporary Chrome profiles are best-effort cleanup.
    }
  }
}

function findAvailablePort() {
  return new Promise((resolvePort, rejectPort) => {
    const server = createServer();
    server.on("error", rejectPort);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => {
        if (port) resolvePort(port);
        else rejectPort(new Error("Could not reserve a local browser-smoke port."));
      });
    });
  });
}

async function waitForHealth(baseUrl, child) {
  const deadline = Date.now() + 8000;
  let lastError = null;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`server exited before health check. ${safeProcessOutput(child)}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/health`, { cache: "no-store" });
      if (response.ok) return;
      lastError = new Error(`health returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(120);
  }
  throw new Error(`server health check timed out. ${lastError?.message || "no response"}`);
}

async function dumpRouteDom(baseUrl, route) {
  const userDataDir = await mkdtemp(join(tmpdir(), `ai-presence-browser-smoke-${route.label}-`));
  cleanupTasks.push(() => rm(userDataDir, { recursive: true, force: true }));
  const debugPort = await findAvailablePort();
  const url = `${baseUrl}${route.path}`;
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-sync",
    "--disable-crash-reporter",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--run-all-compositor-stages-before-draw",
    `--remote-debugging-port=${debugPort}`,
    "--remote-allow-origins=*",
    `--user-data-dir=${userDataDir}`,
    "--window-size=1280,720",
    "about:blank",
  ];

  const child = spawn(chromePath, args, {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stderr = "";
  let target = null;
  let client = null;
  const browserErrors = [];

  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await new Promise((resolveLaunch, rejectLaunch) => {
      child.once("error", (error) => rejectLaunch(chromeLaunchError(error)));
      child.once("spawn", resolveLaunch);
    });
    await waitForChromeDebug(debugPort, child, () => stderr);
    target = await createChromeTarget(debugPort);
    client = await CdpClient.connect(target.webSocketDebuggerUrl);
    client.onEvent((message) => {
      const formatted = formatBrowserError(message);
      if (formatted) browserErrors.push(formatted);
    });
    await client.send("Runtime.enable");
    await client.send("Log.enable");
    await client.send("Page.enable");
    const loadPromise = client.waitForEvent("Page.loadEventFired", 10_000);
    await client.send("Page.navigate", { url });
    await loadPromise;
    await delay(route.budgetMs);

    if (browserErrors.length) {
      throw new Error(`${route.label}: browser console failure: ${browserErrors.slice(0, 3).join(" | ")}`);
    }

    const evaluation = await client.send("Runtime.evaluate", {
      expression: "document.documentElement.outerHTML",
      returnByValue: true,
    });
    const dom = evaluation.result?.value || "";
    if (!dom.includes("<html")) {
      throw new Error(`${route.label}: browser DOM snapshot was empty.`);
    }
    return dom;
  } finally {
    client?.close();
    if (target?.id) {
      await closeChromeTarget(debugPort, target.id);
    }
    await stopServer(child);
    if (child.exitCode !== null || child.signalCode !== null) {
      const failed = child.exitCode && child.exitCode !== 0;
      if (failed) {
        throw new Error(`${route.label}: Chrome exited with ${child.exitCode}. ${compactText(stderr)}`);
      }
    }
  }
}

function chromeLaunchError(error) {
  if (error.code === "ENOENT") {
    return new Error(`Chrome is unavailable at ${chromePath}. Set CHROME_PATH to a local Chrome executable to inspect browser smoke output.`);
  }
  return error;
}

async function waitForChromeDebug(port, child, stderrText) {
  const deadline = Date.now() + routeTimeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`Chrome exited before DevTools was ready. ${compactText(stderrText())}`);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return;
      lastError = new Error(`DevTools returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(120);
  }
  throw new Error(`Chrome DevTools did not become ready. ${lastError?.message || compactText(stderrText())}`);
}

async function createChromeTarget(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`, {
    method: "PUT",
  });
  if (!response.ok) {
    throw new Error(`Chrome target creation failed with ${response.status}.`);
  }
  return response.json();
}

async function closeChromeTarget(port, targetId) {
  try {
    await fetch(`http://127.0.0.1:${port}/json/close/${encodeURIComponent(targetId)}`);
  } catch {
    // Chrome is already closing.
  }
}

function formatBrowserError(message) {
  if (message.method === "Runtime.exceptionThrown") {
    const details = message.params?.exceptionDetails;
    return compactText(details?.text || details?.exception?.description || "runtime exception");
  }
  if (message.method === "Runtime.consoleAPICalled") {
    const type = message.params?.type;
    if (type !== "error" && type !== "assert") return "";
    const args = message.params?.args || [];
    const text = args.map((arg) => arg.value || arg.description || "").filter(Boolean).join(" ");
    return compactText(text || `console.${type}`);
  }
  if (message.method === "Log.entryAdded") {
    const entry = message.params?.entry;
    if (entry?.level !== "error") return "";
    if (entry.url && /\/favicon\.ico(?:[?#]|$)/.test(entry.url)) return "";
    if (/favicon\.ico/.test(entry.text || "")) return "";
    return compactText(entry.text || "browser log error");
  }
  return "";
}

class CdpClient {
  static connect(webSocketUrl) {
    return new Promise((resolveClient, rejectClient) => {
      const url = new URL(webSocketUrl);
      const socket = connectSocket(Number(url.port), url.hostname);
      const key = randomBytes(16).toString("base64");
      let handshake = Buffer.alloc(0);
      let settled = false;
      const client = new CdpClient(socket);

      const fail = (error) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        rejectClient(error);
      };

      socket.once("error", fail);
      socket.once("connect", () => {
        socket.write([
          `GET ${url.pathname}${url.search} HTTP/1.1`,
          `Host: ${url.host}`,
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Key: ${key}`,
          "Sec-WebSocket-Version: 13",
          "",
          "",
        ].join("\r\n"));
      });
      socket.on("data", function onHandshakeData(chunk) {
        if (settled) {
          client.receive(chunk);
          return;
        }
        handshake = Buffer.concat([handshake, chunk]);
        const headerEnd = handshake.indexOf("\r\n\r\n");
        if (headerEnd === -1) return;
        const header = handshake.slice(0, headerEnd).toString("utf8");
        if (!/^HTTP\/1\.1 101\b/.test(header)) {
          fail(new Error(`Chrome WebSocket handshake failed. ${compactText(header)}`));
          return;
        }
        settled = true;
        socket.off("data", onHandshakeData);
        socket.on("data", (data) => client.receive(data));
        const remainder = handshake.slice(headerEnd + 4);
        if (remainder.length) client.receive(remainder);
        resolveClient(client);
      });
    });
  }

  constructor(socket) {
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.nextId = 1;
    this.pending = new Map();
    this.eventCallbacks = [];
    this.eventWaiters = new Map();
    this.fragmentOpcode = 0;
    this.fragmentParts = [];
  }

  onEvent(callback) {
    this.eventCallbacks.push(callback);
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    const message = JSON.stringify({ id, method, params });
    this.sendFrame(1, Buffer.from(message, "utf8"));
    return new Promise((resolveSend, rejectSend) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        rejectSend(new Error(`CDP method timed out: ${method}`));
      }, 12_000);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timeout);
          resolveSend(value);
        },
        reject: (error) => {
          clearTimeout(timeout);
          rejectSend(error);
        },
      });
    });
  }

  waitForEvent(method, timeoutMs) {
    return new Promise((resolveWait, rejectWait) => {
      const timeout = setTimeout(() => {
        const waiters = this.eventWaiters.get(method) || [];
        this.eventWaiters.set(method, waiters.filter((waiter) => waiter.resolve !== resolveWait));
        rejectWait(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);
      const waiter = {
        resolve: (message) => {
          clearTimeout(timeout);
          resolveWait(message);
        },
      };
      const waiters = this.eventWaiters.get(method) || [];
      waiters.push(waiter);
      this.eventWaiters.set(method, waiters);
    });
  }

  receive(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.buffer.length >= 2) {
      const first = this.buffer[0];
      const second = this.buffer[1];
      const fin = Boolean(first & 0x80);
      const opcode = first & 0x0f;
      const masked = Boolean(second & 0x80);
      let length = second & 0x7f;
      let offset = 2;

      if (length === 126) {
        if (this.buffer.length < offset + 2) return;
        length = this.buffer.readUInt16BE(offset);
        offset += 2;
      } else if (length === 127) {
        if (this.buffer.length < offset + 8) return;
        const wideLength = this.buffer.readBigUInt64BE(offset);
        if (wideLength > BigInt(Number.MAX_SAFE_INTEGER)) {
          throw new Error("Chrome WebSocket frame is too large.");
        }
        length = Number(wideLength);
        offset += 8;
      }

      const maskOffset = offset;
      if (masked) offset += 4;
      if (this.buffer.length < offset + length) return;

      let payload = this.buffer.slice(offset, offset + length);
      if (masked) {
        const mask = this.buffer.slice(maskOffset, maskOffset + 4);
        payload = Buffer.from(payload.map((byte, index) => byte ^ mask[index % 4]));
      }
      this.buffer = this.buffer.slice(offset + length);
      this.handleFrame(opcode, fin, payload);
    }
  }

  handleFrame(opcode, fin, payload) {
    if (opcode === 8) {
      this.close();
      return;
    }
    if (opcode === 9) {
      this.sendFrame(10, payload);
      return;
    }
    if (opcode === 10) return;

    if (opcode === 0) {
      this.fragmentParts.push(payload);
      if (fin) {
        const complete = Buffer.concat(this.fragmentParts);
        const completeOpcode = this.fragmentOpcode;
        this.fragmentParts = [];
        this.fragmentOpcode = 0;
        this.handleFrame(completeOpcode, true, complete);
      }
      return;
    }

    if (!fin) {
      this.fragmentOpcode = opcode;
      this.fragmentParts = [payload];
      return;
    }

    if (opcode !== 1) return;
    this.handleMessage(payload.toString("utf8"));
  }

  handleMessage(text) {
    let message;
    try {
      message = JSON.parse(text);
    } catch {
      return;
    }

    if (message.id) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(message.error.message || "CDP command failed"));
      } else {
        pending.resolve(message.result || {});
      }
      return;
    }

    for (const callback of this.eventCallbacks) {
      callback(message);
    }

    const waiters = this.eventWaiters.get(message.method) || [];
    if (waiters.length) {
      const [waiter, ...remaining] = waiters;
      this.eventWaiters.set(message.method, remaining);
      waiter.resolve(message);
    }
  }

  sendFrame(opcode, payload) {
    const mask = randomBytes(4);
    let header;
    if (payload.length < 126) {
      header = Buffer.from([0x80 | opcode, 0x80 | payload.length]);
    } else if (payload.length <= 0xffff) {
      header = Buffer.alloc(4);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(payload.length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | 127;
      header.writeBigUInt64BE(BigInt(payload.length), 2);
    }

    const maskedPayload = Buffer.from(payload.map((byte, index) => byte ^ mask[index % 4]));
    this.socket.write(Buffer.concat([header, mask, maskedPayload]));
  }

  close() {
    for (const { reject } of this.pending.values()) {
      reject(new Error("CDP socket closed."));
    }
    this.pending.clear();
    try {
      this.sendFrame(8, Buffer.alloc(0));
    } catch {
      // Socket is already closed.
    }
    this.socket.end();
  }
}

function assertReferenceRoute(dom) {
  const html = requireTag(dom, "html", "reference document root");
  const face = requireTagById(dom, "faceShell", "reference face shell");
  const metrics = requireTagById(dom, "metricsPanel", "reference metrics panel");

  requireAttr(html, "data-live-response-configured", "false", "reference root live response configuration");
  requireAttr(html, "data-live-response-stream", "idle", "reference root live response stream");
  requireAttr(face, "data-presence-state", "idle", "reference face presence state");
  requireAttr(face, "data-controller-decision-trace", "complete", "reference face decision trace");
  requireAttr(metrics, "data-live-response-configured", "false", "reference metrics live response configuration");

  return [
    `live=${attr(html, "data-live-response-configured")}/${attr(html, "data-live-response-stream")}`,
    `state=${attr(face, "data-presence-state")}`,
    `trace=${attr(face, "data-controller-decision-trace")}`,
  ].join(" ");
}

function assertMetricsRoute(dom) {
  const metrics = requireTagById(dom, "metricsPanel", "metrics panel");
  const controls = requireTagById(dom, "metricControls", "metrics controller controls");
  const stateOutput = requireElementById(dom, "metricState", "metrics presence state output");

  rejectAttr(metrics, "hidden", "metrics panel should be visible");
  requireText(dom, "Presence state", "metrics canonical presence-state label");
  requireElementText(stateOutput, "idle", "metrics canonical presence state");
  requireAttr(controls, "data-controller-decision-trace", "complete", "metrics controller decision trace");
  requireAttr(controls, "data-controller-decision-trace-channels", "gaze blink brows mouth posture motion", "metrics decision trace channels");
  requireAttr(controls, "data-controller-coherence", "safe", "metrics controller coherence");
  requireAttr(controls, "data-controller-coherence-renderer-safe", "true", "metrics renderer-safe coherence");

  return [
    `state=${elementText(stateOutput)}`,
    `decisionTrace=${attr(controls, "data-controller-decision-trace")}`,
    `coherence=${attr(controls, "data-controller-coherence")}`,
    `channels=${attr(controls, "data-controller-decision-trace-channels")}`,
  ].join(" ");
}

function assertControllerGalleryRoute(dom) {
  const gallery = requireTagById(dom, "controllerGallery", "controller gallery");
  const grid = requireTagById(dom, "controllerGalleryGrid", "controller gallery grid");

  rejectAttr(gallery, "hidden", "controller gallery should be visible");
  for (const element of [gallery, grid]) {
    requireAttr(element, "data-transition-events", "submit stream-open token interrupt", "controller transition events");
    requireAttr(element, "data-transition-decision-trace", "complete", "controller transition decision trace");
    requireAttr(element, "data-transition-controller-reads", "gaze blink brows mouth posture motion", "controller transition reads");
    requireAttr(element, "data-transition-controller-reads-event", "true", "controller transition event reads");
    requireAttr(element, "data-transition-controller-reads-age", "true", "controller transition age reads");
  }

  return [
    `events=${attr(gallery, "data-transition-events")}`,
    `trace=${attr(gallery, "data-transition-decision-trace")}`,
    `reads=${attr(gallery, "data-transition-controller-reads")}`,
  ].join(" ");
}

function assertComparisonRoute(dom) {
  const comparison = requireTagById(dom, "comparisonDemo", "comparison route root");
  const face = requireTagById(dom, "compareFace", "comparison presence face");

  rejectAttr(comparison, "hidden", "comparison route should be visible");
  requireAttr(comparison, "data-equal-latency", "true", "comparison equal latency");
  requireAttr(comparison, "data-generic-first-token-ms", "1400", "comparison generic first token");
  requireAttr(comparison, "data-presence-first-token-ms", "1400", "comparison presence first token");
  requireAttr(comparison, "data-presence-before-token", "true", "comparison presence before token");
  requireAttrIncludes(comparison, "data-presence-before-token-states", "reading", "comparison reading before token");
  requireAttrIncludes(comparison, "data-presence-before-token-states", "thinking", "comparison thinking before token");
  requireAttrIncludes(comparison, "data-presence-before-token-states", "waiting", "comparison waiting before token");
  requireAttr(comparison, "data-presence-frame-before-token", "true", "comparison frame before token");
  requireAttr(comparison, "data-presence-frame-before-token-channels", "gaze blink brows mouth posture motion", "comparison frame channels");
  requireAttr(comparison, "data-presence-decision-trace-before-token", "complete", "comparison decision trace before token");
  requireAttr(comparison, "data-presence-decision-trace-before-token-channels", "gaze blink brows mouth posture motion", "comparison decision trace channels");
  requireAttr(comparison, "data-presence-decision-trace-before-token-decisions", "6", "comparison decision trace decisions");
  requireAttr(comparison, "data-presence-decision-trace-before-token-warnings", "0", "comparison decision trace warnings");
  requireAttr(comparison, "data-presence-decision-trace-before-token-renderer-safe", "true", "comparison decision trace renderer safe");
  requirePositiveAttr(comparison, "data-presence-decision-trace-lead-ms", "comparison decision trace lead time");
  requireAttr(comparison, "data-presence-trace-summary", "complete", "comparison trace summary");
  requireAttr(comparison, "data-presence-trace-first-output-ms", "1400", "comparison trace first output");
  requireAttr(comparison, "data-presence-trace-first-output-event", "token", "comparison trace first output event");
  requireAttr(comparison, "data-presence-trace-lead-ms", "1400", "comparison trace lead");
  requireAttr(comparison, "data-presence-trace-final-state", "ready", "comparison trace final state");
  requireAttr(comparison, "data-presence-trace-has-output", "true", "comparison trace has output");
  requireAttr(comparison, "data-presence-trace-complete", "true", "comparison trace complete");
  requireAttr(face, "data-presence-trace-summary", "complete", "comparison face trace summary");

  return [
    `equalLatency=${attr(comparison, "data-equal-latency")}`,
    `firstToken=${attr(comparison, "data-generic-first-token-ms")}/${attr(comparison, "data-presence-first-token-ms")}`,
    `beforeToken=${attr(comparison, "data-presence-before-token-states")}`,
    `decisionLead=${attr(comparison, "data-presence-decision-trace-lead-ms")}ms`,
    `trace=${attr(comparison, "data-presence-trace-summary")}/${attr(comparison, "data-presence-trace-final-state")}`,
  ].join(" ");
}

function assertReactBeforeOutputRoute(dom, context) {
  const nonFace = requireTagWithAttrs(dom, {
    "data-nonface-renderer": "status-surface",
    "data-nonface-state": "waiting",
  }, "React non-face before-output surface");
  const face = requireTagWithAttrs(dom, {
    "data-face-svg-renderer": "@ai-presence/face",
    "data-face-latency-phase": "before-output",
  }, "React face before-output renderer");
  const response = requireElementByAttr(dom, "data-react-response", "", "React response output before first token");

  requireAttr(nonFace, "data-nonface-phase", "before-output", "React non-face phase");
  requireAttr(nonFace, "data-nonface-attention", "response", "React non-face attention");
  requireAttr(nonFace, "data-nonface-event", "stream-open", "React non-face event");
  requireAttr(nonFace, "data-nonface-before-output", "true", "React non-face before output");
  requireAttr(face, "data-face-decision-trace", "complete", "React face decision trace");
  requireAttr(face, "data-face-decision-trace-channels", "gaze blink brows mouth posture motion", "React face decision channels");
  requireAttr(face, "data-face-decision-trace-decisions", "6", "React face decision count");
  requireAttr(face, "data-face-decision-trace-warnings", "0", "React face decision warnings");
  requireAttr(face, "data-face-decision-trace-renderer-safe", "true", "React face renderer safe");
  requireTransitionContext(face, "thinking", "stream-open", "React transition context");
  requireAttr(face, "data-face-transition-controller-reads", "gaze blink brows mouth posture motion", "React transition reads");
  requireAttr(face, "data-face-transition-controller-reads-event", "true", "React transition event reads");
  requireAttr(face, "data-face-transition-controller-reads-age", "true", "React transition age reads");
  requireElementText(response, "--", "React response before first token");

  context.reactBeforeOutput.set("state", attr(nonFace, "data-nonface-state"));
  context.reactBeforeOutput.set("phase", attr(nonFace, "data-nonface-phase"));
  context.reactBeforeOutput.set("event", attr(nonFace, "data-nonface-event"));
  context.reactBeforeOutput.set("faceTrace", attr(face, "data-face-decision-trace"));
  context.reactBeforeOutput.set("response", elementText(response));
  return "captured";
}

function assertReactCompleteRoute(dom, context) {
  const panel = requireTagWithAttrs(dom, {
    "data-react-trace-summary": "complete",
  }, "React complete trace panel");
  const response = requireElementByAttr(dom, "data-react-response", "", "React complete response output");
  const beforeState = context.reactBeforeOutput.get("state");
  const beforePhase = context.reactBeforeOutput.get("phase");
  const beforeEvent = context.reactBeforeOutput.get("event");
  const beforeFaceTrace = context.reactBeforeOutput.get("faceTrace");
  const beforeResponse = context.reactBeforeOutput.get("response");

  if (!beforeState || !beforePhase || !beforeEvent || !beforeFaceTrace) {
    throw new Error("react-browser: missing before-output capture evidence.");
  }

  requireAttr(panel, "data-react-trace-entry-count", "5", "React trace entry count");
  requireAttr(panel, "data-react-trace-first-output-ms", "980", "React trace first output");
  requireAttr(panel, "data-react-trace-first-output-event", "token", "React trace first output event");
  requireAttr(panel, "data-react-trace-lead-ms", "980", "React trace lead");
  requireAttr(panel, "data-react-trace-final-state", "ready", "React trace final state");
  requireAttr(panel, "data-react-trace-has-output", "true", "React trace has output");
  requireAttr(panel, "data-react-trace-complete", "true", "React trace complete");
  requireElementTextIncludes(response, "Presence moved through thinking and waiting", "React complete response");

  return [
    `beforeOutput=${beforeState}/${beforePhase}/${beforeEvent}/response:${beforeResponse}`,
    `faceTrace=${beforeFaceTrace}`,
    `trace=${attr(panel, "data-react-trace-summary")}/${attr(panel, "data-react-trace-final-state")}`,
    `firstOutput=${attr(panel, "data-react-trace-first-output-ms")}ms`,
    `lead=${attr(panel, "data-react-trace-lead-ms")}ms`,
  ].join(" ");
}

function assertReactComposerLaneRoute(dom) {
  const surface = requireTagWithAttrs(dom, {
    "data-renderer": "composer-lane",
    "data-presence-state": "waiting",
  }, "React composer-lane before-output surface");
  const response = requireElementByAttr(dom, "data-react-composer-response", "", "React composer-lane response before first token");

  if (dom.includes("/packages/face/") || dom.includes("data-face-")) {
    throw new Error("react-composer-lane: route should not load or render face package evidence.");
  }

  requireAttr(surface, "data-presence-phase", "before-output", "composer-lane phase");
  requireAttr(surface, "data-presence-attention", "response", "composer-lane attention");
  requireAttr(surface, "data-presence-event", "stream-open", "composer-lane event");
  requireAttr(surface, "data-presence-before-output", "true", "composer-lane before output");
  requireAttr(surface, "data-composer-lock", "true", "composer-lane composer lock");
  requireAttr(surface, "data-assistant-text-empty", "true", "composer-lane assistant text empty");
  requireAttr(surface, "data-progress-step", "stream-open", "composer-lane progress step");
  requireAttr(surface, "data-stream-open-ms", "420ms", "composer-lane stream open");
  requireAttr(surface, "data-first-output-ms", "none", "composer-lane first output pending");
  requirePositiveAttr(surface, "data-lead-ms", "composer-lane lead time");
  requireElementText(response, "", "composer-lane response before first token");

  return [
    `renderer=${attr(surface, "data-renderer")}`,
    `state=${attr(surface, "data-presence-state")}/${attr(surface, "data-presence-phase")}`,
    `progress=${attr(surface, "data-progress-step")}`,
    `streamOpen=${attr(surface, "data-stream-open-ms")}`,
    `firstOutput=${attr(surface, "data-first-output-ms")}`,
    `lead=${attr(surface, "data-lead-ms")}`,
    "facePackage=omitted",
  ].join(" ");
}

function requireTag(dom, tagName, label) {
  const match = dom.match(new RegExp(`<${tagName}\\b[^>]*>`, "i"));
  if (!match) throw new Error(`${label} missing.`);
  return match[0];
}

function requireTagById(dom, id, label) {
  const match = dom.match(new RegExp(`<[^>]+\\bid="${escapeRegex(id)}"[^>]*>`, "i"));
  if (!match) throw new Error(`${label} missing.`);
  return match[0];
}

function requireElementById(dom, id, label) {
  return requireElementByAttr(dom, "id", id, label);
}

function requireElementByAttr(dom, attrName, attrValue, label) {
  const valuePattern = attrValue === null
    ? ""
    : `=(?:"${escapeRegex(attrValue)}"|'${escapeRegex(attrValue)}')`;
  const pattern = new RegExp(`<([a-z0-9-]+)\\b(?=[^>]*\\b${escapeRegex(attrName)}${valuePattern})[^>]*>[\\s\\S]*?<\\/\\1>`, "i");
  const match = dom.match(pattern);
  if (!match) throw new Error(`${label} missing.`);
  return match[0];
}

function requireTagWithAttrs(dom, attrs, label) {
  const tags = dom.match(/<[a-z0-9-]+\b[^>]*>/gi) || [];
  const found = tags.find((tag) => {
    for (const [name, value] of Object.entries(attrs)) {
      if (attr(tag, name) !== value) return false;
    }
    return true;
  });
  if (!found) {
    const details = Object.entries(attrs).map(([name, value]) => `${name}="${value}"`).join(" ");
    throw new Error(`${label} missing (${details}).`);
  }
  return found;
}

function requireText(dom, text, label) {
  if (!dom.includes(text)) throw new Error(`${label} missing.`);
}

function requireAttr(tag, attrName, expected, label) {
  const actual = attr(tag, attrName);
  if (actual !== expected) {
    throw new Error(`${label} expected ${attrName}="${expected}", got "${actual ?? "missing"}".`);
  }
}

function requireAttrIncludes(tag, attrName, expectedPart, label) {
  const actual = attr(tag, attrName);
  if (!actual || !actual.split(/\s+/).includes(expectedPart)) {
    throw new Error(`${label} expected ${attrName} to include "${expectedPart}", got "${actual ?? "missing"}".`);
  }
}

function requirePositiveAttr(tag, attrName, label) {
  const actual = attr(tag, attrName);
  const value = evidenceNumber(actual);
  if (!(value > 0)) {
    throw new Error(`${label} expected positive ${attrName}, got "${actual ?? "missing"}".`);
  }
}

function requireTransitionContext(tag, previousState, event, label) {
  const actual = attr(tag, "data-face-transition-context");
  const pattern = new RegExp(`^${escapeRegex(previousState)} ${escapeRegex(event)} \\d+$`);
  if (!actual || !pattern.test(actual)) {
    throw new Error(`${label} expected ${previousState} ${event} <age>, got "${actual ?? "missing"}".`);
  }
}

function rejectAttr(tag, attrName, label) {
  if (attr(tag, attrName) !== null) {
    throw new Error(`${label}; found ${attrName}.`);
  }
}

function requireElementText(elementHtml, expected, label) {
  const actual = elementText(elementHtml);
  if (actual !== expected) {
    throw new Error(`${label} expected text "${expected}", got "${actual}".`);
  }
}

function requireElementTextIncludes(elementHtml, expected, label) {
  const actual = elementText(elementHtml);
  if (!actual.includes(expected)) {
    throw new Error(`${label} expected text including "${expected}", got "${actual}".`);
  }
}

function attr(tag, attrName) {
  const pattern = new RegExp(`\\s${escapeRegex(attrName)}(?:=(["'])(.*?)\\1)?(?=\\s|/?>)`, "i");
  const match = tag.match(pattern);
  if (!match) return null;
  return match[2] ?? "";
}

function elementText(elementHtml) {
  return decodeEntities(
    elementHtml
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "")
      .trim(),
  );
}

function evidenceNumber(value) {
  const match = String(value || "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : NaN;
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function safeProcessOutput(child) {
  return compactText(`${child.stdoutText || ""}\n${child.stderrText || ""}`);
}

function compactText(value) {
  return String(value || "")
    .replace(/\b(?:sk|npm|ghp)_[A-Za-z0-9_-]{12,}\b/g, "[redacted-token]")
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, "[redacted-key]")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-8)
    .join(" ");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function delay(ms) {
  return new Promise((resolveDelay) => {
    setTimeout(resolveDelay, ms);
  });
}

await main();
