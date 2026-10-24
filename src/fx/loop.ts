export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// requestAnimationFrame loop that only runs while `el` is on screen and the tab is visible.
export function visibleLoop(el: Element, frame: (t: number, dt: number) => void) {
  let onScreen = false;
  let raf = 0;
  let last = 0;

  const tick = (t: number) => {
    const dt = last ? Math.min(t - last, 50) : 16;
    last = t;
    frame(t, dt);
    raf = requestAnimationFrame(tick);
  };
  const sync = () => {
    const run = onScreen && !document.hidden;
    if (run && !raf) {
      last = 0;
      raf = requestAnimationFrame(tick);
    } else if (!run && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    sync();
  }).observe(el);
  document.addEventListener('visibilitychange', sync);
}

// Sizes a canvas to its CSS box at device pixel ratio (capped) and returns the CSS size.
export function fitCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, maxDpr = 2) {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h };
}
