# Agent Instructions

Always try to validate work and results before reporting completion.

If output cannot be inspected directly, report the visibility gap and the artifact, command, or access that would close it.

Keep responses concise without dropping important evidence.

Repo-specific rules:

- Preserve the product framing: AI Presence Kit is a presence state layer for AI interfaces. The face is the reference renderer.
- Do not frame the project as emotion detection or private emotion inference. Use interaction-posture language such as `reading`, `thinking`, `waiting`, `streaming`, `speaking`, `interrupted`, `ready`, and `error`.
- Prefer package-surface changes that keep `@ai-presence/core` renderer-agnostic.
- Validate with the narrowest relevant command first, then run `npm run validate` before claiming broad readiness.
- Run `git diff --check` before any commit handoff.
- Browser or visual changes require direct browser/screenshot inspection. If browser access is unavailable, report that limitation.
