// Headings first appear as Elder Futhark runes and "decode" into Latin letters,
// once, when they scroll into view. The real text sits in a sibling .sr-only span.
import { reducedMotion } from './loop';

const RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
const pick = () => RUNES[(Math.random() * RUNES.length) | 0];

function decode(el: HTMLElement) {
  const text = el.textContent ?? '';
  const chars = [...text];
  const duration = 650 + Math.min(chars.length * 18, 250);
  // Each letter settles at its own time, left to right with some jitter.
  const settle = chars.map((_, i) => (i / chars.length) * duration * 0.75 + Math.random() * duration * 0.25);
  const start = performance.now();
  let lastSwap = 0;
  let current = chars.map((c) => (c === ' ' ? ' ' : pick()));

  const render = (now: number) => {
    const elapsed = now - start;
    // Re-roll the unsettled runes every ~60 ms so they flicker without strobing.
    if (now - lastSwap > 60) {
      current = current.map((c, i) => (chars[i] === ' ' || elapsed >= settle[i] ? c : pick()));
      lastSwap = now;
    }
    el.innerHTML = chars
      .map((c, i) => {
        if (c === ' ') return ' ';
        if (elapsed >= settle[i]) return c.replace(/&/g, '&amp;').replace(/</g, '&lt;');
        return `<span class="r">${current[i]}</span>`;
      })
      .join('');
    if (elapsed < duration) requestAnimationFrame(render);
    else el.textContent = text;
  };
  requestAnimationFrame(render);
}

export function initRuneDecode() {
  if (reducedMotion()) return;
  const els = document.querySelectorAll<HTMLElement>('[data-decode]');
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        decode(e.target as HTMLElement);
      }
    },
    { threshold: 0.6 },
  );
  els.forEach((el) => io.observe(el));
}
