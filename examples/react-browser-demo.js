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
  const { faceExpressionForPresence } = PresenceFace;

  const runtime = createPresenceRuntime();
  const aiSdkPresence = createVercelAISDKAdapter(runtime);
  const bindings = PresenceReact.createPresenceReactBindings
    ? PresenceReact.createPresenceReactBindings(React, { runtime })
    : PresenceReact;

  const RESPONSE_TEXT = "Presence moved through thinking and waiting before the first visible token.";
  const MOUTH_PATHS = Object.freeze({
    idle: "M34 62 C42 66 58 66 66 62",
    listening: "M34 63 C42 66 58 66 66 63",
    reading: "M36 62 C43 64 57 64 64 62",
    thinking: "M36 64 C43 62 57 62 64 64",
    curious: "M36 62 C45 68 57 66 64 60",
    uncertain: "M36 64 C44 66 56 62 64 64",
    concerned: "M36 66 C44 60 56 60 64 66",
    ready: "M34 61 C43 68 57 68 66 61",
    speaking: "M38 58 C45 68 55 68 62 58",
  });

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
    const snapshot = bindings.usePresenceSnapshot();
    const expression = faceExpressionForPresence(snapshot);

    return React.createElement(
      "article",
      { className: "presence-panel", "data-rendered-state": snapshot.state },
      React.createElement("p", { className: "eyebrow" }, "AI Presence Kit"),
      React.createElement("h1", null, "React runtime"),
      React.createElement(Face, { expression, state: snapshot.state }),
      React.createElement(
        "dl",
        { className: "presence-readout" },
        React.createElement("div", null, React.createElement("dt", null, "State"), React.createElement("dd", { "data-presence-state": "" }, snapshot.state)),
        React.createElement("div", null, React.createElement("dt", null, "Renderer"), React.createElement("dd", { "data-presence-expression": "" }, expression)),
        React.createElement("div", null, React.createElement("dt", null, "Event"), React.createElement("dd", { "data-presence-event": "" }, snapshot.event)),
      ),
      React.createElement(
        bindings.PresenceRenderer,
        null,
        (renderSnapshot) => React.createElement(
          "output",
          { className: "renderer-slot", "data-renderer-slot": "" },
          `slot:${renderSnapshot.state}`,
        ),
      ),
    );
  }

  function Face({ expression, state }) {
    return React.createElement(
      "svg",
      {
        className: "react-face",
        viewBox: "0 0 100 86",
        role: "img",
        "aria-label": `Reference face rendering ${state}`,
        "data-face-expression": expression,
      },
      React.createElement("path", {
        className: "react-face-frame",
        d: "M24 14 C36 5 64 5 76 14 C87 24 89 61 75 72 C61 83 39 83 25 72 C11 61 13 24 24 14 Z",
      }),
      React.createElement("ellipse", { className: "react-eye react-eye-left", cx: "38", cy: "38", rx: "5", ry: "6" }),
      React.createElement("ellipse", { className: "react-eye react-eye-right", cx: "62", cy: "38", rx: "5", ry: "6" }),
      React.createElement("path", { className: "react-mouth", d: MOUTH_PATHS[expression] || MOUTH_PATHS.idle }),
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
