import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PresenceState } = require("../packages/core/src/presence-core.js");
const { createReactPresenceDemo } = require("../examples/react-presence-demo.js");

const createdElements = [];
const fakeReact = {
  createContext(defaultValue) {
    return { Provider: "PresenceProvider", defaultValue };
  },
  createElement(type, props, ...children) {
    const element = { type, props: props || {}, children };
    createdElements.push(element);
    if (typeof type === "function") {
      return type({ ...(props || {}), children: children.length > 1 ? children : children[0] });
    }
    return element;
  },
  useContext(context) {
    return context.defaultValue;
  },
  useSyncExternalStore(subscribe, getSnapshot) {
    const unsubscribe = subscribe(() => {});
    unsubscribe();
    return getSnapshot();
  },
};

const { PresenceChatDemo, aiSdkPresence, runtime } = createReactPresenceDemo(fakeReact);
const tree = PresenceChatDemo();

assert.ok(tree);
assert.equal(runtime.getSnapshot().state, PresenceState.IDLE);

aiSdkPresence.onSubmit("Hello");
assert.equal(runtime.getSnapshot().state, PresenceState.THINKING);
aiSdkPresence.update({ status: "streaming", messages: [] });
assert.equal(runtime.getSnapshot().state, PresenceState.WAITING);
aiSdkPresence.update({
  status: "streaming",
  messages: [{ role: "assistant", parts: [{ type: "text", text: "Hi" }] }],
});
assert.equal(runtime.getSnapshot().state, PresenceState.STREAMING);
aiSdkPresence.onFinish({ finishReason: "stop" });
assert.equal(runtime.getSnapshot().state, PresenceState.READY);

assert.ok(createdElements.some((element) => element.props?.className?.startsWith("presence-badge")));

console.log("react-example ok");
