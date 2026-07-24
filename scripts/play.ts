/**
 * INSIDE THE MOMENT — chapter one.
 *   node scripts/play.ts   then open out/play.html
 *
 * Six dilemmas on one white sheet. The drawing carries the geometry, the prose
 * carries the weight, and the progress rail carries the record: by the sixth
 * moment it is a permanent account of how many times your hands turned a person
 * into the thing that stopped it.
 */

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { C, MOTION, icon, shell } from "./_design.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "out");
mkdirSync(out, { recursive: true });

const prose = JSON.parse(readFileSync(join(root, "scripts", "_prose.json"), "utf8")) as any[];
const mod = (n: string) => readFileSync(join(root, "scripts", "_modules", n + ".js"), "utf8");
const AUDIO = mod("audio");
const TRANS = mod("transitions");
const SCENE = mod("scene");

const COUNTS: Record<string, { many: number; few: number }> = {
  switch: { many: 5, few: 1 },
  footbridge: { many: 5, few: 1 },
  loop: { many: 5, few: 1 },
  beloved: { many: 5, few: 1 },
  ward: { many: 5, few: 1 },
  passenger: { many: 3, few: 1 },
};

/* The roman-numeral eyebrows ("I · THE SWITCH", uppercase at .36em tracking)
   were doing two jobs badly. The numeral moves into the progress rail, where it
   belongs; what is left is a real title, sentence case, set in New York. */
const TITLES: Record<string, string> = {
  switch: "The switch",
  footbridge: "The footbridge",
  loop: "The loop",
  beloved: "The one you love",
  ward: "The ward",
  passenger: "The passenger",
};

const DATA = prose.map((d) => ({
  id: d.id,
  title: TITLES[d.id] || d.id,
  kind: d.kind,
  mood: d.mood,
  counts: COUNTS[d.id] || { many: 5, few: 1 },
  situationLines: d.situationLines,
  stakes: d.stakes,
  choices: d.choices.map((c: any, i: number) => ({
    id: c.id,
    label: c.label,
    consequence: c.consequence,
    lingers: c.lingers,
    diesMany: i === 0,
    voices: c.voices,
  })),
}));

