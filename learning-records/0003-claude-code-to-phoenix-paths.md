# How Claude Code telemetry reaches Phoenix (resolves the earlier gap)

Primary-source research (July 2026) established that Claude Code now has first-party
OpenTelemetry over OTLP for **metrics, logs, AND traces** — but **traces are beta**
(shipped ~April 2026) and off by default. This resolves the RESOURCES.md gap about
tracing Claude Code itself, and determines what the user can actually see.

## Key facts (high-confidence, multi-source)
- Spans require **both** `CLAUDE_CODE_ENABLE_TELEMETRY=1` **and**
  `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA=1`, plus `OTEL_TRACES_EXPORTER=otlp`. The beta flag
  alone, or the exporter alone, emits **no spans**.
- Native span tree: `claude_code.interaction` (one turn) → `claude_code.llm_request` (each API
  call) and `claude_code.tool` (→ `tool.execution`), with subagent nesting. This is literally
  Lesson 1's gather→act→verify loop as a trace.
- Content (prompts/responses/tool text) is **redacted by default**; opt in via
  `OTEL_LOG_USER_PROMPTS`, `OTEL_LOG_TOOL_DETAILS`, `OTEL_LOG_TOOL_CONTENT`, etc.
- Native spans use `claude_code.*` names and do **NOT** carry `openinference.span.kind`, so
  Phoenix shows the tree but won't auto-label spans as LLM/TOOL/AGENT without enrichment.

## Four paths into Phoenix
- **A — Native OTLP → collector → Phoenix:** real span tree, but no OpenInference span kinds.
- **B — Arize `claude-code-otlp-collector` bridge:** enriches native traces → AGENT/LLM/TOOL.
  (README targets Arize; Phoenix works mechanically via OTLP but isn't documented — flag.)
- **C — Arize hooks plugin (`coding-harness-tracing`):** emits OpenInference spans, **dual-targets
  Phoenix explicitly** (confirmed by Arize maintainer in Phoenix discussion #11153). Lowest-friction
  documented path today. Best coverage via the Agent SDK (`ClaudeSDKClient`).
- **D — LiteLLM/OTel proxy:** LLM spans only — **no tool spans, no loop structure.**

## Gotcha to teach
- Beta bug (#53954, CLI v2.1.119): driving Claude Code via the **Agent SDK streaming path**
  (`query()`/stream-json) emits **only `llm_request` spans** — `interaction`/`tool` are dropped;
  **`claude -p` emits the full tree.** So span completeness depends on how it's launched.

## Implication for teaching
- I don't yet know WHICH path the user is on — this changes whether they see labeled AGENT/LLM/TOOL
  spans (B/C) or an unlabeled `claude_code.*` tree (A). Confirm before Lesson 2's hands-on part.
