# @ai-presence/core

Core presence state runtime for AI interfaces.

This package is intentionally tiny in the prototype: it defines the canonical interaction states, transition events, a small runtime that renderers can subscribe to or poll, and shared controller inputs that stay renderer-agnostic.

The face demo consumes this layer as a browser global so the current static prototype still works without a build step. Package consumers can use either the CommonJS entry or the ESM export:

```js
import { PresenceEvent, createPresenceRuntime } from "@ai-presence/core";

const presence = createPresenceRuntime();
presence.send(PresenceEvent.SUBMIT);
```

For debugging and demos, `createPresenceTrace` records a bounded transition timeline and `summarizePresenceTrace` turns it into compact integration evidence:

```js
import {
  PresenceEvent,
  createPresenceRuntime,
  createPresenceTrace,
  summarizePresenceTrace,
} from "@ai-presence/core";

const trace = createPresenceTrace({ limit: 32 });
const presence = createPresenceRuntime();
const detach = trace.attach(presence);

presence.send(PresenceEvent.SUBMIT);
presence.send(PresenceEvent.STREAM_OPEN);
presence.send(PresenceEvent.TOKEN);

console.log(trace.getEntries().map((entry) => entry.state));
console.log(summarizePresenceTrace(trace).presenceBeforeOutputMs);
detach();
```

Trace entries include `elapsedMs` and `sincePreviousMs`, and the summary exposes facts such as `firstTokenMs`, `firstOutputMs`, `presenceBeforeOutputMs`, `finalState`, `hasOutput`, and `complete` without coupling core to any renderer.

Renderers can derive shared interaction-posture inputs from the same snapshot before mapping them into renderer-specific controllers:

```js
import { PresenceEvent, createPresenceRuntime, presenceControlInputsForSnapshot } from "@ai-presence/core";

const presence = createPresenceRuntime();
const snapshot = presence.send(PresenceEvent.STREAM_OPEN);
const inputs = presenceControlInputsForSnapshot(snapshot);

console.log(inputs.latencyPhase); // "before-output"
console.log(inputs.attentionTarget); // "response"
console.log(inputs.transitionEvent); // "stream-open"
```

These values describe observable interaction posture such as attention target, tension, speech activity, interruption, latency phase, recovery, and compact transition context. They are not emotion detection or private emotion inference.
