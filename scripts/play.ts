/**
 * INSIDE THE MOMENT — crazy-immersive build.
 * Orchestrates four synthesized subsystems (audio / atmosphere / transitions /
 * scene-art) around the no-right-wrong second-person experience.
 *   node scripts/play.ts   then open out/play.html
 */

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "out");
mkdirSync(out, { recursive: true });

const prose = JSON.parse(readFileSync(join(root, "scripts", "_prose.json"), "utf8")) as any[];
const mod = (n: string) => readFileSync(join(root, "scripts", "_modules", n + ".js"), "utf8");
const AUDIO = mod("audio");
const ATMOS = mod("atmosphere");
const TRANS = mod("transitions");
const SCENE = mod("scene");

const COUNTS: Record<string, { many: number; few: number; bridge?: boolean }> = {
  switch: { many: 5, few: 1 },
  footbridge: { many: 5, few: 1, bridge: true },
  loop: { many: 5, few: 1 },
  beloved: { many: 5, few: 1 },
  ward: { many: 5, few: 1 },
  passenger: { many: 3, few: 1 },
};

const DATA = prose.map((d) => ({
  id: d.id,
  eyebrow: d.eyebrow,
  kind: d.kind,
  mood: d.mood,
  scrim: d.mood === "warm" ? "#1a1024" : "#0c121b",
  counts: COUNTS[d.id] || { many: 5, few: 1 },
  situationLines: d.situationLines,
  stakes: d.stakes,
  choices: d.choices.map((c: any, i: number) => ({
    id: c.id, label: c.label, consequence: c.consequence,
    lingers: c.lingers, diesMany: i === 0, voices: c.voices,
  })),
}));

