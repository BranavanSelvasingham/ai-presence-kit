(function initReactPresenceBrowserDemo(globalScope) {
  "use strict";

  const React = globalScope.React;
  const ReactDOM = globalScope.ReactDOM;
  const PresenceCore = globalScope.AIPresenceCore;
  const PresenceFace = globalScope.AIPresenceFace;
  const PresenceAdapters = globalScope.AIPresenceAdapters;
  const PresenceReact = globalScope.AIPresenceReact;
  const demoMode = reactDemoMode();
  const isComposerLaneMode = demoMode === "composer-lane";

  if (!React || !ReactDOM?.createRoot || !PresenceCore || !PresenceAdapters || !PresenceReact) {
    throw new Error("React browser demo dependencies did not load.");
  }

  if (!isComposerLaneMode && !PresenceFace) {
    throw new Error("React browser face demo dependency did not load.");
  }

  const {
    PresenceEvent,
    createPresenceRuntime,
    createPresenceTrace,
    summarizePresenceTrace,
  } = PresenceCore;
  const { createVercelAISDKAdapter } = PresenceAdapters;
  const faceExpressionForPresence = PresenceFace?.faceExpressionForPresence;
  const renderPresenceFaceSvg = PresenceFace?.renderPresenceFaceSvg;

  const runtime = createPresenceRuntime();
  const aiSdkPresence = createVercelAISDKAdapter(runtime);
  const bindings = PresenceReact.createPresenceReactBindings
    ? PresenceReact.createPresenceReactBindings(React, { runtime })
    : PresenceReact;

  const RESPONSE_TEXT = "Presence moved through thinking and waiting before the first visible token.";
  const COMPOSER_LANE_RESPONSE_TEXT = "Lead with the pre-output posture evidence.";

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

  function ComposerLaneApp() {
    const [draft, setDraft] = React.useState("Write a concise launch note for before-output presence.");
    const [assistantText, setAssistantText] = React.useState("");
    const [chatStatus, setChatStatus] = React.useState("idle");
    const [running, setRunning] = React.useState(false);
    const [timeline, setTimeline] = React.useState([]);
    const traceRef = React.useRef(createPresenceTrace({ limit: 24 }));
    const [traceEvidence, setTraceEvidence] = React.useState(() => composerLaneTraceEvidence(traceRef.current));
    const timersRef = React.useRef([]);
    const autorunStartedRef = React.useRef(false);

    const recordComposerSnapshot = React.useCallback((snapshot, elapsedMs) => {
      traceRef.current.record({
        ...snapshot,
        updatedAt: elapsedMs,
      });
      setTraceEvidence(composerLaneTraceEvidence(traceRef.current, elapsedMs));
      setTimeline((current) => [
        `${elapsedMs}ms:${snapshot.event}->${snapshot.state}`,
        ...current,
      ].slice(0, 5));
    }, []);

    React.useEffect(() => {
      return () => {
        clearTimers(timersRef.current);
      };
    }, []);

    const handleDraftChange = React.useCallback((event) => {
      const nextDraft = event.target.value;
      setDraft(nextDraft);
      aiSdkPresence.onInput(nextDraft, { source: "composer" });
    }, []);

    const runTurn = React.useCallback(() => {
      clearTimers(timersRef.current);
      timersRef.current = [];
      setAssistantText("");
      setChatStatus("submitted");
      setRunning(true);
      setTimeline([]);
      traceRef.current.clear();
      setTraceEvidence(composerLaneTraceEvidence(traceRef.current));

      const submittedMessages = [{ role: "user", content: draft }];
      const submitSnapshot = aiSdkPresence.update({
        status: "submitted",
        messages: submittedMessages,
      });
      recordComposerSnapshot(submitSnapshot, 0);

      timersRef.current.push(setTimeout(() => {
        setChatStatus("streaming");
        const streamOpenSnapshot = aiSdkPresence.update({
          status: "streaming",
          messages: submittedMessages,
        });
        recordComposerSnapshot(streamOpenSnapshot, 420);
      }, 420));

      timersRef.current.push(setTimeout(() => {
        const firstTokenText = COMPOSER_LANE_RESPONSE_TEXT.slice(0, 25);
        const firstTokenSnapshot = aiSdkPresence.update({
          status: "streaming",
          messages: [
            ...submittedMessages,
            { role: "assistant", content: firstTokenText },
          ],
        });
        recordComposerSnapshot(firstTokenSnapshot, 980);
        setAssistantText(firstTokenText);
      }, 980));

      timersRef.current.push(setTimeout(() => {
        const fullTokenSnapshot = aiSdkPresence.update({
          status: "streaming",
          messages: [
            ...submittedMessages,
            { role: "assistant", content: COMPOSER_LANE_RESPONSE_TEXT },
          ],
        });
        recordComposerSnapshot(fullTokenSnapshot, 1520);
        setAssistantText(COMPOSER_LANE_RESPONSE_TEXT);
      }, 1520));

      timersRef.current.push(setTimeout(() => {
        const readySnapshot = aiSdkPresence.update({
          status: "ready",
          messages: [
            ...submittedMessages,
            { role: "assistant", content: COMPOSER_LANE_RESPONSE_TEXT },
          ],
        });
        recordComposerSnapshot(readySnapshot, 2080);
        setChatStatus("ready");
        setRunning(false);
      }, 2080));
    }, [draft, recordComposerSnapshot]);

    React.useEffect(() => {
      if (!shouldAutorunReactDemo() || autorunStartedRef.current) return;
      autorunStartedRef.current = true;
      timersRef.current.push(setTimeout(runTurn, 80));
    }, [runTurn]);

    const resetTurn = React.useCallback(() => {
      clearTimers(timersRef.current);
      timersRef.current = [];
      setAssistantText("");
      setChatStatus("idle");
      setRunning(false);
      setTimeline([]);
      traceRef.current.clear();
      setTraceEvidence(composerLaneTraceEvidence(traceRef.current));
      runtime.send(PresenceEvent.RESET);
    }, []);

    return React.createElement(
      bindings.PresenceProvider,
      { runtime },
      React.createElement(
        "div",
        { className: "react-demo-grid composer-lane-grid", "data-react-composer-lane-demo": "" },
        React.createElement(ComposerLanePresencePanel, {
          assistantText,
          chatStatus,
          draft,
          running,
          trace: traceRef.current,
          timeline,
          traceEvidence,
        }),
        React.createElement(ComposerLaneChatPanel, {
          assistantText,
          draft,
          running,
          onDraftChange: handleDraftChange,
          onReset: resetTurn,
          onRun: runTurn,
        }),
      ),
    );
  }

  function ComposerLanePresencePanel({
    assistantText,
    chatStatus,
    draft,
    running,
    trace,
    timeline,
    traceEvidence,
  }) {
    const vercelPresence = bindings.useVercelAIPresence({
      status: chatStatus === "idle" ? "ready" : chatStatus,
      messages: assistantText.length
        ? [{ role: "assistant", parts: [{ type: "text", text: assistantText }] }]
        : [],
      assistantText,
    }, {
      attachTrace: false,
      autoUpdate: false,
      trace,
    });

    return React.createElement(
      bindings.PresenceRendererSlot,
      null,
      ({ snapshot, controlInputs, frameTimeMs }) => React.createElement(
          "article",
          {
            className: "presence-panel composer-lane-panel",
            "data-renderer": "composer-lane",
            "data-rendered-state": snapshot.state,
            "data-react-composer-lane-route": "true",
            "data-react-composer-lane-summary": traceEvidence.status,
            "data-react-composer-lane-stream-open-ms": traceEvidence.streamOpenMs,
            "data-react-composer-lane-first-output-ms": traceEvidence.firstOutputMs,
            "data-react-composer-lane-lead-ms": traceEvidence.leadMs,
            "data-react-composer-lane-has-output": traceEvidence.hasOutput,
            "data-react-composer-lane-complete": traceEvidence.complete,
            "data-react-composer-lane-final-state": traceEvidence.finalState,
          },
          React.createElement("p", { className: "eyebrow" }, "Composer lane"),
          React.createElement("h1", null, "Before output"),
          React.createElement(ComposerLaneSurface, {
            assistantText,
            chatStatus,
            controlInputs,
            draft,
            frameTimeMs,
            running,
            snapshot,
            traceEvidence,
            vercelEvidenceAttributes: vercelPresence.evidenceAttributes,
          }),
          React.createElement(
            "ol",
            { className: "event-list composer-lane-timeline", "data-trace-events": traceEvidence.events },
            timeline.length
              ? timeline.map((item, index) => React.createElement("li", { key: `${index}-${item}` }, item))
              : React.createElement("li", null, "--"),
          ),
        ),
    );
  }

  function ComposerLaneSurface({
    assistantText,
    chatStatus,
    controlInputs,
    draft,
    frameTimeMs,
    running,
    snapshot,
    traceEvidence,
    vercelEvidenceAttributes,
  }) {
    const assistantTextEmpty = assistantText.length === 0;
    const beforeOutput = controlInputs.latencyPhase === "before-output"
      && assistantTextEmpty
      && traceEvidence.hasOutput === "false";
    const locked = running && (
      controlInputs.latencyPhase === "before-output"
      || controlInputs.latencyPhase === "output"
    );
    const progressStep = beforeOutput
      ? snapshot.event
      : traceEvidence.hasOutput === "true"
        ? "first-output"
        : snapshot.state;

    return React.createElement(
      "section",
      {
        className: "composer-lane-surface",
        "data-renderer": "composer-lane",
        "data-presence-state": snapshot.state,
        "data-presence-phase": controlInputs.latencyPhase,
        "data-presence-attention": controlInputs.attentionTarget,
        "data-presence-event": snapshot.event,
        "data-presence-before-output": String(beforeOutput),
        "data-chat-status": chatStatus,
        "data-composer-lock": String(locked),
        "data-composer-draft-present": String(draft.length > 0),
        "data-assistant-text-empty": String(assistantTextEmpty),
        "data-progress-step": progressStep,
        "data-stream-open-ms": traceEvidence.streamOpenMs,
        "data-first-output-ms": traceEvidence.firstOutputMs,
        "data-lead-ms": traceEvidence.leadMs,
        "data-trace-summary": traceEvidence.status,
        "data-trace-entry-count": traceEvidence.entryCount,
        "data-trace-states": traceEvidence.states,
        "data-frame-time": String(frameTimeMs),
        ...vercelEvidenceAttributes,
      },
      React.createElement(
        "div",
        { className: "composer-lane-status" },
        React.createElement("span", { className: "nonface-status-dot", "aria-hidden": "true" }),
        React.createElement("span", { className: "nonface-status-state" }, beforeOutput ? snapshot.state : chatStatus),
        React.createElement("span", { className: "nonface-status-phase" }, controlInputs.latencyPhase),
      ),
      React.createElement(
        "div",
        { className: "composer-lane-progress", "aria-hidden": "true" },
        React.createElement("span", { className: "composer-lane-progress-fill" }),
      ),
      React.createElement(
        "dl",
        { className: "presence-readout composer-lane-readout" },
        React.createElement("div", null, React.createElement("dt", null, "Step"), React.createElement("dd", null, progressStep)),
        React.createElement("div", null, React.createElement("dt", null, "Stream open"), React.createElement("dd", null, traceEvidence.streamOpenMs)),
        React.createElement("div", null, React.createElement("dt", null, "Lead"), React.createElement("dd", null, traceEvidence.leadMs)),
      ),
    );
  }

  function ComposerLaneChatPanel({
    assistantText,
    draft,
    running,
    onDraftChange,
    onReset,
    onRun,
  }) {
    return React.createElement(
      "article",
      { className: "chat-panel composer-chat-panel" },
      React.createElement("label", { htmlFor: "composerLanePrompt" }, "Prompt"),
      React.createElement("textarea", {
        id: "composerLanePrompt",
        rows: 3,
        value: draft,
        onChange: onDraftChange,
        disabled: running,
        "data-react-composer-input": "",
      }),
      React.createElement(
        "div",
        { className: "button-row" },
        React.createElement("button", { type: "button", onClick: onRun, disabled: running, "data-react-composer-run": "" }, running ? "Pending" : "Send"),
        React.createElement("button", { type: "button", onClick: onReset, "data-react-composer-reset": "" }, "Reset"),
      ),
      React.createElement("output", {
        className: "response-output composer-response-output",
        "aria-busy": String(running && assistantText.length === 0),
        "data-react-composer-response": "",
        "data-assistant-text-empty": String(assistantText.length === 0),
      }, assistantText),
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

  function composerLaneTraceEvidence(trace, currentElapsedMs = null) {
    const summary = summarizePresenceTrace(trace);
    const entries = trace.getEntries();
    const currentMs = Number.isFinite(currentElapsedMs)
      ? currentElapsedMs
      : entries.at(-1)?.updatedAt;
    const leadMs = Number.isFinite(summary.presenceBeforeOutputMs)
      ? summary.presenceBeforeOutputMs
      : pendingComposerLeadMs(entries, currentMs);

    return Object.freeze({
      status: summary.complete ? "complete" : "pending",
      entryCount: String(summary.entryCount),
      streamOpenMs: formatEvidenceMs(summary.streamOpenMs),
      firstOutputMs: formatEvidenceMs(summary.firstOutputMs),
      leadMs: formatEvidenceMs(leadMs),
      finalState: summary.finalState || "none",
      hasOutput: String(summary.hasOutput),
      complete: String(summary.complete),
      events: entries.map((entry) => entry.event).join(" "),
      states: entries.map((entry) => entry.state).join(" "),
    });
  }

  function pendingComposerLeadMs(entries, currentElapsedMs) {
    if (!Number.isFinite(currentElapsedMs)) return NaN;
    const firstBeforeOutput = entries.find((entry) => (
      entry.state === "thinking" || entry.state === "waiting"
    ));
    if (!firstBeforeOutput || !Number.isFinite(firstBeforeOutput.updatedAt)) return NaN;
    return Math.max(0, currentElapsedMs - firstBeforeOutput.updatedAt);
  }

  function formatEvidenceMs(value) {
    return Number.isFinite(value) ? `${Math.round(value)}ms` : "none";
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

  function reactDemoMode() {
    try {
      const params = new URLSearchParams(globalScope.location?.search || "");
      const pageMode = params.get("mode") || params.get("demo");
      if (pageMode) return pageMode;

      const scriptUrl = globalScope.document?.currentScript?.src
        ? new URL(globalScope.document.currentScript.src, globalScope.location?.href)
        : null;
      const scriptMode = scriptUrl?.searchParams.get("mode") || scriptUrl?.searchParams.get("demo");
      if (scriptMode) return scriptMode;

      return globalScope.location?.pathname?.includes("composer-lane") ? "composer-lane" : "face";
    } catch {
      return "face";
    }
  }

  const root = ReactDOM.createRoot(document.querySelector("[data-react-demo-root]"));
  root.render(React.createElement(isComposerLaneMode ? ComposerLaneApp : App));
})(window);
