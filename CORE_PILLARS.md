# Core Pillars

## Main Objective

Build AI Presence Kit into a small, renderer-agnostic presence state layer and reference facial controller system for AI interfaces.

The product goal is to help existing AI apps replace passive waiting indicators with visible interaction posture. The face is not a fixed avatar, pose switcher, or emotion detector. It is the reference proof surface for parallel micro-decision systems reacting to runtime state.

The core flow is:

```text
AI/user runtime signals
-> presence state
-> parallel facial controllers
-> coherent expressive motion
```

AI Presence Kit should turn interaction state into coordinated facial micro-movements that make an AI interface feel attentive, alive, and responsive before, during, and after speech.

## Product Wedge

AI interfaces already know useful runtime facts: the user is typing, pausing, reading, interrupting, or waiting; the model is opening a stream, thinking, streaming, speaking, ready, or errored.

Most interfaces collapse those facts into spinners, disabled buttons, typing dots, or a static avatar.

AI Presence Kit should make those runtime facts visible as low-latency presence:

```text
replace passive waiting indicators with presence
```

The package should stay useful even when the final renderer is not this SVG face.

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

## 7. Renderer-Agnostic Package Surface

The reusable product is the contract between runtime signals, canonical presence states, trace evidence, and controller inputs.

Keep `@ai-presence/core` independent of SVG, React, browser DOM, OpenAI APIs, and face-specific decisions. Core should answer:

- what state is the AI interface in?
- what event caused the transition?
- what shared control inputs should a renderer see?
- what happened before the first output?
- was there an interruption posture?

Adapters, React bindings, and face rendering can sit on top of that contract, but should not leak renderer assumptions back into core.

## 8. Inspectable Evidence Over Vibes

The project should prove behavior with inspectable evidence:

- package tests for state/event contracts
- latency budgets for core and face pipelines
- DOM attributes for before-output timing and controller decisions
- browser screenshots for public visual claims
- package dry-runs and consumer smokes for publish claims

If the claim cannot be inspected or measured, treat it as a hypothesis.

## 9. Fresh-Eyes Public Surface

The project is now public and looking for collaborators, so every meaningful milestone should preserve first-time comprehension:

- README explains why the project exists before implementation detail.
- Screenshots match the default app or changed visual surface.
- `CONTRIBUTING.md` lists concrete ways to help.
- Release docs keep validation, security, publish, and npm-token handling repeatable.
- Public copy says interaction posture, not emotion detection.

Run `npm run release:public-gate` when those surfaces change.

## Non-Goals

Do not steer the project toward:

- emotion detection or private emotion inference
- a full chat framework
- a general avatar identity platform
- lip-sync as the core product
- renderer-specific APIs in `@ai-presence/core`
- broad rewrites without narrow validation evidence

## Automation Steering Rubric

When choosing the next arc, prefer work that answers yes to several of these:

- Does it strengthen presence before output?
- Does it keep the core renderer-agnostic?
- Does it improve or validate parallel controller coherence?
- Does it make adoption easier for an existing AI app?
- Does it sharpen the public collaborator surface?
- Can it be validated with targeted tests, browser evidence, package smoke, or release gates?

Defer work that is visually interesting but weakens the package contract, adds heavy runtime dependencies, or shifts the project toward emotion inference.
