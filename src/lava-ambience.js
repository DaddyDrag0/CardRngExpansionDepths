(() => {
  const THEME = 'lava';
  const LAYER_ID = 'lavaAmbienceLayer';
  const BLOB_COUNT = 16;
  const BUBBLE_COUNT = 30;

  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const isLava = () => document.documentElement.dataset.theme === THEME;
  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = values => values[Math.floor(Math.random() * values.length)];

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
    const core = document.createElement('b');
    core.className = 'lava-core';
    blob.appendChild(core);

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

    const haze = document.createElement('div');
    haze.className = 'lava-haze';
    layer.appendChild(haze);

    if (reducedMotion()) return;
    for (let i = 0; i < BLOB_COUNT; i++) layer.appendChild(makeBlob(i));
    for (let i = 0; i < BUBBLE_COUNT; i++) layer.appendChild(makeBubble(i));
  }

  function syncTheme() {
    const layer = getLayer();
    if (isLava()) {
      layer.hidden = false;
      if (layer.childElementCount <= 1) populate();
    } else {
      layer.hidden = true;
      layer.replaceChildren();
    }
  }

  function boot() {
    getLayer().hidden = true;
    new MutationObserver(syncTheme).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    syncTheme();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
