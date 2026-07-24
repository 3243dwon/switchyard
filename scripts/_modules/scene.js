/* ============================================================================
   SCENE — the dilemma as a technical drawing.

   Every dilemma is one wide elevation on white: hairline track, the library's own
   person glyph where the people are, and one coloured body that is going to
   arrive. No sky, no god-rays, no vignette, no weather, no shimmer. A drawing
   does not have a mood; it has a geometry, and the geometry is the argument.

   Three ideas carry the whole thing:

     1. THE TRAIL. A copy of the approach path is drawn in --signal and fills in
        underneath the trolley as it closes. At the moment of choice the sheet
        literally shows how much line is left. This replaces the descent + the
        heartbeat + the god-rays + the bloom with one diagram gesture.

     2. THE BRACKET. Means-dilemmas draw the victim inside a hairline bracket —
        the drafting convention for "this element is a component of the
        assembly." That is the doctrine of double effect, which is the one thing
        this project is actually about, drawn rather than narrated.

     3. THE STRIKE. Death is not a fade and not a blur. The glyph's fill drops
        out and leaves an outline — present, empty, still exactly where it was —
        and one line is drawn through the group's baseline. Fading them out on
        white would let them dissolve into the paper, which is the
        aestheticization all over again.

   CONTRACT WITH THE ORCHESTRATOR (unchanged, and load-bearing):
     GEO.approach — far -> junction. Played while you decide.
     GEO.stay     — junction -> the many.
     GEO.act      — junction -> the one.
     GEO.tscale   — "farScale nearScale"
   Emitted as data-* on #sy-scene and consumed as CSS Motion Path values. The
   endpoint of `approach` must equal the start of `stay` and `act`, or the
   trolley visibly jumps at the moment of decision.
   ============================================================================ */
