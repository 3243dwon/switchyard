/**
 * Risograph constructivist — the flagship poster. Spec-driven:
 *   • baseline.count  → the stenciled phalanx + the giant numeral
 *   • victim.count    → the small numeral
 *   • mechanism       → a pushing arrow (means) vs a diverting fork (side-effect)
 *   • derived causation → the thesis stamp ("a person is not a tool" vs "divert")
 */

import type { Dilemma } from "../types.ts";
import { esc, scene } from "./shared.ts";

const PAPER = "#F2E6C9";
const PINK = "#FF2D7E";
const BLUE = "#0B4FCB";
const INK = "#161616";

export function renderRisograph(d: Dilemma, opts: { choiceId?: string } = {}): string {
  const s = scene(d, opts.choiceId);
  const n = Math.min(s.mainCount, 6);

  // the condemned phalanx, climbing the diagonal toward the upper right
  let phalanx = "";
  const seats: Array<[number, number, number]> = [];
  for (let i = 0; i < n; i++) seats.push([470 + i * 24, 330 - i * 21, 1.05 + i * 0.03]);
  const stamp = (fill: string, extra = "") =>
    seats.map(([x, y, k]) => `<use href="#p" transform="translate(${x},${y}) scale(${k})"${extra} fill="${fill}"/>`).join("");
  phalanx =
    `<g transform="translate(8,6)" opacity="0.8">${stamp(BLUE)}</g>` +
    `<g>${stamp(INK)}</g>` +
    `<g opacity="0.9">${stamp("url(#hp)")}</g>`;

  const bigNum = s.mainCount >= 10 ? 96 : 150;

  // the gesture: push a body in (means) OR throw a switch to a spur (side-effect)
  const gesture = s.isPush
    ? `<g stroke="${INK}" stroke-width="6" filter="url(#rough)"><line x1="208" y1="372" x2="470" y2="372"/><line x1="220" y1="372" x2="220" y2="404"/><line x1="300" y1="372" x2="300" y2="430"/><line x1="380" y1="372" x2="380" y2="430"/><line x1="455" y1="372" x2="455" y2="408"/></g>
<g transform="translate(300,372)"><g transform="translate(7,5)" fill="${BLUE}" opacity="0.8"><circle cx="0" cy="-78" r="15"/><path d="M-17,-64 Q0,-70 17,-64 L15,-22 L-15,-22 Z"/><rect x="-15" y="-22" width="12" height="24" rx="4"/><rect x="3" y="-22" width="12" height="24" rx="4"/></g><circle cx="0" cy="-78" r="15" fill="${INK}"/><path d="M-17,-64 Q0,-70 17,-64 L15,-22 L-15,-22 Z" fill="${INK}"/><rect x="-15" y="-22" width="12" height="24" rx="4" fill="${INK}"/><rect x="3" y="-22" width="12" height="24" rx="4" fill="${INK}"/></g>
<text x="246" y="300" font-family="sans-serif" font-weight="900" font-size="52" fill="${PINK}">${s.sideCount}</text>
<path d="M250,300 C 300,330 350,360 402,404" stroke="${PINK}" stroke-width="20" fill="none"/>
<path d="M392,388 L420,420 L378,424 Z" fill="${PINK}"/>`
    : `<g filter="url(#rough)"><path d="M360,441 C 410,470 440,500 470,520" stroke="${INK}" stroke-width="10" fill="none"/></g>
<circle cx="360" cy="441" r="6" fill="${INK}"/><line x1="360" y1="441" x2="384" y2="420" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
<g transform="translate(8,6)" fill="${BLUE}" opacity="0.8"><use href="#p" transform="translate(470,524) scale(1.35)"/></g>
<use href="#p" transform="translate(470,524) scale(1.35)" fill="${INK}"/>
<use href="#p" transform="translate(470,524) scale(1.35)" fill="url(#hp)"/>
<text x="498" y="520" font-family="sans-serif" font-weight="900" font-size="52" fill="${PINK}">${s.sideCount}</text>`;

  const stampZh = s.isMeans ? "拒绝 · A PERSON IS NOT A TOOL" : "分流 · DIVERT TO THE FEW";
  const stampEn = s.isMeans
    ? `deontology forbids the act · E[deaths]=${s.edAct.toFixed(2)}`
    : `permitted · still a death · E[deaths]=${s.edAct.toFixed(2)}`;

  return `<svg viewBox="0 0 680 740" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="t-${d.id}">
<title id="t-${d.id}">${esc(d.title)} — risograph poster</title>
<defs>
<pattern id="hp" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(15)"><circle cx="4" cy="4" r="2.2" fill="${PINK}"/></pattern>
<pattern id="hb" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)"><circle cx="5.5" cy="5.5" r="2" fill="${BLUE}"/></pattern>
<filter id="rough" x="-6%" y="-6%" width="112%" height="112%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="11" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="7" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="3" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.4 1.1" result="a"/><feComposite in="SourceGraphic" in2="a" operator="in"/></filter>
<g id="p"><circle cx="0" cy="-40" r="7.5"/><path d="M-8,-33 Q0,-37 8,-33 L7,-12 L-7,-12 Z"/><rect x="-7" y="-12" width="6" height="13" rx="2.5"/><rect x="1" y="-12" width="6" height="13" rx="2.5"/></g>
</defs>
<rect width="680" height="740" fill="${PAPER}"/>
<g transform="translate(626,64)" fill="${BLUE}" opacity="0.13"><path d="M0,0 L-690,-60 L-690,-20 Z"/><path d="M0,0 L-690,40 L-690,90 Z"/><path d="M0,0 L-660,150 L-660,205 Z"/><path d="M0,0 L-560,280 L-560,340 Z"/><path d="M0,0 L-400,420 L-400,485 Z"/><path d="M0,0 L-180,540 L-180,610 Z"/><path d="M0,0 L-690,-150 L-690,-110 Z"/></g>
<g filter="url(#rough)"><path d="M69,701 L619,210 L601,189 L51,679 Z" fill="${INK}"/><g stroke="${INK}" stroke-width="8" opacity="0.9"><line x1="120" y1="678" x2="150" y2="652"/><line x1="210" y1="598" x2="240" y2="572"/><line x1="300" y1="518" x2="330" y2="492"/><line x1="390" y1="438" x2="420" y2="412"/><line x1="480" y1="358" x2="510" y2="332"/><line x1="555" y1="290" x2="585" y2="264"/></g></g>
<g transform="translate(150,628) rotate(-42)"><g transform="translate(6,5)" fill="${BLUE}" opacity="0.85"><rect x="-30" y="-20" width="60" height="40" rx="7"/></g><rect x="-30" y="-20" width="60" height="40" rx="7" fill="${INK}"/><rect x="6" y="-13" width="18" height="14" rx="2" fill="url(#hp)"/><circle cx="-14" cy="20" r="6" fill="${INK}"/><circle cx="16" cy="20" r="6" fill="${INK}"/><path d="M30,-22 L48,0 L30,22 Z" fill="${INK}"/></g>
<text x="466" y="246" font-family="sans-serif" font-weight="900" font-size="${bigNum}" fill="${PINK}" opacity="0.92" letter-spacing="-6">${s.mainCount}</text>
${phalanx}
${gesture}
<text x="40" y="96" font-family="sans-serif" font-weight="900" font-size="44" fill="${INK}" letter-spacing="-1">${esc(d.title.toUpperCase())}</text>
<text x="42" y="120" font-family="monospace" font-size="13" fill="${BLUE}">switchyard · ${esc(s.act.mechanism)} · ${esc(s.causation)}</text>
<g transform="translate(60,628) rotate(-5)"><rect x="0" y="0" width="332" height="62" fill="none" stroke="${PINK}" stroke-width="4"/><text x="16" y="28" font-family="sans-serif" font-weight="900" font-size="21" fill="${PINK}">${esc(stampZh)}</text><text x="16" y="50" font-family="monospace" font-size="12" fill="${INK}">${esc(stampEn)}</text></g>
<rect width="680" height="740" fill="url(#hb)" opacity="0.05"/>
<rect width="680" height="740" fill="${INK}" opacity="0.04" filter="url(#grain)"/>
</svg>`;
}
