# First real trace reviewed: cost/efficiency and grounding are the live problems

Reviewed a real Phoenix session from the user's Vaadin `expense-manager` project (an
autonomous "implement GitHub issue → open PR" workflow). Reading it with the Lesson 2
procedure surfaced concrete, mission-relevant problems — this validates the whole mission
and aims Lesson 3's evals.

## What the trace showed (session: implement #23, 6 turns, 29M tokens, $22.27)
- **Turn 2 is a cost/efficiency outlier: ~18M tokens, $16.10, 16m in ONE turn** — 73% of the
  session's cost. Classic low path-convergence / context-thrash signature. Highest-leverage target.
- **Turn 1 "failed" after 37m30s / 0 tokens — EXPLAINED, not an agent failure.** The user's laptop
  went to sleep during the turn; the 37 min is idle wall-clock, not work. Lesson: a trace's **duration
  is wall-clock and includes idle time** (sleep, permission waits) — so duration/latency is a BAD
  agent-quality signal. Use token count, span count, and active time (`claude_code.active_time.total`)
  instead. This directly shapes Lesson 3: do NOT build a latency-based eval.
- **No visible Vaadin doc grounding.** The tools seen are generic Claude Code tools (Bash, Write,
  ToolSearch); no `search_vaadin_docs` / Vaadin MCP TOOL span. Many consecutive `Write`s with no
  grounding = Lesson-2 Smell 1 (ungrounded gather → hallucinated-API risk). Likely the Vaadin MCP
  server is not wired in — the #1 agent-readiness fix.
- Nice callback: the `ToolSearch` span (`select:TaskCreate`, `total_deferred_tools: 79`) is the harness
  doing just-in-time retrieval of its OWN tool schemas — Lesson 1's JIT retrieval, made visible.

## Implications for teaching
- **Lesson 3 evals should target exactly these:** (1) per-turn cost / path-convergence outliers
  (token/span-based, NOT duration — duration includes idle time), (2) a "was this turn grounded?"
  check (did a Vaadin-doc/read TOOL precede the Writes?).
- The mission payoff is now concrete and measurable: enable Vaadin MCP + tighter task scoping should
  move these numbers, and Phoenix will show it.

## To confirm with user
- Is the Vaadin MCP server enabled for this project? What's inside Turn 2 (repeated reads/writes of the
  same files)? Is Turn 1's failure a real tool error or missing token attribution?
