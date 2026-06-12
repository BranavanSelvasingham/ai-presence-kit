import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const workspaces = [
  "@ai-presence/core",
  "@ai-presence/face",
  "@ai-presence/adapters",
  "@ai-presence/react",
];

const cachePath = process.env.AI_PRESENCE_NPM_CACHE || join(tmpdir(), "ai-presence-npm-cache");
mkdirSync(cachePath, { recursive: true });

for (const workspace of workspaces) {
  const result = spawnSync(
    "npm",
    ["--cache", cachePath, "pack", "--workspace", workspace, "--dry-run"],
    {
      shell: process.platform === "win32",
      stdio: "inherit",
    },
  );

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
