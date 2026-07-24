/**
 * THE WHITE ROOM — Switchyard's design system.
 *
 * One source of truth for every page. Before this file, play.ts and veil.ts each
 * carried ~88 lines of near-identical CSS that had already drifted apart, and the
 * whole project defined exactly two custom properties.
 *
 * The premise: the trolley problem was published in 1967 as a diagram; the
 * melodrama arrived later. A dusk gradient with god-rays aestheticizes the
 * killing — golden hour makes five deaths look like a film still, and the reader
 * gets to feel something instead of decide something. The white room refuses that
 * trade. Everything here is ink on one uninterrupted sheet: the scene is a drawn
 * diagram, the prose is set on the same sheet, the progress rail is six ticks on
 * the same sheet. Nothing is behind anything.
 *
 * Type is Apple's own split — New York sets the words of the fiction, SF Pro sets
 * the words of the interface, and nothing crosses. Both come from the system, so
 * the pages stay single-file and make zero network requests.
 */

/* ---------------------------------------------------------------------------
   C — the palette as data, so CSS, the SVG generator, and the library's own
   renderer can all read the same values. scene.js is plain browser JS and
   cannot import, so this object is also JSON-injected into the page.
   --------------------------------------------------------------------------- */
export const C = {
  ink: "#1D1D1F",       // Apple label
  ink2: "#6E6E73",      // Apple secondary label
  ink3: "#86868B",      // Apple tertiary label
  ink4: "#AEAEB2",      // struck parties, receded souls

  paper: "#FFFFFF",
  paper2: "#FBFBFD",    // the room's actual ground; pure white is harsh at full bleed
  paper3: "#F5F5F7",    // hover fills

  rule: "#D2D2D7",      // Apple separator
  ruleSoft: "#E8E8ED",

  /* The one chromatic pair. Lifted from src/render/editorial.ts (CORAL /
     CORALDARK) so the library's renderer and the deployed experience share an
     accent by construction rather than by coincidence. */
  signal: "#D85A30",    // graphics only: fills and >=3px strokes
  signalInk: "#993C1D", // text and hairlines. 6.96:1 on white — AA at every size

  /* Kept separate on purpose, so "red means something is going to kill someone"
     and "blue means the system is talking to you" never collide. */
  focus: "#0071E3",
} as const;

const vars = (c: typeof C) =>
  `--ink:${c.ink};--ink-2:${c.ink2};--ink-3:${c.ink3};--ink-4:${c.ink4};` +
  `--paper:${c.paper};--paper-2:${c.paper2};--paper-3:${c.paper3};` +
  `--rule:${c.rule};--rule-soft:${c.ruleSoft};` +
  `--signal:${c.signal};--signal-ink:${c.signalInk};--focus:${c.focus};`;

/* ---------------------------------------------------------------------------
   TOKENS
   --------------------------------------------------------------------------- */
