import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const gates = [
  { label: "workspace validation", command: "npm", args: ["run", "validate"] },
  { label: "core runtime performance smoke", command: "npm", args: ["run", "perf:core"] },
  { label: "face pipeline performance smoke", command: "npm", args: ["run", "perf:face"] },
  { label: "release security preflight", command: "npm", args: ["run", "release:security"] },
  { label: "whitespace diff check", command: "git", args: ["diff", "--check"] },
  { label: "authenticated npm scope check", command: "npm", args: ["run", "release:check-scope"] },
];

function runGate(gate) {
  console.log(`\n== ${gate.label} ==`);
  const result = spawnSync(gate.command, gate.args, {
    cwd: root,
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  if (result.status !== 0) {
    console.error(`\nRelease preflight failed at: ${gate.label}`);
    process.exit(result.status || 1);
  }
}

for (const gate of gates) runGate(gate);

console.log("\nrelease preflight passed");
