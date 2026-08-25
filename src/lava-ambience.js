(() => {
  const THEME = 'lava';
  const LAYER_ID = 'lavaAmbienceLayer';
  const STYLE_ID = 'lavaPointerReactionStyles';
  const BLOB_COUNT = 16;
  const BUBBLE_COUNT = 30;

  const blobs = [];
  let pointerX = 0;
  let pointerY = 0;
  let pointerVX = 0;
  let pointerVY = 0;
  let pointerActive = false;
  let lastPointerTime = performance.now();
  let animationFrame = 0;

  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const isLava = () => document.documentElement.dataset.theme === THEME;
  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = values => values[Math.floor(Math.random() * values.length)];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function ensureReactionStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .lava-reactor{
        position:absolute;
        inset:0;
        display:block;
        transform-origin:center;
        will-change:transform;
      }
      .lava-reactor .lava-core{position:absolute}
      html[data-theme="lava"] .lava-blob.pointer-impact .lava-core{
        filter:blur(calc(var(--lava-blur,10px) * .84)) saturate(1.5) brightness(1.1);
      }
    `;
    document.head.appendChild(style);
  }

  function getLayer() {
    let layer = document.getElementById(LAYER_ID);
    if (!layer) {
      layer = document.createElement('div');
      layer.id = LAYER_ID;
      layer.className = 'lava-ambience-layer';
      layer.setAttribute('aria-hidden', 'true');
      document.body.prepend(layer);
    }
    return layer;
  }

  function makeBlob(index) {
    const blob = document.createElement('i');
    blob.className = 'lava-blob';

    const reactor = document.createElement('span');
    reactor.className = 'lava-reactor';

    const core = document.createElement('b');
    core.className = 'lava-core';
    reactor.appendChild(core);
    blob.appendChild(reactor);

    const size = rand(index < 5 ? 260 : 120, index < 5 ? 520 : 330);
    const x = rand(-10, 96);
    const y = rand(-18, 102);
    const duration = rand(28, 67);
    const morph = rand(7, 17);
    const rotation = rand(-28, 28);
    const palette = pick(['ember', 'gold', 'crimson', 'plasma']);

    blob.dataset.lavaTone = palette;
    blob.style.left = `${x.toFixed(2)}vw`;
    blob.style.top = `${y.toFixed(2)}vh`;
    blob.style.width = `${size.toFixed(1)}px`;
    blob.style.height = `${(size * rand(.68, 1.15)).toFixed(1)}px`;
    blob.style.opacity = rand(.35, .82).toFixed(2);
    blob.style.setProperty('--lava-float-time', `${duration.toFixed(2)}s`);
    blob.style.setProperty('--lava-morph-time', `${morph.toFixed(2)}s`);
    blob.style.setProperty('--lava-delay', `${(-rand(0, duration)).toFixed(2)}s`);
    blob.style.setProperty('--lava-morph-delay', `${(-rand(0, morph)).toFixed(2)}s`);
    blob.style.setProperty('--lava-x1', `${rand(-14, 14).toFixed(2)}vw`);
    blob.style.setProperty('--lava-y1', `${rand(-28, 22).toFixed(2)}vh`);
    blob.style.setProperty('--lava-x2', `${rand(-18, 18).toFixed(2)}vw`);
    blob.style.setProperty('--lava-y2', `${rand(-20, 31).toFixed(2)}vh`);
    blob.style.setProperty('--lava-x3', `${rand(-11, 11).toFixed(2)}vw`);
    blob.style.setProperty('--lava-y3', `${rand(-33, 26).toFixed(2)}vh`);
    blob.style.setProperty('--lava-rot1', `${(rotation * .45).toFixed(1)}deg`);
    blob.style.setProperty('--lava-rot2', `${rotation.toFixed(1)}deg`);
    blob.style.setProperty('--lava-rot3', `${(rotation * -.4).toFixed(1)}deg`);
    blob.style.setProperty('--lava-blur', `${rand(5, 18).toFixed(1)}px`);

    blobs.push({
      blob,
      reactor,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      scaleX: 1,
      scaleY: 1,
      scaleVX: 0,
      scaleVY: 0,
      rotation: 0,
      rotationV: 0,
      pointerInside: false,
      returnAt: 0,
      impactUntil: 0,
    });

    return blob;
  }

  function makeBubble(index) {
    const bubble = document.createElement('i');
    bubble.className = 'lava-bubble';
    const size = rand(index < 8 ? 15 : 5, index < 8 ? 42 : 22);
    const duration = rand(14, 38);
    const rising = Math.random() > .28;
    const drift = rand(-15, 15);
    const travel = rising ? -rand(34, 78) : rand(30, 70);

    bubble.style.left = `${rand(0, 100).toFixed(2)}vw`;
    bubble.style.top = `${rand(-8, 108).toFixed(2)}vh`;
    bubble.style.width = `${size.toFixed(1)}px`;
    bubble.style.height = `${(size * rand(.75, 1.2)).toFixed(1)}px`;
    bubble.style.opacity = rand(.18, .58).toFixed(2);
    bubble.style.setProperty('--bubble-time', `${duration.toFixed(2)}s`);
    bubble.style.setProperty('--bubble-delay', `${(-rand(0, duration)).toFixed(2)}s`);
    bubble.style.setProperty('--bubble-drift', `${drift.toFixed(2)}vw`);
    bubble.style.setProperty('--bubble-drift-mid', `${(drift * .65).toFixed(2)}vw`);
    bubble.style.setProperty('--bubble-travel', `${travel.toFixed(2)}vh`);
    bubble.style.setProperty('--bubble-travel-38', `${(travel * .38).toFixed(2)}vh`);
    bubble.style.setProperty('--bubble-travel-72', `${(travel * .72).toFixed(2)}vh`);
    bubble.style.setProperty('--bubble-wobble', `${rand(-28, 28).toFixed(1)}px`);
    return bubble;
  }

  function populate() {
    const layer = getLayer();
    layer.replaceChildren();
    blobs.length = 0;

    const haze = document.createElement('div');
    haze.className = 'lava-haze';
    layer.appendChild(haze);

    if (reducedMotion()) return;
    for (let i = 0; i < BLOB_COUNT; i++) layer.appendChild(makeBlob(i));
    for (let i = 0; i < BUBBLE_COUNT; i++) layer.appendChild(makeBubble(i));
  }

  function hitBlob(state, nx, ny, rect, now) {
    const pointerSpeed = Math.hypot(pointerVX, pointerVY);

    // A real hit transfers the direction the mouse was travelling. Very slow
    // contact still nudges the blob away from the cursor, but never continuously.
    let hitX = nx;
    let hitY = ny;
    if (pointerSpeed > .65) {
      const mx = pointerVX / pointerSpeed;
      const my = pointerVY / pointerSpeed;
      hitX = mx * .82 + nx * .18;
      hitY = my * .82 + ny * .18;
      const length = Math.hypot(hitX, hitY) || 1;
      hitX /= length;
      hitY /= length;
    }

    // Large globs feel heavier. The impulse is intentionally moderate so they
    // visibly coast rather than teleporting away from the cursor.
    const largestSide = Math.max(rect.width, rect.height);
    const massFactor = clamp(260 / largestSide, .58, 1.18);
    const impulse = clamp(3.6 + pointerSpeed * .20, 3.8, 9.5) * massFactor;

    state.vx = clamp(state.vx + hitX * impulse, -12, 12);
    state.vy = clamp(state.vy + hitY * impulse, -12, 12);

    // Don't pull it home immediately. Let it travel like it was actually struck,
    // then start a slow return after the momentum has had time to play out.
    state.returnAt = now + 1350 + Math.min(900, pointerSpeed * 20);
    state.impactUntil = now + 260;

    const horizontal = Math.abs(hitX);
    const vertical = Math.abs(hitY);
    const squash = clamp(.08 + impulse * .012, .10, .21);
    state.scaleVX += vertical * squash - horizontal * squash * .68;
    state.scaleVY += horizontal * squash - vertical * squash * .68;
    state.rotationV += hitX * impulse * .16;
  }

  function detectPointerHit(state, now) {
    const rect = state.blob.getBoundingClientRect();
    const cx = rect.left + rect.width / 2 + state.x;
    const cy = rect.top + rect.height / 2 + state.y;
    const dx = cx - pointerX;
    const dy = cy - pointerY;
    const distance = Math.hypot(dx, dy) || .001;

    // This is a collision radius, not a force field. Staying inside it does not
    // apply more force; the mouse has to leave and strike the glob again.
    const radius = clamp(Math.min(rect.width, rect.height) * .48, 72, 235);
    const inside = pointerActive && distance < radius;

    if (inside && !state.pointerInside) {
      hitBlob(state, dx / distance, dy / distance, rect, now);
    }
    state.pointerInside = inside;
  }

  function animateInteraction() {
    animationFrame = 0;
    if (!isLava() || reducedMotion()) return;

    const now = performance.now();

    for (const state of blobs) {
      detectPointerHit(state, now);

      if (now < state.impactUntil) state.blob.classList.add('pointer-impact');
      else state.blob.classList.remove('pointer-impact');

      // First, coast freely with thick-liquid drag. Only after a delay does a
      // very weak restoring force start guiding the glob toward its old route.
      if (now >= state.returnAt) {
        state.vx += -state.x * .0021;
        state.vy += -state.y * .0021;
        state.vx *= .968;
        state.vy *= .968;
      } else {
        state.vx *= .976;
        state.vy *= .976;
      }

      state.x += state.vx;
      state.y += state.vy;

      // Give a hit enough room to actually travel. At the distant soft limit it
      // loses energy instead of ping-ponging back and forth.
      const maxOffset = 290;
      if (state.x < -maxOffset || state.x > maxOffset) {
        state.x = clamp(state.x, -maxOffset, maxOffset);
        state.vx *= -.22;
      }
      if (state.y < -maxOffset || state.y > maxOffset) {
        state.y = clamp(state.y, -maxOffset, maxOffset);
        state.vy *= -.22;
      }

      // Kill tiny residual oscillation near home rather than buzzing around zero.
      if (now >= state.returnAt && Math.abs(state.x) < .7 && Math.abs(state.vx) < .07) {
        state.x = 0;
        state.vx = 0;
      }
      if (now >= state.returnAt && Math.abs(state.y) < .7 && Math.abs(state.vy) < .07) {
        state.y = 0;
        state.vy = 0;
      }

      // The impact deformation also settles slowly, independently of travel.
      state.scaleVX += (1 - state.scaleX) * .045;
      state.scaleVY += (1 - state.scaleY) * .045;
      state.scaleVX *= .82;
      state.scaleVY *= .82;
      state.scaleX = clamp(state.scaleX + state.scaleVX, .74, 1.30);
      state.scaleY = clamp(state.scaleY + state.scaleVY, .74, 1.30);

      state.rotationV += -state.rotation * .025;
      state.rotationV *= .86;
      state.rotation = clamp(state.rotation + state.rotationV, -16, 16);

      state.reactor.style.transform = `translate3d(${state.x.toFixed(2)}px,${state.y.toFixed(2)}px,0) scale(${state.scaleX.toFixed(3)},${state.scaleY.toFixed(3)}) rotate(${state.rotation.toFixed(2)}deg)`;
    }

    pointerVX *= .86;
    pointerVY *= .86;
    animationFrame = requestAnimationFrame(animateInteraction);
  }

  function startInteractionLoop() {
    if (animationFrame || reducedMotion() || !isLava()) return;
    animationFrame = requestAnimationFrame(animateInteraction);
  }

  function stopInteractionLoop() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    pointerActive = false;
  }

  function onPointerMove(event) {
    if (!isLava() || reducedMotion()) return;
    const now = performance.now();

    if (!pointerActive) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerVX = 0;
      pointerVY = 0;
      pointerActive = true;
      lastPointerTime = now;
      startInteractionLoop();
      return;
    }

    const dt = clamp(now - lastPointerTime, 8, 50);
    const oldX = pointerX;
    const oldY = pointerY;
    pointerX = event.clientX;
    pointerY = event.clientY;

    pointerVX = clamp((pointerX - oldX) * (16.67 / dt), -48, 48);
    pointerVY = clamp((pointerY - oldY) * (16.67 / dt), -48, 48);
    lastPointerTime = now;
    startInteractionLoop();
  }

  function onPointerLeave() {
    pointerActive = false;
    pointerVX = 0;
    pointerVY = 0;
    for (const state of blobs) state.pointerInside = false;
  }

  function syncTheme() {
    const layer = getLayer();
    if (isLava()) {
      layer.hidden = false;
      if (layer.childElementCount <= 1) populate();
      startInteractionLoop();
    } else {
      stopInteractionLoop();
      layer.hidden = true;
      layer.replaceChildren();
      blobs.length = 0;
    }
  }

  function boot() {
    ensureReactionStyles();
    getLayer().hidden = true;

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onPointerLeave, { passive: true });
    window.addEventListener('blur', onPointerLeave, { passive: true });

    new MutationObserver(syncTheme).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    syncTheme();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
