# Setup established: Flow (Java) app, tracing Claude Code itself into Phoenix

The user's app is **Vaadin Flow (Java)**, not Hilla. And their Phoenix traces come from
**Claude Code itself** — the agent's own loop (model + tool calls) — not from an LLM SDK
embedded in the app. This is the more advanced and more interesting setup: their observability
feed *is* the harness at work.

## Implications
- Vaadin pain points to emphasize are the **Flow** ones (server-side Java UI: `Grid`, `Binder`,
  `Button`, Lumo/Aura theming) — not Hilla/React concerns.
- The Phoenix half of the mission is no longer "instrument an app" but **"read the agent's own
  execution trace"** — this unlocks a whole line of lessons about diagnosing Claude Code's loop
  from spans, and eventually evaluating it (tool-selection, path-convergence).
- Resolves the RESOURCES.md gap "no verified example of tracing Claude Code itself" — the user is
  doing it. Open question that remains: the exact export path and whether spans carry OpenInference
  span kinds (AGENT/LLM/TOOL) or flatter Claude Code OTel data. Being researched now.

## To verify
- The exact wiring (Claude Code native OTel → collector → Phoenix? a proxy emitting OpenInference
  spans?). Determines whether they see a real span tree with the loop structure, or flat telemetry.
