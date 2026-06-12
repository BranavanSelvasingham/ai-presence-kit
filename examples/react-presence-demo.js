"use strict";

const { createPresenceRuntime, PresenceEvent } = require("../packages/core/src/presence-core.js");
const { faceExpressionForPresence } = require("../packages/face/src/presence-face.js");
const { createVercelAISDKAdapter } = require("../packages/adapters/src/runtime-adapter.js");
const { createPresenceReactBindings } = require("../packages/react/src/presence-react.js");

function createReactPresenceDemo(React) {
  const runtime = createPresenceRuntime();
  const aiSdkPresence = createVercelAISDKAdapter(runtime);
  const {
    PresenceProvider,
    PresenceRenderer,
    usePresenceSnapshot,
  } = createPresenceReactBindings(React, { runtime });

  function PresenceBadge() {
    const snapshot = usePresenceSnapshot();
    const expression = faceExpressionForPresence(snapshot);

    return React.createElement(
      "output",
      {
        "aria-label": "AI presence state",
        className: `presence-badge presence-badge-${snapshot.state}`,
      },
      `${snapshot.state} / ${expression}`,
    );
  }

  function PresenceChatDemo() {
    const submit = () => {
      aiSdkPresence.onSubmit("Why does this feel faster?");
      aiSdkPresence.update({ status: "streaming", messages: [] });
      aiSdkPresence.update({
        status: "streaming",
        messages: [{ role: "assistant", parts: [{ type: "text", text: "Presence moved before the token." }] }],
      });
      aiSdkPresence.onFinish({ finishReason: "stop" });
    };

    return React.createElement(
      PresenceProvider,
      { runtime },
      React.createElement(PresenceBadge),
      React.createElement(
        PresenceRenderer,
        null,
        (snapshot) => React.createElement("small", null, `event: ${snapshot.event}`),
      ),
      React.createElement("button", { type: "button", onClick: submit }, "Run presence turn"),
    );
  }

  return {
    PresenceChatDemo,
    aiSdkPresence,
    runtime,
  };
}

if (require.main === module) {
  const React = {
    createContext(defaultValue) {
      return { Provider: "Provider", defaultValue };
    },
    createElement(type, props, ...children) {
      return { type, props: props || {}, children };
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

  const { runtime, aiSdkPresence } = createReactPresenceDemo(React);
  runtime.send(PresenceEvent.USER_INPUT, { text: "Preview" });
  aiSdkPresence.update({ status: "streaming", messages: [] });
  console.log(runtime.getSnapshot().state);
}

module.exports = {
  createReactPresenceDemo,
};
