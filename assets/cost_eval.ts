#!/usr/bin/env node
/**
 * cost_eval.ts — Lesson 4's eval, in TypeScript.
 *
 * Flags cost-outlier turns: turns whose total tokens dwarf the median. Prints
 * the outliers (with their tool-step counts) and can log the flag back to Phoenix.
 * Deliberately uses tokens/steps, NOT duration — duration is wall-clock and
 * includes idle time (see Lesson 4).
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
 *     npx tsx cost_eval.ts --project expense-manager
 *     npx tsx cost_eval.ts --project expense-manager --factor 5   # outlier = >5x median
 *     npx tsx cost_eval.ts --project expense-manager --log        # + write to Phoenix
 */
import { createClient } from "@arizeai/phoenix-client";
import { getSpans, addSpanAnnotation } from "@arizeai/phoenix-client/spans";

type Span = Awaited<ReturnType<typeof getSpans>>["spans"][number];

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

function tokensOf(s: Span): number {
  const attrs = (s.attributes ?? {}) as Record<string, unknown>;
  return Number(attrs["llm.token_count.total"] ?? 0);
}

async function main() {
  const project = getArg("--project", process.env.PHOENIX_PROJECT_NAME ?? "default")!;
  const max = parseInt(getArg("--max", "5000")!, 10);
  const factor = parseFloat(getArg("--factor", "5")!);
  const doLog = process.argv.includes("--log");

  const client = createClient(); // reads PHOENIX_HOST / PHOENIX_API_KEY from env
  const spans = await fetchSpans(client, project, max);
  if (spans.length === 0) {
    console.log(`No spans for project '${project}'. Check the name and PHOENIX_HOST.`);
    return;
  }

  // tokens + tool-steps per AGENT turn (each turn is its own trace); keep a root span for log-back.
  const tok = new Map<string, number>();
  const steps = new Map<string, number>();
  const root = new Map<string, Span>();
  for (const s of spans) {
    const t = s.context.trace_id;
    tok.set(t, (tok.get(t) ?? 0) + tokensOf(s));
    if (s.span_kind === "TOOL") steps.set(t, (steps.get(t) ?? 0) + 1);
    if (s.parent_id == null && !root.has(t)) root.set(t, s);
  }

  const totals = [...tok.values()].sort((a, b) => a - b);
  const median = totals[Math.floor(totals.length / 2)] || 1;
  const outliers = [...tok.entries()].filter(([, n]) => n > factor * median).sort((a, b) => b[1] - a[1]);

  console.log(`${tok.size} turns; median ${median.toLocaleString()} tokens; ` +
    `${outliers.length} outlier(s) over ${factor}x:`);
  for (const [t, n] of outliers) {
    console.log(`  ${n.toLocaleString().padStart(12)} tokens  ${String(steps.get(t) ?? 0).padStart(4)} tool-steps  trace=${t}`);
  }

  if (doLog) {
    let logged = 0;
    for (const [t, n] of outliers) {
      const r = root.get(t);
      if (!r) continue;
      await addSpanAnnotation({
        client,
        sync: true,
        spanAnnotation: {
          spanId: r.context.span_id, // OTel span id
          name: "cost_outlier",
          annotatorKind: "CODE",
          label: "outlier",
          score: n / median, // how many times the median this turn cost
        },
      });
      logged++;
    }
    console.log(`logged ${logged} 'cost_outlier' annotations to Phoenix`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
