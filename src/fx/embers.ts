// A few sparks rising behind the thesis card in The Forge. Kept deliberately sparse.
import { fitCanvas, reducedMotion, visibleLoop } from './loop';

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  r: number;
}

export function initEmbers(canvas: HTMLCanvasElement) {
  if (reducedMotion()) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w = 0;
  let h = 0;
  const resize = () => ({ w, h } = fitCanvas(canvas, ctx));
  resize();
  addEventListener('resize', resize);

  const spawn = (): Ember => ({
    x: w * (0.1 + Math.random() * 0.8),
    y: h + 4,
    vx: (Math.random() - 0.5) * 0.02,
    vy: -(0.025 + Math.random() * 0.035),
    life: 0,
    max: 3500 + Math.random() * 3500,
    r: 0.8 + Math.random() * 1.4,
  });
  const embers: Ember[] = Array.from({ length: 18 }, () => {
    const e = spawn();
    e.y = h * Math.random();
    e.life = e.max * Math.random();
    return e;
  });

  visibleLoop(canvas, (t, dt) => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < embers.length; i++) {
      const e = embers[i];
      e.life += dt;
      e.x += (e.vx + Math.sin(t * 0.001 + i) * 0.01) * dt;
      e.y += e.vy * dt;
      if (e.life > e.max || e.y < -10) {
        embers[i] = spawn();
        continue;
      }
      const fade = Math.sin((e.life / e.max) * Math.PI);
      ctx.globalAlpha = fade * 0.75;
      ctx.fillStyle = i % 3 ? '#ff6a2b' : '#f0c46a';
      ctx.shadowColor = '#ff6a2b';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  });
}
