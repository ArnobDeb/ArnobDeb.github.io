// A small playable pool table: drag back from the cue ball and release to shoot.
// Simple circle physics with friction, elastic collisions, cushions and six pockets.
import { fitCanvas, visibleLoop } from './loop';

interface Ball { x: number; y: number; vx: number; vy: number; c: string; cue?: boolean; gone?: boolean }

const COLORS = ['#d9a441', '#8a6cff', '#e0464d', '#3ee6c1', '#111418', '#8fd3ff', '#ff6a2b', '#d65c80', '#21a68a', '#bd8a33'];

export function initPool(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const scoreEl = canvas.closest('.tile')?.querySelector<HTMLElement>('.pool__score');
  const resetBtn = canvas.closest('.tile')?.querySelector<HTMLButtonElement>('.pool__reset');
  let w = 0;
  let h = 0;
  let R = 7;
  let balls: Ball[] = [];
  let potted = 0;
  let aim: { x: number; y: number } | null = null;

  const rail = () => Math.max(10, w * 0.05);
  const pockets = () => {
    const m = rail();
    return [
      [m, m], [w / 2, m - 2], [w - m, m],
      [m, h - m], [w / 2, h - m + 2], [w - m, h - m],
    ] as [number, number][];
  };

  const rack = () => {
    R = Math.max(5, Math.min(9, w / 38));
    balls = [{ x: w * 0.25, y: h / 2, vx: 0, vy: 0, c: '#f3f1ea', cue: true }];
    const ox = w * 0.64;
    let k = 0;
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row <= col; row++) {
        balls.push({ x: ox + col * R * 1.8, y: h / 2 + (row - col / 2) * R * 2.05, vx: 0, vy: 0, c: COLORS[k++ % COLORS.length] });
      }
    }
    potted = 0;
    if (scoreEl) scoreEl.textContent = 'Potted: 0';
  };

  const resize = () => {
    const first = !w;
    ({ w, h } = fitCanvas(canvas, ctx));
    if (first || !balls.length) rack();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();
  resetBtn?.addEventListener('click', rack);

  const local = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const cue = () => balls.find((b) => b.cue)!;
  const moving = () => balls.some((b) => !b.gone && Math.hypot(b.vx, b.vy) > 0.01);

  canvas.addEventListener('pointerdown', (e) => {
    const p = local(e);
    const c = cue();
    if (moving() || Math.hypot(p.x - c.x, p.y - c.y) > R * 4) return;
    aim = p;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (aim) aim = local(e);
  });
  canvas.addEventListener('pointerup', () => {
    if (!aim) return;
    const c = cue();
    const dx = c.x - aim.x;
    const dy = c.y - aim.y;
    const pow = Math.min(Math.hypot(dx, dy), w * 0.35) / (w * 0.35);
    const len = Math.hypot(dx, dy) || 1;
    c.vx = (dx / len) * pow * 1.1;
    c.vy = (dy / len) * pow * 1.1;
    aim = null;
  });

  const step = (dt: number) => {
    const m = rail();
    const sub = 4;
    for (let s = 0; s < sub; s++) {
      const d = dt / sub;
      for (const b of balls) {
        if (b.gone) continue;
        b.x += b.vx * d;
        b.y += b.vy * d;
        const f = Math.pow(0.9985, d);
        b.vx *= f;
        b.vy *= f;
        if (Math.hypot(b.vx, b.vy) < 0.004) b.vx = b.vy = 0;
        if (b.x < m + R) (b.x = m + R), (b.vx = Math.abs(b.vx) * 0.85);
        if (b.x > w - m - R) (b.x = w - m - R), (b.vx = -Math.abs(b.vx) * 0.85);
        if (b.y < m + R) (b.y = m + R), (b.vy = Math.abs(b.vy) * 0.85);
        if (b.y > h - m - R) (b.y = h - m - R), (b.vy = -Math.abs(b.vy) * 0.85);
        for (const [px, py] of pockets()) {
          if (Math.hypot(b.x - px, b.y - py) < R * 1.7) {
            if (b.cue) {
              b.x = w * 0.25;
              b.y = h / 2;
              b.vx = b.vy = 0;
            } else {
              b.gone = true;
              potted++;
              if (scoreEl) scoreEl.textContent = `Potted: ${potted}`;
            }
          }
        }
      }
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const a = balls[i];
          const b = balls[j];
          if (a.gone || b.gone) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy);
          if (dist >= R * 2 || dist === 0) continue;
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = R * 2 - dist;
          a.x -= (nx * overlap) / 2;
          a.y -= (ny * overlap) / 2;
          b.x += (nx * overlap) / 2;
          b.y += (ny * overlap) / 2;
          const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
          if (rel <= 0) continue;
          a.vx -= rel * nx;
          a.vy -= rel * ny;
          b.vx += rel * nx;
          b.vy += rel * ny;
        }
      }
    }
  };

  const draw = () => {
    const m = rail();
    ctx.clearRect(0, 0, w, h);
    // Wooden rail and felt.
    ctx.fillStyle = '#2a1d12';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 10);
    ctx.fill();
    const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.6);
    g.addColorStop(0, '#13493c');
    g.addColorStop(1, '#0b2c25');
    ctx.fillStyle = g;
    ctx.fillRect(m, m, w - m * 2, h - m * 2);
    // A faint rune carved into the felt.
    ctx.fillStyle = 'rgba(255,255,255,.04)';
    ctx.font = `${h * 0.5}px "Noto Sans Runic", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (document.fonts?.check('16px "Noto Sans Runic"', 'ᚹ')) ctx.fillText('ᚹ', w / 2, h / 2);
    ctx.fillStyle = '#05070a';
    for (const [px, py] of pockets()) {
      ctx.beginPath();
      ctx.arc(px, py, R * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const b of balls) {
      if (b.gone) continue;
      ctx.fillStyle = b.c;
      ctx.beginPath();
      ctx.arc(b.x, b.y, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.beginPath();
      ctx.arc(b.x - R * 0.3, b.y - R * 0.35, R * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    const c = cue();
    if (aim) {
      // Cue stick behind the ball, and a dotted guide in the shot direction.
      const dx = c.x - aim.x;
      const dy = c.y - aim.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      ctx.strokeStyle = '#d9a441';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(c.x - ux * (R + 4 + len * 0.3), c.y - uy * (R + 4 + len * 0.3));
      ctx.lineTo(c.x - ux * (R + 4 + len * 0.3 + w * 0.3), c.y - uy * (R + 4 + len * 0.3 + w * 0.3));
      ctx.stroke();
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + ux * w * 0.4, c.y + uy * w * 0.4);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (!moving()) {
      // Pulse the cue ball to invite a shot.
      ctx.strokeStyle = `rgba(240,196,106,${0.35 + 0.35 * Math.sin(performance.now() / 300)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(c.x, c.y, R + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  draw();
  visibleLoop(canvas, (_, dt) => {
    step(dt);
    draw();
  });
}
