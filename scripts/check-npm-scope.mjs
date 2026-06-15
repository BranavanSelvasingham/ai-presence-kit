import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scopeName = "@ai-presence";
const requiredPackages = [
  "@ai-presence/core",
  "@ai-presence/face",
  "@ai-presence/adapters",
  "@ai-presence/react",
];

let tempDir = null;

function cleanup() {
  if (tempDir) rmSync(tempDir, { recursive: true, force: true });
}

process.on("exit", cleanup);

function loadReleaseEnv() {
  if (process.env.NPM_TOKEN) return;

  const envPath = resolve(root, ".env.release.local");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key === "NPM_TOKEN" && value) {
      process.env.NPM_TOKEN = value;
      return;
    }
  }
}

function createNpmEnv() {
  if (!process.env.NPM_TOKEN) return process.env;

  tempDir = mkdtempSync(join(tmpdir(), "ai-presence-scope-check-"));
  const npmrcPath = join(tempDir, "npmrc");
  const authConfigKey = "_authToken";
  writeFileSync(npmrcPath, `//registry.npmjs.org/:${authConfigKey}=\${NPM_TOKEN}\n`, { mode: 0o600 });
  return {
    ...process.env,
    NPM_CONFIG_USERCONFIG: npmrcPath,
  };
}

loadReleaseEnv();
const npmEnv = createNpmEnv();

function runNpm(args) {
  return spawnSync("npm", args, {
    encoding: "utf8",
    env: npmEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function printFailure(message, result) {
  console.error(message);
  const stderr = result?.stderr?.trim();
  if (stderr) {
    console.error(stderr);
  }
}

const whoami = runNpm(["whoami"]);

if (whoami.status !== 0) {
  printFailure(
    "npm scope check requires an authenticated npm session or NPM_TOKEN in `.env.release.local`.",
    whoami,
  );
  process.exit(1);
}

const username = whoami.stdout.trim();
console.log(`npm authenticated as ${username}`);

const access = runNpm(["access", "list", "packages", scopeName, "--json"]);

if (access.status !== 0) {
  console.log(`${scopeName}: scope package listing unavailable with current credentials`);
  console.log(`${scopeName}: falling back to per-package registry metadata`);

  for (const packageName of requiredPackages) {
    const metadata = runNpm(["view", packageName, "version"]);
    if (metadata.status === 0) {
      console.log(`${packageName}: visible latest ${metadata.stdout.trim()}`);
      continue;
    }
    if (/E404|404 Not Found/.test(metadata.stderr || "")) {
      console.log(`${packageName}: not published in registry yet`);
      continue;
    }
    printFailure(`Unable to inspect registry metadata for ${packageName}.`, metadata);
    process.exit(1);
  }

  process.exit(0);
}

let packages;

try {
  packages = JSON.parse(access.stdout || "{}");
} catch (error) {
  console.error(`Unable to parse npm access output for ${scopeName}.`);
  console.error(error.message);
  process.exit(1);
}

const visiblePackageNames = Object.keys(packages);
console.log(`${scopeName}: scope access confirmed`);

if (visiblePackageNames.length === 0) {
  console.log(`${scopeName}: no published packages visible yet`);
} else {
  console.log(`${scopeName}: visible packages ${visiblePackageNames.join(", ")}`);
}

for (const packageName of requiredPackages) {
  if (visiblePackageNames.includes(packageName)) {
    console.log(`${packageName}: visible to authenticated account`);
  } else {
    console.log(`${packageName}: not published in accessible scope yet`);
  }
}