export const TOKENS = `:root{
  color-scheme:light;
  ${vars(C)}

  /* — type. ui-serif resolves to New York on Apple platforms, -apple-system to
       SF Pro. Off Apple platforms Georgia wins: wider, with old-style figures,
       so the rag differs slightly. That is degradation, not a bug. — */
  --serif:ui-serif,'New York','Iowan Old Style',Charter,Georgia,'Times New Roman',serif;
  --sans:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
  --mono:ui-monospace,'SF Mono',SFMono-Regular,Menlo,monospace;
  --font-serif:var(--serif);   /* consumed by the SVG renderers in src/render/ */

  /* — scale: two hand-set ramps, swapped once. No clamp(): a size that is a
       continuous function of the viewport is never right at any width and has
       no ratio to its neighbours. --t-body at 17px on mobile is SF Body. — */
  --t-display:56px; --t-title:40px; --t-lead:28px; --t-body:21px;
  --t-sub:17px; --t-caption:13px; --t-micro:11px;

  /* — tracking. Negative above 21px is mandatory: New York, like SF Display, is
       drawn to be tightened optically at size. Positive tracking above +0.01em
       appears nowhere in this system. — */
  --tr-display:-.03em; --tr-title:-.025em; --tr-lead:-.015em;
  --tr-body:-.01em; --tr-sub:-.01em; --tr-flat:0;

  /* — 4px base — */
  --s1:4px; --s2:8px; --s3:12px; --s4:16px; --s5:24px;
  --s6:32px; --s7:48px; --s8:64px; --s9:96px; --s10:144px;
  --gutter:var(--s6);
  --measure:34rem;        /* prose — ~62 characters at --t-lead */
  --measure-wide:46rem;   /* the drawing plate */

  /* — hairlines that stay hairlines — */
  --hair:1px;

  /* — radii: continuous-corner language. Nothing below 6px, ever; the old
       border-radius:2px was the clearest non-designer tell in the file. — */
  --r-xs:6px; --r-s:10px; --r-m:14px; --r-l:20px; --r-pill:980px;

  /* — motion. Apple speed. — */
  --d-1:120ms;  /* hover, focus, toggle        */
  --d-2:240ms;  /* dot fill, chevron, state    */
  --d-3:400ms;  /* content arriving, transition*/
  --d-approach:900ms;  /* the trolley closing on the junction. Diegetic travel,
                          so it keeps more time than a UI transition: at 400ms it
                          teleports instead of approaching. */
  --d-commit:450ms;    /* the trolley taking the track you set */

  --e-out:cubic-bezier(.22,.61,.36,1);
  --e-enter:cubic-bezier(.16,1,.3,1);
  --e-exit:cubic-bezier(.7,0,.84,0);
  --e-bear:cubic-bezier(.32,.06,.62,1);   /* the approach: slow start, relentless middle */
  --e-commit:cubic-bezier(.5,0,.9,1);     /* the divert: accelerates, and does NOT
                                             decelerate into the strike */
}
@media (max-width:700px){:root{
  --t-display:34px; --t-title:27px; --t-lead:21px; --t-body:17px;
  --t-sub:15px; --t-caption:13px; --t-micro:11px;
  --gutter:20px;
}}
@media (-webkit-min-device-pixel-ratio:2){:root{--hair:.5px}}`;

/* ---------------------------------------------------------------------------
   RESET + the room
   --------------------------------------------------------------------------- */
export const BASE = `
*{margin:0;padding:0;box-sizing:border-box}
/* No -webkit-font-smoothing:antialiased. On light grounds it thins the strokes,
   and it is exactly what makes light-mode type look weak and washed. */
html,body{height:100%;background:var(--paper-2);color:var(--ink);
  font-family:var(--serif);font-synthesis:none;font-optical-sizing:auto}
body{overflow:hidden}

/* — the room: top rail, the sheet, bottom rail — */
#stage{position:relative;display:grid;grid-template-rows:56px 1fr 56px;
  width:100%;height:100svh;overflow:hidden;background:var(--paper-2)}

#room{grid-row:2;min-height:0;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:var(--s5);
  padding:var(--s4) var(--gutter);overflow-y:auto;
  transition:opacity var(--d-3) var(--e-out)}
#room::-webkit-scrollbar{width:0;height:0}

/* — the drawing plate. A definite height: an SVG sized in percentages inside an
     auto-basis flex item resolves to zero, and the plate silently collapses.
     'meet', not 'slice' — a plate with air, not a backdrop bled to the edges. — */
#scene{flex:0 1 auto;width:min(var(--measure-wide),88vw);
  height:clamp(120px,24vh,214px);min-height:88px;
  display:flex;align-items:center;justify-content:center}
#scene svg{width:100%;height:100%;display:block}
#scene.in{animation:enter var(--d-3) var(--e-enter) both}
@keyframes enter{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

/* — the words. margin-inline:auto matters for the ending, where #room switches
     to display:block and flex centring no longer applies. — */
#text{flex:0 0 auto;width:min(var(--measure),88vw);margin-inline:auto}

/* — type roles — */
.title{font:400 var(--t-sub)/1.3 var(--serif);letter-spacing:var(--tr-sub);
  color:var(--ink-2);margin-bottom:var(--s5)}
/* A lede, then the facts. Three sentences at the same weight read as three
   equal announcements; setting the first larger makes the block a paragraph
   with a shape, and buys back the height the drawing needs. */
.sit{font:400 var(--t-body)/1.5 var(--serif);letter-spacing:var(--tr-body);
  color:var(--ink-2);margin-bottom:var(--s2)}
.sit:first-of-type{font:400 var(--t-lead)/1.42 var(--serif);
  letter-spacing:var(--tr-lead);color:var(--ink);margin-bottom:var(--s3)}
.stakes{font:400 var(--t-caption)/1.4 var(--sans);letter-spacing:var(--tr-flat);
  color:var(--ink-3);margin-top:var(--s4)}
.did{font:400 var(--t-lead)/1.3 var(--serif);letter-spacing:var(--tr-lead);
  color:var(--ink);margin-bottom:var(--s2)}
.consequence{font:400 var(--t-body)/1.55 var(--serif);letter-spacing:var(--tr-body);
  color:var(--ink-2);margin-bottom:var(--s5)}

/* A fixed name column. 'auto' lets "The one who would be the person worth
   being" set the column width and strangle the lines down to three words each. */
.voices{display:grid;grid-template-columns:10rem 1fr;gap:var(--s3) var(--s5)}
.voice{display:contents}
.voice .vn{font:600 var(--t-caption)/1.4 var(--sans);letter-spacing:var(--tr-flat);
  color:var(--ink-3);align-self:start;padding-top:3px}
.voice .vl{font:400 var(--t-body)/1.55 var(--serif);letter-spacing:var(--tr-body);color:var(--ink-2)}
.voice.linger .vn{color:var(--signal-ink)}
.voice.linger .vl{color:var(--ink)}

/* — the reveal — */
.line,.voice,.endline,.clead,.cvoice,.did,.consequence,.born,.fate{
  opacity:0;transform:translateY(6px);
  transition:opacity var(--d-3) var(--e-enter),transform var(--d-3) var(--e-enter)}
.line.show,.voice.show,.endline.show,.clead.show,.cvoice.show,
.did.show,.consequence.show,.born.show,.fate.show{opacity:1;transform:none}
/* a display:contents row cannot be transformed; fade its children instead */
.voice>*{opacity:0;transition:opacity var(--d-3) var(--e-enter)}
.voice.show>*{opacity:1}
`;

