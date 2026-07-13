# Grounding eval refined to three-way (exclude non-Vaadin turns)

The user raised a valid metric-validity point: a turn that writes no Vaadin code shouldn't count as
"ungrounded" — it has no Vaadin API to hallucinate. Counting it pollutes the denominator.

## Decision
Label each turn one of three: **grounded / not_grounded / no_vaadin_code**. Rate =
grounded / (grounded + not_grounded) — only over turns that actually write Vaadin code.

## How "Vaadin write" is detected
A write span (Edit/Write) counts as Vaadin if its attributes contain a signal like `com.vaadin`
(configurable `VAADIN_WRITE_SIGNALS`). This needs tool-content logging ON; if it's off, no writes are
detected as Vaadin and the rate is empty — which itself flags "turn on OTEL_LOG_TOOL_CONTENT to measure this."
Added an `--inspect` mode to dump a real write span's attributes so the signal can be tuned to the user's data.

## Vaadin-write signal (verified against real --inspect output)
Edit/Write spans carry `tool.file_path`, `tool.description`, and `input.value` (the full JSON diff) —
so tool-content logging IS ON for expense-manager (also unblocks the Lesson 5 correctness judge).
CRITICAL: the project's own group id is **`com.vaadin.expensemanager`**, so a bare `com.vaadin` signal
matches every backend/test file. Use the FRAMEWORK package **`com.vaadin.flow`** (add `com.vaadin.hilla`)
as the Vaadin-write signal. Fixed in the script and Lesson 3.

## Status
`assets/grounding_eval.ts` updated and re-typechecked clean against @arizeai/phoenix-client. Lesson 3
teaches the three-way labeling, the rationale, and the com.vaadin.flow gotcha. Python port NOT updated.
