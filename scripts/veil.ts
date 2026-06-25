/**
 * THE VEIL OF IGNORANCE — chapter two of Switchyard's immersive canon.
 * You set the rules of a society from behind a veil, not knowing who you'll be;
 * then the veil lifts, you're born into a drawn position, and you live your own rules.
 * Reuses the trolley chapter's three synthesized subsystems (audio / atmosphere /
 * transitions); the scene is its own — luminous "souls" behind a sheet of light.
 *   node scripts/veil.ts   then open out/veil.html
 */

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "out");
mkdirSync(out, { recursive: true });

const DATA = JSON.parse(readFileSync(join(root, "scripts", "_veil.json"), "utf8"));
const mod = (n: string) => readFileSync(join(root, "scripts", "_modules", n + ".js"), "utf8");
const AUDIO = mod("audio");
const ATMOS = mod("atmosphere");
const TRANS = mod("transitions");

/* ---- the scene: abstract luminous presences behind a veil of light ---- *
 * A "soul" is a vertical lens of light + a head orb + a soft aura. They differ
 * only by height / brightness / posture — a hierarchy of lives, never a face.   */
function soul(id: string, x: number, baseY: number, h: number, bow = 0, bright = 1): string {
  const w = h * 0.15;
  const cy = baseY - h * 0.46;
  const headY = baseY - h * 0.9;
  const headR = h * 0.08;
  const lean = bow; // horizontal offset of the top, for a bowed / curled posture
  // body as a tapered lens drawn with two cubic curves, top nudged by `lean`
  const tx = x + lean;
  const body =
    `M ${x} ${baseY} ` +
    `C ${x - w} ${baseY - h * 0.25} ${tx - w} ${cy} ${tx} ${headY + headR * 0.6} ` +
    `C ${tx + w} ${cy} ${x + w} ${baseY - h * 0.25} ${x} ${baseY} Z`;
  return (
    `<g id="life-${id}" class="life" style="--bright:${bright}">` +
    `<ellipse class="aura" cx="${tx}" cy="${cy}" rx="${h * 0.36}" ry="${h * 0.5}"/>` +
    `<path class="soulbody" d="${body}"/>` +
    `<circle class="soulhead" cx="${tx}" cy="${headY}" r="${headR}"/>` +
    `<ellipse class="soulrefl" cx="${x}" cy="${baseY + 8}" rx="${w * 1.5}" ry="${h * 0.03}"/>` +
    `</g>`
  );
}

// the four possible lives, behind the veil, dim until the draw
const LIVES =
  // weakest — a low, short, bowed presence, close to the ground
  soul("weakest", 300, 600, 150, 26, 0.7) +
  // stranger — a presence at a threshold, with two faint open "hands"
  `<g class="threshold"><path d="M474 600 L474 452 Q540 430 606 452 L606 600" /></g>` +
  soul("stranger", 540, 596, 232, 0, 0.85) +
  `<g id="hands-stranger" class="hands"><path d="M508 520 Q494 540 498 560"/><path d="M572 520 Q586 540 582 560"/></g>` +
  // average — a plain, upright, medium presence in a plain frame
  `<g class="frame"><rect x="724" y="430" width="72" height="170" rx="2"/></g>` +
  soul("average", 760, 600, 244, 0, 0.9) +
  // fortunate — a tall, bright presence raised on a step
  `<g class="dais"><rect x="936" y="586" width="148" height="16"/><rect x="952" y="572" width="116" height="16"/></g>` +
  soul("fortunate", 1010, 568, 286, 0, 1.15);

// you, in the foreground, faceless, the pen a short stroke of light toward the veil
const YOU =
  `<g id="you">` +
  soul("self", 640, 716, 250, 0, 0.0).replace('id="life-self" class="life"', 'class="selfsoul"') +
  `<line id="pen" x1="690" y1="612" x2="742" y2="568"/>` +
  `</g>`;

