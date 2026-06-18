# AI Presence Kit Adopter Trial

Use this packet when asking a React/Vercel AI SDK app developer to try AI Presence Kit in one real chat surface. The goal is not a full migration. The goal is to verify whether presence-before-output is understandable, useful, and easy to wire into an existing AI interface.

## Ask

Try the React hook in one chat or composer surface and send back:

- time to first visible presence
- integration line count and imports added
- whether the evidence attributes made debugging clear
- any confusing API names or missing defaults
- whether the framing read as interaction posture, not emotion inference
- the first production blocker you hit

## Install

```bash
npm install @ai-presence/react@0.1.6
```

`@ai-presence/react` brings the core runtime and adapter helpers. React remains a peer dependency.

## Minimal React/Vercel AI SDK Path

```js
import { createPresenceReactBindings } from "@ai-presence/react";

const {
  PresenceProvider,
  useVercelAIPresence,
} = createPresenceReactBindings(React);

function ChatPresence({ chat }) {
  const presence = useVercelAIPresence({
    status: chat.status,
    messages: chat.messages,
  });

  return React.createElement(
    PresenceProvider,
    { runtime: presence.runtime },
    React.createElement("section", presence.evidenceAttributes, chat.status),
  );
}
```

Use the returned attributes on the app's existing status, composer, or waiting surface. The SVG face is optional; the trial should work without it.

## Evidence To Inspect

During `status: "streaming"` before assistant text exists, inspect the DOM surface for:

```text
data-ai-presence-framework="vercel-ai-sdk"
data-ai-presence-status="streaming"
data-presence-state="waiting"
data-presence-phase="before-output"
data-assistant-text-empty="true"
data-presence-before-output="true"
data-first-output-ms="none"
data-lead-ms="<positive duration>"
```

The useful proof is that the interface changed posture before output appeared. In completed turns, inspect `presence.traceSummary` for `presenceBeforeOutputMs`, `firstOutputMs`, `finalState`, `hasOutput`, and `complete`.

## Success Criteria

- First visible presence is wired in 10 minutes or less.
- The app adds no more than three imports.
- The app adds no more than 15 app-side integration lines for the first surface.
- The surface exposes before-output evidence while assistant text is empty.
- The developer can explain the state as `thinking`, `waiting`, `streaming`, `ready`, `interrupted`, or `error`.
- No one interprets the API as emotion detection or private emotion inference.

## Feedback Template

```text
App/framework:
Time to first visible presence:
Imports added:
Integration lines:
Surface used:
Before-output DOM evidence observed:
Confusing API or docs:
Production blocker:
Would you keep it in the app? Why:
```

## What This Is Not

AI Presence Kit is not emotion detection. It does not infer user emotion, classify private feelings, or require the reference face renderer. It maps runtime facts such as input, submit, stream open, first output, completion, interruption, and error into inspectable interaction posture for AI interfaces.