/* ---------------------------------------------------------------------------
   CONTROLS — the choice row is the primary control of the whole experience.
   --------------------------------------------------------------------------- */
export const CONTROLS = `
.choices{margin-top:var(--s6)}
.choice{display:grid;grid-template-columns:12px 1fr auto;align-items:center;gap:var(--s4);
  width:100%;min-height:56px;padding:15px var(--s2);text-align:left;cursor:pointer;
  background:none;border:0;border-top:var(--hair) solid var(--rule);
  font:400 var(--t-lead)/1.3 var(--serif);letter-spacing:var(--tr-lead);color:var(--ink);
  transition:background var(--d-1) var(--e-out)}
.choice:last-child{border-bottom:var(--hair) solid var(--rule)}
.choice:hover{background:var(--paper-3)}
.choice:active{background:var(--rule-soft)}

/* the dot: the only place --signal appears in the interface. It means
   "this is the one that moves." */
.choice .dot{width:8px;height:8px;border-radius:50%;background:none;
  box-shadow:inset 0 0 0 1px var(--rule);transition:background var(--d-2) var(--e-out)}
.choice:hover .dot,.choice:focus-visible .dot{background:var(--signal);box-shadow:none}
.choice .chev{color:var(--ink-3);display:flex;
  transition:transform var(--d-2) var(--e-out),color var(--d-2) var(--e-out)}
.choice:hover .chev{transform:translateX(4px);color:var(--ink-2)}

/* one advance control, one verb */
.advance{display:inline-flex;align-items:center;gap:var(--s2);margin-top:var(--s5);
  min-height:48px;padding:14px var(--s6);
  font:500 var(--t-sub)/1 var(--sans);letter-spacing:var(--tr-sub);
  color:var(--paper);background:var(--ink);border:0;border-radius:var(--r-pill);cursor:pointer;
  opacity:0;transition:opacity var(--d-3) var(--e-enter),background var(--d-1) var(--e-out)}
.advance.show{opacity:1}
.advance:hover{background:#000}
.advance.quiet{background:none;color:var(--ink-2);padding:12px 0;min-height:44px;text-decoration:none}
.advance.quiet:hover{background:none;color:var(--ink)}
.advance svg{fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}

/* Focus is never removed. It is the primary control of the experience, and the
   old rule set outline:none on :focus-visible. */
:focus-visible{outline:2px solid var(--focus);outline-offset:4px;border-radius:var(--r-xs)}

.vh{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;
  clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
`;