function buildScene(id, mood, counts){
  counts = counts || {};
  var MEANS = (mood === 'cool');   // the victim's body is the mechanism
  var N     = (counts.many != null ? counts.many : 5);

  /* Palette. Injected by the builder as C so CSS, this file, and the library's
     editorial renderer all read the same values; the fallback keeps the module
     runnable on its own. */
  var K = (typeof C !== 'undefined') ? C : {
    ink:'#1D1D1F', ink2:'#6E6E73', ink3:'#86868B', ink4:'#AEAEB2',
    paper:'#FFFFFF', rule:'#D2D2D7', signal:'#D85A30', signalInk:'#993C1D'
  };

  var GEO  = { approach:'', stay:'', act:'', tscale:'0.34 1.0' };
  var VIEW = '0 400 1280 400';     // one band, shared by every scene, so the
                                   // plate never resizes between dilemmas

  /* Shared geometry — coordinates unchanged from the original composition. */
  var JX = 640, JY = 600;          // junction
  var MANYX = 640, MANYY = 706;    // the many
  var FEWX  = 960, FEWY  = 662;    // the one
  var HORIZON = 470;

  /* =====================================================================
     VOCABULARY
     ===================================================================== */

  /* A person. This is `person()` from src/render/editorial.ts:17 — the glyph
     the library already draws — so the renderer and the experience finally
     agree. Head plus rounded shoulders, baseline-anchored, no face.
     `profile` offsets the head and drops one shoulder: that is how "he never
     turns around" gets into the drawing instead of only into the prose. */
  function person(x, baseline, s, profile){
    s = s || 1;
    var hx = profile ? profile * 1.6 : 0;
    return '<g class="fig" transform="translate('+x.toFixed(1)+','+baseline.toFixed(1)+') scale('+s.toFixed(3)+')">'+
      '<circle cx="'+hx+'" cy="-26" r="5"/>'+
      '<path d="M0,-21 C-5,-21 -6,-16 -6,-2 L6,-2 C6,-16 5,-21 0,-21 Z"/>'+
    '</g>';
  }

  /* The many. Evenly measured — a crowd in a thought experiment is a count, and
     the drawing must not let five feel like a mob. The ±2% height jitter is
     deterministic per index: presence at the hand-drawn scale, without faces. */
  function group(cx, cy, s, n){
    var g = '', e = extent(cx, s, n);
    for (var i = 0; i < n; i++){
      var x = e.left + i*e.gap;
      var d = Math.abs(i - (n-1)/2) / Math.max(1, (n-1)/2);
      var j = 1 + ((i * 37) % 5 - 2) * 0.01;            // -2%..+2%, stable
      g += person(x, cy + d*8, s * j * (1 - d*0.05));
    }
    return g;
  }

  /* One source of truth for how wide a group actually is, so the strike and
     the callout land on the people rather than near them. */
  function extent(cx, s, n){
    var gap = 62 * s, span = (n - 1) * gap;
    return { gap:gap, left:cx - span/2, right:cx + span/2 };
  }

  /* The strike. pathLength=1 so one CSS rule drives every length. */
  function strike(x1, x2, y){
    return '<line class="strike" x1="'+x1+'" y1="'+y+'" x2="'+x2+'" y2="'+y+'" pathLength="1"/>';
  }

  /* The means bracket. Drafting notation: this body is part of the mechanism. */
  function bracket(cx, baseline, w, h){
    var l = cx - w/2, r = cx + w/2, t = baseline - h, a = 9;
    return '<g class="brk">'+
      '<path d="M'+(l+a)+' '+t+' H'+l+' V'+baseline+' H'+(l+a)+'"/>'+
      '<path d="M'+(r-a)+' '+t+' H'+r+' V'+baseline+' H'+(r-a)+'"/>'+
    '</g>';
  }

  /* A dimension callout — leader line and a count. This is what makes it a
     drawing rather than a picture, and it puts the arithmetic in front of you
     at the moment you would rather not look at it. */
  /* Sizes are in viewBox units, and the band is 400 units presented at roughly
     160px — so everything here renders at about 0.4×. A 13-unit numeral would
     arrive as 5px. Strokes are exempt via non-scaling-stroke; text is not. */
  function callout(x, y, text){
    return '<g class="call"><line x1="'+x+'" y1="'+y+'" x2="'+x+'" y2="'+(y-30)+'"/>'+
      '<text x="'+x+'" y="'+(y-44)+'" text-anchor="middle">'+text+'</text></g>';
  }

  /* The many are counted from the side: a numeral above them would sit exactly
     where the trolley comes to rest at the junction. */
  function calloutSide(x, y, text){
    return '<g class="call"><line x1="'+x+'" y1="'+y+'" x2="'+(x+30)+'" y2="'+y+'"/>'+
      '<text x="'+(x-12)+'" y="'+(y+11)+'" text-anchor="end">'+text+'</text></g>';
  }

  /* The track. Two hairlines in perspective, ties as ticks. */
  function railPlane(){
    var ties = '';
    for (var i = 0; i < 20; i++){
      var t = i/19, y = HORIZON + 10 + t*t*300, w = 26 + t*300, x = 640 - w/2;
      ties += '<line class="tie" x1="'+x.toFixed(1)+'" y1="'+y.toFixed(1)+'" x2="'+(x+w).toFixed(1)+'" y2="'+y.toFixed(1)+'"/>';
    }
    return '<line class="horizon" x1="0" y1="'+HORIZON+'" x2="1280" y2="'+HORIZON+'"/>'+
      ties +
      '<path class="rail" d="M632 '+(HORIZON+6)+' L626 600 L618 780"/>'+
      '<path class="rail" d="M648 '+(HORIZON+6)+' L654 600 L662 780"/>';
  }

  /* The spur, and the switch point that sends it there. */
  function spur(){
    return '<path class="rail" d="M640 596 Q800 600 934 650"/>'+
      '<path class="rail" d="M646 612 Q806 622 950 678"/>'+
      '<line class="lever" x1="'+JX+'" y1="'+JY+'" x2="'+(JX+30)+'" y2="'+(JY-20)+'"/>'+
      '<circle class="node" cx="'+JX+'" cy="'+JY+'" r="3"/>';
  }

  /* The trolley. The only coloured thing in the system. Local (0,0), no
     transform and no SMIL — the orchestrator owns its position and scale. */
  function trolley(){
    return '<g id="sy-trolley"><rect x="-32" y="-20" width="64" height="40" rx="8"/></g>';
  }

  /* The trail the trolley has already covered. */
  function trail(d){
    return '<path id="sy-trail" class="trail" d="'+d+'" pathLength="1"/>';
  }

  /* =====================================================================
     HOW IT READS ALIVE, AND HOW IT READS DEAD
     ===================================================================== */
  var css =
  '<style>'+
    /* Hairlines hold at 1px regardless of how far the 1280-unit viewBox is
       scaled down. Deliberately NOT applied to .trail and .strike: non-scaling
       strokes are dashed in screen units, which defeats pathLength="1" and turns
       a line that should draw itself into a row of 1px dots. */
    '#sy-scene .rail,#sy-scene .tie,#sy-scene .horizon,#sy-scene .hatch,'+
    '#sy-scene .lever,#sy-scene .node,#sy-scene .edge,#sy-scene .brk,'+
    '#sy-scene .arm,#sy-scene .fig,#sy-scene .call line{vector-effect:non-scaling-stroke}'+
    '#sy-scene .rail{fill:none;stroke:'+K.ink3+';stroke-width:1.5;stroke-linecap:round}'+
    '#sy-scene .tie,#sy-scene .horizon,#sy-scene .hatch{stroke:'+K.rule+';stroke-width:1;fill:none}'+
    '#sy-scene .lever{stroke:'+K.ink3+';stroke-width:1.5;stroke-linecap:round}'+
    '#sy-scene .node{fill:'+K.paper+';stroke:'+K.ink3+';stroke-width:1.5}'+
    '#sy-scene .edge{fill:none;stroke:'+K.ink3+';stroke-width:1.5;stroke-linejoin:round}'+
    '#sy-scene .brk{fill:none;stroke:'+K.ink3+';stroke-width:1;stroke-linejoin:round}'+
    '#sy-scene .arm{fill:none;stroke:'+K.ink+';stroke-width:1.5;stroke-linecap:round}'+
    '#sy-scene .fig{fill:'+K.ink+';stroke:none;transition:fill 240ms cubic-bezier(.22,.61,.36,1)}'+
    '#sy-scene .call line{stroke:'+K.rule+';stroke-width:1}'+
    '#sy-scene .call text{font:500 32px/1 var(--sans,-apple-system,system-ui,sans-serif);'+
      'fill:'+K.ink3+';font-variant-numeric:tabular-nums;transition:fill 240ms ease}'+
    '#sy-trolley rect{fill:'+K.signal+';transition:fill 240ms cubic-bezier(.22,.61,.36,1)}'+

    /* The covered line, and the strike. Widths are in viewBox units because
       these two scale with the drawing: the band is presented at roughly 0.4x,
       so 7 units arrives as ~2.8px. */
    '#sy-scene .trail{fill:none;stroke:'+K.signal+';stroke-width:7;stroke-linecap:round;'+
      'stroke-dasharray:1;stroke-dashoffset:1}'+

    /* the strike: one line, drawn left to right, and that is the whole death animation */
    '#sy-scene .strike{stroke:'+K.signalInk+';stroke-width:5;stroke-linecap:round;'+
      'stroke-dasharray:1;stroke-dashoffset:1;'+
      'transition:stroke-dashoffset 400ms cubic-bezier(.22,.61,.36,1)}'+
    '#sy-scene.dead-many #sy-many .strike,#sy-scene.dead-few #sy-few .strike{stroke-dashoffset:0}'+

    /* present, empty, and exactly where they were */
    '#sy-scene.dead-many #sy-many .fig,#sy-scene.dead-few #sy-few .fig{'+
      'fill:none;stroke:'+K.ink4+';stroke-width:1}'+
    '#sy-scene.dead-many #sy-many .call text,#sy-scene.dead-few #sy-few .call text{fill:'+K.signalInk+'}'+

    /* the signal is spent the moment it lands */
    '#sy-scene.dead-many #sy-trolley rect,#sy-scene.dead-few #sy-trolley rect{fill:'+K.ink+'}'+

    '@media (prefers-reduced-motion:reduce){'+
      '#sy-scene .strike{transition:none}#sy-scene .fig{transition:none}}'+
  '</style>';

  /* =====================================================================
     THE SIX
     ===================================================================== */

  function railGeo(){
    GEO.approach = 'M638 470 L634 520 L'+JX+' '+JY;
    GEO.stay     = 'M'+JX+' '+JY+' L632 660 L'+MANYX+' '+MANYY;
    GEO.act      = 'M'+JX+' '+JY+' Q800 612 '+FEWX+' '+FEWY;
    GEO.tscale   = '0.34 1.0';
  }

  /* the many, the one, and their numbers — shared by the four rail scenes */
  function parties(oneExtra){
    var e = extent(MANYX, 1.7, N);
    return '<g id="sy-many">'+ group(MANYX, MANYY, 1.7, N) +
        strike(e.left - 34, e.right + 34, MANYY + 8) +
        calloutSide(e.left - 46, MANYY - 18, String(N)) +
      '</g>'+
      '<g id="sy-few">'+ person(FEWX, FEWY, 1.55, -1) + (oneExtra || '') +
        (MEANS ? bracket(FEWX, FEWY + 6, 58, 62) : '') +
        strike(FEWX - 34, FEWX + 34, FEWY + 6) +
        callout(FEWX, FEWY - 60, '1') +
      '</g>';
  }

  function scene_switch(){
    railGeo();
    return railPlane() + spur() + trail(GEO.approach) +
      trolley() + parties();
  }

  function scene_loop(){
    railGeo();
    // The spur rejoins the main line, so the body is what stops it and the
    // topology alone derives `means`. The arrowhead is the point: without it,
    // the one idea this scene exists to show is invisible.
    return railPlane() + spur() +
      '<path class="rail" marker-end="url(#sy-arrow)" d="M950 678 Q1030 720 966 758 Q880 796 714 722"/>'+
      trail(GEO.approach) + trolley() + parties();
  }

  function scene_beloved(){
    railGeo();
    // The beloved is drawn exactly like every other one, except for a single
    // stroke: an arm, lifted. They are waving at you. The drawing does not
    // otherwise plead the case — the prose can do that.
    var arm = '<path class="arm" d="M'+(FEWX-9)+' '+(FEWY-30)+' q-16 -6 -20 -22"/>';
    return railPlane() + spur() + trail(GEO.approach) + trolley() + parties(arm);
  }

  function scene_footbridge(){
    var bridgeY = 604, deckY = bridgeY - 44;
    GEO.approach = 'M638 470 L636 530 L640 588';
    GEO.stay     = 'M640 588 L636 660 L'+MANYX+' '+MANYY;
    GEO.act      = 'M640 588 L640 '+bridgeY;   // a short advance: it stops at the body
    GEO.tscale   = '0.34 1.0';
    var balusters = '';
    for (var i = 0; i < 25; i++){
      var x = 20 + i*52;
      balusters += '<line class="hatch" x1="'+x+'" y1="'+deckY+'" x2="'+x+'" y2="'+bridgeY+'"/>';
    }
    var em = extent(MANYX, 1.7, N);
    return railPlane() + trail(GEO.approach) + trolley() +
      '<g id="sy-many">'+ group(MANYX, MANYY, 1.7, N) +
        strike(em.left - 34, em.right + 34, MANYY + 8) +
        calloutSide(em.left - 46, MANYY - 18, String(N)) +
      '</g>'+
      '<line class="edge" x1="0" y1="'+bridgeY+'" x2="1280" y2="'+bridgeY+'"/>'+
      '<line class="edge" x1="0" y1="'+deckY+'" x2="1280" y2="'+deckY+'"/>'+ balusters +
      '<g id="sy-few">'+ person(640, deckY, 1.55, -1) +
        bracket(640, deckY + 4, 58, 62) +
        strike(606, 674, deckY + 4) +
        callout(724, deckY - 40, '1') +
      '</g>';
  }

  function scene_ward(){
    // No track. The threat glides in across the ward — toward the beds, or away
    // toward the one whose body is the supply.
    GEO.approach = 'M170 470 L400 464 L640 460';
    GEO.stay     = 'M640 460 L620 512 L548 548';
    GEO.act      = 'M640 460 Q940 520 1176 588';
    GEO.tscale   = '0.7 1.0';
    var bn = Math.max(1, Math.min(N, 5)), beds = '';
    for (var i = 0; i < bn; i++){
      var bx = 150 + i*186, by = 566;
      beds += '<g class="fig" transform="translate('+bx+','+by+') rotate(-90)">'+
          '<circle cx="0" cy="-26" r="5"/>'+
          '<path d="M0,-21 C-5,-21 -6,-16 -6,-2 L6,-2 C6,-16 5,-21 0,-21 Z"/>'+
        '</g>'+
        '<line class="edge" x1="'+(bx-52)+'" y1="'+(by+14)+'" x2="'+(bx+62)+'" y2="'+(by+14)+'"/>'+
        '<line class="hatch" x1="'+(bx-46)+'" y1="'+(by+14)+'" x2="'+(bx-46)+'" y2="'+(by+48)+'"/>'+
        '<line class="hatch" x1="'+(bx+56)+'" y1="'+(by+14)+'" x2="'+(bx+56)+'" y2="'+(by+48)+'"/>';
    }
    return '<line class="horizon" x1="0" y1="'+HORIZON+'" x2="1280" y2="'+HORIZON+'"/>'+
      trail(GEO.approach) + trolley() +
      '<g id="sy-many">'+ beds +
        strike(80, 830, 620) + callout(455, 520, String(bn)) +
      '</g>'+
      '<line class="edge" x1="1080" y1="440" x2="1080" y2="780"/>'+
      '<g id="sy-few">'+ person(1176, 648, 1.55, -1) +
        bracket(1176, 654, 58, 62) +
        strike(1142, 1210, 654) + callout(1176, 590, '1') +
      '</g>';
  }

  function scene_passenger(){
    var WALLX = 1112, WALLY = 688;
    GEO.approach = 'M638 466 L632 520 L626 590';
    GEO.stay     = 'M626 590 L600 650 L560 700';
    GEO.act      = 'M626 590 Q820 620 '+WALLX+' '+WALLY;
    GEO.tscale   = '0.34 1.0';
    var lane = '', hatch = '', ep = extent(560, 1.7, N);
    for (var i = 0; i < 9; i++){
      var t = i/8, y = HORIZON + 14 + t*t*300, w = 3 + t*22;
      lane += '<line class="hatch" x1="'+(640-w/2).toFixed(1)+'" y1="'+y.toFixed(1)+'" x2="'+(640+w/2).toFixed(1)+'" y2="'+y.toFixed(1)+'"/>';
    }
    for (var j = 0; j < 9; j++){
      hatch += '<line class="hatch" x1="'+(WALLX+30)+'" y1="'+(452+j*38)+'" x2="'+(WALLX+146)+'" y2="'+(424+j*38)+'"/>';
    }
    return '<line class="horizon" x1="0" y1="'+HORIZON+'" x2="1280" y2="'+HORIZON+'"/>'+
      '<path class="edge" d="M60 780 Q560 520 632 '+(HORIZON+8)+'"/>'+
      '<path class="edge" d="M1220 780 Q720 520 648 '+(HORIZON+8)+'"/>'+ lane +
      '<rect class="edge" x="'+(WALLX+30)+'" y="424" width="116" height="356"/>'+ hatch +
      trail(GEO.approach) + trolley() +
      '<g id="sy-many">'+ group(560, 700, 1.7, N) +
        strike(ep.left - 34, ep.right + 34, 708) +
        calloutSide(ep.left - 46, 682, String(N)) +
      '</g>'+
      '<g id="sy-few">'+ person(WALLX, WALLY, 1.55, -1) +
        strike(WALLX - 34, WALLX + 34, WALLY + 6) +
        callout(WALLX, WALLY - 60, '1') +
      '</g>';
  }

  /* ---- dispatch ------------------------------------------------------- */
  var body;
  switch (id){
    case 'footbridge': body = scene_footbridge(); break;
    case 'loop':       body = scene_loop();       break;
    case 'beloved':    body = scene_beloved();    break;
    case 'ward':       body = scene_ward();       break;
    case 'passenger':  body = scene_passenger();  break;
    case 'switch':
    default:           body = scene_switch();     break;
  }

  return '<svg id="sy-scene" viewBox="'+VIEW+'" preserveAspectRatio="xMidYMid meet" '+
    'xmlns="http://www.w3.org/2000/svg" aria-hidden="true"'+
    ' data-approach="'+GEO.approach+'"'+
    ' data-stay="'+GEO.stay+'"'+
    ' data-act="'+GEO.act+'"'+
    ' data-tscale="'+GEO.tscale+'">'+
    '<defs><marker id="sy-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" '+
      'markerHeight="6" orient="auto-start-reverse">'+
      '<path d="M0 1 L9 5 L0 9" fill="none" stroke="'+K.ink3+'" stroke-width="1.5" '+
      'stroke-linecap="round" stroke-linejoin="round"/></marker></defs>'+
    css +
    '<g id="sy-world">'+ body +'</g>'+
  '</svg>';
}
