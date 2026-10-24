// A short procedural lightning bolt that strikes the element, plus a ≤150 ms flash.
import { reducedMotion } from './loop';

const SVG = 'http://www.w3.org/2000/svg';
let lastStrike = 0;

// Jagged path from (x0,y0) to (x1,y1) by recursive midpoint displacement.
function boltPoints(x0: number, y0: number, x1: number, y1: number, spread: number, depth: number): [number, number][] {
  if (depth === 0) return [[x0, y0], [x1, y1]];
  const mx = (x0 + x1) / 2 + (Math.random() - 0.5) * spread;
  const my = (y0 + y1) / 2 + (Math.random() - 0.5) * spread * 0.3;
  const left = boltPoints(x0, y0, mx, my, spread / 2, depth - 1);
  const right = boltPoints(mx, my, x1, y1, spread / 2, depth - 1);
  return [...left, ...right.slice(1)];
}

const toPath = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');

export function strike(target: Element) {
  if (reducedMotion()) return;
  const now = performance.now();
  if (now - lastStrike < 1200) return;
  lastStrike = now;

  const r = target.getBoundingClientRect();
  const x1 = r.left + r.width / 2;
  const y1 = r.top + r.height / 2;
  const x0 = x1 + (Math.random() - 0.5) * 240;
  const main = boltPoints(x0, -10, x1, y1, Math.max(120, y1 * 0.35), 6);

  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'fx-bolt');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);

  const add = (d: string, width: number, color: string) => {
    const p = document.createElementNS(SVG, 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', color);
    p.setAttribute('stroke-width', String(width));
    p.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(p);
  };
  add(toPath(main), 3, '#bfe6ff');
  add(toPath(main), 1.2, '#ffffff');
  // A couple of short forks off the main channel.
  for (let i = 0; i < 2; i++) {
    const [fx, fy] = main[(main.length * (0.3 + Math.random() * 0.4)) | 0];
    const fork = boltPoints(fx, fy, fx + (Math.random() - 0.5) * 180, fy + 60 + Math.random() * 90, 50, 4);
    add(toPath(fork), 1, '#d6ecff');
  }

  const flash = document.createElement('div');
  flash.className = 'fx-flash';
  flash.style.setProperty('--fx-x', `${(x1 / innerWidth) * 100}%`);
  flash.style.setProperty('--fx-y', `${(y1 / innerHeight) * 100}%`);

  document.body.append(flash, svg);
  setTimeout(() => {
    flash.remove();
    svg.remove();
  }, 400);
}

export function initLightning() {
  document.querySelectorAll('[data-lightning]').forEach((el) => {
    el.addEventListener('pointerenter', () => strike(el));
    el.addEventListener('click', () => strike(el));
  });
}
