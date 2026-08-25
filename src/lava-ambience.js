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
  const lerp = (from, to, amount) => from + (to - from) * amount;

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
        will-change:transform,transform-origin;
      }
      .lava-reactor .lava-core{
        position:absolute;
        overflow:hidden;
        isolation:isolate;
      }
      .lava-reactor .lava-core::after{
        content:"";
        position:absolute;
        inset:-2%;
        z-index:3;
        pointer-events:none;
        border-radius:inherit;
        opacity:var(--lava-dent-strength,0);
        background:
          radial-gradient(circle at var(--lava-dent-x,50%) var(--lava-dent-y,50%),
            rgba(32,0,0,.56) 0 3.5%,
            rgba(92,5,0,.40) 6%,
            rgba(255,112,30,.18) 10%,
            rgba(255,185,77,.05) 14%,
            transparent 23%);
        filter:blur(var(--lava-dent-blur,2px));
        transition:opacity .12s linear;
      }
      html[data-theme="lava"] .lava-blob.pointer-jelly .lava-core{
        filter:blur(calc(var(--lava-blur,10px) * .92)) saturate(1.44) brightness(1.06);
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
      core,
      amount: 0,
      targetAmount: 0,
      stretch: 1,
      targetStretch: 1,
      squash: 1,
      targetSquash: 1,
      twist: 0,
      targetTwist: 0,
      skew: 0,
      targetSkew: 0,
      originX: 50,
      originY: 50,
      targetOriginX: 50,
      targetOriginY: 50,
      dentX: 50,
      dentY: 50,
      ripple: 0,
      ripplePhase: rand(0, Math.PI * 2),
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

  function calculateJellyTarget(state) {
    state.targetAmount = 0;
    state.targetStretch = 1;
    state.targetSquash = 1;
    state.targetTwist = 0;
    state.targetSkew = 0;
    state.targetOriginX = 50;
    state.targetOriginY = 50;

    if (!pointerActive) return;

    const rect = state.blob.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = pointerX - cx;
    const dy = pointerY - cy;
    const distance = Math.hypot(dx, dy) || .001;

    // This is only an influence area. It never changes the blob's actual route.
    const radius = clamp(Math.max(rect.width, rect.height) * .58 + 65, 145, 360);
    if (distance >= radius) return;

    const proximity = 1 - distance / radius;
    const force = proximity * proximity * (3 - 2 * proximity);
    const nx = dx / distance;
    const ny = dy / distance;
    const speed = clamp(Math.hypot(pointerVX, pointerVY), 0, 44);
    const speedFactor = clamp(speed / 24, 0, 1);

    // Keep the apparent distortion anchored near the cursor. The user sees the
    // liquid stretch and bend around the pointer, while the outer blob keeps drifting.
    const localX = clamp((pointerX - rect.left) / Math.max(1, rect.width) * 100, 8, 92);
    const localY = clamp((pointerY - rect.top) / Math.max(1, rect.height) * 100, 8, 92);

    state.targetAmount = force;
    state.targetOriginX = localX;
    state.targetOriginY = localY;
    state.dentX = localX;
    state.dentY = localY;

    // Stretch mostly along the path of the mouse and compress across it. A slow
    // pass feels gooey; a fast pass creates a sharper temporary twist/ripple.
    const horizontalPass = Math.abs(pointerVX) >= Math.abs(pointerVY);
    const stretch = force * (.10 + speedFactor * .10);
    const squash = force * (.065 + speedFactor * .065);
    state.targetStretch = horizontalPass ? 1 + stretch : 1 - squash;
    state.targetSquash = horizontalPass ? 1 - squash : 1 + stretch;

    const sideTwist = nx * -8.5 + ny * 5.5;
    const motionTwist = clamp((pointerVX - pointerVY) * .15, -8, 8);
    state.targetTwist = force * (sideTwist + motionTwist * speedFactor);
    state.targetSkew = force * clamp((nx * ny * -18) + (pointerVX + pointerVY) * .09, -15, 15);

    // Feed a little energy into a decaying after-wobble, but never into position.
    state.ripple = Math.max(state.ripple, force * (.5 + speedFactor * .65));
  }

  function animateInteraction() {
    animationFrame = 0;
    if (!isLava() || reducedMotion()) return;

    const now = performance.now() * .001;

    for (const state of blobs) {
      calculateJellyTarget(state);

      // Ease into the pointer shape quickly enough to feel responsive, then relax
      // more slowly so the blob has a soft jelly memory after the mouse passes.
      const entering = state.targetAmount > state.amount;
      const response = entering ? .18 : .085;
      state.amount = lerp(state.amount, state.targetAmount, response);
      state.stretch = lerp(state.stretch, state.targetStretch, response);
      state.squash = lerp(state.squash, state.targetSquash, response);
      state.twist = lerp(state.twist, state.targetTwist, response);
      state.skew = lerp(state.skew, state.targetSkew, response);
      state.originX = lerp(state.originX, state.targetOriginX, .16);
      state.originY = lerp(state.originY, state.targetOriginY, .16);

      state.ripple *= state.targetAmount > .02 ? .982 : .955;
      if (state.ripple < .002) state.ripple = 0;
      state.ripplePhase += .14;

      const wave = Math.sin(state.ripplePhase + now * 2.1) * state.ripple;
      const crossWave = Math.cos(state.ripplePhase * .83 + now * 1.65) * state.ripple;
      const scaleX = clamp(state.stretch + wave * .035, .78, 1.27);
      const scaleY = clamp(state.squash - wave * .028, .78, 1.27);
      const twist = clamp(state.twist + crossWave * 3.2, -18, 18);
      const skew = clamp(state.skew + wave * 4.2, -18, 18);

      state.reactor.style.transformOrigin = `${state.originX.toFixed(2)}% ${state.originY.toFixed(2)}%`;
      state.reactor.style.transform = `rotate(${twist.toFixed(2)}deg) skew(${skew.toFixed(2)}deg,${(-skew * .34).toFixed(2)}deg) scale(${scaleX.toFixed(3)},${scaleY.toFixed(3)})`;

      state.core.style.setProperty('--lava-dent-x', `${state.dentX.toFixed(2)}%`);
      state.core.style.setProperty('--lava-dent-y', `${state.dentY.toFixed(2)}%`);
      state.core.style.setProperty('--lava-dent-strength', clamp(state.amount * .86 + state.ripple * .16, 0, .92).toFixed(3));
      state.core.style.setProperty('--lava-dent-blur', `${(1.2 + state.amount * 2.8).toFixed(2)}px`);

      if (state.amount > .035 || state.ripple > .05) state.blob.classList.add('pointer-jelly');
      else state.blob.classList.remove('pointer-jelly');
    }

    pointerVX *= .83;
    pointerVY *= .83;
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
    pointerVX = clamp((pointerX - oldX) * (16.67 / dt), -44, 44);
    pointerVY = clamp((pointerY - oldY) * (16.67 / dt), -44, 44);
    lastPointerTime = now;
    startInteractionLoop();
  }

  function onPointerLeave() {
    pointerActive = false;
    pointerVX = 0;
    pointerVY = 0;
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
