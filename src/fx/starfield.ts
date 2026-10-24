// Cursor-reactive night sky for the hero: parallax star layers, stars near the cursor
// brighten and lean toward it, and nearby stars join into faint constellations.
import { Aurora } from './aurora';
import { fitCanvas, reducedMotion, visibleLoop } from './loop';

interface Star {
  x: number;
  y: number;
  z: number; // depth 0.2 (far) .. 1 (near)
  r: number;
  tw: number; // twinkle phase
  ox: number; // current offset toward the cursor
  oy: number;
  glow: number; // 0..1, eased brightness boost
  sx: number; // screen position this frame
  sy: number;
}

const RADIUS = 150; // cursor influence radius (px)
const LINK = 95; // max distance between linked stars (px)

export function initSky(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const still = reducedMotion();
  const aurora = new Aurora();
  let stars: Star[] = [];
  let w = 0;
  let h = 0;

  // Target and smoothed cursor (CSS px relative to the canvas).
  let tx: number | null = null;
  let ty: number | null = null;
  let mx = 0;
  let my = 0;
  let presence = 0; // eases to 1 while the cursor is over the hero

  const build = () => {
    ({ w, h } = fitCanvas(canvas, ctx));
    aurora.resize(w, h);
    const count = w < 700 ? 80 : Math.min(280, Math.round((w * h) / 6500));
    stars = Array.from({ length: count }, () => {
      const z = 0.2 + Math.random() ** 1.6 * 0.8;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        z,
        r: 0.4 + z * 1.3,
        tw: Math.random() * Math.PI * 2,
        ox: 0,
        oy: 0,
        glow: 0,
        sx: 0,
        sy: 0,
      };
    });
    mx = w / 2;
    my = h / 2;
  };

  const draw = (t: number, dt: number) => {
    const k = 1 - Math.pow(0.001, dt / 1000); // frame-rate independent easing
    if (tx !== null && ty !== null) {
      mx += (tx - mx) * Math.min(1, k * 6);
      my += (ty - my) * Math.min(1, k * 6);
      presence += (1 - presence) * Math.min(1, k * 3);
    } else {
      presence += (0 - presence) * Math.min(1, k * 2);
    }

    ctx.clearRect(0, 0, w, h);
    aurora.draw(ctx, w, h, t, presence > 0.05 ? mx : null, 0.7);

    // Parallax: near stars shift more as the cursor moves away from centre.
    const px = (mx - w / 2) / w;
    const py = (my - h / 2) / h;
    const near: Star[] = [];

    for (const s of stars) {
      let x = s.x - px * 26 * s.z * presence;
      let y = s.y - py * 18 * s.z * presence;
      const dx = mx - x;
      const dy = my - y;
      const d = Math.hypot(dx, dy);
      const pull = presence > 0.05 && d < RADIUS ? (1 - d / RADIUS) * presence : 0;

      // Lean toward the cursor, then relax back.
      const goalX = dx * pull * 0.12 * s.z;
      const goalY = dy * pull * 0.12 * s.z;
      s.ox += (goalX - s.ox) * Math.min(1, k * 4);
      s.oy += (goalY - s.oy) * Math.min(1, k * 4);
      s.glow += (pull - s.glow) * Math.min(1, k * 5);
      x += s.ox;
      y += s.oy;
      s.sx = x;
      s.sy = y;

      const twinkle = still ? 0.8 : 0.65 + 0.35 * Math.sin(t * 0.0016 * (0.5 + s.z) + s.tw);
      const alpha = Math.min(1, (0.25 + 0.6 * s.z) * twinkle + s.glow * 0.8);
      const r = s.r * (1 + s.glow * 1.1);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.glow > 0.3 ? '#fff6dc' : '#dbe9ff';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      if (s.glow > 0.15) {
        near.push(s);
        // Soft halo on the brightest stars.
        ctx.globalAlpha = s.glow * 0.25;
        ctx.fillStyle = '#f0c46a';
        ctx.beginPath();
        ctx.arc(x, y, r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Constellations among stars near the cursor.
    ctx.lineWidth = 0.7;
    for (let i = 0; i < near.length; i++) {
      const a = near[i];
      for (let j = i + 1; j < near.length; j++) {
        const b = near[j];
        const d = Math.hypot(a.sx - b.sx, a.sy - b.sy);
        if (d > LINK) continue;
        ctx.globalAlpha = (1 - d / LINK) * Math.min(a.glow, b.glow) * 0.75;
        ctx.strokeStyle = '#8fd3ff';
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  };

  build();
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      build();
      if (still) draw(0, 16);
    }, 150);
  });

  if (still) {
    draw(0, 16); // one static frame, no motion
    return;
  }

  const hero = canvas.parentElement ?? canvas;
  hero.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    tx = e.clientX - rect.left;
    ty = e.clientY - rect.top;
  });
  hero.addEventListener('pointerleave', () => {
    tx = ty = null;
  });

  visibleLoop(hero, draw);
}
