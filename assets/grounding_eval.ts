#!/usr/bin/env node
/**
 * grounding_eval.ts — Lesson 3's eval, in TypeScript.
 *
 * Question: of the turns where the agent wrote/edited code, what fraction first
 * consulted the Vaadin docs? Prints a "grounded-rate" and (optionally) logs the
 * verdict back into Phoenix.
 *
 * Verified against @arizeai/phoenix-client (Phoenix 2026). Note: unlike the
 * Python client this uses PHOENIX_HOST (not PHOENIX_COLLECTOR_ENDPOINT).
 *
 * Setup:
 *     npm install @arizeai/phoenix-client
 *     export PHOENIX_HOST="http://localhost:6006"     # your Phoenix
 *     export PHOENIX_API_KEY="..."                     # only if auth is on
 *
 * Usage (needs Node 18+; tsx runs TS directly):
 *     npx tsx grounding_eval.ts --project expense-manager --discover   # step 1: see names
 *     npx tsx grounding_eval.ts --project expense-manager              # step 2: the rate
 *     npx tsx grounding_eval.ts --project expense-manager --log        # + write to Phoenix
 */
import { createClient } from "@arizeai/phoenix-client";
import { getSpans, addSpanAnnotation } from "@arizeai/phoenix-client/spans";

type Span = Awaited<ReturnType<typeof getSpans>>["spans"][number];

// --- What counts as "grounded"? -------------------------------------------
// Span-name substrings that mean "looked at the real Vaadin docs".
// RUN --discover FIRST, then edit these to match what YOUR traces actually
// call the tool (MCP tools often appear namespaced, e.g.
// "mcp__vaadin__search_vaadin_docs").
const GROUNDING_NAME_SUBSTRINGS = ["search_vaadin_docs", "get_full_document", "vaadin_docs"];
const GROUNDING_SPAN_KINDS = new Set(["RETRIEVER"]);
const WRITE_NAME_PREFIXES = ["write", "edit"];

/** Verdict for one AGENT turn: did grounding happen before the first write? */
function turnIsGrounded(spans: Span[]): boolean | null {
  const sorted = [...spans].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );
  let sawGrounding = false;
  for (const s of sorted) {
    const name = (s.name ?? "").toLowerCase();
    const kind = s.span_kind ?? "";
    if (GROUNDING_NAME_SUBSTRINGS.some((sub) => name.includes(sub)) || GROUNDING_SPAN_KINDS.has(kind)) {
      sawGrounding = true;
    }
    if (WRITE_NAME_PREFIXES.some((p) => name.startsWith(p))) {
      return sawGrounding; // the first code-write decides the verdict
    }
  }
  return null; // no write this turn -> not applicable
}

function getArg(flag: string, dflt?: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : dflt;
}

async function fetchSpans(client: ReturnType<typeof createClient>, projectName: string, max: number): Promise<Span[]> {
  const out: Span[] = [];
  let cursor: string | undefined = undefined;
  while (out.length < max) {
    const res: Awaited<ReturnType<typeof getSpans>> = await getSpans({
      client,
      project: { projectName },
      limit: Math.min(1000, max - out.length), // server max per page is 1000
      cursor,
    });
    out.push(...res.spans);
    if (!res.nextCursor) break;
    cursor = res.nextCursor;
  }
  return out;
}

async function main() {
  const project = getArg("--project", process.env.PHOENIX_PROJECT_NAME ?? "default")!;
  const max = parseInt(getArg("--max", "5000")!, 10);
  const discover = process.argv.includes("--discover");
  const doLog = process.argv.includes("--log");

  const client = createClient(); // reads PHOENIX_HOST / PHOENIX_API_KEY from env
  const spans = await fetchSpans(client, project, max);
  if (spans.length === 0) {
    console.log(`No spans for project '${project}'. Check the name and PHOENIX_HOST.`);
    return;
  }

  // Step 1 — discovery: what does YOUR data actually call things?
  const counts = new Map<string, number>();
  for (const s of spans) {
    const key = `${s.span_kind}\t${s.name}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  console.log(`${spans.length} spans in '${project}'. Top span_kind x name:`);
  [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .forEach(([key, n]) => console.log(`  ${String(n).padStart(5)}  ${key}`));
  if (discover) {
    console.log("\nEdit GROUNDING_NAME_SUBSTRINGS / WRITE_NAME_PREFIXES above to match, then re-run.");
    return;
  }

  // Step 2 — the eval: one verdict per turn (each turn is its own trace).
  const byTrace = new Map<string, Span[]>();
  for (const s of spans) {
    const t = s.context.trace_id;
    if (!byTrace.has(t)) byTrace.set(t, []);
    byTrace.get(t)!.push(s);
  }
  const verdicts = new Map<string, boolean>();
  for (const [t, ss] of byTrace) {
    const v = turnIsGrounded(ss);
    if (v !== null) verdicts.set(t, v);
  }
  if (verdicts.size === 0) {
    console.log("\nNo writing turns found (no write/edit tool spans). Nothing to score.");
    return;
  }
  const grounded = [...verdicts.values()].filter(Boolean).length;
  const rate = grounded / verdicts.size;
  console.log(`\ngrounded-rate: ${(rate * 100).toFixed(0)}%  (${grounded}/${verdicts.size} writing turns grounded)`);

  // Step 3 (optional) — write verdicts back to Phoenix as annotations.
  // Annotations attach to a SPAN id (the OTel context.span_id), so we tag each
  // turn's root (parent-less) span.
  if (doLog) {
    let logged = 0;
    for (const [t, v] of verdicts) {
      const ss = byTrace.get(t)!;
      const root = ss.find((s) => s.parent_id == null) ?? ss[0];
      await addSpanAnnotation({
        client,
        sync: true,
        spanAnnotation: {
          spanId: root.context.span_id, // OTel span id, not the Phoenix global id
          name: "grounded",
          annotatorKind: "CODE",
          label: v ? "grounded" : "ungrounded",
          score: v ? 1 : 0,
        },
      });
      logged++;
    }
    console.log(`logged ${logged} 'grounded' annotations to Phoenix`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
