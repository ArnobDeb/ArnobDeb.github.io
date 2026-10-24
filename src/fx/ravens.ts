// Huginn flies along the top progress line as the page scrolls.
export function initRavens() {
  const fill = document.querySelector<HTMLElement>('.ravens__fill');
  const bird = document.querySelector<HTMLElement>('.ravens__bird');
  if (!fill || !bird) return;

  let queued = false;
  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    fill.style.transform = `scaleX(${p})`;
    bird.style.transform = `translateX(${p * (innerWidth - bird.clientWidth)}px)`;
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