/* ---------------------------------------------------------------------------
   CHROME — rails, progress, sound, the gate, the ending.
   --------------------------------------------------------------------------- */
export const CHROME = `
.rail{display:flex;align-items:center;justify-content:space-between;gap:var(--s4);
  padding:0 var(--gutter);font:400 var(--t-caption)/1 var(--sans);color:var(--ink-3)}
.rail.top{grid-row:1}
.rail.bot{grid-row:3}
.wordmark{font:600 var(--t-sub)/1 var(--sans);letter-spacing:var(--tr-sub);color:var(--ink-3)}

/* Progress. Six ticks that are also the record of your hands: a tick drawn in
   --signal-ink means that choice used a person as a means. By the sixth the rail
   is a permanent, readable account of what you did — which is what the old
   invisible accumulating colour-grade was reaching for. */
#progress{display:flex;align-items:center;gap:var(--s4)}
#progress .n{font-variant-numeric:tabular-nums;font-weight:500}
#progress .ticks{display:flex;gap:6px}
#progress i{width:24px;height:2px;border-radius:1px;background:var(--rule);
  transition:background var(--d-2) var(--e-out),height var(--d-2) var(--e-out)}
#progress i.now{background:var(--ink);height:4px}
#progress i.side{background:var(--ink-2)}
#progress i.means{background:var(--signal-ink)}

/* Sound: a labelled control. A labelled control is more Ive than a clever glyph,
   and nobody ever knew which of the old diamonds meant on. */
#sound{display:inline-flex;align-items:center;gap:var(--s2);min-height:44px;padding:0 var(--s2);
  font:400 var(--t-caption)/1 var(--sans);color:var(--ink-3);
  background:none;border:0;cursor:pointer;transition:color var(--d-1) var(--e-out)}
#sound:hover{color:var(--ink)}
#sound svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.5;
  stroke-linecap:round;stroke-linejoin:round}
#sound .off{display:none}
#sound[aria-pressed="false"] .on{display:none}
#sound[aria-pressed="false"] .off{display:block}

/* The gate. It exists because Web Audio needs a gesture, so it should read as a
   title page, not a ceremony: no radial gradient, no centred stack, no scale. */
#begin{position:absolute;inset:0;z-index:30;background:var(--paper-2);
  display:flex;align-items:center;padding:0 var(--gutter);
  transition:opacity var(--d-3) var(--e-out)}
#begin.gone{opacity:0;pointer-events:none}
.bi{width:min(var(--measure),88vw);margin:0 auto}
.bi>*{opacity:0;transform:translateY(12px);
  transition:opacity var(--d-3) var(--e-enter),transform var(--d-3) var(--e-enter)}
.bi.in>*{opacity:1;transform:none}
.b-title{font:400 var(--t-display)/1.06 var(--serif);letter-spacing:var(--tr-display);color:var(--ink)}
.b-sub{font:400 var(--t-body)/1.5 var(--serif);letter-spacing:var(--tr-body);
  color:var(--ink-2);margin:var(--s5) 0 var(--s7)}
.b-meta{font:400 var(--t-caption)/1.4 var(--sans);color:var(--ink-3);margin-top:var(--s5)}

/* The ending is the one moment that breaks the room: the plate is gone, the
   sheet is whole, and it scrolls like a document. Left-aligned — a centred 46ch
   paragraph block is the AI-landing-page signature. */
#stage.ended{grid-template-rows:56px 1fr 0}
#stage.ended .rail.bot{display:none}
#room.ending{display:block;overflow-y:auto;padding:var(--s9) var(--gutter);gap:0}
#room.ending::-webkit-scrollbar{width:0;height:0}
.end{width:min(var(--measure),88vw);margin:0 auto}
.end .title{font:400 var(--t-title)/1.14 var(--serif);letter-spacing:var(--tr-title);
  color:var(--ink);margin-bottom:var(--s7)}
.endline{font:400 var(--t-body)/1.62 var(--serif);letter-spacing:var(--tr-body);
  color:var(--ink);margin-bottom:var(--s5)}
.endline.last{color:var(--ink-2);margin-top:var(--s6)}
.clead{font:400 var(--t-caption)/1.4 var(--sans);color:var(--ink-3);
  margin:var(--s9) 0 var(--s5)}
.council{display:grid;grid-template-columns:12rem 1fr;row-gap:0}
.cvoice{display:contents}
.cvoice>*{padding:var(--s5) 0;border-top:var(--hair) solid var(--rule)}
.clabel{font:600 var(--t-caption)/1.3 var(--sans);color:var(--ink-2)}
.cline{font:400 var(--t-sub)/1.55 var(--serif);letter-spacing:var(--tr-sub);color:var(--ink)}
.navrow{margin-top:var(--s8);display:flex;flex-wrap:wrap;gap:var(--s6);align-items:center}

@media (max-width:700px){
  #stage{grid-template-rows:52px 1fr 52px}
  #room{gap:var(--s6)}
  .choice{min-height:48px;padding:14px var(--s1);grid-template-columns:10px 1fr auto}
  .council{grid-template-columns:1fr;row-gap:0}
  .cvoice>*{padding:var(--s3) 0}
  .cvoice .clabel{padding-bottom:0;border-bottom:0}
  .cvoice .cline{border-top:0;padding-top:var(--s1)}
  #progress .n{display:none}
  .voices{grid-template-columns:1fr;gap:var(--s2) 0}
  .voice .vn{margin-top:var(--s3)}
}
@media (max-height:560px){
  #stage{grid-template-rows:0 1fr 48px}
  .rail.top{display:none}
  #room{gap:var(--s5)}
  #scene{flex:0 1 24vh}
}

/* Reduced motion: no travel, no transform. A short honest fade, and the trolley
   is drawn at the junction rather than driven to it. */
@media (prefers-reduced-motion:reduce){
  *{animation-duration:1ms!important;animation-iteration-count:1!important;
    transition-duration:.01ms!important;scroll-behavior:auto!important}
  .line,.voice,.endline,.clead,.cvoice,.did,.consequence,.born,.fate,.bi>*{transform:none}
}
`;

