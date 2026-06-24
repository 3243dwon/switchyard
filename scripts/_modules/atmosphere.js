/* ============================================================================
 *  createAtmosphere(stageEl)
 *  Atmosphere / FX subsystem for "INSIDE THE MOMENT".
 *  - One full-stage <canvas> (#air) between #scene and #scrim, pointer-events:none.
 *  - Layered depth particles (warm dust-in-god-rays / cool ash-mist).
 *  - Cursor-following additive dread-light.
 *  - Parallax that nudges #scene depth planes AND drifts the scene wrapper.
 *  - Idle Lissajous drift when the pointer is still.
 *  - grade() pushes a stage-level color grade + vignette for means/side_effect.
 *  Single shared rAF loop. 60fps target. Degrades with no canvas / reduced-motion.
 *  Vanilla JS, no deps, no assets.
 * ========================================================================== */
function createAtmosphere(stageEl){
  'use strict';

  // ---- capability checks -----------------------------------------------------
  var reduce = false;
  try { reduce = window.matchMedia &&
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}
  var finePointer = true;
  try { finePointer = !window.matchMedia ||
                      window.matchMedia('(pointer:fine)').matches; } catch(e){}
  var interactive = finePointer && !reduce;   // parallax + cursor light + idle drift

  // ---- canvas / context ------------------------------------------------------
  var canvas = document.createElement('canvas');
  canvas.id = 'air';
  canvas.setAttribute('aria-hidden','true');
  // sits above #scene/#scrim, below #text. #scrim is typically ~z 2, #text ~z 5.
  var cs = canvas.style;
  cs.position='absolute'; cs.inset='0'; cs.width='100%'; cs.height='100%';
  cs.pointerEvents='none'; cs.zIndex='3';
  cs.mixBlendMode='screen';            // additive-ish lift for motes + light
  cs.opacity='0';                      // faded up on start()
  cs.transition='opacity 1.2s ease';
  // insert just before #scrim if present, else append to stage
  var scrim = stageEl.querySelector('#scrim');
  if (scrim && scrim.parentNode === stageEl) stageEl.insertBefore(canvas, scrim);
  else stageEl.appendChild(canvas);

  var ctx = null;
  var hasCanvas = false;
  try { ctx = canvas.getContext('2d'); hasCanvas = !!ctx; } catch(e){ hasCanvas=false; }

  // ---- stage-level grade overlay (multiply/overlay color push) ---------------
  // A soft full-stage div under #scrim that lets us push warm/cool & lurch on means.
  var gradeEl = document.createElement('div');
  gradeEl.id = 'air-grade';
  gradeEl.setAttribute('aria-hidden','true');
  var gs = gradeEl.style;
  gs.position='absolute'; gs.inset='0'; gs.pointerEvents='none'; gs.zIndex='3';
  gs.mixBlendMode='multiply';
  gs.opacity='0';
  gs.transition = reduce ? 'none' : 'background 1.2s ease, opacity 1.2s ease';
  gs.background='rgba(255,255,255,0)';
  if (scrim && scrim.parentNode === stageEl) stageEl.insertBefore(gradeEl, scrim);
  else stageEl.appendChild(gradeEl);

  // ---- scene depth-plane wiring ---------------------------------------------
  // The SVG is authored with depth groups. We translate them for parallax.
  // We resolve them lazily each setMood() (scene innerHTML is swapped on arrive).
  var sceneEl = stageEl.querySelector('#scene');
  var planes = { back:null, mid:null, fore:null };
  function resolvePlanes(){
    if (!sceneEl) sceneEl = stageEl.querySelector('#scene');
    if (!sceneEl){ planes.back=planes.mid=planes.fore=null; return; }
    // Preferred explicit ids; fall back to common scene group ids.
    planes.back = sceneEl.querySelector('#sy-back, #plane-back, .depth-back');
    planes.mid  = sceneEl.querySelector('#sy-mid, #plane-mid, .depth-mid');
    planes.fore = sceneEl.querySelector('#sy-fore, #plane-fore, .depth-fore');
    // If author didn't tag planes, synthesize from known scene parts.
    if (!planes.mid)  planes.mid  = sceneEl.querySelector('#sy-haz') &&
                                    sceneEl.querySelector('#sy-haz').parentNode;
    if (!planes.fore) planes.fore = sceneEl.querySelector('#sy-many') &&
                                    sceneEl.querySelector('#sy-many').parentNode;
  }
  resolvePlanes();

  // ---- sizing / DPR ----------------------------------------------------------
  var W=0, H=0, DPR=1;
  function resize(){
    var r = stageEl.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    DPR = Math.min(2, window.devicePixelRatio || 1);
    if (hasCanvas){
      canvas.width  = Math.round(W*DPR);
      canvas.height = Math.round(H*DPR);
      ctx.setTransform(DPR,0,0,DPR,0,0);
    }
    spawnParticles();   // re-seed to fit new bounds (keeps density right)
  }
  var ro=null;
  try { ro = new ResizeObserver(resize); ro.observe(stageEl); } catch(e){}
  window.addEventListener('resize', resize);

  // ---- mood state ------------------------------------------------------------
  var mood = 'warm';
  // Palettes
  var PAL = {
    warm: {
      mote:'255,230,174',                 // #FFE6AE
      aMin:0.04, aMax:0.12, count:74,
      vyMin:-9, vyMax:-4,                  // up
      vx:  6,                              // drift right
      size:[1.0,2.5],
      light:'255,230,174',                // cursor light warm
      lightA:0.10,
      godrays:true,
      haze:'rgba(255,200,120,0.0)',
      gradeWarm:'rgba(255,196,120,0.10)', // multiply push: amber lows / gold
      vignette:0.55
    },
    cool: {
      mote:'205,214,221',                 // #cdd6dd
      aMin:0.03, aMax:0.08, count:46,
      vyMin:3, vyMax:9,                    // down (gravity of dread)
      vx:  10,                            // lateral wind shear
      size:[2.0,4.0],
      light:'205,214,221',
      lightA:0.10,
      godrays:false,
      haze:'rgba(184,194,204,0.0)',
      gradeCool:'rgba(120,140,160,0.12)', // multiply push: blue-steel, -sat
      vignette:0.60
    }
  };
  function pal(){ return PAL[mood] || PAL.warm; }

  // god-ray sweep cone origin (matches SVG sun ~820,452 in a 1280-ish frame)
  function sunPt(){ return { x: W*0.64, y: H*0.50 }; }

  // ---- particle pool ---------------------------------------------------------
  // depth: 0=back (slow,small,dim) 1=mid 2=fore (fast,big,bright) — used for
  // both parallax response and size/speed.
  var parts = [];
  function rnd(a,b){ return a + Math.random()*(b-a); }
  function spawnParticles(){
    if (!hasCanvas) return;
    var p = pal();
    // scale density with viewport area but cap it; never busy.
    var area = (W*H) / (1280*720);
    var n = Math.round(p.count * Math.min(1.25, Math.max(0.5, area)));
    parts.length = 0;
    for (var i=0;i<n;i++){
      var depth = i % 3;                 // even spread across 3 planes
      parts.push(makeParticle(depth, true));
    }
  }
  function makeParticle(depth, anywhere){
    var p = pal();
    var ds = 0.55 + depth*0.45;          // depth scalar 0.55 / 1.0 / 1.45
    var sz = rnd(p.size[0], p.size[1]) * (0.7 + depth*0.25);
    return {
      x: anywhere ? rnd(0,W) : spawnX(p),
      y: anywhere ? rnd(0,H) : spawnY(p),
      sz: sz,
      depth: depth,
      vx: p.vx * ds * rnd(0.4,1.0) * (mood==='cool'? rnd(-1,1)*0.6+0.4 : 1),
      vy: rnd(p.vyMin, p.vyMax) * ds,
      a:  rnd(p.aMin, p.aMax),
      sway: rnd(0, Math.PI*2),
      swaySpd: rnd(0.2,0.7),
      swayAmp: rnd(3,9) * (0.5+depth*0.4),
      life: rnd(0.6,1.0)                 // 0..1 motion scalar (used by post-choice)
    };
  }
  function spawnX(p){
    if (mood==='cool') return rnd(0,W);
    return rnd(-W*0.1, W*0.6);           // warm drifts up-right; seed lower-left
  }
  function spawnY(p){
    return mood==='cool' ? rnd(-H*0.1,-2) : rnd(H*0.5, H+H*0.1);
  }

  // ---- cursor light / parallax state ----------------------------------------
  var tnx=0, tny=0;       // target normalized mouse -1..1
  var cnx=0, cny=0;       // current (lerped) -> parallax
  var lightX=0, lightY=0;       // current light px (lerped)
  var lightTX=0, lightTY=0;     // target light px
  var lightR=220, lightRT=220;  // radius (tightens over choices)
  var lightVis=0;               // 0..1 visibility (hidden during reading)
  var lightVisT=0;
  var lastMove=0, hasPointer=false;
  var idleT=0;

  // haze breathing phase (cool slow pulse)
  var hazePhase=0;
  // post-choice doomed-side suppression: {side:'many'|'few', x0,x1, t}
  var doomed=null;
  // means flinch desaturate window
  var flinch=0;           // 0..1 envelope, fades
  // god-ray sweep angle
  var raySweep=0;

  // ---- public: mouse ---------------------------------------------------------
  function onMouse(nx,ny){
    if (!interactive) return;
    tnx = Math.max(-1, Math.min(1, nx));
    tny = Math.max(-1, Math.min(1, ny));
    lastMove = now();
    hasPointer = true;
    // target light px from normalized (center origin)
    lightTX = (W*0.5) + tnx*(W*0.5);
    lightTY = (H*0.5) + tny*(H*0.5);
  }
  // Allow the host to tighten/relax light over a .choice & toggle reading vis.
  function light(opts){
    opts = opts || {};
    if (typeof opts.radius==='number') lightRT = opts.radius;
    if (typeof opts.visible==='boolean') lightVisT = opts.visible ? 1 : 0;
  }

  // ---- public: burst ---------------------------------------------------------
  // A restrained particle burst at the choice moment (px coords in stage space).
  function burst(x,y){
    if (!hasCanvas) return;
    if (typeof x!=='number'){ var s=sunPt(); x=s.x; y=s.y; }
    var p = pal();
    var n = reduce ? 8 : 22;
    for (var i=0;i<n;i++){
      var ang = rnd(0,Math.PI*2);
      var spd = rnd(20,120);
      var bp = makeParticle(2, true);
      bp.x=x; bp.y=y;
      bp.vx = Math.cos(ang)*spd;
      bp.vy = Math.sin(ang)*spd - 10;
      bp.a  = rnd(p.aMax*0.8, p.aMax*1.6);
      bp.sz = rnd(1.2, 3.2);
      bp.burst = true;
      bp.bt = 0;                          // burst age
      parts.push(bp);
    }
    // cap pool
    if (parts.length > 220) parts.splice(0, parts.length-220);
  }

  // ---- public: grade ---------------------------------------------------------
  // kind: 'means' (lurch: extra desat/cool, settles ~4% colder & STAYS),
  //       'side_effect' (only a slight vignette deepen — grief, not guilt),
  //       'beloved' (warm hybrid: brief ash pulse that fully recovers),
  //       'reset' (return to mood resting grade).
  var gradeStain=0;   // persistent cool/desat stain accumulated by means choices
  function grade(kind){
    var p = pal();
    if (kind==='reset'){
      gradeStain=0; flinch=0;
      applyRestingGrade();
      return;
    }
    if (kind==='means'){
      flinch = 1;                                   // canvas brightness/desat dip
      gradeStain = Math.min(0.18, gradeStain + 0.10);
      if (reduce){
        // snap, no transition
        gs.transition='none';
        gradeEl.style.background = 'rgba(120,140,160,'+(0.12+gradeStain*0.6).toFixed(3)+')';
        gradeEl.style.opacity='1';
        void gradeEl.offsetWidth;
        gs.transition='background 1.2s ease, opacity 1.2s ease';
      } else {
        // 600ms lurch overlay, then settle ~4% colder/desat & STAY
        gs.transition='background .6s ease, opacity .6s ease';
        gradeEl.style.background='rgba(120,140,160,'+(0.22+gradeStain*0.4).toFixed(3)+')';
        gradeEl.style.opacity='1';
        setTimeout(function(){
          gs.transition='background 1.2s ease, opacity 1.2s ease';
          gradeEl.style.background='rgba(120,140,160,'+(0.12+gradeStain*0.5).toFixed(3)+')';
        }, 620);
      }
      bumpVignette(0.04);
      return;
    }
    if (kind==='beloved'){
      // warm scene, side-effect throw kills the loved one: ash pulse, full recover
      flinch = 0.8;
      if (!reduce){
        gs.transition='background .5s ease, opacity .5s ease';
        gradeEl.style.background='rgba(150,150,160,0.16)';
        gradeEl.style.opacity='1';
        setTimeout(function(){
          gs.transition='background 1.2s ease, opacity 1.2s ease';
          applyRestingGrade();
        }, 560);
      }
      bumpVignette(0.03);
      return;
    }
    // default: side_effect — grief, not guilt. Only deepen vignette.
    bumpVignette(0.05);
  }
  function applyRestingGrade(){
    var p = pal();
    if (mood==='warm'){
      gradeEl.style.background = p.gradeWarm;
      gradeEl.style.opacity = '0.85';
    } else {
      // bake any accumulated stain into the resting cool grade
      var base = 0.12 + gradeStain*0.5;
      gradeEl.style.background = 'rgba(120,140,160,'+base.toFixed(3)+')';
      gradeEl.style.opacity = '1';
    }
  }
  // vignette nudge via CSS var the SVG #vig can read (host may bind --vig)
  var vigBase=0.55, vigTarget=0.55, vigCur=0.55;
  function bumpVignette(d){ vigTarget = Math.min(0.78, vigTarget + d); }

  // ---- public: setMood -------------------------------------------------------
  function setMood(m){
    mood = (m==='cool') ? 'cool' : 'warm';
    resolvePlanes();
    gradeStain = 0;                       // each scene starts clean
    vigBase = vigTarget = vigCur = pal().vignette;
    flinch = 0; doomed=null;
    canvas.style.opacity = '1';
    spawnParticles();
    applyRestingGrade();
    // cool scenes a half-stop more claustrophobic — handled by vignette base above
  }
  // mark which side died so its air goes dead (host calls after the dimming)
  function killSide(side){
    // side 'many'|'few' — approximate the screen region from the SVG group.
    var sel = side==='few' ? '#sy-few' : '#sy-many';
    var g = sceneEl && sceneEl.querySelector(sel);
    var x0=0,x1=W;
    if (g && g.getBoundingClientRect){
      var rg=g.getBoundingClientRect(), rs=stageEl.getBoundingClientRect();
      x0 = rg.left - rs.left; x1 = rg.right - rs.left;
    } else {
      // fallback: many on left third, few on right third
      if (side==='few'){ x0=W*0.6; x1=W; } else { x0=0; x1=W*0.4; }
    }
    doomed = { x0:x0-40, x1:x1+40, t:0 };
  }

  // ---- main loop -------------------------------------------------------------
  var running=false, raf=0, prev=0;
  function now(){ return (window.performance && performance.now) ? performance.now() : Date.now(); }

  function start(){
    if (running) return;
    running = true;
    resize();
    canvas.style.opacity = hasCanvas ? '1' : '0';
    applyRestingGrade();
    if (!hasCanvas){ staticFallback(); return; }
    prev = now();
    raf = requestAnimationFrame(loop);
  }
  function stop(){
    running=false;
    if (raf) cancelAnimationFrame(raf), raf=0;
    if (ctx) ctx.clearRect(0,0,W,H);
  }

  function loop(t){
    if (!running) return;
    var dt = Math.min(0.05, (t - prev)/1000) || 0.016;  // clamp big gaps
    prev = t;
    step(dt, t);
    raf = requestAnimationFrame(loop);
  }

  function step(dt, t){
    var p = pal();

    // --- parallax target: idle Lissajous if pointer still ---
    if (interactive){
      var stillFor = now() - lastMove;
      if (!hasPointer || stillFor > 4000){
        idleT += dt;
        // slow autonomous drift, amplitude ~40% of mouse range, period ~14s
        var wob = 0.4;
        tnx = Math.sin(idleT*(2*Math.PI/14)) * wob;
        tny = Math.sin(idleT*(2*Math.PI/14)*0.73 + 1.3) * wob;
        lightVisT = Math.min(lightVisT, 0.5); // dim presence while idle
      }
      // lerp current toward target (smoothing IS the feel)
      cnx += (tnx - cnx)*0.08;
      cny += (tny - cny)*0.08;
      // light lerps slower (trails like attention)
      lightX += (lightTX - lightX)*0.12;
      lightY += (lightTY - lightY)*0.12;
      lightR += (lightRT - lightR)*0.10;
      lightVis += (lightVisT - lightVis)*0.08;
      applyParallax();
    }

    // --- particles ---
    if (hazePhase!==undefined) hazePhase += dt;
    raySweep = Math.sin(now()/1000 * (2*Math.PI/20)) * 3*Math.PI/180; // ±3° / 20s
    if (doomed){ doomed.t += dt; }
    if (flinch>0){ flinch = Math.max(0, flinch - dt/0.6); } // 600ms decay

    ctx.clearRect(0,0,W,H);

    // cold haze band (cool) — drawn first, behind motes
    if (mood==='cool') drawHaze(t);
    // warm god-ray wedges (warm)
    else drawGodrays();

    drawParticles(dt);

    // cursor dread-light (additive)
    if (interactive && lightVis>0.01) drawLight();

    // means flinch: brief global desaturate/darken dip over everything we drew
    if (flinch>0.01){
      ctx.save();
      ctx.globalCompositeOperation='source-atop';
      ctx.fillStyle='rgba(40,46,54,'+(0.20*flinch).toFixed(3)+')';
      ctx.fillRect(0,0,W,H);
      ctx.restore();
    }

    // vignette var smoothing toward resting (so post-choice deepen relaxes)
    vigCur += (vigTarget - vigCur)*0.04;
    if (Math.abs(vigTarget - vigBase) > 0.001) vigTarget += (vigBase - vigTarget)*0.01;
    stageEl.style.setProperty('--vig', vigCur.toFixed(3));
  }

  function applyParallax(){
    // disabled: the orchestrator owns granular [data-depth] parallax (avoids double-transform fight)
  }

  function drawParticles(dt){
    var p = pal();
    var sun = sunPt();
    for (var i=parts.length-1;i>=0;i--){
      var q = parts[i];
      // life suppression over the doomed side (air goes dead)
      var localLife = 1;
      if (doomed && q.x>doomed.x0 && q.x<doomed.x1){
        localLife = Math.max(0.04, 1 - Math.min(1, doomed.t/2)); // ~2s to near-still
      }
      q.sway += q.swaySpd*dt;
      var swayX = Math.cos(q.sway)*q.swayAmp*0.016;
      q.x += (q.vx*dt + swayX) * localLife;
      q.y += (q.vy*dt) * localLife;

      // burst particles decay & drag
      if (q.burst){
        q.bt += dt;
        q.vx *= (1 - 1.6*dt); q.vy = q.vy*(1-1.6*dt) + 18*dt; // settle/fall
        q.a *= (1 - 0.9*dt);
        if (q.bt>2.2 || q.a<0.004){ parts.splice(i,1); continue; }
      } else {
        // respawn at edges
        if (mood==='cool'){
          if (q.y > H+8 || q.x < -12 || q.x > W+12){ replace(q); }
        } else {
          if (q.y < -12 || q.x > W+12){ replace(q); }
        }
      }

      // alpha; warm motes brighten inside the god-ray cone
      var a = q.a;
      if (p.godrays){
        var dx = q.x - sun.x, dy = q.y - sun.y;
        var ang = Math.atan2(dy,dx);
        // cone roughly pointing down-left from the sun
        var d = Math.abs(angDiff(ang, 2.5 + raySweep));
        if (d < 0.5) a += (0.5-d)*0.14;
      }
      a *= (0.4 + 0.6*localLife);
      if (a < 0.003) continue;

      ctx.globalAlpha = Math.min(0.5, a);
      ctx.fillStyle = 'rgb('+p.mote+')';
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.sz*(0.8+q.depth*0.15), 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function replace(q){
    var p = pal();
    var fresh = makeParticle(q.depth, false);
    q.x=fresh.x; q.y=fresh.y; q.vx=fresh.vx; q.vy=fresh.vy;
    q.a=fresh.a; q.sz=fresh.sz; q.sway=fresh.sway;
  }
  function angDiff(a,b){
    var d = a-b;
    while(d> Math.PI) d-=2*Math.PI;
    while(d<-Math.PI) d+=2*Math.PI;
    return d;
  }

  function drawGodrays(){
    // 2-3 long low-opacity wedges from the sun, slowly rotating ±3°.
    var sun = sunPt();
    var base = 2.45;                       // ~down-left
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    for (var k=0;k<3;k++){
      var ang = base + raySweep + (k-1)*0.16;
      var len = Math.max(W,H)*1.3;
      var ax = sun.x + Math.cos(ang)*len;
      var ay = sun.y + Math.sin(ang)*len;
      var grad = ctx.createLinearGradient(sun.x,sun.y,ax,ay);
      grad.addColorStop(0,'rgba(255,230,174,0.05)');
      grad.addColorStop(1,'rgba(255,230,174,0)');
      ctx.fillStyle=grad;
      var wn = 0.10;                       // wedge half-angle
      ctx.beginPath();
      ctx.moveTo(sun.x,sun.y);
      ctx.lineTo(sun.x+Math.cos(ang-wn)*len, sun.y+Math.sin(ang-wn)*len);
      ctx.lineTo(sun.x+Math.cos(ang+wn)*len, sun.y+Math.sin(ang+wn)*len);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawHaze(t){
    // faint horizontal haze band across the track midground, slow scroll + slow
    // 0.2Hz brightness pulse (cold breathing).
    var pulse = 0.5 + 0.5*Math.sin(hazePhase*2*Math.PI*0.2);
    var a = 0.03 + 0.02*pulse;
    var y0 = H*0.46, y1 = H*0.66;
    var g = ctx.createLinearGradient(0,y0,0,y1);
    g.addColorStop(0,'rgba(184,194,204,0)');
    g.addColorStop(0.5,'rgba(184,194,204,'+a.toFixed(3)+')');
    g.addColorStop(1,'rgba(184,194,204,0)');
    ctx.fillStyle=g;
    ctx.fillRect(0,y0,W,y1-y0);
  }

  function drawLight(){
    var p = pal();
    var r = lightR;
    var g = ctx.createRadialGradient(lightX,lightY,0, lightX,lightY,r);
    var a = p.lightA * lightVis;
    g.addColorStop(0,'rgba('+p.light+','+a.toFixed(3)+')');
    g.addColorStop(1,'rgba('+p.light+',0)');
    ctx.save();
    ctx.globalCompositeOperation='lighter';   // additive dread-light
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.arc(lightX,lightY,r,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  // ---- degraded path ---------------------------------------------------------
  function staticFallback(){
    // No canvas (or reduced-motion can keep canvas but we also offer this):
    // a single static SVG-ish haze gradient so the frame still has depth.
    canvas.style.display='none';
    var haze = document.getElementById('air-static');
    if (!haze){
      haze = document.createElement('div');
      haze.id='air-static';
      haze.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:3;';
      if (scrim && scrim.parentNode===stageEl) stageEl.insertBefore(haze,scrim);
      else stageEl.appendChild(haze);
    }
    paintStaticHaze(haze);
  }
  function paintStaticHaze(el){
    if (mood==='cool'){
      el.style.background='radial-gradient(120% 80% at 50% 40%, rgba(205,214,221,.06), transparent 70%)';
    } else {
      el.style.background='radial-gradient(80% 80% at 64% 50%, rgba(255,230,174,.10), transparent 70%)';
    }
  }

  // If reduced-motion: keep a calm static canvas frame (no animation),
  // but still honor setMood/grade as static target states.
  if (reduce && hasCanvas){
    // Override loop with a one-shot static paint on mood changes.
    var _origSetMood = setMood;
    setMood = function(m){
      _origSetMood(m);
      if (!running) return;
      // draw one static frame: faint haze + a sprinkle of motionless motes
      ctx.clearRect(0,0,W,H);
      if (mood==='cool') drawHaze(0); else drawGodrays();
      for (var i=0;i<Math.min(parts.length,40);i++){
        var q=parts[i];
        ctx.globalAlpha=Math.min(0.4,q.a);
        ctx.fillStyle='rgb('+pal().mote+')';
        ctx.beginPath(); ctx.arc(q.x,q.y,q.sz,0,Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha=1;
    };
    // suppress animated loop; start() just paints once.
    start = function(){
      if (running) return; running=true; resize();
      canvas.style.opacity='1'; applyRestingGrade(); setMood(mood);
    };
  }

  // ---- teardown helper -------------------------------------------------------
  function destroy(){
    stop();
    window.removeEventListener('resize', resize);
    if (ro){ try{ ro.disconnect(); }catch(e){} }
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    if (gradeEl && gradeEl.parentNode) gradeEl.parentNode.removeChild(gradeEl);
    var s=document.getElementById('air-static');
    if (s && s.parentNode) s.parentNode.removeChild(s);
  }

  // ---- public API ------------------------------------------------------------
  return {
    start: start,
    stop: stop,
    setMood: function(m){ return setMood(m); },
    onMouse: onMouse,
    burst: burst,
    grade: grade,
    // extras the host can use to complete the immersion bible:
    light: light,          // light({radius, visible}) — tighten over .choice, hide during reading
    killSide: killSide,    // killSide('many'|'few') — thin/still the doomed side's air
    destroy: destroy
  };
}