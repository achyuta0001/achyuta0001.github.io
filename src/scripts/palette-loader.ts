// React and the palette (~70 KB gzipped) load on first use instead of on every
// page view. Hovering or focusing the trigger starts the download early.
let loading: Promise<unknown> | null = null;
const load = () => (loading ??= import('../islands/mountPalette'));

export function initPaletteLoader(): void {
  document.addEventListener('palette:want', load);
  if (window.__paletteWanted) load();
  const trigger = document.querySelector('[data-palette-trigger]');
  for (const ev of ['pointerenter', 'focus', 'touchstart']) {
    trigger?.addEventListener(ev, load, { once: true, passive: true });
  }
}
