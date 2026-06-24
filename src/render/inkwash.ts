/**
 * 水墨 / sumi-e ink-wash. The conceit IS the engine: ink weight encodes the toll.
 *   • baseline.count → the size/darkness of the great pool + the 五-style watermark
 *   • victim.count   → the small pool + the 一-style watermark
 *   • mechanism      → a pushing-hand stroke (means) vs a forking track (side-effect)
 */

import type { Dilemma } from "../types.ts";
import { esc, cn, scene } from "./shared.ts";

const PAPER = "#F6F1E4";
const INK = "#141414";
const SEAL = "#B23A2E";

const SEAL_CHAR: Record<string, string> = { interpose: "推", consume: "取", reroute: "岔", withhold: "配", omission: "空" };
const ZH_LINE: Record<string, string> = {
  interpose: "用一人之身，停下电车",
  consume: "取一人，以救众",
  reroute: "改道，舍一以全五",
  withhold: "药只够一边",
  omission: "按兵不动",
};

const brushFigure = (x: number, baseY: number, h: number) =>
  `<circle cx="${x}" cy="${baseY - h - 6}" r="5.5"/><path d="M${x - 7},${baseY} C ${x - 9},${baseY - h * 0.55} ${x - 4},${baseY - h} ${x},${baseY - h} C ${x + 4},${baseY - h} ${x + 9},${baseY - h * 0.55} ${x + 7},${baseY} Z"/>`;