const VEIL_SVG = `<svg id="sy-scene" viewBox="0 0 1280 800" preserveAspectRatio="xMidYMid slice" data-mood="cool" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="chamber" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#05070d"/><stop offset="46" stop-color="#0a0d16" offset="0.46"/>
    <stop offset="0.78" stop-color="#0b0e17"/><stop offset="1" stop-color="#070910"/>
  </linearGradient>
  <radialGradient id="veilGlow" cx="50%" cy="40%" r="62%">
    <stop offset="0" stop-color="#dfe8f6" stop-opacity="0.5"/>
    <stop offset="38%" stop-color="#9fb0cd" stop-opacity="0.2"/>
    <stop offset="100%" stop-color="#6c7ca0" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="veilGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#e6edf8" stop-opacity="0"/>
    <stop offset="0.16" stop-color="#d2ddee" stop-opacity="0.46"/>
    <stop offset="0.62" stop-color="#aebcd6" stop-opacity="0.36"/>
    <stop offset="1" stop-color="#8a99b6" stop-opacity="0.08"/>
  </linearGradient>
  <radialGradient id="seam" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#f3f7ff" stop-opacity="0.9"/>
    <stop offset="100%" stop-color="#f3f7ff" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="candle" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#f0b46a" stop-opacity="0.5"/>
    <stop offset="100%" stop-color="#f0b46a" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vig" cx="50%" cy="42%" r="76%">
    <stop offset="0" stop-color="#000" stop-opacity="0"/>
    <stop offset="58%" stop-color="#000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000" stop-opacity="0.72"/>
  </radialGradient>
  <filter id="veilShim" x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.011 0.028" numOctaves="2" seed="7" result="n">
      <animate attributeName="baseFrequency" dur="16s" values="0.011 0.028;0.017 0.022;0.011 0.028" repeatCount="indefinite"/>
    </feTurbulence>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="soft"><feGaussianBlur stdDeviation="2.2"/></filter>
</defs>
<rect x="0" y="0" width="1280" height="800" fill="url(#chamber)"/>
<g id="sy-world">
  <g data-depth="0.03" transform="translate(0 0)">
    <rect x="0" y="0" width="1280" height="800" fill="url(#veilGlow)" opacity="0.5"/>
    <ellipse cx="225" cy="678" rx="240" ry="20" fill="#04060c" opacity="0.6"/>
  </g>
  <g id="lives" data-depth="0.10" transform="translate(0 0)" filter="url(#soft)">${LIVES}</g>
  <g id="veil" data-depth="0.20" transform="translate(0 0)">
    <rect x="0" y="0" width="1280" height="800" fill="url(#veilGlow)" opacity="0.7"/>
    <g filter="url(#veilShim)">
      <g id="veil-l"><rect x="-40" y="-20" width="700" height="840" fill="url(#veilGrad)"/>
        <line x1="180" y1="0" x2="180" y2="800" stroke="#eaf0fb" stroke-opacity="0.05" stroke-width="2"/>
        <line x1="420" y1="0" x2="420" y2="800" stroke="#eaf0fb" stroke-opacity="0.06" stroke-width="2"/></g>
      <g id="veil-r"><rect x="620" y="-20" width="700" height="840" fill="url(#veilGrad)"/>
        <line x1="860" y1="0" x2="860" y2="800" stroke="#eaf0fb" stroke-opacity="0.05" stroke-width="2"/>
        <line x1="1100" y1="0" x2="1100" y2="800" stroke="#eaf0fb" stroke-opacity="0.06" stroke-width="2"/></g>
    </g>
    <rect id="veil-seam" x="632" y="0" width="16" height="800" fill="url(#seam)" opacity="0.85"/>
  </g>
  <g id="you" data-depth="0.42" transform="translate(0 0)">${YOU}</g>
  <g data-depth="0.30" transform="translate(0 0)">
    <rect x="540" y="700" width="200" height="120" fill="url(#candle)"/>
    <circle cx="640" cy="724" r="3.2" fill="#ffd79a" opacity="0.9"/>
  </g>
</g>
<rect x="0" y="0" width="1280" height="800" fill="url(#vig)" pointer-events="none"/>
</svg>`;

