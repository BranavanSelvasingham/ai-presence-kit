# @ai-presence/face

Reference face renderer primitives for AI Presence Kit.

This package maps canonical presence snapshots from `@ai-presence/core` to renderer-specific face expressions. The current prototype still owns the detailed SVG paths and motion grammar; this package starts the reusable boundary between presence state and face rendering.

```js
import { faceExpressionForPresence } from "@ai-presence/face";

const expression = faceExpressionForPresence(snapshot);
```
