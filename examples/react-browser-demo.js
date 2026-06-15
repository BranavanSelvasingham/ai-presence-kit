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

  const {
    PresenceEvent,
    createPresenceRuntime,
    createPresenceTrace,
    summarizePresenceTrace,
  } = PresenceCore;
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
    const reactTraceRef = React.useRef(createPresenceTrace({ limit: 16 }));
    const [traceEvidence, setTraceEvidence] = React.useState(() => reactTraceSummaryEvidence(reactTraceRef.current));
    const timersRef = React.useRef([]);
    const autorunStartedRef = React.useRef(false);

    const recordReactTraceSnapshot = React.useCallback((snapshot, elapsedMs) => {
      reactTraceRef.current.record({
        ...snapshot,
        updatedAt: elapsedMs,
      });
      setTraceEvidence(reactTraceSummaryEvidence(reactTraceRef.current));
    }, []);

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
      reactTraceRef.current.clear();
      setTraceEvidence(reactTraceSummaryEvidence(reactTraceRef.current));

      const submitSnapshot = aiSdkPresence.onSubmit(prompt);
      recordReactTraceSnapshot(submitSnapshot, 0);

      timersRef.current.push(setTimeout(() => {
        const streamOpenSnapshot = aiSdkPresence.update({ status: "streaming", messages: [] });
        recordReactTraceSnapshot(streamOpenSnapshot, 420);
      }, 420));

      timersRef.current.push(setTimeout(() => {
        const firstTokenSnapshot = aiSdkPresence.update({
          status: "streaming",
          messages: [{ role: "assistant", parts: [{ type: "text", text: RESPONSE_TEXT.slice(0, 30) }] }],
        });
        recordReactTraceSnapshot(firstTokenSnapshot, 980);
        setResponse(RESPONSE_TEXT.slice(0, 30));
      }, 980));

      timersRef.current.push(setTimeout(() => {
        const laterTokenSnapshot = aiSdkPresence.update({
          status: "streaming",
          messages: [{ role: "assistant", parts: [{ type: "text", text: RESPONSE_TEXT }] }],
        });
        recordReactTraceSnapshot(laterTokenSnapshot, 1520);
        setResponse(RESPONSE_TEXT);
      }, 1520));

      timersRef.current.push(setTimeout(() => {
        const completeSnapshot = aiSdkPresence.onFinish({ finishReason: "stop" });
        recordReactTraceSnapshot(completeSnapshot, 2080);
        setRunning(false);
      }, 2080));
    }, [prompt, recordReactTraceSnapshot]);

    React.useEffect(() => {
      if (!shouldAutorunReactDemo() || autorunStartedRef.current) return;
      autorunStartedRef.current = true;
      timersRef.current.push(setTimeout(runTurn, 80));
    }, [runTurn]);

    const resetTurn = React.useCallback(() => {
      clearTimers(timersRef.current);
      timersRef.current = [];
      setRunning(false);
      setResponse("");
      setEvents([]);
      reactTraceRef.current.clear();
      setTraceEvidence(reactTraceSummaryEvidence(reactTraceRef.current));
      runtime.send(PresenceEvent.RESET);
    }, []);

    return React.createElement(
      bindings.PresenceProvider,
      { runtime },
      React.createElement(
        "div",
        { className: "react-demo-grid" },
        React.createElement(PresencePanel, { traceEvidence }),
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

  function PresencePanel({ traceEvidence }) {
    return React.createElement(
      bindings.PresenceRendererSlot,
      null,
      ({ snapshot, controlInputs, frameTimeMs }) => {
        const expression = faceExpressionForPresence(snapshot);

        return React.createElement(
          "article",
          {
            className: "presence-panel",
            "data-rendered-state": snapshot.state,
            "data-react-trace-summary": traceEvidence.status,
            "data-react-trace-entry-count": traceEvidence.entryCount,
            "data-react-trace-first-output-ms": traceEvidence.firstOutputMs,
            "data-react-trace-first-output-event": traceEvidence.firstOutputEvent,
            "data-react-trace-lead-ms": traceEvidence.leadMs,
            "data-react-trace-final-state": traceEvidence.finalState,
            "data-react-trace-has-output": traceEvidence.hasOutput,
            "data-react-trace-complete": traceEvidence.complete,
          },
          React.createElement("p", { className: "eyebrow" }, "AI Presence Kit"),
          React.createElement("h1", null, "React runtime"),
          React.createElement(NonFaceRendererSurface, {
            controlInputs,
            frameTimeMs,
            snapshot,
          }),
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

  function NonFaceRendererSurface({ snapshot, controlInputs, frameTimeMs }) {
    const beforeOutput = controlInputs.latencyPhase === "before-output";

    return React.createElement(
      "output",
      {
        className: "nonface-status-surface",
        "data-nonface-renderer": "status-surface",
        "data-nonface-state": snapshot.state,
        "data-nonface-phase": controlInputs.latencyPhase,
        "data-nonface-attention": controlInputs.attentionTarget,
        "data-nonface-event": snapshot.event,
        "data-nonface-frame-time": String(frameTimeMs),
        "data-nonface-before-output": String(beforeOutput),
      },
      React.createElement("span", { className: "nonface-status-dot", "aria-hidden": "true" }),
      React.createElement("span", { className: "nonface-status-state" }, snapshot.state),
      React.createElement("span", { className: "nonface-status-phase" }, controlInputs.latencyPhase),
    );
  }

  function reactTraceSummaryEvidence(reactTrace) {
    const summary = summarizePresenceTrace(reactTrace);
    const complete = Boolean(summary.complete && summary.hasOutput && summary.finalState);

    return Object.freeze({
      status: complete ? "complete" : "incomplete",
      entryCount: String(summary.entryCount),
      firstOutputMs: reactTraceEvidenceMs(summary.firstOutputMs),
      firstOutputEvent: summary.firstOutputEvent || "none",
      leadMs: reactTraceEvidenceMs(summary.presenceBeforeOutputMs),
      finalState: summary.finalState || "none",
      hasOutput: String(summary.hasOutput),
      complete: String(summary.complete),
    });
  }

  function reactTraceEvidenceMs(value) {
    return Number.isFinite(value) ? String(value) : "none";
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
    const transitionEvidence = transitionEvidenceForRenderedFace(renderedFace);

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
        "data-face-previous-state": renderedFace.attributes.previousState || "",
        "data-face-transition-event": renderedFace.attributes.transitionEvent || "",
        "data-face-transition-age-ms": renderedFace.attributes.transitionAgeMs || "",
        "data-face-transition-context": transitionEvidence.context,
        "data-face-transition-controller-reads": transitionEvidence.controllerReads,
        "data-face-transition-controller-reads-event": transitionEvidence.readsEvent,
        "data-face-transition-controller-reads-age": transitionEvidence.readsAge,
        "data-renderer-slot-face": "",
        dangerouslySetInnerHTML: { __html: renderedFace.svg },
      },
    );
  }

  function transitionEvidenceForRenderedFace(renderedFace) {
    const previousState = renderedFace.attributes.previousState || "none";
    const transitionEvent = renderedFace.attributes.transitionEvent || "none";
    const transitionAgeMs = renderedFace.attributes.transitionAgeMs || "none";
    const eventReadChannels = controllerReadChannels(renderedFace.decisionTrace, "transitionEvent");
    const ageReadChannels = controllerReadChannels(renderedFace.decisionTrace, "transitionAgeMs");
    const controllerReads = renderedFace.decisionTrace.channels
      .filter((channel) => eventReadChannels.includes(channel) && ageReadChannels.includes(channel));

    return Object.freeze({
      context: `${previousState} ${transitionEvent} ${transitionAgeMs}`,
      controllerReads: controllerReads.join(" "),
      readsEvent: String(eventReadChannels.length === renderedFace.decisionTrace.channels.length),
      readsAge: String(ageReadChannels.length === renderedFace.decisionTrace.channels.length),
    });
  }

  function controllerReadChannels(decisionTrace, readName) {
    return decisionTrace.channels.filter((channel) => {
      const reads = decisionTrace.decisions[channel]?.reads || [];
      return reads.includes(readName);
    });
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

  function shouldAutorunReactDemo() {
    try {
      const params = new URLSearchParams(globalScope.location?.search || "");
      return params.get("autorun") === "1" || params.get("autorunReact") === "1";
    } catch {
      return false;
    }
  }

  const root = ReactDOM.createRoot(document.querySelector("[data-react-demo-root]"));
  root.render(React.createElement(App));
})(window);
