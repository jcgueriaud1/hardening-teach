# Intervention still flat (~20%); soft rule looks insufficient → enforce

Third run: `turns 78 (grounded 5, not_grounded 17, no_vaadin_code 56)` → 23% (5/22). Versus the 19%
baseline (6/31), this is **within noise** (n=22; one turn ≈ 4–5 points; two-proportion test not
significant). Conclusion: grounding is **still ~20%** — the intervention has not reliably moved it.

## Reading
- A soft prose rule (CLAUDE.md) asks; it does not enforce. Consistent with Anthropic's point that a
  tool's presence/mention doesn't guarantee use.
- Decisive lever: a **PreToolUse hook** that blocks an Edit/Write touching `com.vaadin.flow` unless a
  Vaadin doc lookup (`search_vaadin_docs` / `get_full_document`) occurred earlier in the session.
  Enforcement, not suggestion → the rate should jump, then confirm with `--since`.

## Unknowns to confirm with user
- Was the 78-turn run windowed (`--since`) or a smaller cumulative pull? (Determines if it's truly post-change.)
- What change was applied — the CLAUDE.md rule, the official vaadin/agent-skills, or something unrelated?