const APP = `
(function(){
  var ORDER=['count','faith','tend','agree','virtue'];
  var LABEL={count:'the one who counts',faith:'the one who keeps faith',tend:'the one who tends the wound',agree:'the one who asks what we agreed',virtue:'the one who would be the person worth being'};
  var CLOSE={count:'It will always begin with the number. Let it; just never let it finish alone.',faith:'There are lines it will not cross for any sum. You felt what holding them costs.',tend:'It never forgot a face, and it will not let you forget one either.',agree:'It keeps asking what we would allow if we did not know who we would be.',virtue:'It cares less what you did than who the doing made of you.'};
  var stage=document.getElementById('stage'),sceneEl=document.getElementById('scene'),scrimEl=document.getElementById('scrim'),textEl=document.getElementById('text'),beginEl=document.getElementById('begin'),muteEl=document.getElementById('mute');
  var A=createAudio(), atmo=createAtmosphere(stage), T=createTransitions(stage);
  var i=0, log=[], started=false, layers=[], hbTimer=0, voiceTimers=[], troAnim=null;
  var mx=0,my=0,tx=0,ty=0;
  var OFFSET_OK=(function(){try{return !!(window.CSS&&CSS.supports&&(CSS.supports('offset-path','path(\"M0 0 L1 1\")')||CSS.supports('motion-path','path(\"M0 0 L1 1\")')));}catch(e){return false;}})();

  function loop(){
    mx+=(tx-mx)*0.06; my+=(ty-my)*0.06;
    for(var k=0;k<layers.length;k++){var L=layers[k];L.el.setAttribute('transform',L.base+' translate('+(mx*L.d*150).toFixed(1)+','+(my*L.d*95).toFixed(1)+')');}
    requestAnimationFrame(loop);
  }

  stage.addEventListener('pointermove',function(e){var r=stage.getBoundingClientRect();tx=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1));ty=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));if(started)atmo.onMouse(tx,ty);});

  function clearTimers(){voiceTimers.forEach(clearTimeout);voiceTimers=[];if(hbTimer)clearTimeout(hbTimer);}

  function collectLayers(){
    layers=[];
    var gs=sceneEl.querySelectorAll('#sy-world [data-depth]');
    for(var k=0;k<gs.length;k++){var g=gs[k];if(g.id==='sy-trolley'||g.id==='sy-haz')continue;layers.push({el:g,d:parseFloat(g.getAttribute('data-depth'))||0,base:g.getAttribute('transform')||''});}
  }

  function arrive(){
    clearTimers();
    var d=DATA[i];
    document.documentElement.style.setProperty('--scrim',d.scrim);
    scrimEl.style.opacity='';
    sceneEl.innerHTML=buildScene(d.id,d.mood,d.counts);
    sceneEl.className='in';
    var sc=sceneEl.querySelector('#sy-scene'); if(sc) sc.setAttribute('data-mood',d.mood);
    collectLayers();
    atmo.setMood(d.mood); atmo.light({visible:false}); atmo.grade('reset');
    A.setMood(d.mood); A.heartbeat(false,0);
    // the trolley descends from the far distance toward the junction while you decide
    if(troAnim){try{troAnim.cancel();}catch(e){}troAnim=null;}
    var tro=sceneEl.querySelector('#sy-trolley');
    if(tro&&sc){
      var ap=sc.getAttribute('data-approach'), tsc=(sc.getAttribute('data-tscale')||'0.4 1').split(' ');
      if(OFFSET_OK&&ap&&tro.animate){
        tro.style.offsetRotate='0deg'; tro.style.offsetPath="path('"+ap+"')";
        troAnim=tro.animate([{offsetDistance:'0%',transform:'scale('+tsc[0]+')'},{offsetDistance:'100%',transform:'scale('+tsc[1]+')'}],{duration:4200,easing:'cubic-bezier(.22,.6,.24,1)',fill:'forwards'});
      } else {
        var jm=(sc.getAttribute('data-stay')||'M640 600').match(/M\\s*([\\d.]+)[ ,]+([\\d.]+)/);
        tro.setAttribute('transform','translate('+(jm?jm[1]:640)+' '+(jm?jm[2]:600)+') scale('+(tsc[1]||1)+')');
      }
    }
    var h='<p class="eyebrow">'+d.eyebrow+'</p>';
    d.situationLines.forEach(function(l){h+='<p class="line sit">'+l+'</p>';});
    h+='<p class="line stakes">'+d.stakes+'</p>';
    h+='<div class="line choices" id="choices"></div>';
    textEl.innerHTML=h; textEl.onclick=null;
    textEl.querySelector('.eyebrow').classList.add('show');
    if(T.revealLines) T.revealLines(textEl,{selector:'.line',stagger:550,start:150});
    else textEl.querySelectorAll('.line').forEach(function(l,k){l.style.transitionDelay=(k*0.55)+'s';requestAnimationFrame(function(){l.classList.add('show');});});
    var cw=document.getElementById('choices');
    d.choices.forEach(function(c){
      var b=document.createElement('button'); b.className='choice'; b.textContent=c.label;
      b.addEventListener('pointerenter',function(){A.choiceHover(true,c.lingers);A.heartbeat(true,1);atmo.light({visible:true,radius:0.42});scrimEl.style.opacity='0.5';});
      b.addEventListener('pointerleave',function(){A.choiceHover(false,c.lingers);A.heartbeat(true,0);atmo.light({visible:false});scrimEl.style.opacity='';});
      b.addEventListener('focus',function(){A.choiceHover(true,c.lingers);});
      b.addEventListener('blur',function(){A.choiceHover(false,c.lingers);});
      b.onclick=function(){choose(c);};
      cw.appendChild(b);
    });
    var nLines=d.situationLines.length+2;
    hbTimer=setTimeout(function(){A.heartbeat(true,0);},150+nLines*550+300);
    phase='choose';
  }

  function choose(c){
    clearTimers();
    log.push({id:DATA[i].id,kind:DATA[i].kind,diesMany:c.diesMany,lingers:c.lingers});
    A.choiceHover(false,c.lingers); A.heartbeat(false,0); atmo.light({visible:false});
    scrimEl.style.opacity='0.62';
    var sc=sceneEl.querySelector('#sy-scene'), tro=sceneEl.querySelector('#sy-trolley');
    // the trolley now takes the track your choice set — straight on, or onto the spur
    var travel=1650;
    if(troAnim){try{troAnim.cancel();}catch(e){}troAnim=null;}
    if(tro&&sc&&OFFSET_OK&&tro.animate){
      var ts=(sc.getAttribute('data-tscale')||'0.4 1').split(' '), near=parseFloat(ts[1])||1;
      var outp=c.diesMany?sc.getAttribute('data-stay'):sc.getAttribute('data-act');
      if(outp){ tro.style.offsetRotate='0deg'; tro.style.offsetPath="path('"+outp+"')";
        troAnim=tro.animate([{offsetDistance:'0%',transform:'scale('+near+')'},{offsetDistance:'100%',transform:'scale('+(near*1.06).toFixed(3)+')'}],{duration:travel,easing:'cubic-bezier(.4,0,.78,1)',fill:'forwards'}); }
      else travel=350;
    } else travel=350;
    var h='<p class="eyebrow show">'+DATA[i].eyebrow+'</p>';
    h+='<p class="line did show">You '+c.label+'.</p>';
    h+='<p class="line consequence" id="cons">'+c.consequence+'</p>';
    h+='<div class="voices" id="voices"></div>';
    h+='<button class="walkon" id="walkon">walk on &rarr;</button>';
    textEl.innerHTML=h;
    var arrived=false;
    function arrival(){
      if(arrived)return; arrived=true;
      A.impact(c.lingers); if(T.flashImpact)T.flashImpact({mood:DATA[i].mood});
      atmo.burst(); atmo.grade(c.lingers?'means':(DATA[i].id==='beloved'?'beloved':'side_effect'));
      atmo.killSide(c.diesMany?'many':'few');
      if(sc)sc.classList.add(c.diesMany?'dead-many':'dead-few');
      var cons=document.getElementById('cons'); if(cons)cons.classList.add('show');
      var vbox=document.getElementById('voices'), t=650;
      ORDER.forEach(function(k,idx){
        var heavy=c.lingers&&(k==='faith'||k==='tend');
        var p=document.createElement('p'); p.className='voice'+(heavy?' linger':''); p.textContent=c.voices[k]; vbox.appendChild(p);
        voiceTimers.push(setTimeout(function(){p.classList.add('show');A.voice(idx,{lingers:heavy});},t));
        t+= heavy?1650:1120;
      });
      voiceTimers.push(setTimeout(function(){var w=document.getElementById('walkon');w.classList.add('show');w.onclick=advance;},t+250));
    }
    voiceTimers.push(setTimeout(arrival,travel));
    textEl.onclick=function(e){ if(e.target&&e.target.id==='walkon')return;
      if(!arrived){ if(troAnim){try{troAnim.finish();}catch(_){}} arrival(); return; }
      clearTimers(); document.querySelectorAll('.voice').forEach(function(p){p.classList.add('show');});
      var w=document.getElementById('walkon'); if(w){w.classList.add('show');w.onclick=advance;} };
    phase='voices';
  }

  function advance(){
    textEl.onclick=null; A.whoosh();
    var go=function(){i++; if(i<DATA.length) arrive(); else ending();};
    if(T.between) T.between(go); else go();
  }

  function endBackdrop(){
    // a quiet residual-dusk gradient + slow drawn starfield (offline, no assets)
    var R=function(s){var x=s>>>0||1;return function(){x^=x<<13;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296;};}(20260624);
    var stars='';
    for(var k=0;k<150;k++){
      var sx=(R()*1280).toFixed(1), sy=(R()*620).toFixed(1), sr=(0.4+R()*1.5).toFixed(2), so=(0.25+R()*0.6).toFixed(2), dur=(3+R()*5).toFixed(1), del=(R()*5).toFixed(1);
      stars+='<circle cx="'+sx+'" cy="'+sy+'" r="'+sr+'" fill="#f3ead6" opacity="'+so+'"><animate attributeName="opacity" values="'+so+';'+(so*0.25).toFixed(2)+';'+so+'" dur="'+dur+'s" begin="'+del+'s" repeatCount="indefinite"/></circle>';
    }
    return '<svg id="sy-end" viewBox="0 0 1280 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">'+
      '<defs>'+
        '<linearGradient id="sy-endsky" x1="0" y1="0" x2="0" y2="1">'+
          '<stop offset="0%" stop-color="#05060c"/>'+
          '<stop offset="52%" stop-color="#0c0a18"/>'+
          '<stop offset="82%" stop-color="#1d1424"/>'+
          '<stop offset="100%" stop-color="#2a1a26"/>'+
        '</linearGradient>'+
        '<radialGradient id="sy-endglow" cx="50%" cy="100%" r="70%">'+
          '<stop offset="0%" stop-color="#c77a4a" stop-opacity="0.30"/>'+
          '<stop offset="40%" stop-color="#7a3f63" stop-opacity="0.12"/>'+
          '<stop offset="100%" stop-color="#7a3f63" stop-opacity="0"/>'+
        '</radialGradient>'+
        '<radialGradient id="sy-endvig" cx="50%" cy="44%" r="74%">'+
          '<stop offset="0%" stop-color="#000" stop-opacity="0"/>'+
          '<stop offset="60%" stop-color="#000" stop-opacity="0"/>'+
          '<stop offset="100%" stop-color="#000" stop-opacity="0.7"/>'+
        '</radialGradient>'+
      '</defs>'+
      '<rect x="0" y="0" width="1280" height="800" fill="url(#sy-endsky)"/>'+
      '<g>'+stars+'</g>'+
      '<rect x="0" y="0" width="1280" height="800" fill="url(#sy-endglow)"/>'+
      '<rect x="0" y="0" width="1280" height="800" fill="url(#sy-endvig)" pointer-events="none"/>'+
    '</svg>';
  }

  function ending(){
    clearTimers(); sceneEl.className='in'; sceneEl.innerHTML=endBackdrop();
    document.documentElement.style.setProperty('--scrim','#000'); scrimEl.style.opacity='0';
    atmo.setMood('warm'); atmo.grade('reset'); A.setMood('warm'); A.heartbeat(false,0);
    textEl.classList.add('ending');
    var acted=log.filter(function(e){return !e.diesMany;}).length, stayed=log.length-acted;
    var means=log.filter(function(e){return e.lingers;}).length;
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
    var h='<div class="end"><p class="eyebrow">after</p>';
    P.forEach(function(s){h+='<p class="endline">'+s+'</p>';});
    h+='<p class="clead">Five voices walked it with you. They are quieter now, but none of them has left.</p>';
    h+='<div class="council">';
    ORDER.forEach(function(k){h+='<div class="cvoice"><p class="clabel">'+LABEL[k]+'</p><p class="cline">'+CLOSE[k]+'</p></div>';});
    h+='</div><p class="endline last">None of them is wrong. They never stopped arguing. Neither, now, will you.</p>';
    h+='<button class="walkon" id="again">walk back through</button></div>';
    textEl.innerHTML=h; textEl.onclick=null;
    document.getElementById('again').onclick=function(){location.reload();};
    var els=textEl.querySelectorAll('.eyebrow,.endline,.clead,.cvoice,.last,.walkon');
    els.forEach(function(l,k){l.style.transitionDelay=(0.4+k*0.62)+'s';requestAnimationFrame(function(){l.classList.add('show');});});
    ORDER.forEach(function(k,idx){voiceTimers.push(setTimeout(function(){A.voice(idx,{soft:true});},1700+idx*620));});
  }

  function begin(){
    if(started)return; started=true;
    A.init(); atmo.start();
    beginEl.classList.add('gone');
    setTimeout(function(){beginEl.style.display='none';},900);
    requestAnimationFrame(loop);
    arrive();
  }
  document.getElementById('beginBtn').onclick=begin;
  stage.addEventListener('pointerdown',function(){if(!started)return;A.init();},{once:false});
  muteEl.onclick=function(){A.toggleMute();muteEl.textContent=A.muted?'\\u25c7':'\\u25c6';};
  var phase='';
})();
`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Switchyard — inside the moment</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--scrim:#1a1024;--serif:Georgia,'Iowan Old Style','Apple Garamond','Times New Roman',serif}
html,body{height:100%;background:#000;overflow:hidden}
#stage{position:relative;width:100%;height:100svh;overflow:hidden;background:#000;font-family:var(--serif);cursor:default}
#scene{position:absolute;inset:0;z-index:0}
#scene svg{width:100%;height:100%;display:block}
#scene.in{animation:iris 1.5s cubic-bezier(.16,.84,.44,1) both}
@keyframes iris{from{opacity:0;transform:scale(1.07)}to{opacity:1;transform:scale(1)}}
#sy-many,#sy-few{transition:opacity 1.4s ease,filter 1.4s ease}
#sy-scene.dead-many #sy-many,#sy-scene.dead-few #sy-few{opacity:.13;filter:blur(.7px)}
#sy-scene.dead-many #sy-few,#sy-scene.dead-few #sy-many{opacity:1}
#scrim{position:absolute;inset:0;z-index:2;background:linear-gradient(to bottom,transparent 16%,var(--scrim) 97%);transition:opacity .8s ease;pointer-events:none}
#grain{position:absolute;inset:0;z-index:4;opacity:.05;mix-blend-mode:overlay;pointer-events:none;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
#text{position:absolute;left:max(30px,4.5vw);bottom:max(36px,7.5vh);right:max(30px,4.5vw);max-width:40ch;color:#f4efe6;z-index:6}
.eyebrow{font:500 12px/1 var(--serif);letter-spacing:.36em;text-transform:uppercase;color:#e7d9c3;opacity:0;transition:opacity 1.1s ease;margin-bottom:20px}
.eyebrow.show{opacity:.8}
.line,.voice,.endline,.clead,.cvoice,.did,.consequence{opacity:0;transform:translateY(11px);transition:opacity 1.2s ease,transform 1.2s ease}
.line.show,.voice.show,.endline.show,.clead.show,.cvoice.show,.did.show,.consequence.show{opacity:1;transform:none}
.sit{font:400 clamp(21px,3.2vw,31px)/1.5 var(--serif);text-shadow:0 1px 16px rgba(0,0,0,.6);margin-bottom:14px}
.stakes{font:italic 400 clamp(13px,1.7vw,16px)/1.6 var(--serif);color:#dccfb9;margin-top:10px;text-shadow:0 1px 12px rgba(0,0,0,.55)}
.choices{display:flex;flex-direction:column;gap:15px;margin-top:38px}
.choice{align-self:flex-start;font:400 clamp(20px,2.7vw,27px)/1.3 var(--serif);color:#f4efe6;background:none;border:none;border-bottom:1px solid rgba(244,239,230,.2);padding:3px 1px 7px;cursor:pointer;text-align:left;transition:.45s;text-shadow:0 1px 14px rgba(0,0,0,.6)}
.choice:hover,.choice:focus-visible{border-bottom-color:#fff;letter-spacing:.012em;color:#fff;outline:none;transform:translateX(3px)}
.did{font:400 clamp(19px,2.5vw,25px)/1.4 var(--serif);color:#fff;margin-bottom:15px;text-shadow:0 1px 14px rgba(0,0,0,.65)}
.consequence{font:400 clamp(15px,1.9vw,19px)/1.6 var(--serif);color:#dccfb9;margin-bottom:28px}
.voices{display:flex;flex-direction:column;gap:14px}
.voice{font:italic 400 clamp(15px,2vw,20px)/1.55 var(--serif);color:#c9beaa;text-shadow:0 1px 12px rgba(0,0,0,.55);padding-left:15px;border-left:1px solid rgba(231,217,195,.22)}
.voice.linger{color:#efe3cd;font-size:clamp(16px,2.15vw,21px);border-left-color:rgba(231,217,195,.5)}
.walkon{margin-top:32px;font:500 14px/1 var(--serif);letter-spacing:.2em;text-transform:uppercase;color:#e7d9c3;background:none;border:none;cursor:pointer;opacity:0;transition:opacity 1.5s ease}
.walkon.show{opacity:.82}.walkon:hover{color:#fff}
/* ---- ending: a centered, composed full-screen closing moment ---- */
#text.ending{position:absolute;inset:0;left:0;right:0;bottom:0;max-width:none;display:flex;align-items:center;justify-content:center;overflow-y:auto;padding:6vh max(26px,5vw)}
#text.ending::-webkit-scrollbar{width:0;height:0}
.end{max-width:52ch;width:100%;margin:auto;text-align:center;display:flex;flex-direction:column;align-items:center}
.end .eyebrow{margin-bottom:30px}
.endline{font:400 clamp(18px,2.5vw,26px)/1.62 var(--serif);color:#f1ece2;margin-bottom:20px;text-shadow:0 2px 18px rgba(0,0,0,.7);max-width:46ch}
.endline.last{color:#e7d9c3;font-style:italic;margin-top:14px}
.clead{font:italic 400 clamp(14px,1.9vw,17px)/1.6 var(--serif);color:#bdb29d;margin:14px 0 6px;text-shadow:0 1px 14px rgba(0,0,0,.6);max-width:42ch}
.council{margin:18px 0 8px;border-top:1px solid rgba(231,217,195,.16);padding-top:26px;width:100%;max-width:46ch;display:grid;grid-template-columns:1fr 1fr;gap:18px 34px;text-align:left}
.council .cvoice:last-child{grid-column:1 / -1;justify-self:center;text-align:center;max-width:34ch}
.clabel{font:500 10.5px/1.2 var(--serif);letter-spacing:.22em;text-transform:uppercase;color:#cbbfa6}
.cline{font:italic 400 clamp(13px,1.6vw,15px)/1.5 var(--serif);color:#a99e8c;margin-top:6px}
#mute{position:absolute;right:18px;bottom:16px;z-index:8;font-size:15px;color:#e7d9c3;opacity:.32;background:none;border:none;cursor:pointer;transition:opacity .3s}
#mute:hover{opacity:.85}
#begin{position:absolute;inset:0;z-index:30;background:radial-gradient(120% 120% at 50% 40%,#241a36,#0a0712);display:flex;align-items:center;justify-content:center;text-align:center;color:#f4efe6;font-family:var(--serif);transition:opacity .9s ease}
#begin.gone{opacity:0;pointer-events:none}
#begin .bi{animation:fadeup 1.8s ease both}
@keyframes fadeup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.b-kicker{font:500 12px/1 var(--serif);letter-spacing:.4em;text-transform:uppercase;color:#c9b893;opacity:.7;margin-bottom:22px}
.b-title{font:400 clamp(34px,7vw,64px)/1.05 var(--serif);letter-spacing:.01em}
.b-sub{font:italic 400 15px/1.6 var(--serif);color:#bdb29d;margin:18px 0 40px}
#beginBtn{font:500 15px/1 var(--serif);letter-spacing:.22em;text-transform:uppercase;color:#f4efe6;background:none;border:1px solid rgba(244,239,230,.4);border-radius:2px;padding:15px 38px;cursor:pointer;transition:.4s}
#beginBtn:hover{background:rgba(244,239,230,.08);border-color:#f4efe6;letter-spacing:.28em}
/* ---- phones (~380px): keep the whole moment above the fold, no scroll ---- */
@media (max-width:560px){
  #text{left:max(18px,4vw);right:max(18px,4vw);bottom:max(22px,4vh);max-width:none}
  .eyebrow{font-size:11px;letter-spacing:.3em;margin-bottom:13px}
  .sit{font-size:clamp(16px,4.6vw,20px);line-height:1.42;margin-bottom:9px}
  .stakes{font-size:clamp(12px,3.3vw,14px);line-height:1.5;margin-top:7px}
  .choices{gap:9px;margin-top:20px}
  .choice{font-size:clamp(16px,4.4vw,19px);padding:2px 1px 6px}
  .did{font-size:clamp(16px,4.4vw,20px);margin-bottom:11px}
  .consequence{font-size:clamp(13px,3.5vw,16px);line-height:1.5;margin-bottom:18px}
  .voices{gap:9px}
  .voice{font-size:clamp(13px,3.6vw,16px);line-height:1.45;padding-left:11px}
  .voice.linger{font-size:clamp(14px,3.9vw,17px)}
  .walkon{margin-top:20px;font-size:13px}
  #text.ending{padding:3vh 18px;align-items:flex-start}
  .endline{font-size:clamp(14px,4.1vw,19px);line-height:1.46;margin-bottom:11px}
  .clead{font-size:clamp(12px,3.3vw,14px);margin:8px 0 2px}
  .council{grid-template-columns:1fr;gap:13px;padding-top:18px;margin:12px 0 4px}
  .council .cvoice:last-child{grid-column:auto;max-width:none}
  .b-title{font-size:clamp(30px,10vw,46px)}
  .b-sub{font-size:13px;margin:14px 0 30px}
  #beginBtn{padding:13px 30px}
}
/* very short / landscape phones: compress the situation block further */
@media (max-height:520px){
  .sit{font-size:clamp(14px,2.4vh,19px);margin-bottom:6px}
  .stakes{margin-top:5px}
  .choices{margin-top:14px;gap:8px}
  .choice{font-size:clamp(15px,2.6vh,18px)}
  .eyebrow{margin-bottom:9px}
}
@media(prefers-reduced-motion:reduce){*{animation-duration:.2s!important;transition-duration:.2s!important}}
</style></head><body>
<div id="stage">
  <div id="scene"></div>
  <div id="scrim"></div>
  <div id="grain"></div>
  <div id="text"></div>
  <button id="mute" aria-label="toggle sound">&#9670;</button>
  <div id="begin"><div class="bi"><p class="b-kicker">switchyard</p><h1 class="b-title">Inside the Moment</h1><p class="b-sub">six choices &middot; no right answers &middot; sound on, headphones if you have them</p><button id="beginBtn">begin</button></div></div>
</div>
<script>${AUDIO}</script>
<script>${ATMOS}</script>
<script>${TRANS}</script>
<script>${SCENE}</script>
<script>const DATA=${JSON.stringify(DATA)};</script>
<script>${APP}</script>
</body></html>`;

const p = join(out, "play.html");
writeFileSync(p, html);
console.log(`wrote ${p} — ${DATA.length} dilemmas, immersive build (${Math.round(html.length / 1024)}kb)`);
