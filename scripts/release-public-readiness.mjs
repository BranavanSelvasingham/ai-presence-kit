import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readText(path) {
  const absolutePath = resolve(root, path);
  assert.ok(existsSync(absolutePath), `${path} missing`);
  return readFileSync(absolutePath, "utf8");
}

for (const requiredFile of [
  "README.md",
  "CONTRIBUTING.md",
  "docs/PUBLIC_RELEASE_GATE.md",
  "docs/RELEASE_RUNBOOK.md",
  "docs/RELEASE_READINESS.md",
  "docs/media/main-app-release.png",
]) {
  assert.ok(existsSync(resolve(root, requiredFile)), `${requiredFile} missing`);
}

const readme = readText("README.md");
assert.match(readme, /Why This Exists/);
assert.match(readme, /renderer-agnostic presence state layer for AI interfaces/);
assert.match(readme, /reference facial controller system/);
assert.match(readme, /AI interfaces should not feel frozen until text appears/);
assert.match(readme, /Collaborating/);
assert.match(readme, /AI interfaces, expressive systems, interaction design, SVG\/rendering, or low-latency UI behavior/);
assert.match(readme, /not emotion recognition/i);
assert.match(readme, /main-app-release\.png/);
assert.match(readme, /Replace spinners with presence/);

const contributing = readText("CONTRIBUTING.md");
assert.match(contributing, /Good First Collaboration Areas/);
assert.match(contributing, /presence state layer/);
assert.match(contributing, /interaction posture/);
assert.match(contributing, /not emotion detection/i);
assert.match(contributing, /npm run validate/);
assert.match(contributing, /npm run release:public-gate/);

const publicGate = readText("docs/PUBLIC_RELEASE_GATE.md");
assert.match(publicGate, /Fresh-Eyes Gate/);
assert.match(publicGate, /Collaborator-Readiness Gate/);
assert.match(publicGate, /npm run release:public-gate/);
assert.match(publicGate, /npm run release:preflight/);
assert.match(publicGate, /npm run release:publish -- X\.Y\.Z/);
assert.match(publicGate, /NPM_TOKEN/);
assert.match(publicGate, /Do not paste/);
assert.match(publicGate, /first-time/);
assert.match(publicGate, /screenshot/);
assert.match(publicGate, /CONTRIBUTING\.md/);

const releaseRunbook = readText("docs/RELEASE_RUNBOOK.md");
assert.match(releaseRunbook, /Fresh-Eyes Gate/);
assert.match(releaseRunbook, /npm run release:public-gate/);
assert.match(releaseRunbook, /npm run release:publish -- X\.Y\.Z/);
assert.match(releaseRunbook, /\.env\.release\.local/);

console.log("release public readiness passed");
