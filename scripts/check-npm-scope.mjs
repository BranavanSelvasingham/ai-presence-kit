import { spawnSync } from "node:child_process";

const scopeName = "@ai-presence";
const requiredPackages = [
  "@ai-presence/core",
  "@ai-presence/face",
  "@ai-presence/adapters",
  "@ai-presence/react",
];

function runNpm(args) {
  return spawnSync("npm", args, {
    encoding: "utf8",
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
    "npm scope check requires an authenticated npm session. Run `npm login`, then retry `npm run release:check-scope`.",
    whoami,
  );
  process.exit(1);
}

const username = whoami.stdout.trim();
console.log(`npm authenticated as ${username}`);

const access = runNpm(["access", "list", "packages", scopeName, "--json"]);

if (access.status !== 0) {
  printFailure(
    `Unable to list packages for ${scopeName}. Create or confirm control of the npm scope, then retry.`,
    access,
  );
  process.exit(1);
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
