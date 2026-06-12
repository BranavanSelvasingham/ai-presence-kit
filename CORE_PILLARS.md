# Core Pillars

## Main Objective

Build a low-latency facial presence engine for AI interfaces, where the face is not a fixed avatar or a pose switcher, but a set of parallel micro-decision systems reacting to runtime state.

The core flow is:

```text
AI/user runtime signals
-> presence state
-> parallel facial controllers
-> coherent expressive motion
```

AI Presence Kit should turn interaction state into coordinated facial micro-movements that make an AI interface feel attentive, alive, and responsive before, during, and after speech.

## 1. Parallel Micro-Decisions Over Pose Swaps

The face should not jump between canned expressions like `idle`, `thinking`, or `speaking`.

Each facial subsystem should make small local decisions from the shared presence snapshot:

- gaze: where attention is directed
- blink: when to reset visual tension
- brows: how much cognitive effort is visible
- mouth: whether preparing, speaking, holding, or resting
- posture: forward, neutral, withdrawn, interrupted
- motion: stillness, drift, anticipation, recovery

The intelligence is in how these controllers compose into one coherent face.

## 2. Presence Before Output

The face should react before the first token arrives.

The strongest wedge is equal model latency with different felt responsiveness:

```text
user pauses -> face reads
submit -> face gathers
stream opens -> face waits
first token -> face releases into response
```

The project wins if the user feels that the interface is with them before text appears.

## 3. Interaction Posture, Not Emotion Detection

The system should not claim to know true emotions.

It expresses observable interaction posture:

```text
reading
waiting
thinking
streaming
speaking
interrupted
ready
error
```

Those states drive facial behavior, but the face remains conservative and legible. No private emotion inference.

## 4. Low-Latency Expressive Control

Facial movement should be cheap, immediate, and local.

The runtime should not depend on heavy inference, video generation, 3D rigs, or speech audio to feel alive. It should react in milliseconds to UI and AI runtime signals.

## 5. Coherent Motion From Independent Controllers

The face should feel unified even though its parts are controlled independently.

Shared control inputs should include:

- presence state
- attention target
- arousal or tension
- speech activity
- interruption state
- latency phase
- recent transition history

Each controller reads the same snapshot but decides locally.

## 6. Reference Face First, Extensible Later

The SVG face is the proof surface.

The architecture can later support Rive, Live2D, Three.js, voice surfaces, or Audio2Face, but the current priority is proving that a simple face can feel alive through timing, gaze, blinking, mouth preparation, posture, and micro-motion.

Reusable packages should remain narrow:

- `@ai-presence/core`: canonical state, events, runtime, trace/debug primitives, and shared controller inputs.
- `@ai-presence/adapters`: plain-object bridges from AI runtimes to presence events.
- `@ai-presence/react`: hooks and renderer slots.
- `@ai-presence/face`: default SVG reference renderer and facial controller proof.

Avoid becoming a full chat framework, avatar platform, lip-sync engine, or emotion detector.
