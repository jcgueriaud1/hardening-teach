#!/usr/bin/env node
/**
 * grounding_eval.ts — Lesson 3's eval, in TypeScript.
 *
 * Question: of the turns that write VAADIN code, what fraction first consulted
 * the Vaadin docs? Each turn is labeled one of:
 *   grounded        - a Vaadin-doc lookup happened before the first Vaadin write
 *   not_grounded    - a Vaadin write with no preceding doc lookup
 *   no_vaadin_code  - the turn wrote no Vaadin code (EXCLUDED from the rate)
 * grounded-rate = grounded / (grounded + not_grounded).
 *
 * Verified against @arizeai/phoenix-client (Phoenix 2026). The TS client reads
 * PHOENIX_HOST (not PHOENIX_COLLECTOR_ENDPOINT); attributes are flat dotted keys.
 *
 * Setup:
 *     npm install @arizeai/phoenix-client
 *     export PHOENIX_HOST="http://localhost:6006"     # your Phoenix
 *     export PHOENIX_API_KEY="..."                     # only if auth is on
 *
 * Usage (Node 18+):
 *     npx tsx grounding_eval.ts --project expense-manager --discover   # list span kinds+names
 *     npx tsx grounding_eval.ts --project expense-manager --inspect    # dump a write span's attrs
 *     npx tsx grounding_eval.ts --project expense-manager              # the rate
 *     npx tsx grounding_eval.ts --project expense-manager --log        # + write labels to Phoenix
 */
import { createClient } from "@arizeai/phoenix-client";
import { getSpans, addSpanAnnotation } from "@arizeai/phoenix-client/spans";

type Span = Awaited<ReturnType<typeof getSpans>>["spans"][number];
type Label = "grounded" | "not_grounded" | "no_vaadin_code";

// --- Tunables (run --discover / --inspect first, then adjust) --------------
// Span names that mean "looked at the real Vaadin docs" (case-insensitive substring).
const GROUNDING_NAME_SUBSTRINGS = ["search_vaadin_docs", "get_full_document", "vaadin_docs"];
const GROUNDING_SPAN_KINDS = new Set(["RETRIEVER"]);
// Tool spans that mutate code.
const WRITE_NAME_PREFIXES = ["write", "edit"];
// A write counts as VAADIN work if any of these appears in its attributes
// (needs tool-content logging on; --inspect shows what your spans capture).
// NOTE: use the FRAMEWORK package "com.vaadin.flow", NOT bare "com.vaadin" —
// this project's own group id is com.vaadin.expensemanager, so "com.vaadin"
// would match every backend/test file too. Add "com.vaadin.hilla" for Hilla.
const VAADIN_WRITE_SIGNALS = ["com.vaadin.flow", "com.vaadin.hilla"];

function isWrite(s: Span): boolean {
  const name = (s.name ?? "").toLowerCase();
  return WRITE_NAME_PREFIXES.some((p) => name.startsWith(p));
}

function isVaadinWrite(s: Span): boolean {
  if (!isWrite(s)) return false;
  const blob = JSON.stringify(s.attributes ?? {}).toLowerCase();
  return VAADIN_WRITE_SIGNALS.some((sig) => blob.includes(sig));
}

function isGrounding(s: Span): boolean {
  const name = (s.name ?? "").toLowerCase();
  return GROUNDING_NAME_SUBSTRINGS.some((sub) => name.includes(sub)) || GROUNDING_SPAN_KINDS.has(s.span_kind ?? "");
}

/** Three-way label for one AGENT turn. */
function classifyTurn(turn: Span[]): Label {
  const sorted = [...turn].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  let sawGrounding = false;
  for (const s of sorted) {
    if (isGrounding(s)) sawGrounding = true;
    if (isVaadinWrite(s)) return sawGrounding ? "grounded" : "not_grounded"; // first Vaadin write decides
  }
  return "no_vaadin_code"; // no Vaadin write this turn -> excluded from the rate
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
      limit: Math.min(1000, max - out.length),
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
  const inspect = process.argv.includes("--inspect");
  const doLog = process.argv.includes("--log");

  const client = createClient(); // reads PHOENIX_HOST / PHOENIX_API_KEY from env
  const spans = await fetchSpans(client, project, max);
  if (spans.length === 0) {
    console.log(`No spans for project '${project}'. Check the name and PHOENIX_HOST.`);
    return;
  }

  // --discover: what does YOUR data call things?
  if (discover) {
    const counts = new Map<string, number>();
    for (const s of spans) {
      const key = `${s.span_kind}\t${s.name}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    console.log(`${spans.length} spans in '${project}'. Top span_kind x name:`);
    [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)
      .forEach(([key, n]) => console.log(`  ${String(n).padStart(5)}  ${key}`));
    return;
  }

  // --inspect: show a real write span's attributes, so we can tune VAADIN_WRITE_SIGNALS.
  if (inspect) {
    const sample = spans.find(isWrite);
    if (!sample) { console.log("No write/edit spans found."); return; }
    console.log(`Sample ${sample.name} span attributes:`);
    console.log(JSON.stringify(sample.attributes ?? {}, null, 2).slice(0, 2000));
    return;
  }

  // The eval: one three-way label per turn (each turn is its own trace).
  const byTrace = new Map<string, Span[]>();
  for (const s of spans) {
    const t = s.context.trace_id;
    if (!byTrace.has(t)) byTrace.set(t, []);
    byTrace.get(t)!.push(s);
  }
  const tally: Record<Label, number> = { grounded: 0, not_grounded: 0, no_vaadin_code: 0 };
  const labels = new Map<string, Label>();
  for (const [t, ss] of byTrace) {
    const label = classifyTurn(ss);
    tally[label]++;
    labels.set(t, label);
  }

  const vaadinTurns = tally.grounded + tally.not_grounded;
  console.log(`turns: ${byTrace.size}  ` +
    `(grounded ${tally.grounded}, not_grounded ${tally.not_grounded}, no_vaadin_code ${tally.no_vaadin_code})`);
  if (vaadinTurns === 0) {
    console.log("No Vaadin-writing turns detected. If you DID write Vaadin code, tool-content logging " +
      "may be off, or VAADIN_WRITE_SIGNALS needs tuning — run --inspect to see captured attributes.");
    return;
  }
  console.log(`grounded-rate: ${((tally.grounded / vaadinTurns) * 100).toFixed(0)}%  ` +
    `(${tally.grounded}/${vaadinTurns} Vaadin-writing turns grounded)`);

  // --log: write the three-way label back to each turn's root (AGENT) span.
  if (doLog) {
    let logged = 0;
    for (const [t, label] of labels) {
      const ss = byTrace.get(t)!;
      const root = ss.find((s) => s.parent_id == null) ?? ss[0];
      await addSpanAnnotation({
        client,
        sync: true,
        spanAnnotation: {
          spanId: root.context.span_id,
          name: "vaadin_grounding",
          annotatorKind: "CODE",
          label,
          score: label === "grounded" ? 1 : label === "not_grounded" ? 0 : undefined,
        },
      });
      logged++;
    }
    console.log(`logged ${logged} 'vaadin_grounding' annotations to Phoenix`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
