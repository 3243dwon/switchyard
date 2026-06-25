/**
 * Run the consistency probe — one or more models, side by side.
 *
 *   node scripts/probe.ts                                  # offline, 3 simulated "model personalities"
 *   ANTHROPIC_API_KEY=sk-... node scripts/probe.ts                             # live, claude-opus-4-8
 *   ANTHROPIC_API_KEY=sk-... node scripts/probe.ts claude-opus-4-8 claude-haiku-4-5   # several models
 *
 * For each model and each canon dilemma it asks the SAME dilemma under several
 * morally-irrelevant reframings and reports where the verdict flips. It writes:
 *   out/probe.<model>.<id>.svg   — a per-model, per-dilemma consistency strip
 *   out/probe.compare.svg        — one chart comparing every model
 *   out/probe-report.md          — a markdown methods + flip-rate table
 *
 * A flip under a morally-irrelevant reframing is an objective inconsistency —
 * "does the model have stable values, or just vibes?"  See PROBE.md.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import type { AskModel, ProbeResult, MockProfile } from "../src/index.ts";
import {
  asValid, footbridge, theSwitch, transplant, tunnel,
  probe, anthropicModel, mockModel, renderProbeStrip, renderProbeCompare, probeReport,
} from "../src/index.ts";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "out");
mkdirSync(out, { recursive: true });

const key = process.env.ANTHROPIC_API_KEY;
const dilemmas = [theSwitch, footbridge, transplant, tunnel].map(asValid);

// each entry is one model to probe: a display label + an adapter.
interface ModelSpec { label: string; ask: AskModel; }
let specs: ModelSpec[];

if (key) {
  // live: one model per id given on the command line, defaulting to claude-opus-4-8.
  const ids = process.argv.slice(2);
  const models = ids.length ? ids : ["claude-opus-4-8"];
  specs = models.map((m) => ({ label: m, ask: anthropicModel({ apiKey: key, model: m }) }));
  console.log(`\n  SWITCHYARD — consistency probe   [live · ${models.join(", ")}]`);
} else {
  // offline: three DISTINCT mock personalities so the comparison is non-trivial.
  // They differ only in which morally-irrelevant cues sway them.
  const personalities: Array<{ label: string; profile: MockProfile }> = [
    { label: "mock-stoic", profile: { lean: "act" } }, // ignores every cue — the steady baseline
    { label: "mock-vibes", profile: { lean: "act", framing: true, emotion: true } }, // textbook framing effect
    { label: "mock-squeamish", profile: { lean: "act", framing: true, emotion: true, loadedVerb: true } }, // also balks at "kill"
  ];
  specs = personalities.map((p) => ({ label: p.label, ask: mockModel(p.profile) }));
  console.log(`\n  SWITCHYARD — consistency probe   [offline · ${specs.length} simulated model personalities]`);
  console.log("  (set ANTHROPIC_API_KEY to probe real models)");
}

const perModel: ProbeResult[][] = [];
const labels: string[] = [];

for (const spec of specs) {
  const results: ProbeResult[] = [];
  let modelFlips = 0, modelTotal = 0;
  console.log(`\n  ══ ${spec.label} ══`);
  for (const d of dilemmas) {
    const r = await probe(d, spec.ask);
    results.push(r);
    modelFlips += r.flips;
    modelTotal += r.total;
    const verdict = r.flips === 0 ? "STABLE" : `${r.flips}/${r.total} FLIPS`;
    const flippedOn = r.results.filter((x) => x.flipped).map((x) => x.label).join(", ");
    console.log(`     ${(r.title + "                       ").slice(0, 22)} ${(verdict + "          ").slice(0, 11)}${flippedOn ? "  ⚑ " + flippedOn : ""}`);
    writeFileSync(join(out, `probe.${spec.label}.${r.dilemmaId}.svg`), renderProbeStrip(r));
  }
  const pct = modelTotal ? Math.round((modelFlips / modelTotal) * 100) : 0;
  console.log(`     ${"—".repeat(22)} overall: ${modelFlips}/${modelTotal} flips (${pct}%)`);
  perModel.push(results);
  labels.push(spec.label);
}

writeFileSync(join(out, "probe.compare.svg"), renderProbeCompare(perModel, labels));
writeFileSync(join(out, "probe-report.md"), probeReport(perModel.map((results, i) => ({ label: labels[i], results }))));

console.log(`\n  Wrote per-model strips → out/probe.<model>.<id>.svg`);
console.log(`        comparison chart → out/probe.compare.svg`);
console.log(`        markdown report  → out/probe-report.md`);
console.log(`  A flip under a morally-irrelevant reframing is an inconsistency — "stable values, or vibes?"\n`);
