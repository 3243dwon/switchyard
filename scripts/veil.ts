/**
 * THE VEIL OF IGNORANCE — chapter two.
 *   node scripts/veil.ts   then open out/veil.html
 *
 * You write the rules of a society without knowing which life you will be handed,
 * then the veil lifts and you live under your own rules.
 *
 * The veil is real frosted glass — a backdrop-filter, the one place in the whole
 * project where Apple's material language means what it says. You cannot see who
 * you will be because the glass is frosted, not because the room is dark. When it
 * parts, the blur resolves to zero: the world does not get uncovered, it comes
 * into focus. That is a truer picture of the original position than a black
 * chamber, and it is the only honest reason to reach for the material.
 *
 * The four lives are drawn the same size except the weakest. What differs is the
 * ground under them — a threshold, a frame, a dais. The old build encoded the
 * fortunate as *brighter* (bright: 1.15 against 0.7), which says they are more of
 * a person, and that is the opposite of the chapter's argument.
 */

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { C, MOTION, icon, shell } from "./_design.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "out");
mkdirSync(out, { recursive: true });

const DATA = JSON.parse(readFileSync(join(root, "scripts", "_veil.json"), "utf8"));
const mod = (n: string) => readFileSync(join(root, "scripts", "_modules", n + ".js"), "utf8");
const AUDIO = mod("audio");
const TRANS = mod("transitions");

/* ---- the chamber ---------------------------------------------------------
   Same band and same glyph as chapter one, so the two chapters finally share a
   visual vocabulary instead of only sharing class names.                    */
const PERSON_H = 31;                       // the glyph's own height, in units
const person = (x: number, base: number, h: number, id?: string) => {
  const s = (h / PERSON_H).toFixed(3);
  return `<g${id ? ` id="life-${id}"` : ""} class="life"><g class="fig" transform="translate(${x},${base}) scale(${s})">` +
    `<circle cx="0" cy="-26" r="5"/>` +
    `<path d="M0,-21 C-5,-21 -6,-16 -6,-2 L6,-2 C6,-16 5,-21 0,-21 Z"/>` +
    `</g><line class="tick" x1="${x - 26}" y1="${base}" x2="${x + 26}" y2="${base}"/>` +
    `<g class="brk"><path d="M${x - 40} ${base - h - 16} H${x - 52} V${base + 12} H${x - 40}"/>` +
    `<path d="M${x + 40} ${base - h - 16} H${x + 52} V${base + 12} H${x + 40}"/></g></g>`;
};

const BASE_Y = 700;
const LIVES =
  // the weakest: the only one drawn smaller, and standing on nothing
  person(300, BASE_Y, 120, "weakest") +
  // a stranger: at a threshold, outside it
  `<path class="edge" d="M470 ${BASE_Y} V566 Q540 542 610 566 V${BASE_Y}"/>` +
  person(540, BASE_Y, 190, "stranger") +
  // an ordinary life: inside a plain frame
  `<rect class="edge" x="700" y="546" width="120" height="${BASE_Y - 546}"/>` +
  person(760, BASE_Y, 190, "average") +
  // the fortunate: the same person, thirty units higher off the ground
  `<rect class="edge" x="936" y="${BASE_Y - 16}" width="148" height="16"/>` +
  `<rect class="edge" x="952" y="${BASE_Y - 30}" width="116" height="14"/>` +
  person(1010, BASE_Y - 30, 190, "fortunate");

const CHAMBER = `<svg id="sy-scene" viewBox="0 400 1280 400" preserveAspectRatio="xMidYMid meet"
 xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<line class="horizon" x1="0" y1="${BASE_Y}" x2="1280" y2="${BASE_Y}"/>
<g id="sy-world">${LIVES}</g>
</svg>`;

