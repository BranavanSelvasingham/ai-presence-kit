import { spawn } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.AI_PRESENCE_BASE_URL || "http://127.0.0.1:8058";
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const captures = [
  {
    label: "main-app",
    output: "docs/media/main-app-release.png",
    path: "/",
    virtualTimeBudgetMs: 1200,
  },
];

function chromeArgs(capture) {
  return [
    "--headless=new",
    "--disable-gpu",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-sync",
    "--disable-crash-reporter",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=${join(tmpdir(), `ai-presence-release-media-${capture.label}-${Date.now()}`)}`,
    "--window-size=1280,720",
    `--virtual-time-budget=${capture.virtualTimeBudgetMs}`,
    `--screenshot=${resolve(root, capture.output)}`,
    `${baseUrl}${capture.path}`,
  ];
}

function waitForCapture(capture) {
  const outputPath = resolve(root, capture.output);
  mkdirSync(dirname(outputPath), { recursive: true });

  return new Promise((resolveCapture, rejectCapture) => {
    const child = spawn(chromePath, chromeArgs(capture), {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    let settled = false;

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    const finish = (error = null) => {
      if (settled) return;
      settled = true;
      clearInterval(poll);
      clearTimeout(timeout);
      if (!child.killed) child.kill("SIGTERM");
      if (error) rejectCapture(error);
      else resolveCapture(outputPath);
    };

    const poll = setInterval(() => {
      if (!existsSync(outputPath)) return;
      const size = statSync(outputPath).size;
      if (size > 10_000) finish();
    }, 250);

    const timeout = setTimeout(() => {
      finish(new Error(`${capture.label}: screenshot timed out. ${stderr.trim()}`));
    }, 15_000);

    child.on("error", (error) => {
      finish(error);
    });

    child.on("exit", (code, signal) => {
      if (settled) return;
      if (existsSync(outputPath) && statSync(outputPath).size > 10_000) {
        finish();
        return;
      }
      finish(new Error(`${capture.label}: Chrome exited with code ${code ?? signal}. ${stderr.trim()}`));
    });
  });
}

for (const capture of captures) {
  const outputPath = await waitForCapture(capture);
  console.log(`${capture.label}: ${outputPath}`);
}

console.log("release media captured");
