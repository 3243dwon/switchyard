/**
 * Run me:  node examples/demo.ts   (Node 24+, zero install)
 *
 * Validates the whole canon, prints how the five frameworks vote on each, shows
 * the means-vs-side-effect axis being DERIVED (switch ≠ footbridge with identical
 * numbers), then writes a few editorial dioramas to ./out.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  CANON, asValid, scoreAll, isContested, generate, renderDiorama, RENDER_STYLES, animePrompt,
  deriveCausation, harmedParties, expectedDeaths, theSwitch, footbridge, loop, transplant, alignment,
} from "../src/index.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "out");
mkdirSync(out, { recursive: true });

const pad = (s: string, n: number) => (s + " ".repeat(n)).slice(0, n);

console.log("\n  SWITCHYARD — the canon, scored\n  " + "─".repeat(78));
console.log("  " + pad("dilemma", 16) + pad("contested?", 12) + "utilitarian / deontological / virtue / contractualist / care");
console.log("  " + "─".repeat(78));

for (const raw of CANON) {
  const d = asValid(raw); // throws if the grammar produced something incoherent
  const votes = scoreAll(d).map((r) => labelOf(d, r.recommends)).join("  ");
  console.log("  " + pad(d.id, 16) + pad(isContested(d) ? "yes" : "—", 12) + votes);
}

console.log("\n  Double effect, DERIVED (identical 5-vs-1 counts, different causation):");
for (const d of [theSwitch, footbridge, loop, transplant]) {
  const act = d.choices.find((c) => c.mechanism !== "omission")!;
  const v = harmedParties(d, act)[0];
  console.log(
    "  " + pad(d.id, 14) + pad(act.mechanism, 11) + "→ " +
    pad(deriveCausation(d, act, v.id), 12) +
    "(deontology " + (scoreAll(d).find((r) => r.framework === "deontological")!.recommends === act.id ? "permits" : "forbids") + " the act)",
  );
}

console.log("\n  Generated dilemmas (seeded — reproducible):");
for (const seed of [7, 42, 256]) {
  const d = asValid(generate(seed));
  const act = d.choices.find((c) => c.mechanism !== "omission")!;
  const v = harmedParties(d, act)[0];
  console.log(
    "  seed " + pad(String(seed), 6) + pad(d.title, 22) +
    "side: " + pad(`${v.identity}/${v.desert}`, 20) +
    "ed(act) " + expectedDeaths(d, act).toFixed(2),
  );
}

// render the WHOLE canon in EVERY style — the engine, not a template, makes the art
const stylesDir = join(out, "styles");
mkdirSync(stylesDir, { recursive: true });
let wrote = 0;
for (const raw of CANON) {
  const d = asValid(raw);
  for (const style of RENDER_STYLES) {
    writeFileSync(join(stylesDir, `${d.id}.${style}.svg`), renderDiorama(d, { style }));
    wrote++;
  }
}
// a couple of seeded ones too, to prove generativity reaches the renderers
for (const seed of [42, 256]) {
  const d = asValid(generate(seed));
  for (const style of RENDER_STYLES) writeFileSync(join(stylesDir, `gen-${seed}.${style}.svg`), renderDiorama(d, { style }));
  wrote += RENDER_STYLES.length;
}
writeFileSync(join(root, "examples", "footbridge.spec.json"), JSON.stringify(footbridge, null, 2));

console.log(`\n  Styles: ${RENDER_STYLES.join(", ")}`);
console.log(`  Wrote ${wrote} dioramas → ./out/styles/<id>.<style>.svg  and  examples/footbridge.spec.json`);

// the anime "renderer" emits a prompt, not an SVG — domain swaps the apparatus + setting
console.log("\n  Anime hero-art prompts (Shinkai · Tanaka house style → paste into NijiJourney 6):");
for (const raw of [footbridge, transplant, alignment]) {
  const d = asValid(raw);
  console.log(`\n  ── ${d.id} · domain:${d.domain} ──\n  ${animePrompt(d).niji}`);
}
console.log();

function labelOf(d: typeof theSwitch, choiceId: string): string {
  const c = d.choices.find((x) => x.id === choiceId)!;
  return c.mechanism === "omission" ? "wait" : "act";
}
