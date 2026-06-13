(function initReactPresenceBrowserDemo(globalScope) {
  "use strict";

  const React = globalScope.React;
  const ReactDOM = globalScope.ReactDOM;
  const PresenceCore = globalScope.AIPresenceCore;
  const PresenceFace = globalScope.AIPresenceFace;
  const PresenceAdapters = globalScope.AIPresenceAdapters;
  const PresenceReact = globalScope.AIPresenceReact;

  if (!React || !ReactDOM?.createRoot || !PresenceCore || !PresenceFace || !PresenceAdapters || !PresenceReact) {
    throw new Error("React browser demo dependencies did not load.");
  }

  const { PresenceEvent, createPresenceRuntime } = PresenceCore;
  const { createVercelAISDKAdapter } = PresenceAdapters;
  const {
    faceExpressionForPresence,
    renderPresenceFaceSvg,
  } = PresenceFace;

  const runtime = createPresenceRuntime();
  const aiSdkPresence = createVercelAISDKAdapter(runtime);
  const bindings = PresenceReact.createPresenceReactBindings
    ? PresenceReact.createPresenceReactBindings(React, { runtime })
    : PresenceReact;

  const RESPONSE_TEXT = "Presence moved through thinking and waiting before the first visible token.";

  function App() {
    const [prompt, setPrompt] = React.useState("Why does this feel faster?");
    const [response, setResponse] = React.useState("");
    const [events, setEvents] = React.useState([]);
    const [running, setRunning] = React.useState(false);
    const timersRef = React.useRef([]);

    React.useEffect(() => {
      const unsubscribe = runtime.subscribe((snapshot) => {
        setEvents((current) => [
          `${snapshot.event} -> ${snapshot.state}`,
          ...current,
        ].slice(0, 5));
      });

      return () => {
        unsubscribe();
        clearTimers(timersRef.current);
      };
    }, []);

    const handlePromptChange = React.useCallback((event) => {
      const nextPrompt = event.target.value;
      setPrompt(nextPrompt);
      aiSdkPresence.onInput(nextPrompt);
    }, []);

    const runTurn = React.useCallback(() => {
      clearTimers(timersRef.current);
      timersRef.current = [];
      setRunning(true);
      setResponse("");

      aiSdkPresence.onSubmit(prompt);

      timersRef.current.push(setTimeout(() => {
        aiSdkPresence.update({ status: "streaming", messages: [] });
      }, 420));

      timersRef.current.push(setTimeout(() => {
        aiSdkPresence.update({
          status: "streaming",
          messages: [{ role: "assistant", parts: [{ type: "text", text: RESPONSE_TEXT.slice(0, 30) }] }],
        });
        setResponse(RESPONSE_TEXT.slice(0, 30));
      }, 980));

      timersRef.current.push(setTimeout(() => {
        aiSdkPresence.update({
          status: "streaming",
          messages: [{ role: "assistant", parts: [{ type: "text", text: RESPONSE_TEXT }] }],
        });
        setResponse(RESPONSE_TEXT);
      }, 1520));

      timersRef.current.push(setTimeout(() => {
        aiSdkPresence.onFinish({ finishReason: "stop" });
        setRunning(false);
      }, 2080));
    }, [prompt]);

    const resetTurn = React.useCallback(() => {
      clearTimers(timersRef.current);
      timersRef.current = [];
      setRunning(false);
      setResponse("");
      setEvents([]);
      runtime.send(PresenceEvent.RESET);
    }, []);

    return React.createElement(
      bindings.PresenceProvider,
      { runtime },
      React.createElement(
        "div",
        { className: "react-demo-grid" },
        React.createElement(PresencePanel),
        React.createElement(ChatPanel, {
          events,
          prompt,
          response,
          running,
          onPromptChange: handlePromptChange,
          onReset: resetTurn,
          onRun: runTurn,
        }),
      ),
    );
  }

  function PresencePanel() {
    return React.createElement(
      bindings.PresenceRendererSlot,
      null,
      ({ snapshot, controlInputs, frameTimeMs }) => {
        const expression = faceExpressionForPresence(snapshot);

        return React.createElement(
          "article",
          { className: "presence-panel", "data-rendered-state": snapshot.state },
          React.createElement("p", { className: "eyebrow" }, "AI Presence Kit"),
          React.createElement("h1", null, "React runtime"),
          React.createElement(FaceRendererSlot, { snapshot, frameTimeMs }),
          React.createElement(
            "dl",
            { className: "presence-readout" },
            React.createElement("div", null, React.createElement("dt", null, "State"), React.createElement("dd", { "data-presence-state": "" }, snapshot.state)),
            React.createElement("div", null, React.createElement("dt", null, "Phase"), React.createElement("dd", { "data-presence-phase": "" }, controlInputs.latencyPhase)),
            React.createElement("div", null, React.createElement("dt", null, "Attention"), React.createElement("dd", { "data-presence-attention": "" }, controlInputs.attentionTarget)),
            React.createElement("div", null, React.createElement("dt", null, "Renderer"), React.createElement("dd", { "data-presence-expression": "" }, expression)),
            React.createElement("div", null, React.createElement("dt", null, "Event"), React.createElement("dd", { "data-presence-event": "" }, snapshot.event)),
          ),
          React.createElement("output", { className: "renderer-slot", "data-renderer-slot": "" }, `slot:${snapshot.state}`),
        );
      },
    );
  }

  function FaceRendererSlot({ snapshot, frameTimeMs }) {
    const frameOptions = {
      now: frameTimeMs,
      timeMs: frameTimeMs,
    };
    const renderedFace = renderPresenceFaceSvg(snapshot, {
      className: "react-face",
      ...frameOptions,
      title: `Reference face rendering ${snapshot.state}`,
    });

    return React.createElement(
      "div",
      {
        className: "face-renderer-slot",
        "data-face-svg-renderer": "@ai-presence/face",
        "data-face-svg-state": renderedFace.state,
        "data-face-svg-channels": renderedFace.attributes.channels,
        "data-face-svg-frame-time": String(frameTimeMs),
        "data-face-svg-motion-energy": renderedFace.attributes.motionEnergy,
        "data-face-decision-trace": renderedFace.attributes.decisionTrace,
        "data-face-decision-trace-channels": renderedFace.attributes.decisionTraceChannels,
        "data-face-decision-trace-decisions": renderedFace.attributes.decisionTraceDecisions,
        "data-face-decision-trace-warnings": renderedFace.attributes.decisionTraceWarnings,
        "data-face-decision-trace-renderer-safe": renderedFace.attributes.decisionTraceRendererSafe,
        "data-face-latency-phase": renderedFace.attributes.latencyPhase || "unknown",
        "data-renderer-slot-face": "",
        dangerouslySetInnerHTML: { __html: renderedFace.svg },
      },
    );
  }

  function ChatPanel({ events, prompt, response, running, onPromptChange, onReset, onRun }) {
    return React.createElement(
      "article",
      { className: "chat-panel" },
      React.createElement("label", { htmlFor: "reactPrompt" }, "Prompt"),
      React.createElement("textarea", {
        id: "reactPrompt",
        rows: 3,
        value: prompt,
        onChange: onPromptChange,
      }),
      React.createElement(
        "div",
        { className: "button-row" },
        React.createElement("button", { type: "button", onClick: onRun, disabled: running, "data-react-run": "" }, running ? "Running" : "Run"),
        React.createElement("button", { type: "button", onClick: onReset, "data-react-reset": "" }, "Reset"),
      ),
      React.createElement("output", { className: "response-output", "data-react-response": "" }, response || "--"),
      React.createElement(
        "ol",
        { className: "event-list", "data-react-events": "" },
        events.length
          ? events.map((event, index) => React.createElement("li", { key: `${index}-${event}` }, event))
          : React.createElement("li", null, "--"),
      ),
    );
  }

  function clearTimers(timers) {
    for (const timer of timers) {
      clearTimeout(timer);
    }
  }

  const root = ReactDOM.createRoot(document.querySelector("[data-react-demo-root]"));
  root.render(React.createElement(App));
})(window);
