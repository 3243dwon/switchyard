/**
 * The animated moment — SMIL loop. The trolley rolls in, the choice resolves,
 * the death tally ticks, it holds, it resets. A still is an illustration; this
 * is a moment. Spec-driven: counts, the gesture, and the verdict line.
 *
 * Render as a GIF/MP4 for READMEs (a frozen frame-0 PNG loses the point).
 */

import type { Dilemma } from "../types.ts";
import { esc, scene } from "./shared.ts";

const INK = "#1c1b1a";
const CORAL = "#D85A30";
const GREEN = "#3B6D11";
const PAPER = "#F4EFE3";
const GRAY = "#9a958a";

const person = (x: number, y: number, fill: string, k = 1) =>
  `<g transform="translate(${x},${y}) scale(${k})" fill="${fill}"><circle cx="0" cy="-24" r="5"/><path d="M0,-19 C-5,-19 -6,-15 -6,-2 L6,-2 C6,-15 5,-19 0,-19 Z"/></g>`;

const DUR = "6s";
const reveal = (kt: string) => `<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="${kt}" dur="${DUR}" repeatCount="indefinite"/>`;

export function renderAnimated(d: Dilemma, opts: { choiceId?: string } = {}): string {
  const s = scene(d, opts.choiceId);
  const fiveN = Math.min(s.mainCount, 5);
  let five = "";
  for (let i = 0; i < fiveN; i++) five += person(566 + i * 14, 240, INK, 1);

  const verdict = s.isMeans ? "deontology refuses · used as a means" : "a death, foreseen not intended";

  return `<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="t-${d.id}">
<title id="t-${d.id}">${esc(d.title)} — animated</title>
<rect width="680" height="360" fill="${PAPER}"/>
<text x="40" y="56" font-family="var(--font-serif), Georgia, serif" font-size="20" fill="${INK}">${esc(d.title)}</text>
<text x="640" y="56" text-anchor="end" font-family="monospace" font-size="12" fill="${GRAY}">${esc(s.act.mechanism)} · ${esc(s.causation)}</text>
<line x1="40" y1="72" x2="640" y2="72" stroke="#d8d2c4" stroke-width="1"/>

<line x1="40" y1="240" x2="640" y2="240" stroke="${INK}" stroke-width="3"/>
<path d="M320,240 C 360,256 400,278 440,300" stroke="${GRAY}" stroke-width="2.5" fill="none" stroke-dasharray="6 6"/>

${five}
<text x="556" y="214" font-family="var(--font-serif), Georgia, serif" font-size="26" fill="${INK}">${s.mainCount}</text>
<g opacity="0"><text x="556" y="290" font-family="monospace" font-size="12" fill="${GREEN}">saved</text>${reveal("0;0.52;0.57;0.92;1")}</g>

${person(440, 300, INK, 1)}
<g opacity="0"><line x1="426" y1="286" x2="454" y2="314" stroke="${CORAL}" stroke-width="3"/><line x1="454" y1="286" x2="426" y2="314" stroke="${CORAL}" stroke-width="3"/>${reveal("0;0.5;0.55;0.95;1")}</g>
<text x="470" y="306" font-family="var(--font-serif), Georgia, serif" font-size="22" fill="${CORAL}" opacity="0">${s.sideCount}${reveal("0;0.52;0.57;0.95;1")}</text>

<g><animateTransform attributeName="transform" type="translate" values="-150,0;218,0;218,0;218,0;-150,0" keyTimes="0;0.5;0.55;0.9;1" dur="${DUR}" repeatCount="indefinite"/>
<rect x="70" y="218" width="50" height="26" rx="3" fill="${INK}"/>
<rect x="78" y="224" width="13" height="9" rx="1.5" fill="${PAPER}"/>
<rect x="98" y="224" width="13" height="9" rx="1.5" fill="${PAPER}"/>
<circle cx="84" cy="244" r="5" fill="${INK}"/><circle cx="106" cy="244" r="5" fill="${INK}"/>
<path d="M120,222 L134,231 L120,240 Z" fill="${CORAL}"/></g>

<g opacity="0"><rect x="300" y="150" width="40" height="92" fill="${CORAL}" opacity="0.18"/><text x="320" y="140" text-anchor="middle" font-family="monospace" font-size="11.5" fill="${CORAL}">${esc(s.act.label)}</text>${reveal("0;0.48;0.53;0.9;1")}</g>

<rect x="40" y="300" width="200" height="34" rx="4" fill="#ece6d8"/>
<text x="54" y="322" font-family="monospace" font-size="13" fill="${INK}">deaths: </text>
<text x="112" y="322" font-family="monospace" font-size="13" fill="${CORAL}" opacity="0">${s.sideCount}${reveal("0;0.52;0.57;0.95;1")}</text>
<text x="40" y="350" font-family="monospace" font-size="11.5" fill="${GRAY}">${esc(verdict)} · E[deaths]=${s.edAct.toFixed(2)}</text>
</svg>`;
}
