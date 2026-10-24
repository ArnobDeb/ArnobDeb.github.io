// The world tree's trunk fills with light as you scroll down the timeline,
// and each knot lights up as the light reaches it.
export function initYggdrasil(root: HTMLElement) {
  const fill = root.querySelector<HTMLElement>('.ygg__fill');
  const trunk = root.querySelector<HTMLElement>('.ygg__trunk');
  const knots = [...root.querySelectorAll<HTMLElement>('.ygg__node')];
  if (!fill || !trunk) return;

  let queued = false;
  const update = () => {
    queued = false;
    const r = trunk.getBoundingClientRect();
    const line = innerHeight * 0.6; // the light sits at 60% of the viewport
    const p = Math.min(1, Math.max(0, (line - r.top) / r.height));
    fill.style.transform = `scaleY(${p})`;
    for (const k of knots) {
      const kr = k.getBoundingClientRect();
      k.classList.toggle('is-lit', kr.top + 14 < line);
    }
    root.classList.toggle('is-crowned', p > 0.02);
    root.classList.toggle('is-rooted', p > 0.98);
  };
  const queue = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  update();
}
