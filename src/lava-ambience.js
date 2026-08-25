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
        will-change:transform;
      }
      .lava-reactor .lava-core{
        position:absolute;
        overflow:hidden;
        isolation:isolate;
        will-change:mask-image,-webkit-mask-image,filter;
      }
      .lava-cursor-split{
        position:absolute;
        z-index:8;
        left:50%;
        top:50%;
        width:70px;
        height:34px;
        border-radius:999px;
        pointer-events:none;
        opacity:0;
        transform:translate(-50%,-50%);
        transform-origin:center;
        will-change:left,top,width,height,transform,opacity;
        background:radial-gradient(ellipse at center,
          transparent 0 34%,
          rgba(255,220,128,.12) 42%,
          rgba(255,138,45,.42) 49%,
          rgba(242,55,15,.26) 57%,
          rgba(85,5,2,.08) 66%,
          transparent 78%);
        filter:blur(2px) saturate(1.35);
        mix-blend-mode:screen;
      }
      .lava-cursor-split::before,
      .lava-cursor-split::after{
        content:"";
        position:absolute;
        left:50%;
        width:74%;
        height:18%;
        border-radius:999px;
        transform:translateX(-50%);
        background:linear-gradient(90deg,transparent,rgba(255,203,102,.28),rgba(255,89,22,.42),rgba(255,203,102,.22),transparent);
        filter:blur(2.5px);
        opacity:.8;
      }
      .lava-cursor-split::before{top:17%}
      .lava-cursor-split::after{bottom:17%}
      html[data-theme="lava"] .lava-blob.pointer-split .lava-core{
        filter:blur(calc(var(--lava-blur,10px) * .93)) saturate(1.46) brightness(1.07);
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

    const split = document.createElement('span');
    split.className = 'lava-cursor-split';

    reactor.appendChild(core);
    reactor.appendChild(split);
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
      split,
      amount: 0,
      targetAmount: 0,
      cutX: 50,
      cutY: 50,
      targetCutX: 50,
      targetCutY: 50,
      angle: 0,
      targetAngle: 0,
      shortRadius: 0,
      targetShortRadius: 0,
      longRadius: 0,
      targetLongRadius: 0,
      alongScale: 1,
      targetAlongScale: 1,
      acrossScale: 1,
      targetAcrossScale: 1,
      twist: 0,
      targetTwist: 0,
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

  function setNeutralTarget(state) {
    state.targetAmount = 0;
    state.targetShortRadius = 0;
    state.targetLongRadius = 0;
    state.targetAlongScale = 1;
    state.targetAcrossScale = 1;
    state.targetTwist = 0;
  }

  function calculateSplitTarget(state) {
    setNeutralTarget(state);
    if (!pointerActive) return;

    const rect = state.blob.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = pointerX - cx;
    const dy = pointerY - cy;
    const distance = Math.hypot(dx, dy) || .001;
    const radius = clamp(Math.max(rect.width, rect.height) * .56 + 55, 130, 350);
    if (distance >= radius) return;

    const proximity = 1 - distance / radius;
    const force = proximity * proximity * (3 - 2 * proximity);
    const speed = clamp(Math.hypot(pointerVX, pointerVY), 0, 46);
    const speedFactor = clamp(speed / 24, 0, 1);

    const localX = clamp((pointerX - rect.left) / Math.max(1, rect.width) * 100, 3, 97);
    const localY = clamp((pointerY - rect.top) / Math.max(1, rect.height) * 100, 3, 97);
    state.targetCutX = localX;
    state.targetCutY = localY;
    state.targetAmount = force;

    if (speed > .55) {
      state.targetAngle = Math.atan2(pointerVY, pointerVX) * 180 / Math.PI;
    }

    // The actual transparent opening is cursor-sized when moving slowly and gets
    // longer in the direction of travel when the mouse slices through quickly.
    const base = 8 + force * 13;
    state.targetShortRadius = force * (base + speedFactor * 5);
    state.targetLongRadius = force * (base * 1.45 + speedFactor * 21);

    // The whole glob does not move. It only fattens across the cut and elongates
    // slightly along it, which makes the two sides look like they are yielding.
    state.targetAlongScale = 1 + force * (.018 + speedFactor * .025);
    state.targetAcrossScale = 1 + force * (.055 + speedFactor * .075);
    state.targetTwist = force * clamp((pointerVX - pointerVY) * .10, -7, 7);

    state.ripple = Math.max(state.ripple, force * (.34 + speedFactor * .52));
  }

  function applyMask(state) {
    if (state.amount < .012 || state.shortRadius < .6 || state.longRadius < .9) {
      state.core.style.webkitMaskImage = 'none';
      state.core.style.maskImage = 'none';
      state.split.style.opacity = '0';
      return;
    }

    const angle = ((state.angle % 360) + 360) % 360;
    const horizontalWeight = Math.abs(Math.cos(angle * Math.PI / 180));
    const rx = lerp(state.shortRadius, state.longRadius, horizontalWeight);
    const ry = lerp(state.longRadius, state.shortRadius, horizontalWeight);

    // A true transparent hole is cut out of the lava itself. This is what makes
    // the pointer appear to physically split the glob rather than merely darken it.
    const mask = `radial-gradient(ellipse ${rx.toFixed(2)}px ${ry.toFixed(2)}px at ${state.cutX.toFixed(2)}% ${state.cutY.toFixed(2)}%, transparent 0 43%, rgba(0,0,0,.12) 55%, rgba(0,0,0,.72) 76%, #000 100%)`;
    state.core.style.webkitMaskImage = mask;
    state.core.style.maskImage = mask;
    state.core.style.webkitMaskRepeat = 'no-repeat';
    state.core.style.maskRepeat = 'no-repeat';

    // A glowing rim rides over the transparent cut so the parted edges read as
    // hot, stretched lava instead of a plain circular hole.
    const rimWidth = Math.max(34, state.longRadius * 3.05);
    const rimHeight = Math.max(22, state.shortRadius * 3.15);
    state.split.style.left = `${state.cutX.toFixed(2)}%`;
    state.split.style.top = `${state.cutY.toFixed(2)}%`;
    state.split.style.width = `${rimWidth.toFixed(2)}px`;
    state.split.style.height = `${rimHeight.toFixed(2)}px`;
    state.split.style.opacity = clamp(state.amount * .84, 0, .86).toFixed(3);
    state.split.style.transform = `translate(-50%,-50%) rotate(${state.angle.toFixed(2)}deg)`;
  }

  function animateInteraction() {
    animationFrame = 0;
    if (!isLava() || reducedMotion()) return;

    const now = performance.now() * .001;

    for (const state of blobs) {
      calculateSplitTarget(state);

      const entering = state.targetAmount > state.amount;
      const response = entering ? .24 : .105;
      state.amount = lerp(state.amount, state.targetAmount, response);
      state.cutX = lerp(state.cutX, state.targetCutX, .28);
      state.cutY = lerp(state.cutY, state.targetCutY, .28);
      state.angle = lerp(state.angle, state.targetAngle, .20);
      state.shortRadius = lerp(state.shortRadius, state.targetShortRadius, response);
      state.longRadius = lerp(state.longRadius, state.targetLongRadius, response);
      state.alongScale = lerp(state.alongScale, state.targetAlongScale, response);
      state.acrossScale = lerp(state.acrossScale, state.targetAcrossScale, response);
      state.twist = lerp(state.twist, state.targetTwist, response);

      state.ripple *= state.targetAmount > .025 ? .984 : .945;
      if (state.ripple < .002) state.ripple = 0;
      state.ripplePhase += .16;

      const wave = Math.sin(state.ripplePhase + now * 2.0) * state.ripple;
      const angle = state.angle * Math.PI / 180;
      const horizontalWeight = Math.abs(Math.cos(angle));
      const scaleXBase = lerp(state.acrossScale, state.alongScale, horizontalWeight);
      const scaleYBase = lerp(state.alongScale, state.acrossScale, horizontalWeight);
      const scaleX = clamp(scaleXBase + wave * .025, .92, 1.18);
      const scaleY = clamp(scaleYBase - wave * .018, .92, 1.18);
      const twist = clamp(state.twist + Math.cos(state.ripplePhase * .8) * state.ripple * 2.1, -10, 10);

      state.reactor.style.transformOrigin = `${state.cutX.toFixed(2)}% ${state.cutY.toFixed(2)}%`;
      state.reactor.style.transform = `rotate(${twist.toFixed(2)}deg) scale(${scaleX.toFixed(3)},${scaleY.toFixed(3)})`;
      applyMask(state);

      if (state.amount > .025 || state.ripple > .04) state.blob.classList.add('pointer-split');
      else state.blob.classList.remove('pointer-split');
    }

    pointerVX *= .84;
    pointerVY *= .84;
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
    pointerVX = clamp((pointerX - oldX) * (16.67 / dt), -46, 46);
    pointerVY = clamp((pointerY - oldY) * (16.67 / dt), -46, 46);
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
