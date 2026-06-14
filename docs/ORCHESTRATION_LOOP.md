# Orchestration Loop

Use this thread as the AI Presence Kit orchestration, regression, release, and idle-opportunity loop for `/Users/branavan/GitHub/ai-presence-kit`.

This thread is primarily the control plane. Keep the project moving toward:

- building a small, renderer-agnostic presence state layer for AI interfaces
- using the SVG face as the reference proof surface, not as the whole product
- replacing pose swaps with parallel micro-decisions for gaze, blink, brows, mouth, posture, and motion
- proving the before-first-token wedge with inspectable evidence
- preserving interaction-posture framing, not emotion detection
- keeping reusable packages small enough for existing AI apps to adopt
- preserving first-time visitor and collaborator readiness after public-facing changes

## Control-Plane Behavior

Do not take on substantial implementation work here unless the scope is small, the worktree state is understood, validation can finish in this loop, and no focused owner is a better fit.

Always check local worktree status before recommending, delegating, consolidating, or starting a new owner.

When the next meaningful improvement is substantial, create or steer a focused implementation owner thread/worktree when thread tools are available. The orchestrator should provide the owner with a narrow objective, required docs, scope constraints, validation commands, and explicit instructions not to commit, push, open PRs, merge, or deploy.

If thread creation tools are unavailable, produce the owner prompt and report the visibility/tooling gap instead of doing broad implementation in the orchestrator thread.

Monitor active implementation work for:

- completed work
- dirty files
- scope collisions
- validation gaps
- evidence gaps
- release readiness
- need for steering

Consolidate only when:

- changed files are understood
- required regressions passed
- browser/screenshot/log evidence was inspected where relevant
- no unresolved collisions or unrelated dirty changes block the handoff

## Idle Opportunity Review

When no active implementation or release gate remains:

1. Read `AGENTS.md`, `OPERATING_MANUAL.md`, `CORE_PILLARS.md`, and `VALIDATION.md`.
2. Inspect current package state, tests, demos, and recent work.
3. Compare candidate opportunities by impact, risk, files touched, validation cost, release risk, public-readiness cost, and pillar alignment.
4. Select one focused implementation slice.
5. Define acceptance criteria and validation evidence before editing.

Prefer arcs that strengthen at least one of these:

- before-output presence evidence
- renderer-agnostic core contract
- parallel controller coherence
- adapter usefulness for real AI runtimes
- React/browser adoption path
- public collaborator surface
- repeatable release/security automation

Reject or defer arcs that primarily add decorative motion, broaden the product into a chat framework, introduce private emotion inference, or require a broad rewrite without clear validation.

## Owner Prompt Shape

```text
You are a focused implementation owner for /Users/branavan/GitHub/ai-presence-kit. Work on this objective only.

Objective:
<one narrow, concrete outcome>

Current context to preserve:
- AI Presence Kit is a renderer-agnostic presence state layer for AI interfaces, with a reference SVG face proving the controller model.
- The face is the reference proof surface; reusable packages should stay narrow, inspectable, and extensible.
- The project wedge is replacing passive waiting indicators with visible interaction posture before, during, and after output.
- Do not frame behavior as emotion detection.
- Preserve canonical presence states unless the objective explicitly changes the public contract.

Required reading before claims or edits:
- AGENTS.md
- OPERATING_MANUAL.md
- CORE_PILLARS.md
- VALIDATION.md
- relevant source and test files

Start requirements:
- run/report git status
- run/report HEAD and origin/main if release or branch work is involved
- do not commit, push, open PR, merge, or deploy

Scope constraints:
- keep core renderer-agnostic
- keep face work centered on gaze, blink, brows, mouth, posture, motion, and timing
- keep adapters framework-package-free
- preserve static no-build demo compatibility
- avoid unrelated refactors

Acceptance criteria:
- observable package or demo behavior
- regression coverage
- evidence artifacts where relevant
- no hidden broad refactor

Validation expected:
- targeted commands for touched area
- `npm run validate` for package/API changes
- `npm run release:public-gate` for README/docs/screenshots/collaboration-surface changes
- `git diff --check` before handoff
- browser/screenshot/log inspection for visual or browser-facing changes

Report back with:
- goal status
- changed files
- before/after behavior
- validation results
- artifact paths inspected
- remaining risk
```

## Report Format

Report concisely with:

- active scope
- selected opportunity
- changed files
- validation commands and results
- evidence inspected
- commit/PR/deploy status when applicable
- remaining risk or visibility gaps