const APP = `
(function(){
  var ORDER=['count','faith','tend','agree','virtue'];
  var LABEL={count:'the one who counts',faith:'the one who keeps faith',tend:'the one who tends the wound',agree:'the one who asks what we agreed',virtue:'the one who would be the person worth being'};
  var CLOSE={count:'It will always reckon in totals and averages. Let it; just never let the sum decide alone.',faith:'There are lines it holds for everyone, the strong and the unborn alike.',tend:'It never stops naming the one face the rule will help or abandon.',agree:'It keeps asking what you would allow if you did not know who you would be. You just answered it with your eyes shut.',virtue:'It cares less what world you built than who the building made of you.'};
  // endings for the ordinary middle (the prose file covers the four extremes)
  var AVG={served:'You drew the wide middle, and the floor you raised when you could not see your feet cost you a little from the top. You rise more slowly than you might have. You will never once watch the ground come up to meet you, and you paid for that without being asked which night.',betrayed:'You drew the wide middle of a world built to lift its average high, and it carried you up with it. Your typical days are richer than they had any right to be. You rarely have to think about the few they were quietly built upon, and you woke as one of the many, not one of the few.'};
  var PROT={equal:1,worstoff:1,desert:0,sum:0};

  var stage=document.getElementById('stage'),sceneEl=document.getElementById('scene'),scrimEl=document.getElementById('scrim'),textEl=document.getElementById('text'),beginEl=document.getElementById('begin'),muteEl=document.getElementById('mute');
  var A=createAudio(), atmo=createAtmosphere(stage), T=createTransitions(stage);
  var ri=0, picks=[], started=false, layers=[], timers=[];
  var mx=0,my=0,tx=0,ty=0;
  function qs(s){return sceneEl.querySelector(s);}

  function loop(){
    mx+=(tx-mx)*0.06; my+=(ty-my)*0.06;
    for(var k=0;k<layers.length;k++){var L=layers[k];L.el.setAttribute('transform',L.base+' translate('+(mx*L.d*150).toFixed(1)+','+(my*L.d*95).toFixed(1)+')');}
    requestAnimationFrame(loop);
  }
  stage.addEventListener('pointermove',function(e){var r=stage.getBoundingClientRect();tx=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1));ty=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));if(started)atmo.onMouse(tx,ty);});
  function clearTimers(){timers.forEach(clearTimeout);timers=[];}
  function collectLayers(){layers=[];var gs=sceneEl.querySelectorAll('#sy-world [data-depth]');for(var k=0;k<gs.length;k++){var g=gs[k];layers.push({el:g,d:parseFloat(g.getAttribute('data-depth'))||0,base:g.getAttribute('transform')||''});}}

  function revealLines(){ if(T.revealLines){T.revealLines(textEl,{selector:'.line',stagger:560,start:160});return;} textEl.querySelectorAll('.line').forEach(function(l,k){l.style.transitionDelay=(0.16+k*0.56)+'s';requestAnimationFrame(function(){l.classList.add('show');});}); }

  function intro(){
    clearTimers();
    var h='<p class="eyebrow show">chapter two &middot; the veil of ignorance</p>';
    DATA.intro.forEach(function(l){h+='<p class="line sit">'+l+'</p>';});
    h+='<button class="walkon" id="go">take up the pen &rarr;</button>';
    textEl.innerHTML=h; textEl.onclick=null;
    revealLines();
    var t=160+DATA.intro.length*560+300;
    timers.push(setTimeout(function(){var g=document.getElementById('go');g.classList.add('show');g.onclick=function(){A.whoosh();if(T.between)T.between(function(){round(0);});else round(0);};},t));
  }

  function round(n){
    clearTimers(); ri=n; scrimEl.style.opacity='';
    var r=DATA.rounds[n];
    var h='<p class="eyebrow">'+r.eyebrow+'</p>';
    h+='<p class="line sit">'+r.question+'</p>';
    h+='<div class="line choices" id="choices"></div>';
    textEl.innerHTML=h; textEl.onclick=null;
    textEl.querySelector('.eyebrow').classList.add('show');
    revealLines();
    var cw=document.getElementById('choices');
    r.choices.forEach(function(c){
      var b=document.createElement('button'); b.className='choice'; b.textContent=c.label;
      b.addEventListener('pointerenter',function(){A.choiceHover(true,false);A.heartbeat(true,1);atmo.light({visible:true,radius:0.44});scrimEl.style.opacity='0.5';});
      b.addEventListener('pointerleave',function(){A.choiceHover(false,false);A.heartbeat(true,0);atmo.light({visible:false});scrimEl.style.opacity='';});
      b.addEventListener('focus',function(){A.choiceHover(true,false);});
      b.addEventListener('blur',function(){A.choiceHover(false,false);});
      b.onclick=function(){choose(c);};
      cw.appendChild(b);
    });
    timers.push(setTimeout(function(){A.heartbeat(true,0);},160+560*2+300));
  }

  function choose(c){
    clearTimers(); picks.push(c.lean);
    A.choiceHover(false,false); A.heartbeat(false,0); atmo.light({visible:false});
    A.voice(0,{}); scrimEl.style.opacity='0.4';
    var last=ri===DATA.rounds.length-1;
    var h='<p class="eyebrow show">'+DATA.rounds[ri].eyebrow+'</p>';
    h+='<p class="line did show">&mdash; &ldquo;'+c.label+'&rdquo;</p>';
    h+='<div class="voices" id="voices"></div>';
    h+='<button class="walkon" id="next">'+(last?'lift the veil &rarr;':'the pen moves on &rarr;')+'</button>';
    textEl.innerHTML=h;
    var vbox=document.getElementById('voices'), t=520;
    ORDER.forEach(function(k,idx){
      var p=document.createElement('p'); p.className='voice'; p.textContent=c.voices[k]; vbox.appendChild(p);
      timers.push(setTimeout(function(){p.classList.add('show');A.voice(idx,{});},t)); t+=1120;
    });
    timers.push(setTimeout(function(){
      var nx=document.getElementById('next'); nx.classList.add('show');
      nx.onclick=function(){A.whoosh();var go=function(){last?reveal():round(ri+1);};if(T.between)T.between(go);else go();};
    },t+250));
    textEl.onclick=function(){clearTimers();textEl.querySelectorAll('.voice').forEach(function(p){p.classList.add('show');});var nx=document.getElementById('next');if(nx){nx.classList.add('show');nx.onclick=function(){A.whoosh();var go=function(){last?reveal():round(ri+1);};if(T.between)T.between(go);else go();};}};
  }

  function dominantLean(){
    var t={}; picks.forEach(function(l){t[l]=(t[l]||0)+1;});
    var keys=['equal','worstoff','desert','sum'], best=picks[1]||picks[0], bn=-1;
    keys.forEach(function(k){if((t[k]||0)>bn){bn=t[k]||0;best=k;}});
    var leaders=keys.filter(function(k){return (t[k]||0)===bn;});
    return leaders.length>1 ? (picks[1]||best) : best; // ties resolved by the floor you set
  }

  function reveal(){
    clearTimers();
    var lean=dominantLean();
    var pos=DATA.positions[Math.floor(Math.random()*DATA.positions.length)];
    // the veil parts
    var vl=qs('#veil-l'), vr=qs('#veil-r'), seam=qs('#veil-seam');
    A.whoosh();
    timers.push(setTimeout(function(){ A.impact(true); atmo.burst(); A.setMood('cool'); },650));
    if(vl&&vl.animate){
      vl.animate([{transform:'translateX(0)',opacity:1},{transform:'translateX(-840px)',opacity:0}],{duration:2100,easing:'cubic-bezier(.5,0,.18,1)',fill:'forwards'});
      vr.animate([{transform:'translateX(0)',opacity:1},{transform:'translateX(840px)',opacity:0}],{duration:2100,easing:'cubic-bezier(.5,0,.18,1)',fill:'forwards'});
      if(seam)seam.animate([{opacity:0.85,transform:'scaleX(1)'},{opacity:0,transform:'scaleX(7)'}],{duration:900,easing:'ease-out',fill:'forwards'});
    } else { var vg=qs('#veil'); if(vg)vg.style.opacity='0'; }
    // the life you drew lights; the others and you recede
    DATA.positions.forEach(function(p){var el=qs('#life-'+p.id);if(el)el.classList.add(p.id===pos.id?'lit':'gone');});
    var you=qs('#you'); if(you)you.classList.add('receded');
    scrimEl.style.opacity='0.55';

    var rv=DATA.revealVoices[pos.id]||{};
    var h='<p class="eyebrow">the veil lifts</p>';
    h+='<p class="line born">You are born &mdash; '+pos.label+'.</p>';
    h+='<p class="line fate">'+DATA.fate[lean][pos.id]+'</p>';
    h+='<div class="voices" id="voices"></div>';
    h+='<button class="walkon" id="see">see what you wrote &rarr;</button>';
    textEl.innerHTML=h; textEl.onclick=null;
    textEl.querySelector('.eyebrow').classList.add('show');
    timers.push(setTimeout(function(){textEl.querySelector('.born').classList.add('show');A.voice(2,{lingers:true});},1500));
    timers.push(setTimeout(function(){textEl.querySelector('.fate').classList.add('show');},2500));
    var vbox=document.getElementById('voices'), t=3400;
    ORDER.forEach(function(k,idx){
      if(!rv[k])return;
      var p=document.createElement('p'); p.className='voice linger'; p.textContent=rv[k]; vbox.appendChild(p);
      timers.push(setTimeout(function(){p.classList.add('show');A.voice(idx,{lingers:true});},t)); t+=1650;
    });
    timers.push(setTimeout(function(){var s=document.getElementById('see');s.classList.add('show');s.onclick=function(){A.whoosh();if(T.between)T.between(ending);else ending();};},t+300));
    window.__veil={lean:lean,pos:pos.id};
  }

  function ending(){
    clearTimers();
    var lean=window.__veil.lean, posId=window.__veil.pos, prot=PROT[lean];
    var key;
    if(posId==='fortunate') key=prot?'sacrifice':'windfall';
    else if(posId==='average') return endingText(prot?AVG.served:AVG.betrayed);
    else key=prot?'served':'betrayed';
    endingText(DATA.ending[key]);
  }

  function endingText(para){
    document.documentElement.style.setProperty('--scrim','#04060c'); scrimEl.style.opacity='0.35';
    atmo.setMood('cool'); atmo.grade('reset'); A.setMood('cool'); A.heartbeat(false,0);
    textEl.classList.add('ending');
    var h='<div class="end"><p class="eyebrow">what you wrote</p>';
    h+='<p class="endline">'+para+'</p>';
    h+='<p class="endline last">'+DATA.ending.close+'</p>';
    h+='<p class="clead">The same five voices wrote it with you, blind.</p><div class="council">';
    ORDER.forEach(function(k){h+='<div class="cvoice"><p class="clabel">'+LABEL[k]+'</p><p class="cline">'+CLOSE[k]+'</p></div>';});
    h+='</div>';
    h+='<div class="navrow"><button class="walkon" id="again">draw again</button><a class="walkon link" href="./">&larr; the first chapter &middot; the trolley</a></div></div>';
    textEl.innerHTML=h; textEl.onclick=null;
    document.getElementById('again').onclick=function(){location.reload();};
    var els=textEl.querySelectorAll('.eyebrow,.endline,.clead,.cvoice,.navrow');
    els.forEach(function(l,k){l.style.transitionDelay=(0.4+k*0.6)+'s';requestAnimationFrame(function(){l.classList.add('show');});});
    ORDER.forEach(function(k,idx){timers.push(setTimeout(function(){A.voice(idx,{soft:true});},1700+idx*600));});
  }

  function begin(){
    if(started)return; started=true;
    A.init(); atmo.start();
    sceneEl.innerHTML=VEIL_SVG; sceneEl.className='in';
    var sc=qs('#sy-scene'); if(sc)sc.setAttribute('data-mood','cool');
    collectLayers(); atmo.setMood('cool'); atmo.light({visible:false}); atmo.grade('reset'); A.setMood('cool');
    beginEl.classList.add('gone');
    setTimeout(function(){beginEl.style.display='none';},900);
    requestAnimationFrame(loop);
    intro();
  }
  document.getElementById('beginBtn').onclick=begin;
  stage.addEventListener('pointerdown',function(){if(!started)return;A.init();});
  muteEl.onclick=function(){A.toggleMute();muteEl.textContent=A.muted?'\\u25c7':'\\u25c6';};
})();
`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Switchyard — the veil of ignorance</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--scrim:#0a0f18;--serif:Georgia,'Iowan Old Style','Apple Garamond','Times New Roman',serif}
html,body{height:100%;background:#000;overflow:hidden}
#stage{position:relative;width:100%;height:100svh;overflow:hidden;background:#04060c;font-family:var(--serif);cursor:default}
#scene{position:absolute;inset:0;z-index:0}
#scene svg{width:100%;height:100%;display:block}
#scene.in{animation:iris 1.6s cubic-bezier(.16,.84,.44,1) both}
@keyframes iris{from{opacity:0;transform:scale(1.06)}to{opacity:1;transform:scale(1)}}
/* the souls behind the veil */
.life{opacity:.16;transition:opacity 2s ease,filter 2s ease}
.life .aura{fill:#cfe0f8;opacity:calc(.12 * var(--bright,1));filter:blur(8px)}
.life .soulbody{fill:#dbe7fa;opacity:calc(.5 * var(--bright,1))}
.life .soulhead{fill:#eef4ff;opacity:calc(.7 * var(--bright,1))}
.life .soulrefl{fill:#9fb4d8;opacity:.18}
.life.lit{opacity:1;filter:drop-shadow(0 0 26px rgba(190,212,250,.55))}
.life.gone{opacity:.03}
.threshold path,.frame rect,.dais rect{fill:none;stroke:#5d6a86;stroke-width:2;opacity:.32}
.dais rect{fill:#0a0e18;stroke-opacity:.4}
.hands path{fill:none;stroke:#cdd9f0;stroke-width:3;stroke-linecap:round;opacity:.4}
#you .selfsoul .soulbody{fill:#05070e;opacity:.92}
#you .selfsoul .soulhead{fill:#0a0f1a;opacity:.95}
#you .selfsoul .aura{fill:#1a2336;opacity:.4;filter:blur(6px)}
#you .selfsoul .soulrefl{display:none}
#you #pen{stroke:#ffe1ac;stroke-width:2.4;stroke-linecap:round;opacity:.8;filter:drop-shadow(0 0 6px rgba(255,210,140,.7))}
#you.receded{opacity:.26;transition:opacity 2.4s ease}
#scrim{position:absolute;inset:0;z-index:2;background:linear-gradient(to bottom,transparent 14%,var(--scrim) 98%);transition:opacity .8s ease;pointer-events:none}
#grain{position:absolute;inset:0;z-index:4;opacity:.05;mix-blend-mode:overlay;pointer-events:none;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
#text{position:absolute;left:max(30px,4.5vw);bottom:max(36px,7.5vh);right:max(30px,4.5vw);max-width:42ch;color:#eef2f9;z-index:6}
.eyebrow{font:500 12px/1 var(--serif);letter-spacing:.36em;text-transform:uppercase;color:#cdd7e8;opacity:0;transition:opacity 1.1s ease;margin-bottom:20px}
.eyebrow.show{opacity:.78}
.line,.voice,.endline,.clead,.cvoice,.did,.born,.fate{opacity:0;transform:translateY(11px);transition:opacity 1.2s ease,transform 1.2s ease}
.line.show,.voice.show,.endline.show,.clead.show,.cvoice.show,.did.show,.born.show,.fate.show{opacity:1;transform:none}
.sit{font:400 clamp(20px,3vw,29px)/1.5 var(--serif);text-shadow:0 1px 16px rgba(0,0,0,.6);margin-bottom:14px}
.choices{display:flex;flex-direction:column;gap:15px;margin-top:34px}
.choice{align-self:flex-start;font:400 clamp(18px,2.5vw,25px)/1.35 var(--serif);color:#eef2f9;background:none;border:none;border-bottom:1px solid rgba(238,242,249,.2);padding:3px 1px 7px;cursor:pointer;text-align:left;transition:.45s;text-shadow:0 1px 14px rgba(0,0,0,.6)}
.choice:hover,.choice:focus-visible{border-bottom-color:#fff;letter-spacing:.012em;color:#fff;outline:none;transform:translateX(3px)}
.did{font:italic 400 clamp(19px,2.5vw,26px)/1.4 var(--serif);color:#fff;margin-bottom:20px;text-shadow:0 1px 14px rgba(0,0,0,.65)}
.born{font:400 clamp(22px,3.2vw,33px)/1.4 var(--serif);color:#fff;margin-bottom:16px;text-shadow:0 1px 18px rgba(0,0,0,.7)}
.fate{font:400 clamp(16px,2.1vw,21px)/1.6 var(--serif);color:#d3dcec;margin-bottom:26px;text-shadow:0 1px 12px rgba(0,0,0,.55)}
.voices{display:flex;flex-direction:column;gap:14px}
.voice{font:italic 400 clamp(15px,2vw,20px)/1.55 var(--serif);color:#b8c2d6;text-shadow:0 1px 12px rgba(0,0,0,.55);padding-left:15px;border-left:1px solid rgba(205,215,232,.22)}
.voice.linger{color:#dfe6f3;font-size:clamp(16px,2.15vw,21px);border-left-color:rgba(205,215,232,.5)}
.walkon{margin-top:30px;font:500 14px/1 var(--serif);letter-spacing:.2em;text-transform:uppercase;color:#cdd7e8;background:none;border:none;cursor:pointer;opacity:0;transition:opacity 1.5s ease;text-decoration:none;display:inline-block}
.walkon.show{opacity:.82}.walkon:hover{color:#fff}
.walkon.link{opacity:0;font-size:12px;letter-spacing:.16em;color:#8d99b2}
.navrow.show .walkon{opacity:.82}.navrow.show .walkon.link{opacity:.6}
#text.ending{position:absolute;inset:0;left:0;right:0;bottom:0;max-width:none;display:flex;align-items:center;justify-content:center;overflow-y:auto;padding:6vh max(26px,5vw)}
#text.ending::-webkit-scrollbar{width:0;height:0}
.end{max-width:54ch;width:100%;margin:auto;text-align:center;display:flex;flex-direction:column;align-items:center}
.end .eyebrow{margin-bottom:28px}
.endline{font:400 clamp(18px,2.5vw,25px)/1.62 var(--serif);color:#eef2f9;margin-bottom:20px;text-shadow:0 2px 18px rgba(0,0,0,.7);max-width:48ch}
.endline.last{color:#cdd7e8;font-style:italic;margin-top:8px}
.clead{font:italic 400 clamp(14px,1.9vw,17px)/1.6 var(--serif);color:#9aa6bd;margin:16px 0 6px}
.council{margin:14px 0 8px;border-top:1px solid rgba(205,215,232,.16);padding-top:24px;width:100%;max-width:46ch;display:grid;grid-template-columns:1fr 1fr;gap:16px 32px;text-align:left}
.council .cvoice:last-child{grid-column:1 / -1;justify-self:center;text-align:center;max-width:36ch}
.clabel{font:500 10.5px/1.2 var(--serif);letter-spacing:.22em;text-transform:uppercase;color:#aab6cd}
.cline{font:italic 400 clamp(13px,1.6vw,15px)/1.5 var(--serif);color:#8a96ad;margin-top:6px}
.navrow{margin-top:18px;display:flex;flex-direction:column;gap:10px;align-items:center}
#mute{position:absolute;right:18px;bottom:16px;z-index:8;font-size:15px;color:#cdd7e8;opacity:.32;background:none;border:none;cursor:pointer;transition:opacity .3s}
#mute:hover{opacity:.85}
#begin{position:absolute;inset:0;z-index:30;background:radial-gradient(120% 120% at 50% 38%,#16203a,#05070e);display:flex;align-items:center;justify-content:center;text-align:center;color:#eef2f9;font-family:var(--serif);transition:opacity .9s ease}
#begin.gone{opacity:0;pointer-events:none}
#begin .bi{animation:fadeup 1.8s ease both}
@keyframes fadeup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.b-kicker{font:500 12px/1 var(--serif);letter-spacing:.4em;text-transform:uppercase;color:#93a4c4;opacity:.7;margin-bottom:22px}
.b-title{font:400 clamp(32px,6.6vw,60px)/1.06 var(--serif);letter-spacing:.01em}
.b-sub{font:italic 400 15px/1.6 var(--serif);color:#9aa6bd;margin:18px 0 40px}
#beginBtn{font:500 15px/1 var(--serif);letter-spacing:.22em;text-transform:uppercase;color:#eef2f9;background:none;border:1px solid rgba(238,242,249,.4);border-radius:2px;padding:15px 38px;cursor:pointer;transition:.4s}
#beginBtn:hover{background:rgba(238,242,249,.08);border-color:#eef2f9;letter-spacing:.28em}
@media (max-width:560px){
  #text{left:max(18px,4vw);right:max(18px,4vw);bottom:max(22px,4vh);max-width:none}
  .eyebrow{font-size:11px;letter-spacing:.3em;margin-bottom:13px}
  .sit{font-size:clamp(16px,4.4vw,20px);line-height:1.42;margin-bottom:9px}
  .choices{gap:9px;margin-top:20px}
  .choice{font-size:clamp(15px,4.2vw,18px);padding:2px 1px 6px}
  .did{font-size:clamp(16px,4.4vw,20px);margin-bottom:14px}
  .born{font-size:clamp(19px,5.2vw,24px);margin-bottom:11px}
  .fate{font-size:clamp(14px,3.8vw,17px);line-height:1.5;margin-bottom:18px}
  .voices{gap:9px}
  .voice{font-size:clamp(13px,3.6vw,16px);line-height:1.45;padding-left:11px}
  .voice.linger{font-size:clamp(14px,3.9vw,17px)}
  .walkon{margin-top:20px;font-size:13px}
  #text.ending{padding:3vh 18px;align-items:flex-start}
  .endline{font-size:clamp(14px,4.1vw,19px);line-height:1.46;margin-bottom:12px}
  .council{grid-template-columns:1fr;gap:13px;padding-top:18px;margin:12px 0 4px}
  .council .cvoice:last-child{grid-column:auto;max-width:none}
  .b-title{font-size:clamp(28px,9.5vw,44px)}
  .b-sub{font-size:13px;margin:14px 0 30px}
}
@media (max-height:520px){.sit{font-size:clamp(14px,2.4vh,19px);margin-bottom:6px}.choices{margin-top:14px;gap:8px}.choice{font-size:clamp(14px,2.5vh,17px)}.eyebrow{margin-bottom:9px}}
@media(prefers-reduced-motion:reduce){*{animation-duration:.2s!important;transition-duration:.3s!important}}
</style></head><body>
<div id="stage">
  <div id="scene"></div>
  <div id="scrim"></div>
  <div id="grain"></div>
  <div id="text"></div>
  <button id="mute" aria-label="toggle sound">&#9670;</button>
  <div id="begin"><div class="bi"><p class="b-kicker">switchyard &middot; chapter two</p><h1 class="b-title">The Veil of Ignorance</h1><p class="b-sub">write the rules &middot; then live the life you draw &middot; sound on</p><button id="beginBtn">begin</button></div></div>
</div>
<script>${AUDIO}</script>
<script>${ATMOS}</script>
<script>${TRANS}</script>
<script>const VEIL_SVG=${JSON.stringify(VEIL_SVG)};</script>
<script>const DATA=${JSON.stringify(DATA)};</script>
<script>${APP}</script>
</body></html>`;

const p = join(out, "veil.html");
writeFileSync(p, html);
console.log(`wrote ${p} — the veil of ignorance, ${DATA.rounds.length} rounds (${Math.round(html.length / 1024)}kb)`);
