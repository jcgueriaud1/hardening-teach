# Confirmed: user's Phoenix spans are OpenInference-labeled (AGENT/LLM/TOOL)

The user confirmed their Claude Code traces in Phoenix show spans labeled **AGENT / LLM / TOOL**,
not raw `claude_code.*` names. This means they're on an enrichment path — the Arize hooks plugin
(`coding-harness-tracing`) or the OTLP bridge (`claude-code-otlp-collector`) — both of which map
`interaction→AGENT`, `llm_request→LLM`, `tool→TOOL`.

## Implications
- Lesson 2 can teach reading a real labeled span tree (AGENT root, LLM/TOOL children) rather than
  the flatter native `claude_code.*` case. The loop from Lesson 1 is directly visible.
- They have the raw material for Phoenix's layered agent evals (tool-selection, path-convergence),
  which is where Lesson 3+ can go.
- Since they see AGENT/TOOL (not only LLM), they are NOT hitting the Agent-SDK-streaming beta gotcha
  (#53954) where only `llm_request` spans emit — good, the full tree is intact.

## Still unknown
- Which of the two enrichment paths (hooks plugin vs OTLP bridge). Doesn't change Lesson 2's reading
  skill, but will matter if we later customize what attributes are captured.