const APP = `
(function(){
  var ORDER=['count','faith','tend','agree','virtue'];
  var LABEL={count:'The one who counts',faith:'The one who keeps faith',tend:'The one who tends the wound',agree:'The one who asks what we agreed',virtue:'The one who would be the person worth being'};
  var CLOSE={count:'It will always begin with the number. Let it; just never let it finish alone.',faith:'There are lines it will not cross for any sum. You felt what holding them costs.',tend:'It never forgot a face, and it will not let you forget one either.',agree:'It keeps asking what we would allow if we did not know who we would be.',virtue:'It cares less what you did than who the doing made of you.'};

  var stage=document.getElementById('stage'),room=document.getElementById('room'),
      sceneEl=document.getElementById('scene'),textEl=document.getElementById('text'),
      beginEl=document.getElementById('begin'),soundEl=document.getElementById('sound'),
      ticksEl=document.getElementById('ticks'),stepEl=document.getElementById('stepn'),
      liveEl=document.getElementById('live');
  var A=createAudio(), T=createTransitions(stage);
  var i=0, log=[], started=false, timers=[], troAnim=null, trailAnim=null, phase='';
  var OFFSET_OK=(function(){try{return !!(window.CSS&&CSS.supports&&(CSS.supports('offset-path','path("M0 0 L1 1")')||CSS.supports('motion-path','path("M0 0 L1 1")')));}catch(e){return false;}})();

  function clearTimers(){timers.forEach(clearTimeout);timers=[];}
  function say(s){ if(liveEl) liveEl.textContent=s; }

  /* ---- the record. A tick is drawn in signal-ink when that choice used a
     person as a means; by the sixth the rail is what you did, not where you are. */
  function paintTicks(){
    var t=ticksEl.children;
    for(var k=0;k<t.length;k++){
      t[k].className='';
      if(log[k]) t[k].className = log[k].means ? 'means' : 'side';
      else if(k===i && phase!=='end') t[k].className='now';
    }
    stepEl.textContent=(Math.min(i+1,DATA.length))+' / '+DATA.length;
  }

  /* ---- the trolley, and the line it has already covered ---------------- */
  function drive(el, d, dur, easing, fromScale, toScale){
    if(!(el && OFFSET_OK && el.animate)) return null;
    el.style.offsetRotate='0deg';
    el.style.offsetPath="path('"+d+"')";
    return el.animate(
      [{offsetDistance:'0%',transform:'scale('+fromScale+')'},
       {offsetDistance:'100%',transform:'scale('+toScale+')'}],
      {duration:dur,easing:easing,fill:'forwards'});
  }
  function drawTrail(el, dur, easing){
    if(!(el && el.animate)) return null;
    return el.animate([{strokeDashoffset:1},{strokeDashoffset:0}],
      {duration:dur,easing:easing,fill:'forwards'});
  }
  function stopAnims(){
    [troAnim,trailAnim].forEach(function(a){if(a){try{a.cancel();}catch(e){}}});
    troAnim=trailAnim=null;
  }

  function arrive(){
    clearTimers(); stopAnims(); phase='choose';
    var d=DATA[i];
    sceneEl.innerHTML=buildScene(d.id,d.mood,d.counts);
    // the entrance only ever played once before: the class was already 'in', so
    // scenes two through six silently had no entrance at all.
    sceneEl.classList.remove('in'); void sceneEl.offsetWidth; sceneEl.classList.add('in');
    var sc=sceneEl.querySelector('#sy-scene'); if(sc) sc.setAttribute('data-mood',d.mood);
    A.setMood(d.mood);
    paintTicks();

    var tro=sceneEl.querySelector('#sy-trolley'), tr=sceneEl.querySelector('#sy-trail');
    if(sc){
      var ap=sc.getAttribute('data-approach'), ts=(sc.getAttribute('data-tscale')||'0.34 1').split(' ');
      if(ap){
        troAnim=drive(tro,ap,${MOTION.approach},'cubic-bezier(.32,.06,.62,1)',ts[0],ts[1]);
        trailAnim=drawTrail(tr,${MOTION.approach},'cubic-bezier(.32,.06,.62,1)');
        if(!troAnim&&tro){ // no Motion Path: place it at the junction and move on
          var m=(sc.getAttribute('data-stay')||'M640 600').match(/M\\s*([\\d.]+)[ ,]+([\\d.]+)/);
          tro.setAttribute('transform','translate('+(m?m[1]:640)+' '+(m?m[2]:600)+') scale('+(ts[1]||1)+')');
        }
      }
    }

    var h='<h2 class="title line">'+d.title+'</h2>';
    d.situationLines.forEach(function(l){h+='<p class="line sit">'+l+'</p>';});
    h+='<p class="line stakes">'+d.stakes+'</p>';
    h+='<div class="line choices" id="choices"></div>';
    textEl.innerHTML=h;
    T.revealLines(textEl,{selector:'.line',stagger:${MOTION.stagger},start:40});

    var cw=document.getElementById('choices');
    d.choices.forEach(function(c,n){
      var b=document.createElement('button');
      b.className='choice'; b.type='button';
      b.innerHTML='<span class="dot"></span><span class="lbl">'+c.label+'</span><span class="chev">${icon("chevron")}</span>';
      b.addEventListener('pointerenter',function(){A.choiceHover(true,c.lingers);});
      b.addEventListener('pointerleave',function(){A.choiceHover(false,c.lingers);});
      b.addEventListener('focus',function(){A.choiceHover(true,c.lingers);});
      b.addEventListener('blur',function(){A.choiceHover(false,c.lingers);});
      b.onclick=function(){choose(c);};
      cw.appendChild(b);
    });
    say(d.title+'. '+d.situationLines.join(' ')+' '+d.stakes);
  }

  function choose(c){
    clearTimers(); stopAnims(); phase='voices';
    // "lingers" is emotional weight, not doctrine: beloved and passenger both
    // linger while remaining side-effect deaths. The rail records the doctrine —
    // you acted, and the act needed the body — so it is derived, never stored.
    log.push({id:DATA[i].id,kind:DATA[i].kind,diesMany:c.diesMany,lingers:c.lingers,
              means:DATA[i].kind==='means'&&!c.diesMany});
    A.choiceHover(false,c.lingers);
    paintTicks();

    var sc=sceneEl.querySelector('#sy-scene'),
        tro=sceneEl.querySelector('#sy-trolley'),
        tr=sceneEl.querySelector('#sy-trail');
    var travel=${MOTION.travel};
    if(sc){
      var ts=(sc.getAttribute('data-tscale')||'0.34 1').split(' '), near=parseFloat(ts[1])||1;
      var outp=c.diesMany?sc.getAttribute('data-stay'):sc.getAttribute('data-act');
      if(outp){
        // the divert accelerates and does not decelerate into the strike
        troAnim=drive(tro,outp,travel,'cubic-bezier(.5,0,.9,1)',near,near);
        if(tr){ tr.setAttribute('d',outp); tr.style.strokeDashoffset='1';
                trailAnim=drawTrail(tr,travel,'cubic-bezier(.5,0,.9,1)'); }
        if(!troAnim) travel=120;
      } else travel=120;
    } else travel=120;

    var h='<p class="did show">You '+c.label+'.</p>';
    h+='<p class="consequence" id="cons">'+c.consequence+'</p>';
    h+='<div class="voices" id="voices"></div>';
    h+='<button class="advance" type="button" id="next">Continue <span class="chev">${icon("chevron")}</span></button>';
    textEl.innerHTML=h;

    var landed=false;
    function land(){
      if(landed)return; landed=true;
      A.impact(c.lingers); T.flashImpact();
      if(sc)sc.classList.add(c.diesMany?'dead-many':'dead-few');
      var cons=document.getElementById('cons'); if(cons)cons.classList.add('show');
      say(c.consequence);
      var vbox=document.getElementById('voices'), t=${MOTION.base};
      ORDER.forEach(function(k,idx){
        var heavy=c.lingers&&(k==='faith'||k==='tend');
        var p=document.createElement('div');
        p.className='voice'+(heavy?' linger':'');
        p.innerHTML='<span class="vn">'+LABEL[k]+'</span><span class="vl">'+c.voices[k]+'</span>';
        vbox.appendChild(p);
        timers.push(setTimeout(function(){p.classList.add('show');A.voice(idx,{means:heavy});},t));
        t+=${MOTION.voice};
      });
      timers.push(setTimeout(function(){
        var w=document.getElementById('next');
        w.classList.add('show'); w.onclick=advance; w.focus({preventScroll:true});
      },t+120));
    }
    timers.push(setTimeout(land,travel));
    // Impatience, for the keyboard as well as the mouse, and in one press.
    // This used to be two-stage — land, then dump the voices — which made sense
    // when the five arrived 1120ms apart. They now arrive 180ms apart, so the
    // second press was asking the reader to say "yes, really" for no reason.
    skip=function(){
      if(troAnim){try{troAnim.finish();}catch(e){}}
      if(trailAnim){try{trailAnim.finish();}catch(e){}}
      land();
      clearTimers();
      Array.prototype.forEach.call(document.querySelectorAll('.voice'),function(p){p.classList.add('show');});
      var w=document.getElementById('next');
      if(w){w.classList.add('show');w.onclick=advance;w.focus({preventScroll:true});}
    };
    room.onclick=function(e){ if(e.target.closest&&e.target.closest('button'))return; skip(); };
  }
  var skip=null;

  function advance(){
    room.onclick=null; skip=null; A.whoosh();
    T.between(function(){ i++; if(i<DATA.length) arrive(); else ending(); });
  }

  function ending(){
    clearTimers(); stopAnims(); phase='end';
    stage.classList.add('ended'); room.classList.add('ending');
    sceneEl.style.display='none';
    A.setMood('warm');

    var acted=log.filter(function(e){return !e.diesMany;}).length, stayed=log.length-acted;
    var means=log.filter(function(e){return e.means;}).length;
    var sw=log.find(function(e){return e.id==='switch';}), fb=log.find(function(e){return e.id==='footbridge';}), bel=log.find(function(e){return e.id==='beloved';});
    var P=[acted+' times you moved to turn it, and '+stayed+' times you let it run.'];
    if(means===0)P.push('Not once would you make a person into the thing that stops it.');
    else if(means===1)P.push('Once — only once — you used a person as the brake, and you remember the once.');
    else P.push(means+' times the act asked you to use a person as a means, and your hands answered.');
    if(sw&&fb){
      if(!sw.diesMany&&fb.diesMany)P.push('The same five-for-one felt different the moment it asked for your hands. That flinch has a name, and the voices have never agreed whether to trust it.');
      else if(!sw.diesMany&&!fb.diesMany)P.push('Five-for-one was five-for-one to you, whether you threw a lever or used your hands. The arithmetic did not blink.');
      else if(sw.diesMany&&fb.diesMany)P.push('You would not spend the one — not at the switch, not on the bridge. You let the larger number fall rather than choose a single body.');
    }
    if(bel)P.push(!bel.diesMany?'And once the one was a face you love. You sent the wheels its way, and you will live the rest of yours beside that knowing.':'And once the one was a face you love. You let five strangers go rather than that single hand.');

    var h='<div class="end"><h2 class="title">After</h2>';
    P.forEach(function(s){h+='<p class="endline">'+s+'</p>';});
    h+='<p class="clead">Five voices walked it with you. They are quieter now, but none of them has left.</p>';
    h+='<div class="council">';
    ORDER.forEach(function(k){h+='<div class="cvoice"><div class="clabel">'+LABEL[k]+'</div><div class="cline">'+CLOSE[k]+'</div></div>';});
    h+='</div><p class="endline last">None of them is wrong. They never stopped arguing. Neither, now, will you.</p>';
    h+='<div class="navrow"><button class="advance show" type="button" id="again">Start over</button>'+
       '<a class="advance quiet show" href="veil.html">Chapter two: The veil of ignorance <span class="chev">${icon("chevron")}</span></a></div></div>';
    textEl.innerHTML=h; textEl.classList.add('show');
    document.getElementById('again').onclick=function(){location.reload();};
    Array.prototype.forEach.call(textEl.querySelectorAll('.endline,.clead,.cvoice'),function(el){el.classList.add('show');});
    say('After. '+P.join(' '));
    ORDER.forEach(function(k,idx){timers.push(setTimeout(function(){A.voice(idx,{ending:true});},240+idx*${MOTION.voice}));});
  }

  function begin(){
    if(started)return; started=true;
    A.init();
    beginEl.classList.add('gone');
    setTimeout(function(){beginEl.style.display='none';},420);
    arrive();
  }

  document.getElementById('beginBtn').onclick=begin;
  soundEl.onclick=function(){
    A.toggleMute();
    soundEl.setAttribute('aria-pressed', A.muted?'false':'true');
    soundEl.querySelector('.slabel').textContent = A.muted?'Sound off':'Sound on';
  };

  /* ---- keyboard. The skip path used to be a click handler on a div, which
     meant it did not exist for anyone using a keyboard. ------------------- */
  document.addEventListener('keydown',function(e){
    if(e.metaKey||e.ctrlKey||e.altKey)return;
    var k=e.key;
    if(!started){ if(k==='Enter'||k===' '){e.preventDefault();begin();} return; }
    if(k==='m'||k==='M'){ e.preventDefault(); soundEl.click(); return; }
    if(phase==='choose'){
      var cs=document.querySelectorAll('.choice');
      if(k==='1'&&cs[0]){e.preventDefault();cs[0].click();}
      else if(k==='2'&&cs[1]){e.preventDefault();cs[1].click();}
    } else if(phase==='voices'){
      if(k==='Escape'){ e.preventDefault(); if(skip)skip(); }
      else if(k==='ArrowRight'){ var n=document.getElementById('next');
        if(n&&n.classList.contains('show')){e.preventDefault();advance();} }
    }
  });

  // paint the rail before the gate lifts, so the shape of the thing is visible
  (function(){ var s=''; for(var k=0;k<DATA.length;k++) s+='<i></i>'; ticksEl.innerHTML=s; paintTicks(); })();
  requestAnimationFrame(function(){ document.querySelector('.bi').classList.add('in'); });
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
    <div id="progress" role="group" aria-label="Progress through six moments">
      <span class="n" id="stepn">1 / 6</span>
      <span class="ticks" id="ticks"></span>
    </div>
    <span></span>
  </div>

  <p class="vh" id="live" aria-live="polite" role="status"></p>

  <div id="begin">
    <div class="bi">
      <h1 class="b-title">Inside the moment</h1>
      <p class="b-sub">Six moments. In each one something is already moving, and you have a few seconds.</p>
      <button class="advance show" type="button" id="beginBtn">Begin</button>
      <p class="b-meta">Six moments · about eight minutes · sound recommended</p>
    </div>
  </div>
</div>`;

const PAGE_CSS = `
.choice .lbl{display:block}
`;

const html = shell({
  title: "Switchyard — inside the moment",
  description: "Six moral dilemmas, drawn. No right answers.",
  css: PAGE_CSS,
  body: BODY,
  scripts: [
    `const C=${JSON.stringify(C)};`,
    AUDIO,
    TRANS,
    SCENE,
    `const DATA=${JSON.stringify(DATA)};`,
    APP,
  ],
});

const p = join(out, "play.html");
writeFileSync(p, html);
console.log(`wrote ${p} — ${DATA.length} dilemmas (${Math.round(html.length / 1024)}kb)`);
