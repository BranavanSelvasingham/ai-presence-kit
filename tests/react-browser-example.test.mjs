import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const html = readFileSync(resolve(root, "examples/react-browser.html"), "utf8");
const script = readFileSync(resolve(root, "examples/react-browser-demo.js"), "utf8");
const css = readFileSync(resolve(root, "examples/react-browser.css"), "utf8");

assert.match(html, /node_modules\/react\/umd\/react\.production\.min\.js/);
assert.match(html, /node_modules\/react-dom\/umd\/react-dom\.production\.min\.js/);
assert.match(html, /packages\/core\/src\/presence-core\.js/);
assert.match(html, /packages\/react\/src\/presence-react\.js/);
assert.match(html, /data-react-demo-root/);

assert.match(script, /ReactDOM\.createRoot/);
assert.match(script, /createPresenceReactBindings\(React, \{ runtime \}\)/);
assert.match(script, /createVercelAISDKAdapter\(runtime\)/);
assert.match(script, /usePresenceControlInputs\(null, \{ now: snapshot\.updatedAt \}\)/);
assert.match(script, /data-presence-phase/);
assert.match(script, /data-presence-attention/);
assert.match(script, /faceExpressionForPresence\(snapshot\)/);
assert.doesNotMatch(script, /emotion/i);

assert.match(css, /grid-template-columns/);
assert.match(css, /@media \(max-width: 760px\)/);

console.log("react-browser-example ok");
