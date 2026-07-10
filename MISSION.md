# Mission: Understanding coding-agent harnesses, to make Vaadin agent-ready

## Why
You work on Vaadin and want Vaadin projects to produce excellent results when
developers drive them with coding agents like Claude Code. To do that well you
first need to understand — deeply, not by analogy — how a coding-agent *harness*
actually turns a prompt into code changes. You are dogfooding this by building a
real Vaadin app with Claude Code and saving the agent's traces to Arize Phoenix,
so you can see what the agent actually did and whether your changes help.

## Success looks like
- You can explain, from memory, how a coding-agent harness turns one prompt into
  actions — the agentic loop, context window, tools, and where each failure mode lives.
- You have produced concrete, reusable Vaadin "agent-readiness" artifacts
  (e.g. a `CLAUDE.md`, a skill, MCP guidance) that measurably improve agent output
  on a Vaadin task.
- You can open a Phoenix trace of an agent run and point to *where* it went wrong
  and *what* to change — not just that it failed.
- You know which few metrics actually indicate agent quality on Vaadin tasks, and
  can tell fluency (looks right now) from storage strength (holds up under change).

## Constraints
- Learning happens over multiple short sessions; each lesson must give one win fast.
- Stack in play: Vaadin (Flow / Java + Spring Boot, possibly Hilla/React), Claude Code
  as the agent, Arize Phoenix for traces.
- Starting footing (assumed, to confirm): productive *using* Claude Code, but the
  internals — harnessing, context engineering, evals — are still fuzzy.

## Out of scope
- Model training internals (pretraining, RLHF mechanics) beyond what's needed to reason
  about behavior.
- Frameworks other than Vaadin, except as brief contrast.
- Shipping any specific app feature — the app is the *proving ground*, not the goal.
