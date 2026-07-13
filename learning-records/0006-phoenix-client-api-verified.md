# Verified Phoenix client API (use in all eval lessons)

Verified from Phoenix repo source (2026). Prevents future lessons from teaching the
removed legacy API.

## Facts
- **Legacy `px.Client()` was REMOVED in Phoenix v14** (`import phoenix as px; px.Client()`
  now raises ImportError). Use the separate lightweight client package:
  `pip install arize-phoenix-client` → `from phoenix.client import Client`.
- **Export spans:** `Client().spans.get_spans_dataframe(project_identifier="name-or-id", limit=1000, ...)`
  (keyword-only; `project_name` still works but is deprecated; default limit 1000 → raise/paginate for big projects).
- **DataFrame schema:** index = `context.span_id`; columns include `name`, `span_kind` (UPPERCASE:
  LLM/TOOL/AGENT/RETRIEVER/...), `parent_id`, `start_time`, `end_time`, `status_code`, `context.trace_id`,
  and attributes flattened **with an `attributes.` prefix** → token counts are
  `attributes.llm.token_count.total` / `.prompt` / `.completion` (NaN on non-LLM spans; fillna before summing).
  (Bare `llm.token_count.total` is only for SpanQuery filter expressions, not column names.)
- **Connect:** `Client(base_url=..., api_key=...)` or env vars — endpoint resolves from
  `PHOENIX_COLLECTOR_ENDPOINT` → `OTEL_EXPORTER_OTLP_ENDPOINT` → `PHOENIX_HOST`; auth via `PHOENIX_API_KEY`.
  NOTE: the README's `PHOENIX_BASE_URL` is NOT read by the client — use `PHOENIX_COLLECTOR_ENDPOINT` or `base_url=`.
- **Log results back:** "evaluations" are now **annotations**:
  `Client().spans.log_span_annotations_dataframe(dataframe=df, annotation_name="grounded",
  annotator_kind="CODE"|"LLM"|"HUMAN", sync=True)`. `span_id` from a column or the index; optional
  `label`/`score`/`explanation`. The legacy `px.Client().log_evaluations(SpanEvaluations(...))` is gone.

## Implications
- Lesson 3/4 inline snippets corrected to this API. Runnable full script lives at
  `assets/grounding_eval.py` (discovery step + rate + optional annotation log-back).
- Docs pages (arize.com/docs/phoenix) 403 automated fetch — all above corroborated from repo source.