const APP = `
(function(){
  var ORDER=['count','faith','tend','agree','virtue'];
  var LABEL={count:'The one who counts',faith:'The one who keeps faith',tend:'The one who tends the wound',agree:'The one who asks what we agreed',virtue:'The one who would be the person worth being'};
  var CLOSE={count:'It will always reckon in totals and averages. Let it; just never let the sum decide alone.',faith:'There are lines it holds for everyone, the strong and the unborn alike.',tend:'It never stops naming the one face the rule will help or abandon.',agree:'It keeps asking what you would allow if you did not know who you would be. You just answered with your eyes shut.',virtue:'It cares less what world you built than who the building made of you.'};
  var AVG={served:'You drew the wide middle. The floor you raised when you could not see your feet cost you a little from the top. You rise more slowly than you might have, and you will never watch the ground come up to meet you.',betrayed:'You drew the wide middle of a world built to lift its average high, and it carried you with it. Your ordinary days are richer than they had any right to be. You rarely think about the few they were built on.'};
  var PROT={equal:1,worstoff:1,desert:0,sum:0};

  var stage=document.getElementById('stage'),room=document.getElementById('room'),
      sceneEl=document.getElementById('scene'),textEl=document.getElementById('text'),
      beginEl=document.getElementById('begin'),soundEl=document.getElementById('sound'),
      ticksEl=document.getElementById('ticks'),stepEl=document.getElementById('stepn'),
      liveEl=document.getElementById('live'),veilEl=null;
  var A=createAudio(), T=createTransitions(stage);
  var ri=0, picks=[], started=false, timers=[], phase='', skip=null;

  function clearTimers(){timers.forEach(clearTimeout);timers=[];}
  function say(s){ if(liveEl) liveEl.textContent=s; }
  function qs(s){return sceneEl.querySelector(s);}

  function paintTicks(){
    var t=ticksEl.children;
    for(var k=0;k<t.length;k++){
      t[k].className = picks[k] ? (PROT[picks[k]]?'side':'means') : (k===ri&&phase!=='end'?'now':'');
    }
    stepEl.textContent=(Math.min(ri+1,DATA.rounds.length))+' / '+DATA.rounds.length;
  }

  function reveal_lines(){ T.revealLines(textEl,{selector:'.line',stagger:${MOTION.stagger},start:40}); }

  function intro(){
    clearTimers(); phase='intro';
    var h='<h2 class="title line">Before you are anyone</h2>';
    DATA.intro.forEach(function(l){h+='<p class="line sit">'+l+'</p>';});
    h+='<button class="advance" type="button" id="go">Take up the pen <span class="chev">${icon("chevron")}</span></button>';
    textEl.innerHTML=h; reveal_lines(); paintTicks();
    timers.push(setTimeout(function(){var g=document.getElementById('go');
      g.classList.add('show'); g.onclick=function(){A.whoosh();T.between(function(){round(0);});};},
      40+DATA.intro.length*${MOTION.stagger}+${MOTION.base}));
    say(DATA.intro.join(' '));
  }

  function round(n){
    clearTimers(); ri=n; phase='choose';
    var r=DATA.rounds[n];
    var h='<h2 class="title line">'+r.title+'</h2>';
    h+='<p class="line sit">'+r.question+'</p>';
    h+='<div class="line choices" id="choices"></div>';
    textEl.innerHTML=h; reveal_lines(); paintTicks();
    var cw=document.getElementById('choices');
    r.choices.forEach(function(c,idx){
      var b=document.createElement('button'); b.className='choice'; b.type='button';
      b.innerHTML='<span class="dot"></span><span class="lbl">'+c.label+'</span><span class="chev">${icon("chevron")}</span>';
      b.addEventListener('pointerenter',function(){A.choiceHover(true,false);});
      b.addEventListener('pointerleave',function(){A.choiceHover(false,false);});
      b.onclick=function(){choose(c);};
      cw.appendChild(b);
    });
    say(r.title+'. '+r.question);
  }

  function choose(c){
    clearTimers(); picks.push(c.lean); phase='voices';
    A.choiceHover(false,false); A.voice(0,{});
    paintTicks();
    var last=ri===DATA.rounds.length-1;
    var h='<p class="did show">'+c.label+'</p>';
    h+='<div class="voices" id="voices"></div>';
    h+='<button class="advance" type="button" id="next">'+(last?'Lift the veil':'Continue')+' <span class="chev">${icon("chevron")}</span></button>';
    textEl.innerHTML=h;
    var vbox=document.getElementById('voices'), t=${MOTION.base};
    ORDER.forEach(function(k,idx){
      var p=document.createElement('div'); p.className='voice';
      p.innerHTML='<span class="vn">'+LABEL[k]+'</span><span class="vl">'+c.voices[k]+'</span>';
      vbox.appendChild(p);
      timers.push(setTimeout(function(){p.classList.add('show');A.voice(idx,{});},t));
      t+=${MOTION.voice};
    });
    var go=function(){A.whoosh();T.between(function(){last?lift():round(ri+1);});};
    timers.push(setTimeout(function(){var nx=document.getElementById('next');
      nx.classList.add('show');nx.onclick=go;nx.focus({preventScroll:true});},t+120));
    skip=function(){clearTimers();
      Array.prototype.forEach.call(document.querySelectorAll('.voice'),function(p){p.classList.add('show');});
      var nx=document.getElementById('next'); if(nx){nx.classList.add('show');nx.onclick=go;}};
    room.onclick=function(e){if(e.target.closest&&e.target.closest('button'))return;skip();};
  }

  function dominantLean(){
    var t={}; picks.forEach(function(l){t[l]=(t[l]||0)+1;});
    var keys=['equal','worstoff','desert','sum'], best=picks[1]||picks[0], bn=-1;
    keys.forEach(function(k){if((t[k]||0)>bn){bn=t[k]||0;best=k;}});
    var leaders=keys.filter(function(k){return (t[k]||0)===bn;});
    return leaders.length>1 ? (picks[1]||best) : best;   // ties break to the floor you set
  }

  function lift(){
    clearTimers(); phase='reveal'; room.onclick=null; skip=null;
    var lean=dominantLean();
    var pos=DATA.positions[Math.floor(Math.random()*DATA.positions.length)];
    paintTicks();

    // the glass slides apart AND clarifies: it resolves, it is not removed
    var panes=veilEl?veilEl.querySelectorAll('.vpane'):[];
    A.whoosh();
    Array.prototype.forEach.call(panes,function(p,i){
      if(p.animate){
        p.animate([{transform:'translateX(0)'},{transform:'translateX('+(i?110:-110)+'%)'}],
          {duration:${MOTION.veil},easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'});
        p.animate([{backdropFilter:'blur(16px) saturate(140%)',opacity:1},
                   {backdropFilter:'blur(0px) saturate(100%)',opacity:0}],
          {duration:${MOTION.veil},easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'});
      } else { p.style.display='none'; }
    });
    DATA.positions.forEach(function(p){var el=qs('#life-'+p.id);
      if(el) el.classList.add(p.id===pos.id?'lit':'gone');});

    var rv=DATA.revealVoices[pos.id]||{};
    var h='<h2 class="title line">The veil lifts</h2>';
    h+='<p class="born">You are born — '+pos.label+'.</p>';
    h+='<p class="fate">'+DATA.fate[lean][pos.id]+'</p>';
    h+='<div class="voices" id="voices"></div>';
    h+='<button class="advance" type="button" id="see">See what you wrote <span class="chev">${icon("chevron")}</span></button>';
    textEl.innerHTML=h;
    textEl.querySelector('.title').classList.add('show');
    timers.push(setTimeout(function(){textEl.querySelector('.born').classList.add('show');A.voice(2,{means:true});},${MOTION.veil}));
    timers.push(setTimeout(function(){textEl.querySelector('.fate').classList.add('show');},${MOTION.veil}+${MOTION.base}));
    var vbox=document.getElementById('voices'), t=${MOTION.veil}+${MOTION.slow};
    ORDER.forEach(function(k,idx){
      if(!rv[k])return;
      var p=document.createElement('div'); p.className='voice linger';
      p.innerHTML='<span class="vn">'+LABEL[k]+'</span><span class="vl">'+rv[k]+'</span>';
      vbox.appendChild(p);
      timers.push(setTimeout(function(){p.classList.add('show');A.voice(idx,{means:true});},t));
      t+=${MOTION.voice};
    });
    timers.push(setTimeout(function(){var s=document.getElementById('see');
      s.classList.add('show');s.onclick=function(){A.whoosh();T.between(ending);};},t+120));
    say('The veil lifts. You are born — '+pos.label+'. '+DATA.fate[lean][pos.id]);
    window.__veil={lean:lean,pos:pos.id};
  }

  function ending(){
    clearTimers(); phase='end';
    var lean=window.__veil.lean, posId=window.__veil.pos, prot=PROT[lean], para;
    if(posId==='fortunate') para=DATA.ending[prot?'sacrifice':'windfall'];
    else if(posId==='average') para=prot?AVG.served:AVG.betrayed;
    else para=DATA.ending[prot?'served':'betrayed'];

    stage.classList.add('ended'); room.classList.add('ending');
    sceneEl.style.display='none';
    var h='<div class="end"><h2 class="title">What you wrote</h2>';
    h+='<p class="endline show">'+para+'</p>';
    h+='<p class="endline last show">'+DATA.ending.close+'</p>';
    h+='<p class="clead">The same five voices wrote it with you, blind.</p><div class="council">';
    ORDER.forEach(function(k){h+='<div class="cvoice"><div class="clabel">'+LABEL[k]+'</div><div class="cline">'+CLOSE[k]+'</div></div>';});
    h+='</div><div class="navrow"><button class="advance show" type="button" id="again">Start over</button>'+
       '<a class="advance quiet show" href="./">Chapter one: Inside the moment <span class="chev">${icon("chevron")}</span></a></div></div>';
    textEl.innerHTML=h;
    document.getElementById('again').onclick=function(){location.reload();};
    Array.prototype.forEach.call(textEl.querySelectorAll('.clead,.cvoice'),function(el){el.classList.add('show');});
    say('What you wrote. '+para);
    ORDER.forEach(function(k,idx){timers.push(setTimeout(function(){A.voice(idx,{ending:true});},240+idx*${MOTION.voice}));});
  }

  function begin(){
    if(started)return; started=true;
    A.init(); A.setMood('cool');
    sceneEl.innerHTML=VEIL_SVG+'<div id="veil"><div class="vpane"></div><div class="vpane"></div></div>';
    veilEl=document.getElementById('veil');
    sceneEl.classList.remove('in'); void sceneEl.offsetWidth; sceneEl.classList.add('in');
    beginEl.classList.add('gone');
    setTimeout(function(){beginEl.style.display='none';},420);
    intro();
  }

  document.getElementById('beginBtn').onclick=begin;
  soundEl.onclick=function(){A.toggleMute();
    soundEl.setAttribute('aria-pressed',A.muted?'false':'true');
    soundEl.querySelector('.slabel').textContent=A.muted?'Sound off':'Sound on';};

  document.addEventListener('keydown',function(e){
    if(e.metaKey||e.ctrlKey||e.altKey)return;
    var k=e.key;
    if(!started){ if(k==='Enter'||k===' '){e.preventDefault();begin();} return; }
    if(k==='m'||k==='M'){e.preventDefault();soundEl.click();return;}
    if(phase==='choose'){
      var cs=document.querySelectorAll('.choice');
      var n=parseInt(k,10);
      if(n>=1&&n<=cs.length){e.preventDefault();cs[n-1].click();}
    } else if(phase==='voices'){
      if(k==='Escape'){e.preventDefault();if(skip)skip();}
      else if(k==='ArrowRight'){var nx=document.getElementById('next');
        if(nx&&nx.classList.contains('show')){e.preventDefault();nx.click();}}
    }
  });

  (function(){var s='';for(var k=0;k<DATA.rounds.length;k++)s+='<i></i>';ticksEl.innerHTML=s;paintTicks();})();
  requestAnimationFrame(function(){document.querySelector('.bi').classList.add('in');});
})();
`;

