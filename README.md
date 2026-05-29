# Low-Latency Face Runtime

## Question

Can a minimal browser face react to live typed input fast enough, clearly enough, and artfully enough that an AI agent feels co-present before the user submits a message?

## Goal Statement

Build a minimal, artful presence engine for expressive AI interaction: a low-latency web face that reacts instantly to typed input, offers tunable presence levels from still to expressive, refines its expression through OpenAI speculation, streams concise responses, and measures every meaningful latency step without letting instrumentation disturb the quietness of the experience.

The finished prototype should feel less like an avatar and more like a living interface: attentive before it speaks, elegant when idle, responsive under pressure, and adjustable in expressiveness without changing the agent's underlying mind.

## Setup

Server-backed web prototype:

- `index.html`
- `styles.css`
- `app.js`
- `server.mjs`
- `.env.example`
- `FACIAL_EXPRESSION_RESEARCH.md`

Run from this folder:

```bash
cp .env.example .env
# edit .env and set OPENAI_API_KEY
node server.mjs
```

Then open:

```text
http://127.0.0.1:8058
```

The app can still be opened directly as a static file, but OpenAI-backed speculation, streaming responses, and speech require `server.mjs`.

For visual QA without touching the default first screen, the app accepts quiet view-only query params:

```text
http://127.0.0.1:8058/?metrics=1&presence=expressive
```

These only set the initial metrics visibility and presence level; they do not send text or trigger OpenAI calls.

