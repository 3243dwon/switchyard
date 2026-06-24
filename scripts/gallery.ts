/**
 * The daily gallery builder.
 *
 *   node scripts/gallery.ts            # today's dilemma
 *   node scripts/gallery.ts 2026-06-24 # a specific day (reproducible)
 *
 * Seeds a dilemma from the date, renders every style into gallery/, and rebuilds
 * the contact-sheet README. The repo grows its own art — that growing wall is the
 * storefront. Run on a schedule by .github/workflows/daily.yml.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  generate, asValid, renderDiorama, RENDER_STYLES,
  scoreAll, harmedParties, deriveCausation, expectedDeaths,
} from "../src/index.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "gallery");
mkdirSync(dir, { recursive: true });

const date = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const seed = Number(date.replaceAll("-", "")) >>> 0;
const d = asValid(generate(seed));

for (const style of RENDER_STYLES) {
  writeFileSync(join(dir, `${date}.${style}.svg`), renderDiorama(d, { style }));
}

const act = d.choices.find((c) => c.mechanism !== "omission")!;
const victim = harmedParties(d, act)[0];
const causation = deriveCausation(d, act, victim.id);
const split = new Set(scoreAll(d).map((v) => v.recommends)).size > 1 ? "contested" : "unanimous";

interface Entry { date: string; seed: number; title: string; mechanism: string; causation: string; ed: number; split: string; }
const indexPath = join(dir, "index.json");
const index: Entry[] = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, "utf8")) : [];
const entry: Entry = { date, seed, title: d.title, mechanism: act.mechanism, causation, ed: +expectedDeaths(d, act).toFixed(2), split };
const at = index.findIndex((e) => e.date === date);
if (at >= 0) index[at] = entry; else index.push(entry);
index.sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
writeFileSync(indexPath, JSON.stringify(index, null, 2));

const rows = index
  .map(
    (e) => `### ${e.date} — *${e.title}*

<img src="${e.date}.risograph.svg" width="420" alt="${e.title}, risograph"> <img src="${e.date}.inkwash.svg" width="280" alt="${e.title}, ink wash">

\`${e.mechanism}\` · \`${e.causation}\` · **${e.split}** · E[deaths]=${e.ed} — also [editorial](${e.date}.editorial.svg) · [animated](${e.date}.animated.svg) · \`node scripts/gallery.ts ${e.date}\``,
  )
  .join("\n\n---\n\n");

const md = `# Switchyard — daily dilemma gallery

One algorithmically-composed moral dilemma a day, rendered by the [engine](../). Each is seeded by its date, so every frame is reproducible. ${index.length} dilemmas and counting.

---

${rows}
`;
writeFileSync(join(dir, "README.md"), md);
console.log(`gallery: wrote ${date} (seed ${seed}) — "${d.title}" — ${index.length} entries total`);
