# Discovery scan of expense-manager (2125 spans): MCP used but sparse; verification present

Ran the grounding eval's `--discover` step across the whole `expense-manager` project.
Findings resolve the open grounding question and surface two more signals.

## Findings
- **Vaadin MCP IS being called** — `mcp__Vaadin__search_vaadin_docs` (10) and
  `mcp__Vaadin__get_full_document` (8). So the agent grounds itself *sometimes*. The eval's
  substring matchers already catch these (case-insensitive `includes`), so no matcher edit needed.
- **But grounding looks sparse relative to writes**: 18 doc-tool calls vs **423 code writes**
  (Edit 259 + Write 164). Crude ratio → expect a LOW grounded-rate; run step 2 for the real per-turn number.
- **Visual verification IS happening** ✅ — heavy Playwright MCP use (snapshot 30, click 28,
  screenshot 20, navigate 16, fill_form 11 ≈ 105 calls). Matches Vaadin's spec-driven-demo
  `visual-verification` pattern; Lesson 2 "verify" step is present. Good agent-readiness signal.
- **Very human-in-the-loop**: 216 `Permission Request` + 26 `AskUserQuestion` (CHAIN/TOOL). The agent
  pauses for input a lot — the likely source of the long idle gaps (and why a turn spanned laptop sleep).
  A throughput lever: more scoped auto-approve (safely), fewer permission gates.
- **Tool mix**: Bash dominates (730); Read 244; ToolSearch 30 (harness JIT tool-loading); Skill 7;
  Task tools present. LLM spans are named "Turn N" (Turn 1×25 … Turn 7×7) → ~one LLM span per turn,
  ~25 sessions, sessions get shorter over turns.

## Granularity note (to verify)
The eval groups by `context.trace_id` treating each trace as a turn. The earlier Sessions view showed
Turns==Traces (6==6), supporting trace≈turn. If the printed "writing turns" count looks off vs the real
number of coding turns, switch grounding to a per-write-span definition instead.

## Implication
- Grounding is the live lever: MCP is on and occasionally used but not before most writes. Lesson 6
  (a CLAUDE.md rule: "search Vaadin docs before writing a component") should measurably raise the rate —
  and now we have the baseline scan to compare against.
