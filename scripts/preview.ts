/**
 * The whole canon, every renderer style, plus the hero prompts.
 *   node scripts/preview.ts   then open out/preview.html
 *
 * This page used to be the most conventionally AI-looking file in the project:
 * a beige ground, white cards at 12px radius with 1px borders, and monospace
 * uppercase captions at wide tracking. It is now on the same tokens as the two
 * chapters — white, SF Pro, hairline rules, and the artwork left to breathe.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { CANON, asValid, renderDiorama, RENDER_STYLES, animePrompt, generate } from "../src/index.ts";
import { shell } from "./_design.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "out");
mkdirSync(out, { recursive: true });

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const dilemmas = [...CANON, asValid(generate(42)), asValid(generate(777))];

const sections = dilemmas
  .map((raw) => {
    const d = asValid(raw);
    const cells = RENDER_STYLES.map(
      (style) =>
        `<figure class="cell"><figcaption>${style}</figcaption>${renderDiorama(d, { style })}</figure>`,
    ).join("");
    return `<section>
  <header class="shead">
    <h2>${esc(d.title)}</h2>
    <p class="meta">${d.id} · ${d.domain ?? d.hazard.kind}</p>
  </header>
  <div class="grid">${cells}</div>
  <details><summary>Hero prompt · NijiJourney 6</summary><pre>${esc(animePrompt(d).niji)}</pre></details>
</section>`;
  })
  .join("\n");

const PAGE_CSS = `
/* a document, not a stage */
body{overflow:auto;background:var(--paper-2)}
.doc{max-width:60rem;margin:0 auto;padding:var(--s9) var(--gutter) var(--s8)}

.lede{margin-bottom:var(--s9)}
h1{font:400 var(--t-display)/1.06 var(--serif);letter-spacing:var(--tr-display);color:var(--ink)}
.sub{font:400 var(--t-body)/1.5 var(--serif);letter-spacing:var(--tr-body);
  color:var(--ink-2);margin-top:var(--s4);max-width:34rem}

section{padding-top:var(--s8);border-top:var(--hair) solid var(--rule);margin-top:var(--s8)}
section:first-of-type{border-top:0;margin-top:0}
.shead{display:flex;align-items:baseline;justify-content:space-between;gap:var(--s4);
  margin-bottom:var(--s5);flex-wrap:wrap}
h2{font:400 var(--t-title)/1.14 var(--serif);letter-spacing:var(--tr-title);color:var(--ink)}
.meta{font:400 var(--t-caption)/1.4 var(--sans);color:var(--ink-3)}

.grid{display:grid;grid-template-columns:1fr 1fr;gap:var(--s6)}
.cell{margin:0}
.cell figcaption{font:500 var(--t-caption)/1 var(--sans);color:var(--ink-3);margin-bottom:var(--s3)}
.cell svg{width:100%;height:auto;display:block;background:var(--paper);border-radius:var(--r-s)}

details{margin-top:var(--s6)}
summary{font:400 var(--t-caption)/1 var(--sans);color:var(--ink-3);cursor:pointer;
  padding:var(--s3) 0;list-style:none;display:flex;align-items:center;gap:var(--s2)}
summary::-webkit-details-marker{display:none}
summary::before{content:"";width:5px;height:5px;border-right:1.5px solid currentColor;
  border-bottom:1.5px solid currentColor;transform:rotate(-45deg);
  transition:transform var(--d-2) var(--e-out)}
details[open] summary::before{transform:rotate(45deg)}
summary:hover{color:var(--ink)}
pre{white-space:pre-wrap;font:400 var(--t-caption)/1.7 var(--mono);color:var(--ink-2);
  background:var(--paper);border:var(--hair) solid var(--rule);border-radius:var(--r-s);
  padding:var(--s5);margin-top:var(--s3)}

footer{margin-top:var(--s9);padding-top:var(--s5);border-top:var(--hair) solid var(--rule);
  font:400 var(--t-caption)/1.5 var(--sans);color:var(--ink-3)}

@media (max-width:700px){.grid{grid-template-columns:1fr}.doc{padding-top:var(--s7)}}
`;

const BODY = `<main class="doc">
  <div class="lede">
    <h1>The canon</h1>
    <p class="sub">Every dilemma the engine knows, rendered in all four styles. The artwork and the machine-readable spec come from the same source — nothing here was drawn by hand.</p>
  </div>
  ${sections}
  <footer>${dilemmas.length} dilemmas × ${RENDER_STYLES.length} styles · node examples/demo.ts · node scripts/gallery.ts</footer>
</main>`;

const html = shell({
  title: "Switchyard — the canon",
  description: "Every Switchyard dilemma, rendered in all four styles.",
  css: PAGE_CSS,
  body: BODY,
});

const path = join(out, "preview.html");
writeFileSync(path, html);
console.log(`wrote ${path} — ${dilemmas.length} dilemmas × ${RENDER_STYLES.length} styles`);
