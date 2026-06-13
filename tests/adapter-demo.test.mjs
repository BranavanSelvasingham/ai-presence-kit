import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const output = execFileSync("node", ["examples/adapter-demo.mjs"], {
  cwd: root,
  encoding: "utf8",
});

assert.match(output, /vercel:submit->thinking\+\d+ms phase=before-output attention=response face=thinking/);
assert.match(output, /vercel:stream-open->waiting\+\d+ms phase=before-output attention=response face=listening/);
assert.match(output, /realtime:speech-start->speaking\+\d+ms phase=output attention=audience face=speaking/);
assert.match(output, /chat:token->streaming\+\d+ms phase=output attention=audience face=speaking/);
assert.match(output, /channels=gaze,blink,brows,mouth,posture,motion/);
assert.match(output, /vercel:[^\n]+trace=complete decisions=6 safe=true warnings=0 reads=state/);
assert.match(output, /realtime:[^\n]+trace=complete decisions=6 safe=true warnings=0 reads=state/);
assert.match(output, /chat:[^\n]+trace=complete decisions=6 safe=true warnings=0 reads=state/);
assert.match(output, /mouth=preparing/);
assert.match(output, /motion=0\.\d+/);
assert.doesNotMatch(output, /emotion[- ]detection|private emotion/i);

console.log("adapter-demo ok");
