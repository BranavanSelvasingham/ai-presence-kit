import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cachePath = process.env.AI_PRESENCE_NPM_CACHE || join(tmpdir(), "ai-presence-npm-cache");

const workspaces = [
  { name: "@ai-presence/core", dir: "packages/core" },
  { name: "@ai-presence/face", dir: "packages/face" },
  { name: "@ai-presence/adapters", dir: "packages/adapters" },
  { name: "@ai-presence/react", dir: "packages/react" },
];

const ignoredSecretFiles = [".env", ".env.local", ".env.production", ".npmrc"];
const neverTrackedFiles = [".env", ".env.local", ".env.production", ".npmrc"];
const secretPattern = [
  "sk-[A-Za-z0-9_-]{20,}",
  "npm_[A-Za-z0-9]{20,}",
  "_authToken[[:space:]]*=[[:space:]]*[^[:space:]]+",
  "OPENAI_API_KEY[[:space:]]*=[[:space:]]*sk-",
].join("|");

const forbiddenPackageFiles = [
  /(^|\/)\.env($|[./])/,
  /(^|\/)\.npmrc$/,
  /(^|\/)\.git(\/|$)/,
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)package-lock\.json$/,
  /(^|\/)app\.js$/,
  /(^|\/)server\.mjs$/,
];

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: options.stdio || ["ignore", "pipe", "pipe"],
  });
}

function fail(message, detail = "") {
  console.error(message);
  if (detail) console.error(detail);
  process.exit(1);
}

function assertGitIgnore(path) {
  const result = run("git", ["check-ignore", "-q", path]);
  if (result.status !== 0) {
    fail(`${path} must be ignored before release. Update .gitignore before publishing.`);
  }
  console.log(`${path}: ignored`);
}

function assertNotTracked(path) {
  const result = run("git", ["ls-files", "--error-unmatch", path]);
  if (result.status === 0) {
    fail(`${path} is tracked. Remove it from git before release.`);
  }
  if (result.status > 1) {
    fail(`Unable to confirm tracked state for ${path}.`, result.stderr.trim());
  }
  console.log(`${path}: not tracked`);
}

function assertNoTrackedSecrets() {
  const result = run("git", ["grep", "-I", "-l", "-E", secretPattern, "--", "."]);
  if (result.status === 0) {
    fail(
      "Potential secret material found in tracked files. File names only are shown:",
      result.stdout.trim(),
    );
  }
  if (result.status > 1) {
    fail("Unable to scan tracked files for secret material.", result.stderr.trim());
  }
  console.log("tracked secret scan: clean");
}

function readWorkspaceManifest(workspace) {
  const manifestPath = resolve(root, workspace.dir, "package.json");
  if (!existsSync(manifestPath)) fail(`${workspace.name}: missing package.json`);
  return JSON.parse(readFileSync(manifestPath, "utf8"));
}

function assertWorkspaceManifest(workspace) {
  const manifest = readWorkspaceManifest(workspace);
  if (manifest.name !== workspace.name) {
    fail(`${workspace.dir}: expected package name ${workspace.name}, found ${manifest.name}`);
  }
  if (!Array.isArray(manifest.files) || !manifest.files.includes("src") || !manifest.files.includes("dist")) {
    fail(`${workspace.name}: package.json must keep an explicit src/dist files allowlist.`);
  }
  console.log(`${workspace.name}: package manifest allowlist present`);
}

function parsePackJson(stdout, workspaceName) {
  try {
    const parsed = JSON.parse(stdout);
    const pack = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!pack || !Array.isArray(pack.files)) throw new Error("missing files array");
    return pack.files.map((file) => file.path).filter(Boolean);
  } catch (error) {
    fail(`${workspaceName}: unable to parse npm pack --json output.`, error.message);
  }
}

function assertPackContents(workspace) {
  const result = run(
    "npm",
    ["--cache", cachePath, "pack", "--workspace", workspace.name, "--dry-run", "--json"],
  );
  if (result.status !== 0) {
    fail(`${workspace.name}: npm pack dry-run failed.`, result.stderr.trim() || result.stdout.trim());
  }

  const paths = parsePackJson(result.stdout, workspace.name);
  const forbidden = paths.filter((path) => forbiddenPackageFiles.some((pattern) => pattern.test(path)));
  if (forbidden.length) {
    fail(`${workspace.name}: forbidden files would be published.`, forbidden.join("\n"));
  }
  console.log(`${workspace.name}: tarball file list clean (${paths.length} files)`);
}

mkdirSync(cachePath, { recursive: true });

for (const path of ignoredSecretFiles) assertGitIgnore(path);
for (const path of neverTrackedFiles) assertNotTracked(path);

assertNoTrackedSecrets();

for (const workspace of workspaces) {
  assertWorkspaceManifest(workspace);
  assertPackContents(workspace);
}

console.log("release security preflight passed");
