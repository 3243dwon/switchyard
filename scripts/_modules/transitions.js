/* ============================================================================
   createTransitions(stageEl)
   Cinematic transitions + kinetic type subsystem for "INSIDE THE MOMENT".
   - between(cb): the BIG between-dilemma camera-travel (rush down the rails +
                  white-bloom + hold-in-black). cb() fires at the apex (full black)
                  to swap scene+text. ~1.4s total. Reuses the contract #fade and
                  layers its own overlays beneath/above it.
   - revealLines(container, opts): kinetic per-line prose reveal (blur-in + rise
                  + micro-overshoot settle), staggered. Honors the sacred k*0.55s
                  cadence by default; opts can override.
   - revealVoices(container): heavier, slower materialization for the italic
                  inner voices; 'linger' voices hang dissonant (longer, with a
                  faint residual tremor).
   - flashImpact(opts): a fast visual jolt the instant a choice is made —
                  shockwave ring + chromatic kick + vignette punch. ~360ms.
   - reduce: boolean (prefers-reduced-motion). Everything collapses to quick fades.

   Pure DOM + WAAPI + CSS. No assets, no libs, no network. Degrades gracefully:
   if Web Animations API is missing, falls back to the existing CSS .show classes
   and instant opacity. Safe to call repeatedly; overlays are created once.
============================================================================ */
function createTransitions(stageEl){
  'use strict';

  var doc = (stageEl && stageEl.ownerDocument) || document;
  var win = doc.defaultView || window;

  // --- capability checks -----------------------------------------------------
  var mq = (win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)'));
  var reduce = !!(mq && mq.matches);
  if (mq && mq.addEventListener) { mq.addEventListener('change', function(e){ reduce = e.matches; }); }
  var HAS_WAAPI = !!(Element.prototype.animate);

  // Easing curves (the immersion bible's cinematic feel).
  var EASE_OUT_EXPO = 'cubic-bezier(.16,.84,.44,1)';   // iris / settle
  var EASE_IN_OUT   = 'cubic-bezier(.4,0,.2,1)';        // sink / drift
  var EASE_IN       = 'cubic-bezier(.55,.06,.68,.19)';  // fall to black
  var EASE_SETTLE   = 'cubic-bezier(.22,1.2,.36,1)';    // type overshoot

  // ---------------------------------------------------------------------------
  // OVERLAY SCAFFOLD — created once, inside #stage, beneath the contract #fade
  // where possible. We never reorder the contract nodes; we insert our own.
  // ---------------------------------------------------------------------------
  var fadeEl = stageEl.querySelector('#fade');

  function mk(id, css){
    var el = doc.getElementById(id);
    if (el) return el;
    el = doc.createElement('div');
    el.id = id;
    el.style.cssText = css;
    return el;
  }

  // Grade/bloom wash — sits high but below #fade visually via z-index ordering.
  // Used by between() for the white-bloom flash and by flashImpact for vignette punch.
  var bloomEl = mk('tr-bloom',
    'position:absolute;inset:0;pointer-events:none;z-index:18;opacity:0;' +
    'background:radial-gradient(120% 90% at 62% 56%, rgba(255,236,184,.9), rgba(255,236,184,.35) 38%, rgba(255,236,184,0) 70%);' +
    'mix-blend-mode:screen;will-change:opacity');

  // Speed-streaks layer for the rush-down-the-rails (canvas, cheap, transient).
  var streakEl = mk('tr-streaks',
    'position:absolute;inset:0;pointer-events:none;z-index:17;opacity:0;will-change:opacity,transform');

  // Shockwave ring for flashImpact (SVG, drawn on demand).
  var shockEl = mk('tr-shock',
    'position:absolute;inset:0;pointer-events:none;z-index:19;opacity:0;will-change:opacity');

  // Chromatic-kick layer: two tinted copies that splay apart for ~120ms.
  var chromaEl = mk('tr-chroma',
    'position:absolute;inset:0;pointer-events:none;z-index:16;opacity:0;mix-blend-mode:screen;will-change:transform,opacity');

  // Vignette-punch: a hard inner-dark ring that snaps in on impact then relaxes.
  var vigEl = mk('tr-vig',
    'position:absolute;inset:0;pointer-events:none;z-index:15;opacity:0;will-change:opacity;' +
    'background:radial-gradient(120% 100% at 50% 50%, rgba(0,0,0,0) 42%, rgba(0,0,0,.55) 100%)');

  function ensureScaffold(){
    if (!bloomEl.isConnected) {
      // Insert all overlays; if #fade exists, put ours just before it so #fade
      // (z-index:20) always wins for the true black cover.
      var anchor = fadeEl || null;
      [vigEl, chromaEl, streakEl, bloomEl, shockEl].forEach(function(el){
        if (!el.isConnected) {
          if (anchor && anchor.parentNode === stageEl) stageEl.insertBefore(el, anchor);
          else stageEl.appendChild(el);
        }
      });
    }
  }
  ensureScaffold();

  // ---------------------------------------------------------------------------
  // small helpers
  // ---------------------------------------------------------------------------
  function animate(el, frames, opts){
    if (!HAS_WAAPI || !el) {
      // Fallback: jump to the last keyframe's static properties we care about.
      try {
        var last = frames[frames.length - 1] || {};
        if (last.opacity != null) el.style.opacity = last.opacity;
        if (last.transform != null) el.style.transform = (last.transform === 'none' ? '' : last.transform);
        if (last.filter != null) el.style.filter = (last.filter === 'none' ? '' : last.filter);
      } catch(e){}
      return { finished: Promise.resolve(), cancel: function(){}, onfinish: null };
    }
    return el.animate(frames, opts);
  }

  function afterFinish(anim, fn){
    if (!fn) return;
    if (anim && anim.finished && anim.finished.then) { anim.finished.then(fn, fn); }
    else if (anim) { anim.onfinish = fn; setTimeout(fn, (opts_dur(anim)||0)); }
    else fn();
  }
  function opts_dur(){ return 0; }

  // Read mood from the live scene SVG so grade/bloom tint matches.
  function moodTint(){
    var s = stageEl.querySelector('#sy-scene') || stageEl.querySelector('#scene svg');
    var cool = s && /cool/.test(s.getAttribute('data-mood')||'') ;
    // Fallback heuristic: the contract sets --scrim; cool scenes are slate-dark.
    if (!s || s.getAttribute('data-mood') == null) {
      var scrim = (getComputedStyle(doc.documentElement).getPropertyValue('--scrim')||'').trim();
      cool = /1[0-9a-f]{1}|16|1f|2e|a3/.test(scrim) && !/2b2a55|6b4f86|c75f81/.test(scrim);
      // The dusk warm scrim is #1a1024; treat unknown as warm (safer, golden).
      cool = false;
      // Re-detect from sky stop if present:
      var sky = stageEl.querySelector('#sy-scene [id*="sky"], #scene svg [stop-color]');
    }
    return cool
      ? { warm:false, key:'#cdd6dd', rim:'#cdd6dd' }
      : { warm:true,  key:'#FFE6AE', rim:'#FFC27A' };
  }

  // Convert "#rrggbb" → "r,g,b" for rgba() string building.
  function rgb(hex){
    var h = hex.replace('#','');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n = parseInt(h,16);
    return ((n>>16)&255)+','+((n>>8)&255)+','+(n&255);
  }

  // ===========================================================================
  // BETWEEN — the BIG camera-travel between dilemmas.
  // Choreography:
  //   t0        : rush begins. The whole stage drifts forward (translateY -10px,
  //               scale 1→1.012); speed-streaks rip down the rails toward the
  //               vanishing point; grain lifts (handled by host CSS if present);
  //               a white-bloom blooms up as we accelerate.
  //   ~apex     : #fade hits full black (the bloom whites-out then the world is
  //               pulled under). cb() is called HERE to swap scene + text under
  //               cover. Stage transform resets instantly behind black.
  //   tail      : #fade releases; the iris (host CSS .in) takes over on arrive.
  //   Total ~1400ms (matches the iris arrival so sound+image land together).
  // Reduced motion: no drift/scale/streaks; a clean 200ms fade to black, swap,
  //               200ms back.
  // ===========================================================================
  function between(cb){
    ensureScaffold();
    var safeCb = function(){ try { cb && cb(); } catch(e){ try{ cb && cb(); }catch(_){} } };

    if (reduce || !HAS_WAAPI) {
      // Minimal, calm, fully functional.
      if (fadeEl) {
        fadeEl.style.transition = 'opacity .2s ease';
        fadeEl.style.opacity = '1';
        setTimeout(function(){
          safeCb();
          // host arrive() adds .in (iris); under reduced-motion that's fade-only.
          setTimeout(function(){ fadeEl.style.opacity = '0'; }, 30);
        }, 210);
      } else {
        safeCb();
      }
      return;
    }

    var tint = moodTint();

    // --- 1. paint speed-streaks (cheap canvas, perspective lines to vanishing pt)
    paintStreaks(streakEl, tint);

    // --- 2. drive the camera-travel on the stage's children we own + the scene
    var sceneEl = stageEl.querySelector('#scene');
    var travelTargets = [sceneEl, stageEl.querySelector('#scrim'), stageEl.querySelector('#grain')]
                        .filter(Boolean);

    // forward push + slight scale = camera lunging down the track
    travelTargets.forEach(function(el){
      animate(el, [
        { transform: 'translateY(0) scale(1)' },
        { transform: 'translateY(-6px) scale(1.012)', offset: 0.42 },
        { transform: 'translateY(-10px) scale(1.03)' }
      ], { duration: 560, easing: EASE_IN, fill: 'forwards' });
    });

    // streaks rip & accelerate toward us, fading as the bloom takes over
    animate(streakEl, [
      { opacity: 0, transform: 'scale(1)' },
      { opacity: 0.85, transform: 'scale(1.18)', offset: 0.55 },
      { opacity: 0, transform: 'scale(1.6)' }
    ], { duration: 620, easing: 'ease-in', fill: 'forwards' });

    // white/gold bloom swells right before the cut — the over-bright lurch
    animate(bloomEl, [
      { opacity: 0 },
      { opacity: 0.0, offset: 0.25 },
      { opacity: 0.55, offset: 0.62 },
      { opacity: 0 }
    ], { duration: 720, easing: 'ease-in', fill: 'forwards' });

    // --- 3. the black cover via the contract #fade (z-index 20, the real swap)
    // rise to black over the first 560ms (ease-in), then HOLD, swap at apex.
    if (fadeEl) {
      fadeEl.style.transition = 'none';
      var fa = animate(fadeEl, [
        { opacity: 0 },
        { opacity: 1, offset: 0.40 },   // ~560ms → full black
        { opacity: 1, offset: 0.62 },   // brief hold in black
        { opacity: 1 }                  // host arrive() will release via .in iris
      ], { duration: 1400, easing: EASE_IN, fill: 'forwards' });
    }

    // --- 4. the apex swap (under full black) + instant reset of our transforms
    setTimeout(function(){
      // swap content
      safeCb();
      // reset the travel transforms instantly behind black so the iris is clean
      travelTargets.forEach(function(el){
        if (HAS_WAAPI) { try { el.getAnimations && el.getAnimations().forEach(function(a){ a.cancel(); }); } catch(e){} }
        el.style.transform = '';
      });
      streakEl.style.opacity = '0';
      clearStreaks(streakEl);
      // release the black: hand back to the host iris. We ramp #fade down
      // ourselves in case the host relies on us; arrive()'s .in handles scene.
      if (fadeEl) {
        try { fadeEl.getAnimations && fadeEl.getAnimations().forEach(function(a){ a.cancel(); }); } catch(e){}
        fadeEl.style.transition = 'opacity .42s ease';
        // next frame so the swap paints first
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ fadeEl.style.opacity = '0'; }); });
      }
    }, 620); // apex = just after black is solid and bloom has peaked

    // clean the transition override on #fade after it's fully done
    setTimeout(function(){ if (fadeEl) fadeEl.style.transition = ''; }, 1500);
  }

  // Speed-streak painter: radial perspective lines toward the SVG vanishing point
  // (~62% x, 56% y to match the sun/track in the dioramas).
  function paintStreaks(host, tint){
    clearStreaks(host);
    var w = host.clientWidth || stageEl.clientWidth || 1280;
    var h = host.clientHeight || stageEl.clientHeight || 800;
    var cvs = doc.createElement('canvas');
    var dpr = Math.min(win.devicePixelRatio || 1, 2);
    cvs.width = w * dpr; cvs.height = h * dpr;
    cvs.style.cssText = 'width:100%;height:100%;display:block';
    var ctx = cvs.getContext('2d');
    ctx.scale(dpr, dpr);
    var vx = w * 0.62, vy = h * 0.56;
    var col = rgb(tint.key);
    ctx.lineCap = 'round';
    for (var k = 0; k < 70; k++){
      var ang = Math.random() * Math.PI * 2;
      var r0 = 60 + Math.random() * 120;
      var r1 = r0 + 220 + Math.random() * 520;
      var x0 = vx + Math.cos(ang) * r0, y0 = vy + Math.sin(ang) * r0;
      var x1 = vx + Math.cos(ang) * r1, y1 = vy + Math.sin(ang) * r1;
      var a = 0.05 + Math.random() * 0.22;
      var g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, 'rgba(' + col + ',0)');
      g.addColorStop(1, 'rgba(' + col + ',' + a.toFixed(3) + ')');
      ctx.strokeStyle = g;
      ctx.lineWidth = 0.6 + Math.random() * 1.6;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    host.appendChild(cvs);
    host.__cvs = cvs;
  }
  function clearStreaks(host){ if (host.__cvs){ host.removeChild(host.__cvs); host.__cvs = null; } while(host.firstChild) host.removeChild(host.firstChild); }

  // ===========================================================================
  // REVEAL LINES — kinetic prose. blur-in + rise + micro-overshoot settle.
  // Materializes hand-set: each line resolves from a soft blurred lift into a
  // crisp settle with a faint overshoot. Honors the sacred k*0.55s inhale by
  // default. Falls back to the host CSS .show class if WAAPI is absent.
  //   container : the prose column (or any wrapper). Reveals its .line children.
  //   opts: { selector:'.line', stagger:550(ms), start:0(ms), rise:14(px),
  //           blur:8(px), dur:1100(ms), settle:true }
  // ===========================================================================
  function revealLines(container, opts){
    opts = opts || {};
    var sel = opts.selector || '.line';
    var stagger = opts.stagger != null ? opts.stagger : 550;
    var start = opts.start || 0;
    var rise = opts.rise != null ? opts.rise : 14;
    var blur = opts.blur != null ? opts.blur : 8;
    var dur = opts.dur != null ? opts.dur : 1100;
    var settle = opts.settle !== false;
    var nodes = Array.prototype.slice.call((container || stageEl).querySelectorAll(sel));

    nodes.forEach(function(el, k){
      var delay = start + k * stagger;
      kineticReveal(el, { delay: delay, rise: rise, blur: blur, dur: dur, settle: settle });
    });
    return nodes.length;
  }

  // One element's kinetic materialization.
  function kineticReveal(el, o){
    o = o || {};
    if (!el) return;
    if (reduce || !HAS_WAAPI) {
      // Defer to the host's CSS transition (.show) — calm, correct.
      if (o.delay) el.style.transitionDelay = (o.delay/1000) + 's';
      requestAnimationFrame(function(){ el.classList.add('show'); });
      return;
    }
    // Mark shown so any host logic that checks .show stays consistent, but we
    // own the visual via WAAPI; neutralize the CSS transition to avoid a double.
    el.style.transitionDuration = '0s';
    el.style.opacity = '0';
    var rise = o.rise, blur = o.blur, dur = o.dur;

    var frames = o.settle ? [
      { opacity: 0, transform: 'translateY(' + rise + 'px)',        filter: 'blur(' + blur + 'px)' },
      { opacity: 1, transform: 'translateY(-2px)', offset: 0.78,    filter: 'blur(0px)' },
      { opacity: 1, transform: 'translateY(0)',                     filter: 'blur(0px)' }
    ] : [
      { opacity: 0, transform: 'translateY(' + rise + 'px)', filter: 'blur(' + blur + 'px)' },
      { opacity: 1, transform: 'translateY(0)',              filter: 'blur(0px)' }
    ];

    var anim = animate(el, frames, {
      duration: dur,
      delay: o.delay || 0,
      easing: o.settle ? EASE_SETTLE : EASE_OUT_EXPO,
      fill: 'both'
    });
    afterFinish(anim, function(){
      // bake final state; keep .show for host consistency; clear our overrides
      el.classList.add('show');
      el.style.opacity = '';
      el.style.transform = '';
      el.style.filter = '';
      el.style.transitionDuration = '';
      el.style.transitionDelay = '';
    });
  }

  // ===========================================================================
  // REVEAL VOICES — heavier, slower materialization for the italic inner voices.
  // Each voice rises from deeper, with a longer blur-dissolve and a slower
  // settle, as if a thought is condensing. 'linger' voices (means choices)
  // arrive heavier still and keep a faint residual tremor — the weight that
  // won't leave the air. Caller still controls *when* via its own timers; this
  // is invoked per-voice through the returned show(el) OR can reveal the whole
  // container at the bible cadence if called with just (container).
  //
  // Usage A (host drives timing, recommended — matches existing voiceTimer):
  //   var V = revealVoices(container); ... V.show(pEl);   // call when each fires
  // Usage B (fire all now, soft arpeggio): revealVoices(container).all();
  // ===========================================================================
  function revealVoices(container){
    var box = container || stageEl;

    function show(el){
      if (!el) return;
      var linger = el.classList.contains('linger');
      if (reduce || !HAS_WAAPI) {
        requestAnimationFrame(function(){ el.classList.add('show'); });
        if (linger) el.style.borderLeftColor = 'rgba(231,217,195,.5)';
        return;
      }
      el.style.transitionDuration = '0s';
      el.style.opacity = '0';

      var rise = linger ? 18 : 12;
      var blur = linger ? 10 : 7;
      var dur  = linger ? 1700 : 1300;

      var anim = animate(el, [
        { opacity: 0,   transform: 'translateY(' + rise + 'px)', filter: 'blur(' + blur + 'px)' },
        { opacity: 0.9, transform: 'translateY(-3px)', offset: 0.72, filter: 'blur(.4px)' },
        { opacity: 1,   transform: 'translateY(0)',                  filter: 'blur(0px)' }
      ], { duration: dur, easing: EASE_SETTLE, fill: 'both' });

      afterFinish(anim, function(){
        el.classList.add('show');
        el.style.opacity = '';
        el.style.transform = '';
        el.style.filter = '';
        el.style.transitionDuration = '';
        if (linger) lingerTremor(el);   // the residual hang
      });
    }

    function all(){
      var nodes = Array.prototype.slice.call(box.querySelectorAll('.voice'));
      // soft 120ms arpeggio for the impatient tap-to-reveal
      nodes.forEach(function(el, k){
        setTimeout(function(){ show(el); }, reduce ? 0 : k * 120);
      });
    }

    return { show: show, all: all };
  }

  // A faint, slow, almost-subliminal tremor on lingering (means) voices —
  // sonifies/visualizes "his weight still hangs in your palms." Very small,
  // very slow, auto-stops; skipped under reduced motion.
  function lingerTremor(el){
    if (reduce || !HAS_WAAPI) return;
    animate(el, [
      { transform: 'translateX(0)' },
      { transform: 'translateX(.5px)',  offset: 0.25 },
      { transform: 'translateX(-.4px)', offset: 0.6 },
      { transform: 'translateX(.2px)',  offset: 0.85 },
      { transform: 'translateX(0)' }
    ], { duration: 5200, easing: 'ease-in-out', iterations: 2 });
  }

  // ===========================================================================
  // FLASH IMPACT — the instant a choice is made.
  // Layers (fast, ~360ms total): shockwave ring expands from the choice point,
  // a chromatic kick splays red/cyan copies apart and snaps back, and the
  // vignette punches in then relaxes. 'means' impacts are dull/close/cool:
  // smaller ring, slower relax, a cooler grey wash. 'side_effect' impacts are
  // bright/distal: a quick clean ring + warm tick, no lingering wash.
  //   opts: { means:false, mood:'warm'|'cool', x, y } — x/y in px from #stage TL
  //          (defaults to the scene's vanishing point / where hands would be).
  // Reduced motion: a single 120ms vignette tick, no ring/chroma.
  // ===========================================================================
  function flashImpact(opts){
    ensureScaffold();
    opts = opts || {};
    var means = !!opts.means;
    var tint = (opts.mood === 'cool') ? { warm:false, key:'#cdd6dd', rim:'#cdd6dd' }
             : (opts.mood === 'warm') ? { warm:true,  key:'#FFE6AE', rim:'#FFC27A' }
             : moodTint();

    var w = stageEl.clientWidth || 1280, h = stageEl.clientHeight || 800;
    var x = opts.x != null ? opts.x : w * 0.62;
    var y = opts.y != null ? opts.y : (means ? h * 0.86 : h * 0.50); // means lands low/close

    // --- vignette punch (always; the only thing under reduced motion) ---------
    if (reduce || !HAS_WAAPI) {
      vigEl.style.transition = 'opacity .12s ease';
      vigEl.style.opacity = means ? '.5' : '.32';
      setTimeout(function(){ vigEl.style.opacity = '0'; }, 130);
      setTimeout(function(){ vigEl.style.transition = ''; }, 280);
      return;
    }

    animate(vigEl, [
      { opacity: 0 },
      { opacity: means ? 0.6 : 0.34, offset: 0.18 },
      { opacity: 0 }
    ], { duration: means ? 760 : 460, easing: means ? EASE_IN_OUT : 'ease-out', fill: 'forwards' });

    // --- shockwave ring -------------------------------------------------------
    drawShock(shockEl, x, y, tint, means);
    var ringDur = means ? 520 : 360;
    var ringR0 = means ? 0.42 : 0.55, ringR1 = means ? 1.35 : 1.9; // means = tighter, closer
    animate(shockEl, [
      { opacity: 0,                 transform: 'scale(' + ringR0 + ')' },
      { opacity: means ? 0.5 : 0.7, transform: 'scale(' + ((ringR0+ringR1)/2) + ')', offset: 0.22 },
      { opacity: 0,                 transform: 'scale(' + ringR1 + ')' }
    ], { duration: ringDur, easing: 'cubic-bezier(.12,.7,.3,1)', fill: 'forwards' });

    // --- chromatic kick (side_effect = sharp clean kick; means = soft smear) --
    buildChroma(chromaEl, tint);
    var kick = means ? 3 : 7;            // means feels muffled, not electric
    var kickDur = means ? 220 : 150;
    animate(chromaEl, [
      { opacity: 0,                 transform: 'translateX(0)' },
      { opacity: means ? .25 : .5,  transform: 'translateX(' + kick + 'px)', offset: 0.32 },
      { opacity: 0,                 transform: 'translateX(0)' }
    ], { duration: kickDur, easing: 'cubic-bezier(.2,.9,.2,1)', fill: 'forwards' });

    // --- means scenes also flash a brief cold-grey grade wash (the stain) -----
    if (means) {
      animate(bloomEl, [
        { opacity: 0 }, { opacity: 0 }
      ], { duration: 1 }); // ensure bloom is parked
      var wash = mk('tr-wash',
        'position:absolute;inset:0;pointer-events:none;z-index:16;opacity:0;' +
        'background:rgba(120,140,160,.10);mix-blend-mode:multiply');
      if (!wash.isConnected) stageEl.insertBefore(wash, fadeEl || null);
      animate(wash, [
        { opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 0 }
      ], { duration: 1200, easing: 'ease-out', fill: 'forwards' });
    }
  }

  function drawShock(host, x, y, tint, means){
    var w = stageEl.clientWidth || 1280, h = stageEl.clientHeight || 800;
    var rad = Math.min(w, h) * (means ? 0.16 : 0.10);
    var col = tint.key;
    host.innerHTML =
      '<svg width="100%" height="100%" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice" ' +
      'style="position:absolute;inset:0;transform-origin:' + x + 'px ' + y + 'px">' +
        '<circle cx="' + x + '" cy="' + y + '" r="' + rad + '" fill="none" ' +
        'stroke="' + col + '" stroke-width="' + (means ? 1.4 : 2.2) + '" ' +
        'style="filter:blur(' + (means ? 0.8 : 0.3) + 'px)"/>' +
        (means ? '' :
          '<circle cx="' + x + '" cy="' + y + '" r="' + (rad*0.6) + '" fill="none" stroke="' + col + '" ' +
          'stroke-width="1" opacity=".5"/>') +
      '</svg>';
    // set transform-origin on the host for the scale animation to emanate from x,y
    host.style.transformOrigin = x + 'px ' + y + 'px';
  }

  function buildChroma(host, tint){
    // two faint tinted full-frame veils; the animation splays the host which
    // carries both — cheap chromatic-aberration feel without per-channel filters.
    host.innerHTML =
      '<div style="position:absolute;inset:0;background:radial-gradient(120% 90% at 62% 56%, rgba(255,40,60,.06), transparent 60%);transform:translateX(-2px)"></div>' +
      '<div style="position:absolute;inset:0;background:radial-gradient(120% 90% at 62% 56%, rgba(40,180,255,.06), transparent 60%);transform:translateX(2px)"></div>';
  }

  // ---------------------------------------------------------------------------
  return {
    between: between,
    revealLines: revealLines,
    revealVoices: revealVoices,
    flashImpact: flashImpact,
    // also expose the single-element reveal for ad-hoc use (consequence line etc.)
    revealOne: kineticReveal,
    reduce: reduce
  };
}