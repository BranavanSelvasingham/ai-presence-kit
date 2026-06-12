# @ai-presence/core

Core presence state runtime for AI interfaces.

This package is intentionally tiny in the prototype: it defines the canonical interaction states, transition events, and a small runtime that renderers can subscribe to or poll.

The face demo consumes this layer as a browser global so the current static prototype still works without a build step. Package consumers can use either the CommonJS entry or the ESM export:

```js
import { PresenceEvent, createPresenceRuntime } from "@ai-presence/core";

const presence = createPresenceRuntime();
presence.send(PresenceEvent.SUBMIT);
```

For debugging and demos, `createPresenceTrace` records a bounded transition timeline:

```js
import { PresenceEvent, createPresenceRuntime, createPresenceTrace } from "@ai-presence/core";

const trace = createPresenceTrace({ limit: 32 });
const presence = createPresenceRuntime();
const detach = trace.attach(presence);

presence.send(PresenceEvent.SUBMIT);
presence.send(PresenceEvent.STREAM_OPEN);
presence.send(PresenceEvent.TOKEN);

console.log(trace.getEntries().map((entry) => entry.state));
detach();
```

Trace entries include `elapsedMs` and `sincePreviousMs`, which makes before-first-token behavior inspectable without coupling core to any renderer.
