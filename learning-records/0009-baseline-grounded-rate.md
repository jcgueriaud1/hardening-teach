# Baseline grounded-rate: 19% (6 of 31 Vaadin-writing turns) — 2026-07-13

Ran `grounding_eval.ts` on `expense-manager`. Result:
`turns: 159 (grounded 6, not_grounded 25, no_vaadin_code 128)` → grounded-rate **19%** over 31
Vaadin-writing turns. The 128 `no_vaadin_code` (backend/service/test/Bash) sanity-checks the three-way
labeling. So ~81% of turns that write `com.vaadin.flow` code do so without first consulting the Vaadin docs.

## Implications
- This is the mission's baseline metric. The intervention (a CLAUDE.md/AGENTS.md grounding rule, and/or the
  official `vaadin/agent-skills`) must move it — target: raise grounded-rate, shrink `not_grounded` (25).
- **Re-measure honestly**: compare on NEW turns produced *after* the rule, on comparable Vaadin tasks
  (ideally a fixed task set / Phoenix experiment), not against the full historical mix. Correlation ≠ causation.
- Intervention artifact drafted at `assets/vaadin-grounding-rule.md`.
