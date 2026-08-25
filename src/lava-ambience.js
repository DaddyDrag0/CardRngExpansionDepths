(() => {
  const THEME = 'lava';
  const LAYER_ID = 'lavaAmbienceLayer';
  const STYLE_ID = 'lavaPointerReactionStyles';
  const BLOB_COUNT = 16;
  const BUBBLE_COUNT = 30;

  const blobs = [];
  let pointerX = 0;
  let pointerY = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;
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
      html[data-theme="lava"] .lava-blob.pointer-near .lava-core{
        filter:blur(calc(var(--lava-blur,10px) * .84)) saturate(1.48) brightness(1.08);
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
      near: false,
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

  function reactToPointer(state) {
    const rect = state.blob.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = cx - pointerX;
    const dy = cy - pointerY;
    const distance = Math.hypot(dx, dy) || 0.001;

    // Larger blobs get a larger interaction radius, but the mouse can still
    // disturb the lava slightly before it is directly over the visible core.
    const radius = clamp(Math.max(rect.width, rect.height) * .48 + 75, 145, 340);
    const inside = pointerActive && distance < radius;

    if (!inside) {
      state.near = false;
      state.blob.classList.remove('pointer-near');
      return;
    }

    state.near = true;
    state.blob.classList.add('pointer-near');

    const closeness = 1 - distance / radius;
    const force = closeness * closeness;
    const nx = dx / distance;
    const ny = dy / distance;

    // Repulsion makes the cursor feel like it is physically displacing thick liquid.
    const shove = 1.15 + force * 4.4;
    state.vx += nx * shove;
    state.vy += ny * shove;

    // Fast mouse movement transfers a small amount of momentum, letting users
    // bat a blob sideways instead of every interaction feeling identical.
    state.vx += pointerVX * .010 * force;
    state.vy += pointerVY * .010 * force;

    // Deform along the direction of impact. A side hit stretches vertically;
    // a top/bottom hit stretches horizontally, like a soft lava-lamp glob.
    const horizontalHit = Math.abs(nx);
    const verticalHit = Math.abs(ny);
    state.scaleVX += (verticalHit * .16 + force * .08) * force;
    state.scaleVY -= (verticalHit * .10 + force * .055) * force;
    state.scaleVX -= horizontalHit * .09 * force;
    state.scaleVY += horizontalHit * .14 * force;
    state.rotationV += (-nx * ny * 2.8 + pointerVX * .0012) * force;
  }

  function animateInteraction() {
    animationFrame = 0;
    if (!isLava() || reducedMotion()) return;

    for (const state of blobs) {
      reactToPointer(state);

      // Soft spring toward the blob's natural floating position.
      state.vx += -state.x * .018;
      state.vy += -state.y * .018;
      state.vx *= .88;
      state.vy *= .88;
      state.x += state.vx;
      state.y += state.vy;

      // Keep the pointer displacement local; its normal CSS float animation continues underneath.
      const maxOffset = 82;
      state.x = clamp(state.x, -maxOffset, maxOffset);
      state.y = clamp(state.y, -maxOffset, maxOffset);

      state.scaleVX += (1 - state.scaleX) * .075;
      state.scaleVY += (1 - state.scaleY) * .075;
      state.scaleVX *= .76;
      state.scaleVY *= .76;
      state.scaleX = clamp(state.scaleX + state.scaleVX, .70, 1.36);
      state.scaleY = clamp(state.scaleY + state.scaleVY, .70, 1.36);

      state.rotationV += -state.rotation * .055;
      state.rotationV *= .76;
      state.rotation = clamp(state.rotation + state.rotationV, -14, 14);

      state.reactor.style.transform = `translate3d(${state.x.toFixed(2)}px,${state.y.toFixed(2)}px,0) scale(${state.scaleX.toFixed(3)},${state.scaleY.toFixed(3)}) rotate(${state.rotation.toFixed(2)}deg)`;
    }

    pointerVX *= .78;
    pointerVY *= .78;
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
    const dt = clamp(now - lastPointerTime, 8, 50);

    lastPointerX = pointerX;
    lastPointerY = pointerY;
    pointerX = event.clientX;
    pointerY = event.clientY;

    pointerVX = (pointerX - lastPointerX) * (16.67 / dt);
    pointerVY = (pointerY - lastPointerY) * (16.67 / dt);
    pointerVX = clamp(pointerVX, -55, 55);
    pointerVY = clamp(pointerVY, -55, 55);
    lastPointerTime = now;
    pointerActive = true;
    startInteractionLoop();
  }

  function onPointerLeave() {
    pointerActive = false;
    pointerVX = 0;
    pointerVY = 0;
    for (const state of blobs) {
      state.near = false;
      state.blob.classList.remove('pointer-near');
    }
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
