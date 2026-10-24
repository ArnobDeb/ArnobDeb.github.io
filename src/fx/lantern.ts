// A lantern follows the cursor across the hero and reveals rune inscriptions carved into the sky.
export function initLantern(hero: HTMLElement) {
  const layer = hero.querySelector<HTMLElement>('.hero__inscription');
  if (!layer || !matchMedia('(hover: hover)').matches) return;
  let raf = 0;
  let x = 0;
  let y = 0;
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    x = e.clientX - r.left;
    y = e.clientY - r.top;
    if (!raf)
      raf = requestAnimationFrame(() => {
        raf = 0;
        layer.style.setProperty('--mx', `${x}px`);
        layer.style.setProperty('--my', `${y}px`);
        layer.classList.add('is-lit');
      });
  });
  hero.addEventListener('pointerleave', () => layer.classList.remove('is-lit'));
}
