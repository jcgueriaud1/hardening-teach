# Re-measure showed no movement; measure windows, not all-time

Second run of `grounding_eval.ts` on `expense-manager`: `turns 208 (grounded 9, not_grounded 38,
no_vaadin_code 161)`, cumulative rate still 19%. Subtracting the baseline (159/6/25/128), the 49 NEW
turns contain 16 Vaadin-writing turns with only 3 grounded → **new-turn grounded-rate ≈ 19%, unchanged.**

## Two lessons
1. **Cumulative measurement can't show a change** — the old turns dominate the denominator. Must isolate
   the post-intervention window. Added `--since` / `--until` to the eval (getSpans `startTime`/`endTime`).
2. **The intervention (as applied so far) did not move grounding** — even on the new turns it's ~19%.

## Open question (ask user)
What were the "some changes"? If the CLAUDE.md grounding rule was applied and new Vaadin tasks were run,
the rule isn't landing → escalate: confirm CLAUDE.md is loaded, try the official `vaadin/agent-skills`,
or a PreToolUse hook that blocks a `com.vaadin.flow` write unless a doc lookup preceded it. If the changes
were unrelated, the rule hasn't been tested yet — apply it, run comparable tasks, then `--since <ts>`.
