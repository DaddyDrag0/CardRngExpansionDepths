(() => {
  const THEME = 'scarlet';
  const LAYER_ID = 'bloodRainLayer';
  const MAX_DROPS = 140;
  let running = false;
  let timer = 0;
  const pending = new Set();

  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const isScarlet = () => document.documentElement.dataset.theme === THEME;

  function getLayer() {
    let layer = document.getElementById(LAYER_ID);
    if (!layer) {
      layer = document.createElement('div');
      layer.id = LAYER_ID;
      layer.className = 'blood-rain-layer';
      layer.setAttribute('aria-hidden', 'true');
      document.body.prepend(layer);
    }
    return layer;
  }

  function later(fn, delay) {
    const id = window.setTimeout(() => {
      pending.delete(id);
      fn();
    }, delay);
    pending.add(id);
    return id;
  }

  function clearRain() {
    window.clearTimeout(timer);
    timer = 0;
    for (const id of pending) window.clearTimeout(id);
    pending.clear();
    running = false;
    document.getElementById(LAYER_ID)?.replaceChildren();
  }

  function spawnDrop() {
    if (!running || !isScarlet() || reducedMotion()) return;
    const layer = getLayer();
    if (layer.childElementCount >= MAX_DROPS) return;

    const drop = document.createElement('i');
    drop.className = 'blood-drop';

    const size = 4 + Math.random() * 8;
    const height = size * (1.05 + Math.random() * 0.55);
    const duration = 2.0 + Math.random() * 3.6;
    const drift = -38 + Math.random() * 76;
    const opacity = 0.38 + Math.random() * 0.56;

    drop.style.left = `${(Math.random() * 100).toFixed(3)}vw`;
    drop.style.width = `${size.toFixed(2)}px`;
    drop.style.height = `${height.toFixed(2)}px`;
    drop.style.opacity = opacity.toFixed(2);
    drop.style.setProperty('--blood-fall-time', `${duration.toFixed(2)}s`);
    drop.style.setProperty('--blood-drift', `${drift.toFixed(1)}px`);
    drop.style.setProperty('--blood-spin', `${(-10 + Math.random() * 20).toFixed(1)}deg`);

    if (Math.random() < 0.16) {
      drop.style.filter = `blur(${(0.45 + Math.random() * 0.75).toFixed(2)}px)`;
    }

    drop.addEventListener('animationend', () => drop.remove(), {once:true});
    layer.appendChild(drop);
  }

  function scheduleNext() {
    if (!running) return;
    spawnDrop();

    // Fresh random wait for every drop: bursts, normal rain, and occasional gaps.
    const r = Math.random();
    const delay = r < 0.18
      ? 28 + Math.random() * 70
      : r < 0.72
        ? 90 + Math.random() * 175
        : 260 + Math.random() * 360;

    timer = window.setTimeout(scheduleNext, delay);
  }

  function startRain() {
    if (running || !isScarlet() || reducedMotion()) return;
    running = true;
    getLayer();

    // Scatter startup timing so the first drops never appear as a row.
    const initial = 8 + Math.floor(Math.random() * 9);
    for (let i = 0; i < initial; i++) {
      later(spawnDrop, 40 + Math.random() * 1200);
    }
    later(scheduleNext, 40 + Math.random() * 180);
  }

  function syncTheme() {
    if (isScarlet()) startRain();
    else clearRain();
  }

  function boot() {
    getLayer();
    new MutationObserver(syncTheme).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    syncTheme();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
