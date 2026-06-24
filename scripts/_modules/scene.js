/* ============================================================================
   INSIDE THE MOMENT — scene-art generator (drop-in replacement)
   buildScene(id, mood, counts) -> full-bleed, layered, animated SVG string.
   100% offline. No assets. SVG only. SMIL+CSS atmosphere baked in.
   Depth groups carry data-depth for orchestrator parallax.

   TRACK LOGIC (reworked):
   - Vanishing point top-center (~640,455). Rails widen DOWN to the near
     foreground. The runaway trolley descends the MAIN line from far (small,
     near the VP) toward the NEAR foreground where the crowd stands — it
     GROWS as it bears down. The orchestrator drives #sy-trolley along the
     exposed path-geometry data-attrs using the CSS Motion Path API.
   - #sy-many (the many) sits dead-ahead in the near foreground.
   - A JUNCTION on the main line ABOVE the crowd; a SPUR branches off to one
     side; #sy-few (the one) sits on that spur.
   - The #sy-scene root carries data-approach / data-stay / data-act /
     data-tscale so the orchestrator can roll, hold, divert, and scale the
     trolley with a continuous (no-jump) path: approach END === stay START
     === act START === the junction.
   ========================================================================== */
function buildScene(id, mood, counts){
  counts = counts || {};
  var COOL = (mood === 'cool');
  var N    = (counts.many != null ? counts.many : 5);

  /* ---- tiny helpers -------------------------------------------------- */
  function clamp(v,a,b){ return v<a?a:(v>b?b:v); }
  // small deterministic PRNG so each id renders identically every time
  function rng(seed){ var s = seed>>>0 || 1; return function(){ s ^= s<<13; s^=s>>>17; s^=s<<5; s>>>=0; return s/4294967296; }; }
  function seedFor(str){ var h=2166136261; for(var i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  var rand = rng(seedFor(id+'|'+mood));

  /* ---- path geometry exposed to the orchestrator -------------------- */
  // Each scene_*() fills these in; they are injected onto the #sy-scene root.
  var GEO = { approach:'', stay:'', act:'', tscale:'0.30 1.15' };

  /* ---- palette ------------------------------------------------------- */
  // Shinkai dusk (warm / side_effect) vs desaturated slate-steel (cool / means)
  var P = COOL ? {
    sky:['#10131c','#1b2330','#2d3a48','#5b6b78','#8c97a0','#a9b2b8'],
    sun:'#cdd6dd', sunGlow:'#cdd6dd', sunCore:'#eef3f6',
    rim:'#cdd6dd', rim2:'#aeb9c2', rimHot:'#e7eef2',
    cloud:'#27313e', cloudHi:'#5c6a76', cloudLo:'#171f29',
    haze:'#b8c2cc', ground:'#1c232c', groundHi:'#39424c',
    rail:'#76828c', railHi:'#c4cdd4', tie:'#222a32',
    fig:'#161c26', figAmb:'#2b3440', figRim:'#cdd6dd',
    god:'#cdd6dd', vig:'#05070b', accent:'#9fb0bd',
    hazard:'#7fd0d8'
  } : {
    sky:['#231f4a','#3a2f63','#6b4f86','#a85a83','#c75f81','#ef9a5a'],
    sun:'#f7c873', sunGlow:'#ffd98a', sunCore:'#fff0c8',
    rim:'#ffc27a', rim2:'#ff8a3d', rimHot:'#fff0c8',
    cloud:'#5a3d63', cloudHi:'#f0a06a', cloudLo:'#2e2347',
    haze:'#e6b98a', ground:'#241b38', groundHi:'#5a4a6b',
    rail:'#8a6a78', railHi:'#ffc27a', tie:'#1b1428',
    fig:'#241b38', figAmb:'#4a4660', figRim:'#ffc27a',
    god:'#ffe6ae', vig:'#0a0710', accent:'#c75f81',
    hazard:'#ffb259'
  };

  /* ---- shared defs (gradients, filters, blur halos) ------------------ */
  function skyStops(){
    var s='', n=P.sky.length;
    for(var i=0;i<n;i++){ s += '<stop offset="'+Math.round(i/(n-1)*100)+'%" stop-color="'+P.sky[i]+'"/>'; }
    return s;
  }

  var defs =
  '<defs>'+
    '<linearGradient id="sy-sky" x1="0" y1="0" x2="0" y2="1">'+skyStops()+'</linearGradient>'+
    '<radialGradient id="sy-sunG" cx="50%" cy="50%" r="50%">'+
      '<stop offset="0%" stop-color="'+P.sunCore+'" stop-opacity="0.95"/>'+
      '<stop offset="22%" stop-color="'+P.sun+'" stop-opacity="0.7"/>'+
      '<stop offset="60%" stop-color="'+P.sunGlow+'" stop-opacity="0.18"/>'+
      '<stop offset="100%" stop-color="'+P.sunGlow+'" stop-opacity="0"/>'+
    '</radialGradient>'+
    '<radialGradient id="sy-vig" cx="50%" cy="46%" r="72%">'+
      '<stop offset="0%" stop-color="'+P.vig+'" stop-opacity="0"/>'+
      '<stop offset="62%" stop-color="'+P.vig+'" stop-opacity="0"/>'+
      '<stop offset="100%" stop-color="'+P.vig+'" stop-opacity="'+(COOL?0.6:0.55)+'"/>'+
    '</radialGradient>'+
    '<linearGradient id="sy-haze" x1="0" y1="0" x2="0" y2="1">'+
      '<stop offset="0%" stop-color="'+P.haze+'" stop-opacity="0"/>'+
      '<stop offset="100%" stop-color="'+P.haze+'" stop-opacity="'+(COOL?0.16:0.12)+'"/>'+
    '</linearGradient>'+
    '<linearGradient id="sy-ground" x1="0" y1="0" x2="0" y2="1">'+
      '<stop offset="0%" stop-color="'+P.groundHi+'"/>'+
      '<stop offset="100%" stop-color="'+P.ground+'"/>'+
    '</linearGradient>'+
    '<linearGradient id="sy-godray" x1="0" y1="0" x2="0" y2="1">'+
      '<stop offset="0%" stop-color="'+P.god+'" stop-opacity="'+(COOL?0.05:0.11)+'"/>'+
      '<stop offset="100%" stop-color="'+P.god+'" stop-opacity="0"/>'+
    '</linearGradient>'+
    '<linearGradient id="sy-rail" x1="0" y1="0" x2="1" y2="0">'+
      '<stop offset="0%" stop-color="'+P.rail+'"/>'+
      '<stop offset="50%" stop-color="'+P.railHi+'"/>'+
      '<stop offset="100%" stop-color="'+P.rail+'"/>'+
    '</linearGradient>'+
    '<filter id="sy-soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7"/></filter>'+
    '<filter id="sy-soft2" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="20"/></filter>'+
    '<filter id="sy-rim" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>'+
  '</defs>';

  /* ---- CSS (animation, all subtle; reduced-motion freezes it) -------- */
  var css =
  '<style>'+
    '#sy-scene .drift{animation:sy-drift 46s linear infinite}'+
    '#sy-scene .drift2{animation:sy-drift2 64s linear infinite}'+
    '#sy-scene .breathe{animation:sy-breathe 10s ease-in-out infinite;transform-origin:center}'+
    '#sy-scene .raybr{animation:sy-raybr 20s ease-in-out infinite;transform-origin:'+(COOL?'700px -60px':'820px 60px')+'}'+
    '#sy-scene .shimmer{animation:sy-shim 5.5s ease-in-out infinite}'+
    '#sy-scene .hazpulse{animation:sy-haz 2.4s ease-in-out infinite}'+
    '#sy-scene .vigbr{animation:sy-vigbr 12s ease-in-out infinite}'+
    '@keyframes sy-drift{from{transform:translateX(0)}to{transform:translateX(-120px)}}'+
    '@keyframes sy-drift2{from{transform:translateX(0)}to{transform:translateX(90px)}}'+
    '@keyframes sy-breathe{0%,100%{transform:scale(1);opacity:.92}50%{transform:scale(1.06);opacity:1}}'+
    '@keyframes sy-raybr{0%,100%{transform:rotate(-2.4deg);opacity:.8}50%{transform:rotate(2.4deg);opacity:1}}'+
    '@keyframes sy-shim{0%,100%{opacity:.45}50%{opacity:1}}'+
    '@keyframes sy-haz{0%,100%{opacity:.78}50%{opacity:.96}}'+
    '@keyframes sy-vigbr{0%,100%{opacity:.96}50%{opacity:1.0}}'+
    '@media (prefers-reduced-motion: reduce){#sy-scene .drift,#sy-scene .drift2,#sy-scene .breathe,#sy-scene .raybr,#sy-scene .shimmer,#sy-scene .hazpulse,#sy-scene .vigbr{animation:none!important}}'+
  '</style>';

  /* ---- reusable building blocks ------------------------------------- */
  function cloud(x,y,s,op){
    var w=s, h=s*0.42;
    return '<g transform="translate('+x+' '+y+')" opacity="'+op+'">'+
      '<ellipse cx="0" cy="0" rx="'+w+'" ry="'+h+'" fill="'+P.cloud+'" filter="url(#sy-soft)"/>'+
      '<ellipse cx="'+(w*0.45)+'" cy="'+(-h*0.25)+'" rx="'+(w*0.6)+'" ry="'+(h*0.7)+'" fill="'+P.cloud+'" filter="url(#sy-soft)"/>'+
      '<ellipse cx="'+(-w*0.5)+'" cy="'+(h*0.1)+'" rx="'+(w*0.55)+'" ry="'+(h*0.6)+'" fill="'+P.cloudLo+'" filter="url(#sy-soft)"/>'+
      '<path d="M'+(-w*0.9)+' '+(-h*0.5)+' Q0 '+(-h*1.5)+' '+(w*0.9)+' '+(-h*0.5)+'" stroke="'+P.cloudHi+'" stroke-width="3" fill="none" opacity="0.5" filter="url(#sy-rim)"/>'+
    '</g>';
  }

  // a rim-lit figure (stylized Tanaka-ish silhouette, ~7.5 head). facing: 1 or -1
  function figure(x,y,sc,facing){
    facing = facing||1;
    var f = 'translate('+x+' '+y+') scale('+(sc*facing)+' '+sc+')';
    return '<g transform="'+f+'">'+
      '<path d="M-9 -52 q9 -10 18 0 q4 14 1 30 l-3 38 q-8 6 -16 0 l-3 -38 q-3 -16 3 -30z" fill="'+P.figAmb+'"/>'+
      '<path d="M-7 -50 q7 -8 14 0 q3 12 1 27 l-3 40 q-6 4 -10 0 l-3 -40 q-2 -15 1 -27z" fill="'+P.fig+'"/>'+
      '<rect x="-7" y="14" width="5.5" height="34" rx="2.4" fill="'+P.fig+'"/>'+
      '<rect x="1.5" y="14" width="5.5" height="34" rx="2.4" fill="'+P.fig+'"/>'+
      '<circle cx="0" cy="-58" r="9" fill="'+P.fig+'"/>'+
      '<path d="M7 -50 q3 12 1 27 l-3 40" stroke="'+P.figRim+'" stroke-width="1.7" fill="none" opacity="0.85" filter="url(#sy-rim)"/>'+
      '<path d="M6 -64 a9 9 0 0 1 3 9" stroke="'+P.figRim+'" stroke-width="1.7" fill="none" opacity="0.9" filter="url(#sy-rim)"/>'+
    '</g>';
  }

  // a crowd cluster (the many) — overlapping rim-lit figures
  function crowd(cx,cy,sc,n){
    var g='', placed = Math.min(n,7);
    var xs=[-44,-22,0,22,44,-12,12], zs=[0,8,2,8,0,16,16];
    for(var i=0;i<placed;i++){
      var s = sc*(0.82 + (zs[i]/40));
      g += figure(cx+xs[i], cy+zs[i]*0.6, s, (i%2?1:-1));
    }
    return g;
  }

  /* ---- ground / track plane (shared across rail scenes) -------------
     Vanishing point top-center ~(640,455). The MAIN line runs straight
     down the center (slightly widening rails) into the near foreground;
     the JUNCTION sits at (640,600); a SPUR branches off to the right to
     the spur seat at (960,660). Side rails widen down to the bottom. ---- */
  var VPX = 640, VPY = 455;        // vanishing point
  var JX = 640, JY = 600;          // junction (on the main line, above crowd)
  var MANYX = 640, MANYY = 706;    // crowd center (near foreground, dead ahead)
  var FEWX = 960, FEWY = 662;      // the one (on the spur)

  function railPlane(){
    var ties='';
    for(var i=0;i<22;i++){
      var t=i/21, y=470 + t*t*300, w=40+t*340, x=640 - w/2 + Math.sin(i)*4;
      ties += '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+(5+t*16)+'" rx="2" fill="'+P.tie+'" opacity="'+(0.5+t*0.4)+'"/>';
    }
    // outer side rails (perspective fan to the foreground bottom corners)
    var L='M150 800 Q540 540 632 460', R='M1130 800 Q740 540 648 460';
    // the MAIN LINE down the center: VP -> junction -> through the crowd
    var mainL = 'M632 460 L626 600 L620 760', mainR = 'M648 460 L654 600 L660 760';
    return '<g>'+
      '<path d="M0 800 L0 470 Q640 430 1280 470 L1280 800 Z" fill="url(#sy-ground)"/>'+
      ties+
      '<path d="'+L+'" stroke="url(#sy-rail)" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.6"/>'+
      '<path d="'+R+'" stroke="url(#sy-rail)" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.6"/>'+
      // main line rails (the trolley's straight path)
      '<path d="'+mainL+'" stroke="url(#sy-rail)" stroke-width="6" fill="none" stroke-linecap="round"/>'+
      '<path d="'+mainR+'" stroke="url(#sy-rail)" stroke-width="6" fill="none" stroke-linecap="round"/>'+
      '<path class="shimmer" d="'+mainL+'" stroke="'+P.railHi+'" stroke-width="1.7" fill="none" opacity="0.6"/>'+
      '<path class="shimmer" d="'+mainR+'" stroke="'+P.railHi+'" stroke-width="1.7" fill="none" opacity="0.6"/>'+
    '</g>';
  }

  // the SPUR rail (branches off the main line at the junction toward #sy-few)
  function spur(){
    var sL='M640 596 Q800 600 932 648', sR='M644 612 Q806 622 948 676';
    return '<g>'+
      '<path d="'+sL+'" stroke="url(#sy-rail)" stroke-width="5.5" fill="none" stroke-linecap="round"/>'+
      '<path d="'+sR+'" stroke="url(#sy-rail)" stroke-width="5.5" fill="none" stroke-linecap="round"/>'+
      '<path class="shimmer" d="'+sL+'" stroke="'+P.railHi+'" stroke-width="1.5" fill="none" opacity="0.6"/>'+
      '<path class="shimmer" d="'+sR+'" stroke="'+P.railHi+'" stroke-width="1.5" fill="none" opacity="0.6"/>'+
    '</g>';
  }

  /* ---- trolley (the threat) -----------------------------------------
     Art centered at LOCAL (0,0), NO transform attr, NO motion SMIL.
     ONLY the pulsing headlight animates. The orchestrator positions,
     scales and moves it via the CSS Motion Path API. ------------------ */
  function trolley(){
    return '<g id="sy-trolley">'+
      '<rect x="-34" y="-23" width="68" height="46" rx="6" fill="'+P.fig+'"/>'+
      '<rect x="-26" y="-15" width="52" height="18" rx="3" fill="'+P.figAmb+'"/>'+
      '<rect x="-34" y="-23" width="68" height="46" rx="6" fill="none" stroke="'+P.rim+'" stroke-width="1.4" opacity="0.7" filter="url(#sy-rim)"/>'+
      '<circle cx="-20" cy="27" r="8" fill="'+P.tie+'"/><circle cx="20" cy="27" r="8" fill="'+P.tie+'"/>'+
      '<circle cx="0" cy="-23" r="6" fill="'+P.hazard+'" opacity="0.9"><animate attributeName="opacity" values="0.4;1;0.4" dur="1.1s" repeatCount="indefinite"/></circle>'+
    '</g>';
  }

  /* ---- hazard light on the track (the one mechanical heartbeat) ----- */
  function hazard(x,y){
    return '<g id="sy-haz" transform="translate('+x+' '+y+')">'+
      '<circle r="26" fill="'+P.hazard+'" opacity="0.16" filter="url(#sy-soft2)" class="hazpulse"/>'+
      '<circle r="7" fill="'+P.hazard+'" class="hazpulse"/>'+
      '<rect x="-2.4" y="0" width="4.8" height="34" fill="'+P.tie+'"/>'+
    '</g>';
  }

  /* ---- god-rays (volumetric beams from the sun) --------------------- */
  function godrays(ox,oy){
    var g='<g class="raybr" opacity="'+(COOL?0.5:0.9)+'">';
    var angs = COOL ? [10,20,30] : [8,16,26,36];
    for(var i=0;i<angs.length;i++){
      var a=angs[i]*Math.PI/180, spread=70+i*30;
      var x1=ox, y1=oy;
      var x2=ox - Math.sin(a)*1400, y2=oy + Math.cos(a)*1400;
      var nx=Math.cos(a)*spread, ny=Math.sin(a)*spread;
      g += '<polygon points="'+x1+','+y1+' '+(x2-nx)+','+(y2-ny)+' '+(x2+nx)+','+(y2+ny)+'" fill="url(#sy-godray)" opacity="'+(0.5-i*0.08)+'"/>';
    }
    return g+'</g>';
  }

  /* ---- sun / moon with bloom --------------------------------------- */
  function sunMoon(x,y,r){
    return '<g class="breathe">'+
      '<circle cx="'+x+'" cy="'+y+'" r="'+(r*2.6)+'" fill="url(#sy-sunG)"/>'+
      '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+P.sunCore+'" filter="url(#sy-soft)" opacity="0.9"/>'+
      '<circle cx="'+x+'" cy="'+y+'" r="'+(r*0.7)+'" fill="'+P.sunCore+'"/>'+
    '</g>';
  }

  /* ---- atmosphere wrappers ----------------------------------------- */
  function vignette(){
    return '<rect class="vigbr" x="0" y="0" width="1280" height="800" fill="url(#sy-vig)" pointer-events="none"/>';
  }
  function hazeBand(y,h){
    return '<rect class="drift2" x="-200" y="'+y+'" width="1700" height="'+h+'" fill="url(#sy-haze)" opacity="'+(COOL?0.9:0.7)+'"/>';
  }

  /* ===================================================================
     SKY + DEEP BACKGROUND (shared) — depth 0.02..0.06
     =================================================================== */
  function backSky(sunX, sunY, sunR){
    return ''+
    '<g data-depth="0.02">'+
      '<rect x="-60" y="-40" width="1400" height="900" fill="url(#sy-sky)"/>'+
    '</g>'+
    '<g data-depth="0.04">'+
      sunMoon(sunX, sunY, sunR)+
      (COOL
        ? '<rect x="0" y="120" width="1280" height="220" fill="'+P.haze+'" opacity="0.05" filter="url(#sy-soft2)"/>'
        : '<rect x="0" y="300" width="1280" height="260" fill="'+P.sunGlow+'" opacity="0.10" filter="url(#sy-soft2)"/>')+
    '</g>';
  }

  function cloudBank(){
    var g='<g data-depth="0.06"><g class="drift">';
    var ys = COOL ? [120,180,90,210] : [150,90,210,130];
    for(var i=0;i<4;i++){
      g += cloud(180+i*340 + rand()*120, ys[i]+rand()*30, 150+rand()*90, COOL?0.5:0.62);
    }
    g += '</g></g>';
    g += '<g data-depth="0.045"><g class="drift2" opacity="0.55">';
    for(var j=0;j<3;j++){ g += cloud(400+j*420, 70+rand()*40, 120+rand()*70, 0.4); }
    g += '</g></g>';
    return g;
  }

  /* ===================================================================
     PER-DILEMMA COMPOSITIONS  (mid + fore; sky shared above)
     #sy-many = crowd the trolley threatens; #sy-few = the one.
     Each scene fills GEO.{approach,stay,act,tscale}.
     =================================================================== */

  var SUN = COOL ? {x:700,y:300,r:46} : {x:820,y:452,r:64};

  /* The shared rail geometry: approach descends the main line from far
     (small, near VP) to the junction; stay continues straight to the
     crowd; act bends onto the spur to #sy-few. Continuous at the junction. */
  function railGeo(){
    GEO.approach = 'M638 470 L634 520 L'+JX+' '+JY;          // far(VP) -> junction
    GEO.stay     = 'M'+JX+' '+JY+' L632 660 L'+MANYX+' '+MANYY; // junction -> crowd (straight)
    GEO.act      = 'M'+JX+' '+JY+' Q800 612 '+FEWX+' '+FEWY;    // junction -> spur -> the one
    GEO.tscale   = '0.30 1.15';
  }

  function scene_switch(){
    var sun=SUN; railGeo();
    return backSky(sun.x,sun.y,sun.r)+cloudBank()+godrays(sun.x,sun.y)+
    '<g data-depth="0.09">'+hazeBand(430,120)+
      '<path d="M120 800 Q380 540 560 470 L640 800 Z" fill="'+P.cloudLo+'" opacity="0.35"/>'+
    '</g>'+
    '<g data-depth="0.16">'+ railPlane()+ spur()+ hazard(700,604)+
    '</g>'+
    '<g data-depth="0.22">'+ trolley() +'</g>'+
    '<g data-depth="0.30">'+
      '<g id="sy-few">'+figure(FEWX,FEWY,1.02,-1)+'</g>'+
      '<g id="sy-many">'+crowd(MANYX,MANYY,0.96,N)+'</g>'+
      '<g transform="translate(1150 740)"><rect x="-6" y="-70" width="12" height="80" rx="6" fill="'+P.fig+'"/><circle cx="0" cy="-74" r="12" fill="'+P.rim2+'" opacity="0.85"/></g>'+
    '</g>';
  }

  function scene_loop(){
    var sun=SUN; railGeo();
    // loop scene: the spur loops back toward the main line (return rail)
    var loopPath = 'M640 596 Q820 600 936 656 Q1010 700 952 752 Q880 800 720 720';
    return backSky(sun.x,sun.y,sun.r)+cloudBank()+godrays(sun.x,sun.y)+
    '<g data-depth="0.10">'+hazeBand(430,130)+'</g>'+
    '<g data-depth="0.16">'+ railPlane()+ spur()+ hazard(700,604)+
      '<path d="'+loopPath+'" stroke="url(#sy-rail)" stroke-width="5.5" fill="none" opacity="0.9"/>'+
      '<path class="shimmer" d="'+loopPath+'" stroke="'+P.railHi+'" stroke-width="1.5" fill="none" opacity="0.55"/>'+
    '</g>'+
    '<g data-depth="0.22">'+ trolley() +'</g>'+
    '<g data-depth="0.30">'+
      '<g id="sy-few">'+figure(FEWX,FEWY,1.02,1)+'</g>'+
      '<g id="sy-many">'+crowd(MANYX,MANYY,0.96,N)+'</g>'+
      '<g transform="translate(1150 740)"><rect x="-6" y="-66" width="12" height="76" rx="6" fill="'+P.fig+'"/><circle cx="0" cy="-70" r="11" fill="'+P.rim2+'" opacity="0.8"/></g>'+
    '</g>';
  }

  function scene_beloved(){
    var sun=SUN; railGeo();
    return backSky(sun.x,sun.y,sun.r)+cloudBank()+godrays(sun.x,sun.y)+
    '<g data-depth="0.09">'+hazeBand(440,120)+
      '<path d="M120 800 Q420 540 600 470 L700 800 Z" fill="'+P.cloudLo+'" opacity="0.3"/>'+
    '</g>'+
    '<g data-depth="0.16">'+ railPlane()+ spur()+ hazard(700,604)+
    '</g>'+
    '<g data-depth="0.22">'+ trolley() +'</g>'+
    '<g data-depth="0.30">'+
      '<g id="sy-few"><g transform="translate('+FEWX+' '+FEWY+')">'+
        '<circle cx="0" cy="-40" r="64" fill="'+P.sunGlow+'" opacity="0.18" filter="url(#sy-soft2)" class="breathe"/>'+
        figure(0,0,1.10,-1)+
        '<path d="M-16 -36 q-30 6 -44 30" stroke="'+P.figRim+'" stroke-width="2" fill="none" opacity="0.7" filter="url(#sy-rim)"/>'+
      '</g></g>'+
      '<g id="sy-many">'+crowd(MANYX,MANYY,0.94,N)+'</g>'+
      '<g transform="translate(1158 740)"><rect x="-6" y="-70" width="12" height="80" rx="6" fill="'+P.fig+'"/><circle cx="0" cy="-74" r="12" fill="'+P.rim2+'" opacity="0.85"/></g>'+
    '</g>';
  }

  function scene_footbridge(){
    var sun=SUN;
    // crowd far-near on the main line; the body on the bridge interposes.
    var bridgeY = 612, bodyX = 640, bodyY = bridgeY;
    GEO.approach = 'M638 470 L636 530 L640 590';                   // far -> just above bridge
    GEO.stay     = 'M640 590 L636 660 L'+MANYX+' '+MANYY;          // through bridge to the many
    GEO.act      = 'M640 590 L640 '+bodyY;                          // SHORT advance, stops at the body
    GEO.tscale   = '0.30 1.12';
    return backSky(sun.x,sun.y,sun.r)+cloudBank()+godrays(sun.x,sun.y)+
    '<g data-depth="0.10">'+hazeBand(440,140)+
      '<rect x="0" y="560" width="1280" height="240" fill="'+P.cloudLo+'" opacity="0.4"/>'+
    '</g>'+
    '<g data-depth="0.16">'+ railPlane()+ hazard(700,560)+
    '</g>'+
    '<g data-depth="0.22">'+ trolley() +'</g>'+
    '<g data-depth="0.30">'+
      '<g id="sy-many">'+crowd(MANYX,MANYY,0.96,N)+'</g>'+
    '</g>'+
    // the footbridge spans across, above the crowd; the one stands on it
    '<g data-depth="0.26">'+
      '<rect x="-40" y="'+(bridgeY-22)+'" width="1360" height="22" fill="'+P.ground+'"/>'+
      '<rect x="-40" y="'+(bridgeY-22)+'" width="1360" height="5" fill="'+P.rim2+'" opacity="0.55" filter="url(#sy-rim)"/>'+
      '<g stroke="'+P.fig+'" stroke-width="5"><line x1="-40" y1="'+(bridgeY-56)+'" x2="1320" y2="'+(bridgeY-56)+'"/></g>'+
      (function(){var b='';for(var i=0;i<22;i++){var x=-20+i*60;b+='<line x1="'+x+'" y1="'+(bridgeY-56)+'" x2="'+x+'" y2="'+(bridgeY-22)+'" stroke="'+P.fig+'" stroke-width="4"/>';}return b;})()+
      '<rect x="150" y="'+bridgeY+'" width="16" height="188" fill="'+P.fig+'" opacity="0.8"/>'+
      '<rect x="1110" y="'+bridgeY+'" width="16" height="188" fill="'+P.fig+'" opacity="0.8"/>'+
    '</g>'+
    '<g data-depth="0.34">'+
      '<g id="sy-few">'+figure(bodyX,bridgeY-56,1.06,-1)+
        '<line x1="'+bodyX+'" y1="'+(bridgeY-6)+'" x2="'+bodyX+'" y2="'+(bridgeY-22)+'" stroke="'+P.figRim+'" stroke-width="1.2" opacity="0.5"/>'+
      '</g>'+
    '</g>';
  }

  function scene_ward(){
    // hospital, no rails. #sy-trolley = a cold creeping shadow/lamp token.
    var bn = Math.max(1,Math.min(N,5)), beds='';
    for(var i=0;i<bn;i++){
      var bx=170+i*200, by=520;
      beds += '<g transform="translate('+bx+' '+by+')">'+
        '<rect x="-70" y="0" width="140" height="60" rx="8" fill="'+P.groundHi+'"/>'+
        '<rect x="-70" y="0" width="140" height="14" rx="7" fill="'+P.haze+'" opacity="0.3"/>'+
        '<path d="M-58 14 Q-30 -8 6 4 Q40 14 58 14 L58 30 L-58 30 Z" fill="'+P.fig+'" opacity="0.92"/>'+
        '<circle cx="-44" cy="6" r="9" fill="'+P.fig+'"/>'+
        '<rect x="44" y="-58" width="40" height="30" rx="3" fill="'+P.tie+'"/>'+
        '<path d="M48 -44 l5 0 3 -10 4 18 4 -8 16 0" stroke="'+P.hazard+'" stroke-width="1.6" fill="none" opacity="0.85"/>'+
      '</g>';
    }
    // the threat glides from the far ceiling/door toward the beds or the visitor
    GEO.approach = 'M640 300 L640 380 L640 460';        // descends from the upper room
    GEO.stay     = 'M640 460 L640 520 L560 560';        // glides toward the beds (#sy-many)
    GEO.act      = 'M640 460 Q900 520 1180 560';        // glides toward the lone visitor
    GEO.tscale   = '0.55 1.0';
    return ''+
    '<g data-depth="0.02"><rect x="-60" y="-40" width="1400" height="900" fill="url(#sy-sky)"/></g>'+
    '<g data-depth="0.05">'+
      '<rect x="430" y="60" width="420" height="300" rx="6" fill="'+P.sky[2]+'" opacity="0.9"/>'+
      '<rect x="430" y="60" width="420" height="300" rx="6" fill="url(#sy-sunG)" opacity="0.5"/>'+
      '<line x1="640" y1="60" x2="640" y2="360" stroke="'+P.fig+'" stroke-width="10"/>'+
      '<line x1="430" y1="210" x2="850" y2="210" stroke="'+P.fig+'" stroke-width="10"/>'+
      '<rect x="430" y="60" width="420" height="300" rx="6" fill="none" stroke="'+P.fig+'" stroke-width="14"/>'+
      sunMoon(640,150,38)+
    '</g>'+
    '<g data-depth="0.07" class="raybr" opacity="0.6">'+
      '<polygon points="470,360 810,360 1010,800 270,800" fill="url(#sy-godray)"/>'+
    '</g>'+
    '<g data-depth="0.12">'+hazeBand(380,180)+
      '<rect x="0" y="560" width="1280" height="240" fill="url(#sy-ground)"/>'+
      '<line x1="0" y1="560" x2="1280" y2="560" stroke="'+P.haze+'" stroke-width="1.4" opacity="0.25"/>'+
    '</g>'+
    // cold advancing threat token (surgical lamp glide / shadow band), centered at 0,0
    '<g data-depth="0.20">'+
      '<g id="sy-trolley">'+
        '<ellipse cx="0" cy="0" rx="120" ry="30" fill="'+P.cloudLo+'" opacity="0.5" filter="url(#sy-soft2)"/>'+
        '<circle cx="0" cy="-6" r="34" fill="'+P.haze+'" opacity="0.12" filter="url(#sy-soft2)"/>'+
        '<ellipse cx="0" cy="-6" rx="30" ry="14" fill="none" stroke="'+P.rim2+'" stroke-width="2.4" opacity="0.6" filter="url(#sy-rim)"/>'+
        '<circle cx="0" cy="-6" r="6" fill="'+P.hazard+'" opacity="0.85"><animate attributeName="opacity" values="0.4;1;0.4" dur="1.1s" repeatCount="indefinite"/></circle>'+
      '</g>'+
    '</g>'+
    '<g data-depth="0.22"><g id="sy-many">'+beds+'</g></g>'+
    '<g data-depth="0.32">'+
      '<rect x="1120" y="300" width="120" height="500" fill="'+P.cloudLo+'" opacity="0.7"/>'+
      '<rect x="1120" y="300" width="6" height="500" fill="'+P.rim2+'" opacity="0.4" filter="url(#sy-rim)"/>'+
      '<g id="sy-few">'+figure(1180,600,1.18,-1)+'</g>'+
    '</g>';
  }

  function scene_passenger(){
    var sun=SUN;
    // the car descends the road from far; stay = into the pedestrians,
    // act = swerve toward the wall / the passenger arc.
    GEO.approach = 'M638 466 L632 520 L626 590';                 // far road -> near (junction)
    GEO.stay     = 'M626 590 L600 650 L560 700';                 // straight into the three peds
    GEO.act      = 'M626 590 Q760 660 1120 720';                 // swerve toward the wall
    GEO.tscale   = '0.30 1.18';
    return backSky(sun.x,sun.y,sun.r)+cloudBank()+godrays(sun.x,sun.y)+
    '<g data-depth="0.09">'+hazeBand(440,130)+
      '<path d="M120 800 Q420 540 600 470 L700 800 Z" fill="'+P.cloudLo+'" opacity="0.3"/>'+
    '</g>'+
    '<g data-depth="0.15">'+
      '<path d="M40 800 Q560 520 632 462 L648 462 Q720 520 1240 800 Z" fill="url(#sy-ground)"/>'+
      (function(){var d='';for(var i=0;i<10;i++){var t=i/9,y=470+t*t*320,w=4+t*30,x=640-w/2;d+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+(10+t*30)+'" rx="2" fill="'+P.railHi+'" opacity="'+(0.3+t*0.5)+'"/>';}return d;})()+
      (function(){var s='';for(var i=0;i<7;i++){var x=360+i*90;s+='<rect x="'+x+'" y="700" width="56" height="90" rx="3" fill="'+P.haze+'" opacity="0.22" transform="skewX(-6)"/>';}return s;})()+
      hazard(980,470)+
    '</g>'+
    // twin-headlight car token, centered at LOCAL (0,0), no motion SMIL
    '<g data-depth="0.22">'+
      '<g id="sy-trolley">'+
        '<rect x="-44" y="-14" width="88" height="34" rx="10" fill="'+P.fig+'" opacity="0.94"/>'+
        '<rect x="-30" y="-26" width="60" height="20" rx="8" fill="'+P.figAmb+'"/>'+
        '<circle cx="-27" cy="0" r="9" fill="'+P.sunCore+'" opacity="0.9" filter="url(#sy-soft)"/>'+
        '<circle cx="27" cy="0" r="9" fill="'+P.sunCore+'" opacity="0.9" filter="url(#sy-soft)"/>'+
        '<circle cx="-27" cy="0" r="3" fill="'+P.rimHot+'"/>'+
        '<circle cx="27" cy="0" r="3" fill="'+P.rimHot+'"><animate attributeName="opacity" values="0.5;1;0.5" dur="1.1s" repeatCount="indefinite"/></circle>'+
      '</g>'+
      '<g id="sy-many">'+crowd(560,700,0.9,N)+'</g>'+
    '</g>'+
    '<g data-depth="0.34">'+
      '<g id="sy-few">'+
        '<path d="M470 800 Q470 690 640 678 Q810 690 810 800" fill="none" stroke="'+P.fig+'" stroke-width="34" stroke-linecap="round" opacity="0.92"/>'+
        '<path d="M470 800 Q470 690 640 678 Q810 690 810 800" fill="none" stroke="'+P.figRim+'" stroke-width="2.4" stroke-linecap="round" opacity="0.55" filter="url(#sy-rim)"/>'+
        '<circle cx="512" cy="704" r="20" fill="'+P.figAmb+'"/><circle cx="768" cy="704" r="20" fill="'+P.figAmb+'"/>'+
        '<path d="M512 704 a20 20 0 0 1 6 -16" stroke="'+P.figRim+'" stroke-width="2" fill="none" opacity="0.7" filter="url(#sy-rim)"/>'+
      '</g>'+
      '<rect x="1180" y="430" width="120" height="370" fill="'+P.fig+'" opacity="0.7"/>'+
      '<rect x="1180" y="430" width="6" height="370" fill="'+P.rim2+'" opacity="0.4" filter="url(#sy-rim)"/>'+
    '</g>';
  }

  /* ---- dispatch ----------------------------------------------------- */
  var body;
  switch(id){
    case 'footbridge': body = scene_footbridge(); break;
    case 'loop':       body = scene_loop();       break;
    case 'beloved':    body = scene_beloved();    break;
    case 'ward':       body = scene_ward();       break;
    case 'passenger':  body = scene_passenger();  break;
    case 'switch':
    default:           body = scene_switch();     break;
  }

  /* ---- assemble full-bleed SVG ------------------------------------- */
  return '<svg id="sy-scene" viewBox="0 0 1280 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"'+
    ' data-approach="'+GEO.approach+'"'+
    ' data-stay="'+GEO.stay+'"'+
    ' data-act="'+GEO.act+'"'+
    ' data-tscale="'+GEO.tscale+'">'+
    defs + css +
    '<g id="sy-world">'+ body +'</g>'+
    vignette()+   /* locked-to-frame atmosphere, must NOT parallax */
  '</svg>';
}
