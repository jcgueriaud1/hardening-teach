#!/usr/bin/env python3
"""grounding_eval.py — Lesson 3's eval, runnable.

Question: of the turns where the agent wrote/edited code, what fraction first
consulted the Vaadin docs? Prints a "grounded-rate" and (optionally) logs the
verdict back into Phoenix.

Verified against arize-phoenix-client (Phoenix 2026; legacy px.Client() was
removed in Phoenix v14 — this uses the current client).

Setup:
    python3 -m venv .venv && source .venv/bin/activate
    pip install arize-phoenix-client pandas
    export PHOENIX_COLLECTOR_ENDPOINT="http://localhost:6006"   # your Phoenix
    export PHOENIX_API_KEY="..."                                # only if auth is on

Usage:
    python grounding_eval.py --project expense-manager --discover   # step 1: see names
    python grounding_eval.py --project expense-manager              # step 2: the rate
    python grounding_eval.py --project expense-manager --log        # + write to Phoenix
"""
import argparse
import os
import pandas as pd
from phoenix.client import Client

# --- What counts as "grounded"? -------------------------------------------
# Span-name substrings that mean "looked at the real Vaadin docs".
# RUN --discover FIRST, then edit these to match what YOUR traces actually
# call the tool (MCP tools often appear namespaced, e.g.
# "mcp__vaadin__search_vaadin_docs").
GROUNDING_NAME_SUBSTRINGS = ("search_vaadin_docs", "get_full_document", "vaadin_docs")
GROUNDING_SPAN_KINDS = ("RETRIEVER",)          # doc/retrieval spans
WRITE_NAME_PREFIXES = ("write", "edit")        # tool spans that mutate code


def turn_is_grounded(turn: pd.DataFrame):
    """Verdict for one AGENT turn: did grounding happen before the first write?"""
    turn = turn.sort_values("start_time")
    saw_grounding = False
    for _, s in turn.iterrows():
        name = str(s.get("name") or "").lower()
        kind = str(s.get("span_kind") or "")
        if any(sub in name for sub in GROUNDING_NAME_SUBSTRINGS) or kind in GROUNDING_SPAN_KINDS:
            saw_grounding = True
        if name.startswith(WRITE_NAME_PREFIXES):
            return saw_grounding        # the first code-write decides the verdict
    return None                          # no write this turn -> not applicable


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", default=os.environ.get("PHOENIX_PROJECT_NAME", "default"))
    ap.add_argument("--limit", type=int, default=5000, help="max spans to pull (raise for big projects)")
    ap.add_argument("--discover", action="store_true", help="just list span kinds + names, then exit")
    ap.add_argument("--log", action="store_true", help="log verdicts back to Phoenix as annotations")
    args = ap.parse_args()

    client = Client()   # reads PHOENIX_COLLECTOR_ENDPOINT / PHOENIX_API_KEY from env
    df = client.spans.get_spans_dataframe(project_identifier=args.project, limit=args.limit)
    if df.empty:
        print(f"No spans for project {args.project!r}. Check the name and endpoint.")
        return

    # Step 1 — discovery: what does YOUR data actually call things?
    print(f"{len(df)} spans in {args.project!r}. Top span_kind x name:")
    counts = df.assign(name=df["name"].astype(str)).groupby(["span_kind", "name"]).size()
    print(counts.sort_values(ascending=False).head(25).to_string())
    if args.discover:
        print("\nEdit GROUNDING_NAME_SUBSTRINGS / WRITE_NAME_PREFIXES above to match, then re-run.")
        return

    # Step 2 — the eval: one verdict per turn (each turn is its own trace).
    verdicts = df.groupby("context.trace_id", group_keys=False).apply(turn_is_grounded)
    verdicts = verdicts.dropna().astype(bool)
    if verdicts.empty:
        print("\nNo writing turns found (no write/edit tool spans). Nothing to score.")
        return
    rate = verdicts.mean()
    print(f"\ngrounded-rate: {rate:.0%}  "
          f"({int(verdicts.sum())}/{len(verdicts)} writing turns grounded)")

    # Step 3 (optional) — write verdicts back to Phoenix as annotations.
    # Annotations attach to a SPAN id, so we tag each turn's root (AGENT) span.
    if args.log:
        roots = df[df["parent_id"].isna()].reset_index()   # index 'context.span_id' -> column
        root_by_trace = roots.set_index("context.trace_id")["context.span_id"]
        ann = pd.DataFrame({
            "label": verdicts.map({True: "grounded", False: "ungrounded"}),
            "score": verdicts.astype(int),
        })
        ann["span_id"] = ann.index.map(root_by_trace)
        ann = ann.dropna(subset=["span_id"]).set_index("span_id")
        client.spans.log_span_annotations_dataframe(
            dataframe=ann, annotation_name="grounded", annotator_kind="CODE", sync=True)
        print(f"logged {len(ann)} 'grounded' annotations to Phoenix")


if __name__ == "__main__":
    main()