/* ---------------------------------------------------------------------------
   Icons — 14px, 1.5px stroke, currentColor. No glyph fonts, no entities.
   --------------------------------------------------------------------------- */
export function icon(name: "chevron" | "speakerOn" | "speakerOff", px = 14): string {
  const open = `<svg width="${px}" height="${px}" viewBox="0 0 24 24" aria-hidden="true">`;
  const d: Record<string, string> = {
    chevron: `<path d="M9 5l7 7-7 7"/>`,
    speakerOn: `<path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 010 7"/><path d="M18.5 5.5a9 9 0 010 13"/>`,
    speakerOff: `<path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M16 9l5 6"/><path d="M21 9l-5 6"/>`,
  };
  return `${open}${d[name]}</svg>`;
}

/* ---------------------------------------------------------------------------
   sheet / shell
   --------------------------------------------------------------------------- */
export const sheet = (...parts: string[]) => parts.join("\n");

export function shell(o: {
  title: string;
  description?: string;
  css?: string;
  body: string;
  scripts?: string[];
}): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light">
${o.description ? `<meta name="description" content="${o.description}">\n` : ""}<title>${o.title}</title>
<style>
${sheet(TOKENS, BASE, CONTROLS, CHROME, o.css ?? "")}
</style></head><body>
${o.body}
${(o.scripts ?? []).map((s) => `<script>${s}</script>`).join("\n")}
</body></html>`;
}

/* ---------------------------------------------------------------------------
   Motion tiers in ms, for the JS that cannot read custom properties.
   --------------------------------------------------------------------------- */
export const MOTION = {
  fast: 120,
  base: 240,
  slow: 400,
  stagger: 60,    /* between prose lines — was 550 */
  voice: 180,     /* between the five voices — was 1120–1650 */
  approach: 900,  /* the trolley closing on the junction — was 4200 */
  travel: 450,    /* the trolley taking the track you set — was 1650 */
  veil: 700,      /* the veil parting — was 2100 */
} as const;
