# Coding Agents × Vaadin × Phoenix — Resources

Curated, high-trust sources for this workspace. Knowledge for lessons is drawn
from here, not from parametric guesses. Wisdom comes from the communities below.

> Access note: Anthropic's `anthropic.com/engineering` & `/research` pages and
> most `vaadin.com` pages block automated fetchers (they load fine in a browser).
> Everything below was verified to exist; GitHub sources were fetched directly.

## Knowledge

### Pillar 1 — Coding-agent harnesses & context engineering (Anthropic, primary)

- [Building Effective Agents — Anthropic Research (Dec 2024)](https://www.anthropic.com/research/building-effective-agents)
  The founding vocabulary. Use for: workflows vs. agents, the "augmented LLM"
  building block, and composition patterns (routing, orchestrator-workers, evaluator-optimizer).
- [Building agents with the Claude Agent SDK — Anthropic Engineering](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
  The clearest statement of the agentic loop. Use for: the canonical
  **gather context → take action → verify work → repeat** loop, and "Claude Code SDK → Claude Agent SDK".
- [Effective context engineering for AI agents — Anthropic Engineering (~Sep 2025)](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
  Defines context engineering and the context window as a scarce "attention budget."
  Use for: compaction, just-in-time retrieval, system-prompt "altitude," long-horizon memory.
- [Writing effective tools for AI agents — Anthropic Engineering (~Sep 2025)](https://www.anthropic.com/engineering/writing-tools-for-agents)
  The tool-design reference. Use for: why tool descriptions deserve prompt-level care,
  consolidation, actionable error messages, token efficiency.
- [Effective harnesses for long-running agents — Anthropic Engineering (~late 2025)](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
  The most direct treatment of the word "harness" across multiple context windows.
  Use for: compaction, over-scoping and poor-self-evaluation failure modes, verification as a first-class interface.
- [How we built our multi-agent research system — Anthropic Engineering (Jun 2025)](https://www.anthropic.com/engineering/multi-agent-research-system)
  Subagents and their token economics. Use for: when/why to split work across subagents
  (intelligent filters returning ~1–2k-token summaries) and the cost trade-off.
- [Claude Code: Best practices for agentic coding — Anthropic Engineering (Apr 2025)](https://www.anthropic.com/engineering/claude-code-best-practices)
  The day-to-day practitioner's guide. Use for: `CLAUDE.md`, `.claude/commands/` slash commands,
  session hygiene (`/clear`), rules-based feedback.
- [Claude Code docs: Subagents](https://code.claude.com/docs/en/sub-agents) · [Context window](https://code.claude.com/docs/en/context-window) · [MCP](https://code.claude.com/docs/en/mcp)
  The authoritative, current spec. Use for: precise, version-current definitions of
  subagents, the context-window layout (~4,200-token system prompt, deferred MCP schemas), and MCP wiring.

### Pillar 2 — Making Vaadin agent-ready (Vaadin, primary)

- [Official Vaadin MCP server — blog](https://vaadin.com/blog/official-vaadin-mcp) · [docs](https://vaadin.com/docs/latest/building-apps/mcp) · [live: mcp.vaadin.com](https://mcp.vaadin.com/)
  **Enable this first.** Streamable-HTTP MCP server (launched 2025-10-31) with three tools —
  `search_vaadin_docs`, `get_full_document`, `get_vaadin_version` — framework-aware (Flow vs Hilla),
  read-only doc grounding. Use for: killing version/API hallucination.
- [`vaadin/agent-skills` (Apache-2.0)](https://github.com/vaadin/agent-skills) · [`vaadin/agent-marketplace`](https://github.com/vaadin/agent-marketplace)
  The official Claude Code / Codex plugin. Skills: `aura-theme`, `frontend-design`, `vaadin-form-layout`.
  Install: `/plugin marketplace add vaadin/agent-marketplace` → `/plugin install vaadin-skills@vaadin-marketplace`.
  Targets Vaadin 25 / Spring Boot 4 / JUnit 6; needs Claude Code ≥ 1.0.33. Use for: making the agent Vaadin-aware.
- [`vaadin/spec-driven-development-demo`](https://github.com/vaadin/spec-driven-development-demo)
  The reference "agent-ready project" layout. Use for: how to structure a repo —
  `spec/` as source of truth, `project-context.md` / `architecture.md` / `datamodel.md` / `design-system.md`,
  and a `visual-verification` (Playwright) skill so the agent can *see* its own UI.
- [`marcushellberg/vaadin-development-plugin` (archived 2026-06-03)](https://github.com/marcushellberg/vaadin-development-plugin)
  Predecessor with a fuller 11-skill list (theming, Binder validation, TestBench, signals, data providers).
  Use for: reference on skill topics; superseded by the official plugin.
- [Vaadin Copilot — docs](https://vaadin.com/docs/latest/tools/copilot) · [repo](https://github.com/vaadin/copilot)
  In-browser visual AI assistant (ships with Vaadin 24.4+, free). Use for: visual UI edits fed
  back to the coding agent — complementary to, not a replacement for, Claude Code.
- [Java Software Development in an AI-First World — Vaadin blog](https://vaadin.com/blog/the-future-of-software-development-in-an-ai-first-world)
  Vaadin's strategic argument. Use for: the "why agent-ready Vaadin" framing —
  full app in Java/one repo gives agents a more complete project view; spec-driven development.

### Pillar 3 — Tracing & evaluating agents with Arize Phoenix (Arize, primary)

- [`Arize-ai/phoenix` (GitHub, ELv2)](https://github.com/Arize-ai/phoenix)
  The platform home. Use for: install (`pip install arize-phoenix`), deployment, feature scope
  (tracing, evals, datasets & experiments, prompt playground).
- [`Arize-ai/openinference`](https://github.com/Arize-ai/openinference) · [semantic conventions spec](https://github.com/Arize-ai/openinference/blob/main/spec/semantic_conventions.md) · [traces spec](https://github.com/Arize-ai/openinference/blob/main/spec/traces.md)
  The instrumentation standard on top of OpenTelemetry. Use for: span kinds
  (LLM, TOOL, CHAIN, AGENT, RETRIEVER, …), attribute names, the trace/span data model.
- [`phoenix-otel` README](https://github.com/Arize-ai/phoenix/blob/main/packages/phoenix-otel/README.md)
  The fetchable how-to for wiring an app to Phoenix. Use for: `register(project_name=..., auto_instrument=True)`,
  env-var config, and manual `@tracer.chain` / `@tracer.tool` decorators for custom/agentic code.
- [Phoenix tutorial: `evaluate_agent.ipynb`](https://github.com/Arize-ai/phoenix/blob/main/tutorials/evals/evaluate_agent.ipynb) · [Agent Path Convergence docs](https://arize.com/docs/phoenix/evaluation/running-pre-tested-evals/agent-path-convergence)
  The runnable agent-eval playbook. Use for: layered evaluation (routing, tool selection,
  tool args, execution path, final answer), `ToolSelectionEvaluator`, path-convergence efficiency scoring.
- [Phoenix docs: LLM Evals](https://arize.com/docs/phoenix/evaluation/llm-evals) · [Datasets & Experiments quickstart](https://arize.com/docs/phoenix/datasets-and-experiments/quickstart-datasets)
  Evaluation reference. Use for: pre-built eval templates, LLM-as-a-judge via function calling
  (explanations by default), versioned datasets, and the experiment recipe.

## Wisdom (Communities)

- [Vaadin Forum — "biggest problem doing agentic coding with Vaadin?"](https://vaadin.com/forum/t/whats-your-biggest-problem-doing-agentic-coding-with-vaadin/179541) · [Best practices for Claude Code](https://vaadin.com/forum/t/best-practices-for-claude-code/178487)
  The most on-mission community for you. Use for: real-world Vaadin + Claude Code gotchas,
  and (as a Vaadin insider) a place to *test and publish* your agent-readiness findings.
- [Vaadin Discord](https://discord.gg/vaadin) — real-time help and a fast channel to socialize agent-readiness ideas with the team and power users.
- [r/ClaudeAI](https://reddit.com/r/ClaudeAI) and [Anthropic Discord](https://www.anthropic.com/discord)
  Use for: harness/Claude Code practice, prompt & context-engineering critique.
- [Arize community Slack](https://arize-ai.slack.com) (invite via [arize.com/community](https://arize.com/community))
  Use for: Phoenix instrumentation and eval-design troubleshooting.

## Gaps
- **No verified end-to-end example** of tracing *Claude Code itself* (as opposed to an app that calls an LLM SDK) into Phoenix. How Claude Code emits/exports traces, and whether that maps cleanly onto OpenInference span kinds, is an open question to resolve by experiment — likely a future lesson and learning record.
- **Vaadin-specific agent evals** don't exist off the shelf. What "correct Vaadin code" looks like as a Phoenix evaluator (uses real components, no hallucinated API, passes TestBench) is something we'll have to design.
- Exact Vaadin-version targeting of `spec-driven-development-demo` and current wording of the Anthropic "harness" posts are unconfirmed here (egress-blocked); verify in a browser before quoting precisely.