const BODY = `
<div id="stage">
  <div class="rail top">
    <span class="wordmark">Switchyard</span>
    <button id="sound" type="button" aria-pressed="true" aria-label="Toggle sound">
      <span class="on">${icon("speakerOn")}</span><span class="off">${icon("speakerOff")}</span>
      <span class="slabel">Sound on</span>
    </button>
  </div>

  <div id="room">
    <div id="scene"></div>
    <div id="text"></div>
  </div>

  <div class="rail bot">
    <div id="progress" role="group" aria-label="Progress through three rules">
      <span class="n" id="stepn">1 / 3</span>
      <span class="ticks" id="ticks"></span>
    </div>
    <span></span>
  </div>

  <p class="vh" id="live" aria-live="polite" role="status"></p>

  <div id="begin">
    <div class="bi">
      <h1 class="b-title">The veil of ignorance</h1>
      <p class="b-sub">Write the rules of a society. Then find out which life you drew.</p>
      <button class="advance show" type="button" id="beginBtn">Begin</button>
      <p class="b-meta">Three rules · about five minutes · sound recommended</p>
    </div>
  </div>
</div>`;

/* The chamber, the glass, and the two states a life can be in. */
const PAGE_CSS = `
#scene{position:relative}
#sy-scene .horizon{stroke:${C.rule};stroke-width:1;vector-effect:non-scaling-stroke}
#sy-scene .edge{fill:none;stroke:${C.ink3};stroke-width:1.5;vector-effect:non-scaling-stroke}
#sy-scene .tick{stroke:${C.rule};stroke-width:1;vector-effect:non-scaling-stroke}
#sy-scene .fig{fill:${C.ink};stroke:none;transition:fill var(--d-2) var(--e-out)}

/* the bracket only closes around the life you actually drew */
#sy-scene .brk{fill:none;stroke:${C.signal};stroke-width:1.5;
  vector-effect:non-scaling-stroke;opacity:0;transition:opacity var(--d-3) var(--e-out)}
#sy-scene .life.lit .brk{opacity:1}

/* the same grammar chapter one uses for a struck party: present, empty */
#sy-scene .life.gone .fig{fill:none;stroke:${C.ink4};stroke-width:1}

/* the veil: real frosted glass, and the only backdrop-filter in the project */
#veil{position:absolute;inset:0;display:flex;pointer-events:none;overflow:hidden}
.vpane{flex:1;background:rgba(251,251,253,.55);
  -webkit-backdrop-filter:blur(16px) saturate(140%);backdrop-filter:blur(16px) saturate(140%)}
.vpane:first-child{border-right:1px solid rgba(255,255,255,.85)}
@supports not (backdrop-filter:blur(1px)){.vpane{background:rgba(251,251,253,.93)}}

.born{font:400 var(--t-lead)/1.3 var(--serif);letter-spacing:var(--tr-lead);
  color:var(--ink);margin-bottom:var(--s2)}
.fate{font:400 var(--t-body)/1.55 var(--serif);letter-spacing:var(--tr-body);
  color:var(--ink-2);margin-bottom:var(--s5)}
`;

const html = shell({
  title: "Switchyard — the veil of ignorance",
  description: "Write the rules of a society without knowing which life you will be handed.",
  css: PAGE_CSS,
  body: BODY,
  scripts: [
    `const C=${JSON.stringify(C)};`,
    AUDIO,
    TRANS,
    `const VEIL_SVG=${JSON.stringify(CHAMBER)};`,
    `const DATA=${JSON.stringify(DATA)};`,
    APP,
  ],
});

const p = join(out, "veil.html");
writeFileSync(p, html);
console.log(`wrote ${p} — ${DATA.rounds.length} rounds (${Math.round(html.length / 1024)}kb)`);