Expected `.env` keys:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
OPENAI_SPECULATE_MODEL=gpt-5.4-nano
OPENAI_RESPONSE_REASONING_EFFORT=none
OPENAI_SPECULATE_REASONING_EFFORT=none
OPENAI_TEXT_VERBOSITY=low
OPENAI_RESPONSE_MAX_OUTPUT_TOKENS=260
OPENAI_SPECULATE_MAX_OUTPUT_TOKENS=120
OPENAI_REALTIME_MODEL=gpt-realtime-2
OPENAI_REALTIME_VOICE=marin
OPENAI_REALTIME_CALL_TIMEOUT_MS=14000
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=marin
OPENAI_TTS_FORMAT=wav
PORT=8058
```

Default rationale:

- `OPENAI_SPECULATE_MODEL=gpt-5.4-nano`: speed- and cost-sensitive classification-style work while the user is typing.
- `OPENAI_MODEL=gpt-5.4-mini`: lower-latency final responses without paying flagship-model cost on every turn.
- `OPENAI_*_REASONING_EFFORT=none`: lowest-latency setting for these short, non-tool, UI-facing turns.
- `OPENAI_TEXT_VERBOSITY=low`: concise responses and fewer output tokens.
- `OPENAI_REALTIME_MODEL=gpt-realtime-2`: direct speech-to-speech model for the Voice control.
- `OPENAI_REALTIME_VOICE=marin`: realtime output voice for speech-to-speech mode.
- `OPENAI_TTS_MODEL=gpt-4o-mini-tts`: current Speech API TTS model; not the deprecated general `gpt-4o` chat/audio-preview path.
- `OPENAI_TTS_VOICE=marin`: OpenAI's Speech docs recommend `marin` or `cedar` for best quality on the current TTS path.
- `OPENAI_TTS_FORMAT=wav`: browser-friendly low-latency audio format. `pcm` may be faster, but would need custom playback code.

## Prototype Scope

Included:

- Minimal SVG face with expression states.
- Text input as the primary mode.
- Presence levels: Still, Attentive, and Expressive.
- Voice toggle, default off, using OpenAI Realtime speech-to-speech over WebRTC when the server has an API key.
- Speaker toggle, default off.
- Metrics toggle, default hidden.
- Live input event stream from every typed change.
- Local ultra-fast motor-reflex analysis from typing mechanics and sentence shape.
- Background probes use a pure analysis path so measurement does not overwrite live attention or completion state.
- Immediate face state updates through a render-only presence gain layer.
- Presence-scaled micro-presence: subtle blink and gaze drift that respect reduced-motion settings.
- Source-aware expression arbitration: local reflexes, mic changes, and speaking states render immediately; speculative refinements get a short presence-tuned settle window.
- Debounced and cancellable OpenAI speculation lane via `/api/speculate`.
- Prepared speculative reads are passed forward as weak context for `/api/respond` when the user submits matching text.
- Guarded response prefetch starts after high-completion speculation and is reused only for exact matching submitted text.
- Streaming OpenAI response lane via `/api/respond`.
- Direct speech-to-speech lane via `/api/realtime/call` when Voice is on; browser microphone audio streams to OpenAI Realtime over WebRTC and model speech returns as a remote audio stream.
- Optional OpenAI speech lane via `/api/speech` for typed responses when speaker is on, with sentence-level early TTS queueing during streamed responses.
- Stale-turn cancellation when the user starts typing over an in-flight response or speech queue.
- Local fallback if the server is running without `OPENAI_API_KEY`.

Not included:

- Persistent memory.
- Realistic avatar rendering.
- Production lip sync.

## What To Watch

See `FACIAL_EXPRESSION_RESEARCH.md` for the research-backed motion grammar behind the minimal face: gaze aversion, blink timing, eye movement, expression caution, and implementation candidates.

Core latency measures:

- Time to first expression.
- Keystroke to local read.
- Keystroke to usable OpenAI speculation.
- Submit to stream open.
- Time to first token after submit.
- Submit to completed response stream.
- Time to first audio when speaker is on.
- Rolling p50/p90 first-token latency for the current session.
- Input events processed.
- Stale speculative jobs canceled.
- Interrupted response/speech work canceled on new input.
- Compact event trace for the current input/turn.
- Optional three-run latency probe for local read, speculation, stream open, first token, and completion.
- Early TTS request and first-audio timing when Speaker is enabled.
- Attention, arousal, and commit signals from the local reflex layer.
- Presence level, expression source, and active response lane.

Core feel measures:

- Does the face feel attentive while the user is still typing?
- Are the expressions readable without becoming distracting?
- Does muted mode still feel alive?
- Does idle presence feel alive without becoming decorative or distracting?
- Does each presence level feel like the same mind at a different expressive gain?
- Does the metrics panel reveal useful leading-edge behavior?
- Do local reflexes stay reversible, avoiding confident emotion claims before OpenAI speculation returns?

## Interaction Oversight Loop

Use this loop after changing any input, submit, response, or metrics behavior:

1. Action contract: after each user action, verify what should happen to the visible composer, response text, face state, focus, metrics, and async work.
2. Submit path: Enter and click-send should capture the draft once, clear the visible composer, preserve the submitted text for the active response, and leave focus ready for the next draft.
3. Text editing path: Shift+Enter should add a newline, IME composition Enter should not submit, and typing over a response should cancel stale response/speech work before starting a new local reflex read.
4. Async path: prefetch may be reused only for exact submitted text; stale speculation, response, speech, and prefetch jobs must not write back into the current turn.
5. Controls path: mic, speaker, presence, and metrics toggles should update only their own lane and should not silently change the agent's underlying response behavior.
6. Instrumentation path: metrics and probes may reveal latency state, but they should stay optional, visually quiet, and avoid mutating the face or live response.

## Current Result

Initial static prototype created and browser-tested on 2026-05-28.

Validation notes:

- Desktop browser pass loaded the app, toggled metrics, typed input, and submitted a response.
- Mobile pass at `390x844` showed no horizontal overflow and kept controls usable.
- Observed expression timing was single-digit milliseconds during sequential typing and roughly one frame during programmatic fill.
- Local feature read measured as `0ms` in-browser for the current heuristic lane.
- Text response streaming produced first token around `1ms` in the static local path.
- Speaker remained off by default; first audio stayed unset while muted.
- Node syntax checks passed for `app.js` and `server.mjs`.
- Server health endpoint returned `openaiConfigured: false` without a local `.env`, as expected.
- Missing-key API calls return `503` with a clear `.env` setup message.
- Browser-tested the server-backed app at `http://127.0.0.1:8058`; without a key, it stayed usable through local fallback.
- With `.env` configured, browser-tested real OpenAI speculation and streaming response calls.
- Optional metrics now include active lane, stream-open latency, and a compact trace of input, local reflex, speculation, token, completion, and fallback events.
- Response trace marks when a prepared typing-time read is used for the submitted text.
- Trace marks prefetch start, readiness, hit/wait, and reuse when response work completed before submit.
- Speaker-on mode can now queue completed response sentences for TTS before the full response finishes.
- New input can interrupt stale response and speech work, returning control to the local reflex lane.
- Metrics includes a quiet Run probe for repeatable local/OpenAI latency snapshots without moving the face.
- Headless Chrome visual QA captured the quiet default screen plus metrics-open desktop and mobile states.
- Metrics-open desktop view gives the face room instead of covering it; mobile view stacks metrics under the face with visible label/value rows.
- Oversight audit caught and fixed stale composer state after submit, click-send focus loss, and accidental Enter-submit during IME composition.
- Browser validation covered Shift+Enter newline behavior, click-send clear/focus, prefetch reuse after submit, and typing-to-interrupt stale OpenAI response work.

Next iteration:

- Compare against a text-only version.
- Add a text-only comparison harness for A/B latency perception.
