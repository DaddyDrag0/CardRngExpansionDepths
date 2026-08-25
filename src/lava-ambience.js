(() => {
  const THEME = 'lava';
  const LAYER_ID = 'lavaAmbienceLayer';
  const STYLE_ID = 'lavaPointerReactionStyles';
  const BLOB_COUNT = 16;
  const BUBBLE_COUNT = 30;

  const blobs = [];
  let pointerX = 0;
  let pointerY = 0;
  let pointerActive = false;
  let animationFrame = 0;

  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const isLava = () => document.documentElement.dataset.theme === THEME;
  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = values => values[Math.floor(Math.random() * values.length)];
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
      .lava-reactor .lava-core{position:absolute}
      html[data-theme="lava"] .lava-blob.pointer-vibrate .lava-core{
        filter:blur(calc(var(--lava-blur,10px) * .94)) saturate(1.42) brightness(1.05);
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

    // Slightly quicker than the original Lava theme without becoming frantic.
    const duration = rand(22, 50);
    const morph = rand(5.5, 13);
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
      amount: 0,
      targetAmount: 0,
      phaseX: rand(0, Math.PI * 2),
      phaseY: rand(0, Math.PI * 2),
      phaseR: rand(0, Math.PI * 2),
      speedX: rand(22, 30),
      speedY: rand(25, 35),
      speedR: rand(18, 25),
      strength: rand(.8, 1.2),
    });

    return blob;
  }

  function makeBubble(index) {
    const bubble = document.createElement('i');
    bubble.className = 'lava-bubble';
    const size = rand(index < 8 ? 15 : 5, index < 8 ? 42 : 22);
    const duration = rand(10, 28);
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

  function updateHoverTarget(state) {
    state.targetAmount = 0;
    if (!pointerActive) return;

    const rect = state.blob.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rx = rect.width * .46;
    const ry = rect.height * .46;
    const nx = (pointerX - cx) / Math.max(1, rx);
    const ny = (pointerY - cy) / Math.max(1, ry);

    if (nx * nx + ny * ny <= 1) state.targetAmount = 1;
  }

  function animateInteraction(timeMs) {
    animationFrame = 0;
    if (!isLava() || reducedMotion()) return;

    const t = timeMs * .001;

    for (const state of blobs) {
      updateHoverTarget(state);
      state.amount = lerp(state.amount, state.targetAmount, state.targetAmount > state.amount ? .28 : .15);

      if (state.amount > .015) {
        const a = state.amount * state.strength;
        const x = Math.sin(t * state.speedX + state.phaseX) * 2.3 * a;
        const y = Math.sin(t * state.speedY + state.phaseY) * 2.0 * a;
        const rotation = Math.sin(t * state.speedR + state.phaseR) * .85 * a;
        const scaleX = 1 + Math.sin(t * 28 + state.phaseX) * .010 * a;
        const scaleY = 1 + Math.cos(t * 31 + state.phaseY) * .010 * a;

        state.reactor.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${rotation.toFixed(2)}deg) scale(${scaleX.toFixed(3)},${scaleY.toFixed(3)})`;
        state.blob.classList.add('pointer-vibrate');
      } else {
        state.reactor.style.transform = 'none';
        state.blob.classList.remove('pointer-vibrate');
      }
    }

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
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerActive = true;
    startInteractionLoop();
  }

  function onPointerLeave() {
    pointerActive = false;
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
