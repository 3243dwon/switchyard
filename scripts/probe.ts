/**
 * Run the consistency probe.
 *   node scripts/probe.ts                 # offline, simulated "vibes" model
 *   ANTHROPIC_API_KEY=sk-... node scripts/probe.ts            # live, claude-opus-4-8
 *   ANTHROPIC_API_KEY=sk-... node scripts/probe.ts claude-haiku-4-5   # any model id
 *
 * For each dilemma it asks the model the SAME dilemma under several morally-
 * irrelevant reframings and reports where the verdict flips — and writes a
 * consistency strip to out/probe.<id>.svg.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { asValid, footbridge, theSwitch, transplant, tunnel, probe, anthropicModel, mockModel, renderProbeStrip } from "../src/index.ts";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "out");
mkdirSync(out, { recursive: true });

const key = process.env.ANTHROPIC_API_KEY;
const model = process.argv[2];
const ask = key ? anthropicModel({ apiKey: key, model }) : mockModel();

console.log(`\n  SWITCHYARD — consistency probe   [${key ? `live · ${model ?? "claude-opus-4-8"}` : "offline · simulated 'vibes' model"}]`);
if (!key) console.log("  (set ANTHROPIC_API_KEY to probe a real model)");

const dilemmas = [theSwitch, footbridge, transplant, tunnel];

for (const raw of dilemmas) {
  const d = asValid(raw);
  const r = await probe(d, ask);
  const verdict = r.flips === 0 ? "STABLE" : `${r.flips}/${r.total} FLIPS`;
  console.log(`\n  ── ${r.title}  (${verdict}) ──`);
  for (const x of r.results) {
    const v = x.choiceId == null ? "—" : x.choiceId === r.actId ? "act " : "stay";
    console.log(`     ${(x.label + "          ").slice(0, 10)} ${v}${x.flipped ? "  ⚑ flip" : ""}`);
  }
  writeFileSync(join(out, `probe.${d.id}.svg`), renderProbeStrip(r));
}

console.log(`\n  Wrote consistency strips → out/probe.*.svg`);
console.log(`  A flip under a morally-irrelevant reframing is an inconsistency — "stable values, or vibes?"\n`);
