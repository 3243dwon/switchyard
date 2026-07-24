/* ============================================================================
   TRANSITIONS — what is left after the cinema was removed.

   This module used to be 534 lines: a gold bloom flash, a canvas of perspective
   speed-streaks, chromatic aberration, a vignette punch, and a "hold under
   black" that queried a #fade element neither page ever contained — so the
   scene swap it was built to hide had, in production, always happened in plain
   view. None of it survives the white room. A bloom on white is invisible, a
   dark flash on white is a jump-scare, chromatic aberration is a lens artifact
   and there is no lens, and a vignette is the frame telling you what to feel.

   What a sheet of paper can honestly do is two things: bring words onto itself,
   and turn over. That is this file.
   ============================================================================ */
function createTransitions(stageEl){
  var doc = stageEl.ownerDocument;
  var reduce = false;
  try {
    var mq = (doc.defaultView || window).matchMedia('(prefers-reduced-motion: reduce)');
    reduce = mq.matches;
    if (mq.addEventListener) mq.addEventListener('change', function(e){ reduce = e.matches; });
    else if (mq.addListener) mq.addListener(function(e){ reduce = e.matches; });
  } catch (e) {}

  var room = stageEl.querySelector('#room');

  /* ---- bring lines onto the sheet -----------------------------------
     One class, one stagger. The elements already carry their own transition
     from the stylesheet; this only decides when each one is allowed to land. */
  function revealLines(scope, o){
    o = o || {};
    var sel     = o.selector || '.line',
        stagger = o.stagger  != null ? o.stagger : 60,
        start   = o.start    != null ? o.start   : 0,
        els     = scope.querySelectorAll(sel);

    if (reduce){
      for (var i = 0; i < els.length; i++) els[i].classList.add('show');
      return;
    }
    Array.prototype.forEach.call(els, function(el, k){
      el.style.transitionDelay = (start + k*stagger) + 'ms';
      // two frames: the first commits the initial state, the second animates
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){ el.classList.add('show'); });
      });
    });
  }

  /* ---- turn the page ------------------------------------------------
     A white cross-dissolve. The content swaps while the room is at zero, so
     nothing is ever seen changing — which is what the old black hold was for,
     and this one actually runs. */
  function between(cb){
    var safe = function(){ try { cb && cb(); } catch (e) {} };
    if (reduce || !room){ safe(); return; }

    var OUT = 200, IN = 280;
    room.style.transition = 'opacity ' + OUT + 'ms cubic-bezier(.7,0,.84,0)';
    room.style.opacity = '0';

    setTimeout(function(){
      safe();
      room.style.transition = 'opacity ' + IN + 'ms cubic-bezier(.16,1,.3,1)';
      room.style.opacity = '1';
      setTimeout(function(){ room.style.transition = ''; }, IN + 40);
    }, OUT);
  }

  /* ---- the strike landed --------------------------------------------
     The single acknowledgement that something happened: one short dip of the
     room, back immediately. It reads as a blink. There is nothing else, and
     there does not need to be — the drawing is already doing the work. */
  function flashImpact(){
    if (reduce || !room) return;
    if (!room.animate) return;
    room.animate(
      [{ opacity: 1 }, { opacity: .94, offset: .3 }, { opacity: 1 }],
      { duration: 260, easing: 'cubic-bezier(.22,.61,.36,1)' }
    );
  }

  return {
    revealLines: revealLines,
    between: between,
    flashImpact: flashImpact,
    get reduced(){ return reduce; }
  };
}