export function renderInkwash(d: Dilemma, opts: { choiceId?: string } = {}): string {
  const s = scene(d, opts.choiceId);

  // the great pool — scaled by the toll
  const rx5 = 56 + s.mainCount * 6;
  const ry5 = 42 + s.mainCount * 4;
  const m = Math.min(s.mainCount, 7);
  let figs = "";
  for (let i = 0; i < m; i++) {
    const x = 525 - ((m - 1) * 17) / 2 + i * 17;
    figs += brushFigure(x, 372, 60 + (i % 2) * 8);
  }

  const rx1 = 16 + s.sideCount * 6;

  // gesture: a pushing hand (means) over a bridge, or a track that forks (side-effect)
  const gesture = s.isPush
    ? `<g filter="url(#dry)" opacity="0.7"><path d="M268,300 C 320,288 380,290 426,300" stroke="${INK}" stroke-width="3.5" fill="none"/><line x1="300" y1="300" x2="298" y2="338" stroke="${INK}" stroke-width="2.5"/><line x1="392" y1="300" x2="394" y2="346" stroke="${INK}" stroke-width="2.5"/></g>
<ellipse cx="345" cy="292" rx="${rx1}" ry="${rx1 * 0.85}" fill="url(#pool1)" filter="url(#bleed)"/>
<g filter="url(#bleed)" fill="${INK}"><circle cx="345" cy="276" r="8"/><path d="M334,288 C 333,300 357,300 356,288 C 353,280 337,280 334,288 Z"/></g>
<g filter="url(#dry)" opacity="0.85"><path d="M286,286 C 304,284 320,286 330,290" stroke="${INK}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M330,289 l11,-4 M331,293 l12,-1 M330,297 l11,3" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>
<g opacity="0.4"><circle cx="356" cy="318" r="1.6" fill="${INK}"/><circle cx="366" cy="334" r="1.6" fill="${INK}"/><circle cx="377" cy="350" r="1.8" fill="${INK}"/><circle cx="388" cy="366" r="2" fill="${INK}"/></g>`
    : `<g filter="url(#dry)" opacity="0.7"><path d="M360,388 C 392,408 408,428 420,452" stroke="${INK}" stroke-width="3.5" fill="none"/></g>
<ellipse cx="424" cy="456" rx="${rx1}" ry="${rx1 * 0.85}" fill="url(#pool1)" filter="url(#bleed)"/>
<g filter="url(#bleed)" fill="${INK}"><circle cx="424" cy="440" r="8"/><path d="M413,452 C 412,464 436,464 435,452 C 432,444 416,444 413,452 Z"/></g>`;

  const onePoolY = s.isPush ? 292 : 456;
  const oneWmY = s.isPush ? 250 : 414;

  return `<svg viewBox="0 0 680 540" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="t-${d.id}">
<title id="t-${d.id}">${esc(d.title)} — ink wash</title>
<defs>
<filter id="bleed" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.013 0.018" numOctaves="3" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="11" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="dry" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.08" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4"/></filter>
<filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="2" result="f"/><feColorMatrix in="f" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.2 1.05" result="a"/><feComposite in="SourceGraphic" in2="a" operator="in"/></filter>
<radialGradient id="pool5" cx="50%" cy="48%" r="60%"><stop offset="0%" stop-color="#0d0d0d" stop-opacity="0.92"/><stop offset="55%" stop-color="#1f1f1f" stop-opacity="0.7"/><stop offset="100%" stop-color="#2a2a2a" stop-opacity="0"/></radialGradient>
<radialGradient id="pool1" cx="50%" cy="50%" r="55%"><stop offset="0%" stop-color="#1a1a1a" stop-opacity="0.75"/><stop offset="60%" stop-color="#2a2a2a" stop-opacity="0.4"/><stop offset="100%" stop-color="#2a2a2a" stop-opacity="0"/></radialGradient>
</defs>
<rect width="680" height="540" fill="${PAPER}"/>
<text x="525" y="430" font-family="serif" font-size="230" fill="${INK}" opacity="0.06" text-anchor="middle">${esc(cn(s.mainCount))}</text>
<text x="345" y="${oneWmY}" font-family="serif" font-size="90" fill="${INK}" opacity="0.07" text-anchor="middle">${esc(cn(s.sideCount))}</text>
<g filter="url(#dry)" opacity="0.82"><path d="M52,392 C 220,376 380,388 470,374 C 540,364 590,366 626,360" stroke="${INK}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M58,400 C 230,388 360,396 520,382" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.5"/></g>
<ellipse cx="525" cy="360" rx="${rx5}" ry="${ry5}" fill="url(#pool5)" filter="url(#bleed)"/>
<g filter="url(#bleed)" fill="${INK}">${figs}</g>
${gesture}
<g filter="url(#bleed)"><path d="M118,344 C 116,330 124,326 150,326 L188,326 C 196,326 198,332 196,344 C 198,360 196,370 188,372 L132,372 C 122,372 120,360 118,344 Z" fill="#161616"/><path d="M196,332 L214,350 L196,366 Z" fill="#161616"/><rect x="128" y="334" width="20" height="13" rx="2" fill="${PAPER}" opacity="0.85"/></g>
<circle cx="140" cy="384" r="9" fill="#161616" filter="url(#bleed)"/><circle cx="178" cy="384" r="9" fill="#161616" filter="url(#bleed)"/>
<g transform="translate(66,402)"><rect x="0" y="0" width="56" height="56" rx="3" fill="${SEAL}"/><text x="28" y="40" font-family="serif" font-size="34" fill="${PAPER}" text-anchor="middle">${esc(SEAL_CHAR[s.act.mechanism] ?? "墨")}</text></g>
<text x="138" y="424" font-family="serif" font-size="22" fill="${INK}">${esc(d.title)}</text>
<text x="138" y="448" font-family="serif" font-size="15" fill="#6b6b6b">${esc(d.domain ?? "")} · ${esc(ZH_LINE[s.act.mechanism] ?? "")}</text>
<text x="66" y="500" font-family="monospace" font-size="12" fill="#8a8475">ink weight = expected deaths · ${esc(cn(s.mainCount))} ▸ ${esc(cn(s.sideCount))} · ${esc(s.causation)}</text>
<rect width="680" height="540" fill="#1a1a1a" opacity="0.05" filter="url(#paper)"/>
</svg>`;
}
