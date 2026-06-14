import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const allowDirty = args.includes("--allow-dirty");
const version = args.find((arg) => !arg.startsWith("--")) || process.env.npm_package_version;

const packages = [
  { name: "@ai-presence/core", dir: "packages/core" },
  { name: "@ai-presence/face", dir: "packages/face" },
  { name: "@ai-presence/adapters", dir: "packages/adapters" },
  { name: "@ai-presence/react", dir: "packages/react" },
];

if (!version) {
  console.error("Usage: npm run release:publish -- <version> [--dry-run] [--allow-dirty]");
  process.exit(1);
}

let tempDir = null;

function cleanup() {
  if (tempDir) rmSync(tempDir, { recursive: true, force: true });
}

process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});

function fail(message, detail = "") {
  console.error(message);
  if (detail) console.error(detail);
  process.exit(1);
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd || root,
    encoding: "utf8",
    env: options.env || process.env,
    shell: process.platform === "win32",
    stdio: options.stdio || "inherit",
  });

  if (result.status !== 0 && !options.allowFailure) {
    fail(`Command failed: ${command} ${commandArgs.join(" ")}`, result.stderr?.trim() || "");
  }

  return result;
}

function capture(command, commandArgs, options = {}) {
  return run(command, commandArgs, {
    ...options,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

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
  if (dryRun && !process.env.NPM_TOKEN) return process.env;
  if (!process.env.NPM_TOKEN) {
    fail(
      "NPM_TOKEN is required for publishing. Set it in the environment or .env.release.local.",
      "Do not paste npm tokens into chat, docs, commit messages, or shell history.",
    );
  }

  tempDir = mkdtempSync(join(tmpdir(), "ai-presence-release-publish-"));
  const npmrcPath = join(tempDir, "npmrc");
  const authConfigKey = "_authToken";
  writeFileSync(npmrcPath, `//registry.npmjs.org/:${authConfigKey}=\${NPM_TOKEN}\n`, { mode: 0o600 });
  return {
    ...process.env,
    NPM_CONFIG_USERCONFIG: npmrcPath,
  };
}

function assertCleanGit() {
  if (allowDirty) return;
  const result = capture("git", ["status", "--porcelain"]);
  if (result.status !== 0) fail("Unable to inspect git status.", result.stderr.trim());
  if (result.stdout.trim()) {
    fail(
      "Release publish requires a clean worktree. Commit or stash intended changes first.",
      result.stdout.trim(),
    );
  }
}

function assertReleaseTag() {
  const tag = `v${version}`;
  const head = capture("git", ["rev-parse", "HEAD"]);
  if (head.status !== 0) fail("Unable to read HEAD.", head.stderr.trim());

  const tagCommit = capture("git", ["rev-list", "-n", "1", tag], { allowFailure: true });
  if (tagCommit.status !== 0) {
    fail(`${tag} does not exist locally. Create and inspect the release tag before publishing.`);
  }

  if (tagCommit.stdout.trim() !== head.stdout.trim()) {
    fail(`${tag} does not point at HEAD. Publish only the tagged release commit.`);
  }
}

function readManifest(path) {
  return JSON.parse(readFileSync(resolve(root, path), "utf8"));
}

function assertManifestVersions() {
  const rootManifest = readManifest("package.json");
  if (rootManifest.version !== version) {
    fail(`Root package version is ${rootManifest.version}; expected ${version}.`);
  }

  for (const packageInfo of packages) {
    const manifest = readManifest(`${packageInfo.dir}/package.json`);
    if (manifest.name !== packageInfo.name) {
      fail(`${packageInfo.dir}: expected ${packageInfo.name}, found ${manifest.name}.`);
    }
    if (manifest.version !== version) {
      fail(`${packageInfo.name}: package version is ${manifest.version}; expected ${version}.`);
    }

    for (const dependencyGroup of ["dependencies", "peerDependencies", "devDependencies"]) {
      for (const [dependencyName, dependencyVersion] of Object.entries(manifest[dependencyGroup] || {})) {
        if (dependencyName.startsWith("@ai-presence/") && dependencyVersion !== version) {
          fail(
            `${packageInfo.name}: ${dependencyName} dependency is ${dependencyVersion}; expected ${version}.`,
          );
        }
      }
    }
  }
}

function registryVersion(packageName, npmEnv, latest = false) {
  const spec = latest ? packageName : `${packageName}@${version}`;
  const result = capture("npm", ["view", spec, "version"], {
    env: npmEnv,
    allowFailure: true,
  });

  if (result.status === 0) return result.stdout.trim();
  if (/E404|404 Not Found/.test(result.stderr)) return null;
  fail(`Unable to inspect npm registry metadata for ${spec}.`, result.stderr.trim());
}

function publishPackage(packageInfo, npmEnv) {
  const alreadyPublished = registryVersion(packageInfo.name, npmEnv);
  if (alreadyPublished === version && !dryRun) {
    console.log(`${packageInfo.name}@${version}: already published, skipping publish`);
    return;
  }

  const publishArgs = ["publish", `./${packageInfo.dir}`, "--access", "public"];
  if (dryRun) publishArgs.push("--dry-run");

  console.log(`\n== publish ${packageInfo.name}@${version}${dryRun ? " dry-run" : ""} ==`);
  run("npm", publishArgs, { env: npmEnv });

  if (!dryRun) {
    const published = registryVersion(packageInfo.name, npmEnv);
    if (published !== version) {
      fail(`${packageInfo.name}@${version} is not visible after publish.`);
    }
  }
}

loadReleaseEnv();
const npmEnv = createNpmEnv();

assertCleanGit();
assertReleaseTag();
assertManifestVersions();

for (const packageInfo of packages) publishPackage(packageInfo, npmEnv);

if (dryRun) {
  console.log(`release publish dry-run passed for ${version}`);
  process.exit(0);
}

for (const packageInfo of packages) {
  const exactVersion = registryVersion(packageInfo.name, npmEnv);
  if (exactVersion !== version) fail(`${packageInfo.name}@${version}: expected exact npm metadata.`);

  const latestVersion = registryVersion(packageInfo.name, npmEnv, true);
  if (latestVersion !== version) {
    fail(`${packageInfo.name}: npm latest is ${latestVersion || "missing"}; expected ${version}.`);
  }
}

run("npm", ["run", "release:consumer-smoke", "--", version], { env: npmEnv });

console.log(`release publish passed for ${version}`);
