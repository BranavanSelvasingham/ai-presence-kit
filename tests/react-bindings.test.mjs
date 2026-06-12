import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PresenceEvent, PresenceState, createPresenceRuntime } = require("../packages/core/src/presence-core.js");
const { createPresenceReactBindings } = require("../packages/react/src/presence-react.js");

let contextValue = null;
const fakeReact = {
  createContext(defaultValue) {
    contextValue = defaultValue;
    return {
      Provider: "PresenceProvider",
      defaultValue,
    };
  },
  createElement(type, props, children) {
    contextValue = props.value;
    return { type, props, children };
  },
  useContext(context) {
    return contextValue || context.defaultValue;
  },
  useSyncExternalStore(subscribe, getSnapshot) {
    const unsubscribe = subscribe(() => {});
    unsubscribe();
    return getSnapshot();
  },
};

const runtime = createPresenceRuntime({ initialState: PresenceState.IDLE });
const bindings = createPresenceReactBindings(fakeReact, { runtime });

assert.equal(bindings.usePresenceState(), PresenceState.IDLE);
runtime.send(PresenceEvent.USER_INPUT, { text: "Hello" });
assert.equal(bindings.usePresenceSnapshot().state, PresenceState.USER_TYPING);

const providerElement = bindings.PresenceProvider({
  runtime,
  children: "child",
});

assert.equal(providerElement.type, "PresenceProvider");
assert.equal(providerElement.props.value, runtime);

const rendered = bindings.PresenceRenderer({
  children: (snapshot) => snapshot.state,
});

assert.equal(rendered, PresenceState.USER_TYPING);

assert.throws(
  () => createPresenceReactBindings({}),
  /requires React/,
);

console.log("react-bindings ok");
