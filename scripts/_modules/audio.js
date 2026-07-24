function createAudio(){
  // ============================================================================
  // INSIDE THE MOMENT — audio subsystem
  // ONE AudioContext, lazily created on first user gesture. Fully self-contained,
  // no files, no network. No-ops gracefully if Web Audio is unavailable.
  // ============================================================================
  var AC = window.AudioContext || window.webkitAudioContext || null;
  var AUDIO = !!AC;

  // reduced-motion gates the *pulsing/breathing*, not the sound itself.
  var RM = false;
  try { RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}

  // ---- state -----------------------------------------------------------------
  var ctx = null;
  var started = false;            // init() has built the graph
  var muted = false;
  var TARGET = 0.85;              // master target level (un-muted)

  var master, comp, dry, revSend, convolver;
  var bed = null;                 // current bed { mood, nodes:[], gain, stop() }
  var bedXfadeTimer = null;

  // heartbeat
  var hbActive = false, hbIntensity = 0, hbTimer = null, hbPeriod = 1.05, hbMeans = false;
  // hover tension
  var hover = null;               // { osc1, osc2, gain }
  // bookkeeping for hard-stop on scene change
  var transient = [];             // {nodes:[], at} short-lived voices we may want to sweep

  function now(){ return ctx ? ctx.currentTime : 0; }

  // ---- small helpers ---------------------------------------------------------
  function mkGain(v){ var g = ctx.createGain(); g.gain.value = (v==null?0:v); return g; }
  function mkOsc(type, freq){ var o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; return o; }
  function mkFilter(type, freq, q){ var f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; if(q!=null) f.Q.value = q; return f; }

  // route a node to dry + reverb send by amount [0..1]
  function route(node, send){
    node.connect(dry);
    if(send>0){ var s = mkGain(send); node.connect(s); s.connect(revSend); }
  }

  // a reusable noise buffer (white)
  var _noiseBuf = null;
  function noiseBuffer(){
    if(_noiseBuf) return _noiseBuf;
    var len = ctx.sampleRate * 2;
    var b = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = b.getChannelData(0);
    for(var i=0;i<len;i++) d[i] = Math.random()*2-1;
    _noiseBuf = b;
    return b;
  }
  function noiseSource(){ var s = ctx.createBufferSource(); s.buffer = noiseBuffer(); s.loop = true; return s; }

  // brown noise buffer (for means impact body — duller, weightier)
  var _brownBuf = null;
  function brownBuffer(){
    if(_brownBuf) return _brownBuf;
    var len = ctx.sampleRate * 1;
    var b = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = b.getChannelData(0);
    var last = 0;
    for(var i=0;i<len;i++){
      var w = Math.random()*2-1;
      last = (last + 0.02*w)/1.02;
      d[i] = last*3.5;
    }
    _brownBuf = b;
    return b;
  }

  // ---- synthesized convolver impulse ----------------------------------------
  // 1.3s and brighter, down from 2.6s and dark. A long dark tail is a cathedral;
  // this room is small, lit, and has hard walls, and every sound in it should
  // stop when the thing that made it stops.
  function buildReverb(){
    try{
      var dur = 1.3;
      var rate = ctx.sampleRate;
      var len = Math.floor(rate*dur);
      var off = new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(2, len, rate);
      // build noise burst -> lowpass (darken tail) -> exp decay, render to buffer
      var src = off.createBufferSource();
      var ib = off.createBuffer(2, len, rate);
      for(var c=0;c<2;c++){
        var ch = ib.getChannelData(c);
        for(var i=0;i<len;i++){
          var t = i/len;
          // exponential decay envelope
          var env = Math.pow(1-t, 2.4);
          ch[i] = (Math.random()*2-1)*env;
        }
      }
      src.buffer = ib;
      var lp = off.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = 4200; lp.Q.value = 0.4;
      src.connect(lp); lp.connect(off.destination);
      src.start(0);
      return off.startRendering().then(function(buf){
        convolver = ctx.createConvolver();
        convolver.buffer = buf;
        convolver.connect(comp);
        revSend.connect(convolver);
      }).catch(function(){
        // fallback: feedback-delay reverb if offline render fails
        feedbackReverb();
      });
    }catch(e){ feedbackReverb(); return null; }
  }
  function feedbackReverb(){
    // simple stereo-ish feedback delay as a graceful reverb substitute
    var d1 = ctx.createDelay(0.5); d1.delayTime.value = 0.137;
    var d2 = ctx.createDelay(0.5); d2.delayTime.value = 0.191;
    var fb = mkGain(0.42);
    var damp = mkFilter('lowpass', 2400, 0.3);
    revSend.connect(d1); d1.connect(damp); damp.connect(fb); fb.connect(d1); fb.connect(d2);
    d2.connect(comp); d1.connect(comp);
  }

  // ===========================================================================
  // init() — create/resume context, build master chain. Call on first gesture.
  // ===========================================================================
  function init(){
    if(!AUDIO) return;
    if(!ctx){
      try{ ctx = new AC(); }catch(e){ AUDIO=false; return; }
      master = ctx.createGain(); master.gain.value = 0.0001;
      comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.knee.value = 18; comp.ratio.value = 2.8;
      comp.attack.value = 0.006; comp.release.value = 0.28;
      dry = mkGain(1);
      revSend = mkGain(1);
      dry.connect(master);
      // comp is the bus *into* master; reverb + dry both pass through comp.
      // dry -> comp, revSend -> convolver -> comp, comp -> master -> destination
      dry.disconnect();
      dry.connect(comp);
      comp.connect(master);
      master.connect(ctx.destination);
      buildReverb();
    }
    if(ctx.state === 'suspended'){ try{ ctx.resume(); }catch(e){} }
    if(!started){
      started = true;
      // swell master to target (unless muted)
      master.gain.setTargetAtTime(muted?0.0001:TARGET, now(), 0.4);
    }
  }

  // ===========================================================================
  // BEDS — warm (side_effect) vs cool (means). Crossfaded ~1.4s equal power.
  // ===========================================================================
  function buildBed(mood){
    var g = mkGain(0.0001);
    route(g, 0.18);                 // beds get a little room
    var nodes = [];
    var lfos = [];
    var warm = (mood==='warm');

    // --- the bed, retuned for the white room -------------------------------
    // The old bed was a 55Hz sawtooth triad under a 300Hz lowpass: a wall of
    // sub, which is how you score dread. The room is lit now and there is
    // nowhere to hide, so the bed loses its floor — the 55Hz fundamental goes,
    // triangles replace sawtooths, and the cutoff opens. What is left reads as
    // a tuned room rather than an approaching threat.
    var lp = mkFilter('lowpass', warm?900:760, 0.5);
    lp.connect(g);
    var triad = [{f:110,t:'triangle'},{f:164.81,t:'sine'},{f:220,t:'triangle'}];
    var triGain = mkGain(0.035); triGain.connect(lp);
    triad.forEach(function(o,i){
      var osc = mkOsc(o.t, o.f);
      osc.detune.value = (i-1)*4;   // slight spread
      osc.connect(triGain); osc.start();
      nodes.push(osc);
    });
    // breathing LFO on cutoff (disabled under reduced-motion -> static bed)
    if(!RM){
      var lfo = mkOsc('sine', 0.07);
      var lfoG = mkGain(90);
      lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
      nodes.push(lfo); lfos.push(lfo);
    }

    if(warm){
      // gold major-third shimmer C#4
      var sh = mkOsc('sine', 277.18); var shG = mkGain(0.012);
      sh.connect(shG); shG.connect(g); sh.start(); nodes.push(sh);
    } else {
      // cool: beating dyad ~6.5Hz throb + cold highpassed wind
      var b1 = mkOsc('sine',110), b2 = mkOsc('sine',116.54);
      var bG = mkGain(0.02); b1.connect(bG); b2.connect(bG); bG.connect(g);
      b1.start(); b2.start(); nodes.push(b1); nodes.push(b2);
      // wind: white noise -> highpass 1200 -> slow tremolo
      var wind = noiseSource();
      var hp = mkFilter('highpass', 1200, 0.5);
      var wG = mkGain(0.008);
      wind.connect(hp); hp.connect(wG); wG.connect(g); wind.start(); nodes.push(wind);
      if(!RM){
        var trem = mkOsc('sine', 0.13); var tremG = mkGain(0.004);
        trem.connect(tremG); tremG.connect(wG.gain); trem.start(); nodes.push(trem);
      }
    }

    return {
      mood: mood,
      gain: g,
      fadeIn: function(dur){ g.gain.setValueAtTime(Math.max(g.gain.value,0.0001), now()); g.gain.setTargetAtTime(0.62, now(), dur/4); },
      fadeOut: function(dur, then){
        g.gain.setTargetAtTime(0.0001, now(), dur/4);
        setTimeout(function(){
          nodes.forEach(function(n){ try{ n.stop&&n.stop(); }catch(e){} try{ n.disconnect(); }catch(e){} });
          try{ g.disconnect(); }catch(e){}
          if(then) then();
        }, dur*1000 + 120);
      }
    };
  }

  function setMood(mood){
    if(!AUDIO || !started) return;
    mood = (mood==='cool')?'cool':'warm';
    if(bed && bed.mood===mood) return;
    var dur = 1.4;
    var old = bed;
    var nb = buildBed(mood);
    bed = nb;
    nb.fadeIn(dur);
    if(old) old.fadeOut(dur);
  }

  // ===========================================================================
  // HEARTBEAT — synthesized double-thump. Silent during reading; fades in when
  // choices present; accelerates + deepens on hover (intensity), means jitter.
  // ===========================================================================
  function thump(freq, t, gain){
    var o = mkOsc('sine', freq);
    var g = mkGain(0.0001);
    o.connect(g); route(g, 0.04);   // mostly dry — in the chest
    o.start(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t+0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t+0.18);
    o.stop(t+0.22);
    o.onended = function(){ try{o.disconnect();}catch(e){} try{g.disconnect();}catch(e){} };
  }

  function scheduleBeat(){
    if(!hbActive) return;
    var t = now() + 0.02;
    // intensity raises gain +30% and adds means-jitter on 2nd thump
    var amp = 0.09 * (1 + 0.30*hbIntensity);
    thump(110, t, amp);
    var jitter = (hbMeans && hbIntensity>0.01) ? (Math.random()*2-1)*0.018*hbIntensity : 0;
    thump(82, t + 0.15 + jitter, amp*0.92);
    // period lerps 1.05 -> 0.83 by intensity (RM: no acceleration)
    var targetPeriod = RM ? 1.05 : (1.05 - 0.22*hbIntensity);
    // smooth period toward target
    hbPeriod += (targetPeriod - hbPeriod) * 0.5;
    hbTimer = setTimeout(scheduleBeat, hbPeriod*1000);
  }

  function heartbeat(active, intensity){
    if(!AUDIO || !started) return;
    hbIntensity = Math.max(0, Math.min(1, intensity==null?hbIntensity:intensity));
    if(active && !hbActive){
      hbActive = true; hbPeriod = 1.05;
      scheduleBeat();
    } else if(!active && hbActive){
      hbActive = false;
      if(hbTimer){ clearTimeout(hbTimer); hbTimer=null; }
    }
    // if already running, intensity is picked up on next beat (smooth lerp).
  }

  // ===========================================================================
  // IMPACT — the act. means (dull/close/wet) vs side_effect (bright/distant).
  // Pass means=true for a linger/means choice.
  // ===========================================================================
  function impact(means){
    if(!AUDIO || !started) return;
    var t = now();
    if(means){
      // body-soft, DRY, no bright metal
      var o = mkOsc('sine', 55); var g = mkGain(0.0001);
      o.connect(g); route(g, 0.08);
      o.start(t);
      g.gain.setValueAtTime(0.0001,t);
      g.gain.linearRampToValueAtTime(0.5, t+0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t+0.52);
      o.stop(t+0.56); o.onended=function(){try{o.disconnect();g.disconnect();}catch(e){}};
      // dull pitched-down noise body (brown -> lowpass 420)
      var nb = ctx.createBufferSource(); nb.buffer = brownBuffer();
      var nlp = mkFilter('lowpass', 420, 0.4); var ng = mkGain(0.0001);
      nb.connect(nlp); nlp.connect(ng); route(ng, 0.06);
      nb.start(t);
      ng.gain.setValueAtTime(0.18,t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t+0.14);
      nb.stop(t+0.16);
      // sub drop 220ms later — floor going out
      var s = mkOsc('sine', 38); var sg = mkGain(0.0001);
      s.connect(sg); route(sg, 0.05);
      s.start(t+0.22);
      sg.gain.setValueAtTime(0.0001, t+0.22);
      sg.gain.linearRampToValueAtTime(0.18, t+0.24);
      sg.gain.exponentialRampToValueAtTime(0.0001, t+0.84);
      s.stop(t+0.86); s.onended=function(){try{s.disconnect();sg.disconnect();}catch(e){}};
    } else {
      // clean distal: low impact w/ pitch drop + bright metal transient, wet
      var o2 = mkOsc('sine', 70); var g2 = mkGain(0.0001);
      o2.connect(g2); route(g2, 0.5);
      o2.frequency.setValueAtTime(70, t);
      o2.frequency.exponentialRampToValueAtTime(48, t+0.2);
      o2.start(t);
      g2.gain.setValueAtTime(0.0001,t);
      g2.gain.linearRampToValueAtTime(0.5, t+0.004);
      g2.gain.exponentialRampToValueAtTime(0.0001, t+0.42);
      o2.stop(t+0.46); o2.onended=function(){try{o2.disconnect();g2.disconnect();}catch(e){}};
      // metal transient: white noise 60ms -> bandpass 2.2k Q1
      var mn = ctx.createBufferSource(); mn.buffer = noiseBuffer();
      var bp = mkFilter('bandpass', 2200, 1); var mg = mkGain(0.0001);
      mn.connect(bp); bp.connect(mg); route(mg, 0.45);
      mn.start(t);
      mg.gain.setValueAtTime(0.12,t);
      mg.gain.exponentialRampToValueAtTime(0.0001, t+0.06);
      mn.stop(t+0.08);
    }
  }

  // ===========================================================================
  // VOICE — five inner voices, one struck glass/marimba tone each.
  // i in 0..4 -> count A3, faith C4, tend E4, agree G4, virtue B4.
  // means=true -> faith(1)/tend(2) detune octave -14c and double decay.
  // ending=true -> octave lower, softer, wetter (council from a distance).
  // ===========================================================================
  var VOICE_HZ = [220, 261.63, 329.63, 392, 493.88];
  function voice(i, opts){
    if(!AUDIO || !started) return;
    opts = opts||{};
    var idx = Math.max(0, Math.min(4, i|0));
    var base = VOICE_HZ[idx] * (opts.ending ? 0.5 : 1);
    var t = now();
    var heavy = (!!opts.means) && (idx===1 || idx===2);  // faith / tend on a means choice
    var decay = (opts.ending ? 1.7 : 1.4) * (heavy ? 1.85 : 1);
    var gainBase = (opts.ending ? 0.03 : 0.05) * Math.pow(0.9, idx);
    var send = opts.ending ? 0.7 : 0.6;

    function partial(freq, detuneC, g){
      var o = mkOsc('sine', freq);
      if(detuneC) o.detune.value = detuneC;
      var gn = mkGain(0.0001);
      o.connect(gn); route(gn, send);
      o.start(t);
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.linearRampToValueAtTime(g, t+0.004);
      gn.gain.exponentialRampToValueAtTime(0.0001, t+decay);
      o.stop(t+decay+0.05);
      o.onended=function(){try{o.disconnect();gn.disconnect();}catch(e){}};
    }
    partial(base, 0, gainBase);
    // quieter octave-up partner; detuned -14c when heavy (hangs dissonant)
    partial(base*2, heavy ? -14 : 0, gainBase*0.5);
  }

  // ===========================================================================
  // WHOOSH — transition. Noise sweep 1800->180 + sub 60->30. ~520-560ms.
  // ===========================================================================
  function whoosh(){
    if(!AUDIO || !started) return;
    var t = now();
    var dur = RM ? 0.2 : 0.52;
    var n = ctx.createBufferSource(); n.buffer = noiseBuffer();
    var bp = mkFilter('bandpass', 1800, 0.8); var g = mkGain(0.0001);
    n.connect(bp); bp.connect(g); route(g, 0.4);
    bp.frequency.setValueAtTime(1800, t);
    bp.frequency.exponentialRampToValueAtTime(180, t+dur);
    n.start(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.14, t+dur*0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur+0.06);
    n.stop(t+dur+0.1);
    // sub drop into black
    var s = mkOsc('sine', 60); var sg = mkGain(0.0001);
    s.connect(sg); route(sg, 0.3);
    s.frequency.setValueAtTime(60, t);
    s.frequency.exponentialRampToValueAtTime(30, t+dur);
    s.start(t);
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.linearRampToValueAtTime(0.06, t+dur*0.4);
    sg.gain.exponentialRampToValueAtTime(0.0001, t+dur+0.06);
    s.stop(t+dur+0.1); s.onended=function(){try{s.disconnect();sg.disconnect();}catch(e){}};
  }

  // ===========================================================================
  // CHOICE HOVER — sustained tension drone. means=beating minor 2nd (anxious),
  // side_effect=clean held fifth (grave). on=false fades out.
  // ===========================================================================
  function choiceHover(on, means){
    if(!AUDIO || !started) return;
    if(on){
      if(hover) stopHover(0.12);
      var g = mkGain(0.0001);
      route(g, 0.3);
      var f1, f2;
      if(means){ f1=220; f2=233.08; }   // ~13Hz beat, rough
      else { f1=220; f2=329.63; }         // clean fifth, calm/grave
      var o1 = mkOsc('sine', f1), o2 = mkOsc('sine', f2);
      o1.connect(g); o2.connect(g); o1.start(); o2.start();
      g.gain.setTargetAtTime(0.025, now(), 0.13);   // ~400ms to reach
      hover = { o1:o1, o2:o2, g:g };
    } else {
      stopHover(0.1);
    }
  }
  function stopHover(tc){
    if(!hover) return;
    var h = hover; hover = null;
    h.g.gain.setTargetAtTime(0.0001, now(), tc);    // ~300ms out
    setTimeout(function(){
      try{ h.o1.stop(); h.o2.stop(); }catch(e){}
      try{ h.o1.disconnect(); h.o2.disconnect(); h.g.disconnect(); }catch(e){}
    }, 420);
  }

  // ===========================================================================
  // MUTE — ramp master to silence, never suspend mid-tail.
  // ===========================================================================
  function toggleMute(){
    muted = !muted;
    if(AUDIO && started){
      master.gain.setTargetAtTime(muted?0.0001:TARGET, now(), 0.25);
    }
    return muted;
  }

  return {
    init: init,
    setMood: setMood,
    heartbeat: heartbeat,
    impact: impact,
    voice: voice,
    whoosh: whoosh,
    choiceHover: choiceHover,
    toggleMute: toggleMute,
    get muted(){ return muted; }
  };
}