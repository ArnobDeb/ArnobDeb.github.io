// As the hero scrolls away, the letters of the name break apart like shards of ice.
import { reducedMotion } from './loop';

export function initShatter(hero: HTMLElement) {
  if (reducedMotion()) return;
  const el = hero.querySelector<HTMLElement>('.hero__name .decode');
  if (!el) return;
  let shards: { el: HTMLElement; dx: number; dy: number; rot: number }[] = [];

  // Wrap letters once the rune decode has finished (it rewrites the text while it runs).
  const wrap = () => {
    if (shards.length || el.querySelector('.r')) return false;
    const text = el.textContent ?? '';
    el.textContent = '';
    for (const ch of text) {
      const s = document.createElement('span');
      s.className = 'shard';
      s.textContent = ch === ' ' ? ' ' : ch;
      el.append(s);
      shards.push({ el: s, dx: (Math.random() - 0.5) * 220, dy: -40 - Math.random() * 160, rot: (Math.random() - 0.5) * 70 });
    }
    return true;
  };

  let queued = false;
  const update = () => {
    queued = false;
    const p = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight * 0.7)));
    if (p > 0 && !shards.length && !wrap()) return;
    const e = p * p;
    for (const s of shards) {
      s.el.style.transform = p ? `translate3d(${(s.dx * e).toFixed(1)}px,${(s.dy * e).toFixed(1)}px,0) rotate(${(s.rot * e).toFixed(1)}deg)` : '';
      s.el.style.opacity = p ? String(1 - e * 0.9) : '';
    }
  };
  addEventListener(
    'scroll',
    () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
}
