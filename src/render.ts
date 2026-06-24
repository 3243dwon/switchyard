/**
 * The editorial diorama renderer.
 *
 * Reads geometry and the rendered SHAPE of the dilemma (who is the baseline
 * victim, who does the chosen act harm, is there a loop) and emits a clean
 * Pentagram-grade rail schematic as an SVG string. It reads the derived
 * causation only to tint the scene — never to make a moral judgment.
 *
 * This is the trojan horse: the spec is infrastructure, but the diorama is what
 * gets the repo starred by people who will never call the API.
 */

import type { Dilemma, Choice, Party } from "./types.ts";
import { partyById, harmedParties, deriveCausation, expectedDeaths } from "./model.ts";

const GRAY = "#5F5E5A";
const GRAYDARK = "#2C2C2A";
const CORAL = "#D85A30";
const CORALDARK = "#993C1D";
const RULE = "#B4B2A9";

const person = (x: number, baseline: number, fill: string) =>
  `<g transform="translate(${x},${baseline})" fill="${fill}"><circle cx="0" cy="-26" r="5"/><path d="M0,-21 C-5,-21 -6,-16 -6,-2 L6,-2 C6,-16 5,-21 0,-21 Z"/></g>`;

const cluster = (rightX: number, baseline: number, count: number, fill: string) => {
  const n = Math.min(count, 5);
  let s = "";
  for (let i = 0; i < n; i++) s += person(rightX - i * 15, baseline, fill);
  return s;
};

export interface RenderOptions {
  /** which choice to depict; defaults to the first non-omission choice */
  choiceId?: string;
}

export function renderDiorama(d: Dilemma, opts: RenderOptions = {}): string {
  const baseline: Party = partyById(d, d.baselineVictimIds[0]);
  const act: Choice = (opts.choiceId && d.choices.find((c) => c.id === opts.choiceId)) ||
    d.choices.find((c) => c.mechanism !== "omission") ||
    d.choices[d.choices.length - 1];
  const harmed = harmedParties(d, act);
  const victim: Party = harmed.find((p) => p.id !== baseline.id) ?? harmed[0] ?? d.parties.find((p) => p.id !== baseline.id)!;
  const loop = Boolean(d.topology?.segments.some((s) => s.loopsBackTo));
  const causation = deriveCausation(d, act, victim.id);
  const isMeans = causation === "means";

  const sideRail = `M300,200 C 360,214 400,272 545,272`;
  const loopReturn = loop ? `<path d="M545,272 C 598,272 612,236 610,205" stroke="${GRAY}" stroke-width="2.5" fill="none"/>` : "";
  const sideNumColor = isMeans ? CORALDARK : GRAY;
  const meta = `seed ${d.seed ?? "—"} · ${d.domain ?? d.hazard.kind}`;
  const fp = `${act.mechanism} · ${causation} · ${act.force} force · expected deaths if you act: ${expectedDeaths(d, act).toFixed(2)}`;

  return `<svg width="100%" viewBox="0 0 680 340" role="img" xmlns="http://www.w3.org/2000/svg">
<title>${esc(d.title)}</title>
<desc>An editorial rail diorama of the dilemma "${esc(d.title)}".</desc>
<defs><marker id="ah-${d.id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${CORALDARK}"/></marker></defs>
<text x="40" y="52" font-family="var(--font-serif), Georgia, serif" font-size="19" fill="${GRAYDARK}">${esc(d.title)}</text>
<text x="640" y="52" text-anchor="end" font-family="monospace" font-size="12" fill="${GRAY}">${esc(meta)}</text>
<line x1="40" y1="68" x2="640" y2="68" stroke="${RULE}" stroke-width="1"/>

<text x="300" y="160" text-anchor="middle" font-family="monospace" font-size="11.5" fill="${GRAYDARK}">${esc(act.label)}</text>

<path d="M70,200 L610,200" stroke="#888780" stroke-width="3" fill="none"/>
<path d="${sideRail}" stroke="#888780" stroke-width="2.5" fill="none" stroke-dasharray="${loop ? "0" : "6 6"}"/>
${loopReturn}
<path d="M128,200 L540,200" stroke="${CORAL}" stroke-width="4" fill="none" marker-end="url(#ah-${d.id})"/>

<circle cx="300" cy="200" r="4" fill="#444441"/>
<line x1="300" y1="200" x2="319" y2="181" stroke="#444441" stroke-width="3" stroke-linecap="round"/>

<rect x="80" y="172" width="48" height="26" rx="3" fill="#D3D1C7" stroke="${GRAY}" stroke-width="1.5"/>
<rect x="88" y="178" width="13" height="9" rx="1.5" fill="#F1EFE8"/>
<rect x="107" y="178" width="13" height="9" rx="1.5" fill="#F1EFE8"/>
<circle cx="94" cy="200" r="4.5" fill="#444441"/>
<circle cx="114" cy="200" r="4.5" fill="#444441"/>

${cluster(610, 200, baseline.count, GRAY)}
${person(545, 272, GRAY)}

<text x="512" y="188" font-family="var(--font-serif), Georgia, serif" font-size="30" fill="${CORALDARK}">${baseline.count}</text>
<text x="503" y="262" font-family="var(--font-serif), Georgia, serif" font-size="30" fill="${sideNumColor}">${victim.count}</text>
<text x="575" y="226" text-anchor="middle" font-family="monospace" font-size="11.5" fill="${CORALDARK}">do nothing</text>
<text x="545" y="296" text-anchor="middle" font-family="monospace" font-size="11.5" fill="${sideNumColor}">${isMeans ? "used as a means" : "divert"}</text>

<text x="40" y="322" font-family="monospace" font-size="11.5" fill="#888780">${esc(fp)}</text>
</svg>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
