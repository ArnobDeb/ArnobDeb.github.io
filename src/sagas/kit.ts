// Small toolkit shared by the animated saga stages (canvas 2D).
import { fitCanvas, reducedMotion, visibleLoop } from '../fx/loop';

export const C = {
  bg: '#0a0d13',
  stone: '#141a23',
  stone2: '#1b2330',
  line: '#2c3646',
  text: '#e7ecf3',
  dim: '#93a0b2',
  faint: '#56657a',
  frost: '#8fd3ff',
  teal: '#3ee6c1',
  violet: '#8a6cff',
  gold: '#d9a441',
  goldB: '#f0c46a',
  ember: '#ff6a2b',
  blood: '#e0464d',
  ash: '#3a4250',
};

export const FONT = {
  mono: (px: number, w = 400) => `${w} ${px}px "JetBrains Mono", ui-monospace, monospace`,
  body: (px: number, w = 500) => `${w} ${px}px "Inter Variable", Inter, system-ui, sans-serif`,
  rune: (px: number) => `${px}px "Noto Sans Runic", sans-serif`,
  display: (px: number) => `600 ${px}px Cinzel, Georgia, serif`,
};

export interface Frame {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  t: number; // ms since mount (frozen at 0 when motion is reduced)
  dt: number; // ms since last frame (huge when motion is reduced, so tweens snap)
  still: boolean;
}

// Mounts a canvas loop on a stage. With reduced motion, frames are drawn only on demand.
export function mountCanvas(root: HTMLElement, frame: (f: Frame) => void) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!;
  const ctx = canvas.getContext('2d')!;
  const still = reducedMotion();
  let w = 0;
  let h = 0;
  let t = 0;
  const draw = (dt: number) => {
    if (!w || !h) return;
    if (!still) t += dt;
    ctx.clearRect(0, 0, w, h);
    frame({ ctx, w, h, t, dt: still ? 1e6 : dt, still });
  };
  const resize = () => {
    ({ w, h } = fitCanvas(canvas, ctx));
    draw(0);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();
  if (!still) visibleLoop(root, (_, dt) => draw(dt));
  return { redraw: () => draw(0), still };
}

// Frame-rate independent approach of `cur` toward `target`.
export const approach = (cur: number, target: number, dt: number, rate = 6) =>
  cur + (target - cur) * (1 - Math.exp((-dt * rate) / 1000));

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// Repeating 0..1 phase with period `ms`.
export const phase = (t: number, ms: number, offset = 0) => (((t + offset) % ms) + ms) % ms / ms;

export function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 4) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Rune glyphs are drawn only once the runic web font is ready, so a slow load never shows tofu boxes.
let runesReady = false;
const runicOk = () => (runesReady ||= !!document.fonts?.check('16px "Noto Sans Runic"', 'ᛟ'));

export function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  opts: { font?: string; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; alpha?: number } = {},
) {
  if (opts.font?.includes('Runic') && !runicOk()) return;
  ctx.save();
  ctx.font = opts.font ?? FONT.mono(11);
  ctx.fillStyle = opts.color ?? C.dim;
  ctx.textAlign = opts.align ?? 'left';
  ctx.textBaseline = opts.base ?? 'alphabetic';
  ctx.globalAlpha *= opts.alpha ?? 1;
  ctx.fillText(s, x, y);
  ctx.restore();
}

export function glow(ctx: CanvasRenderingContext2D, color: string, blur: number, fn: () => void) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  fn();
  ctx.restore();
}

// Box with a carved-stone look and a label.
export function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { label?: string; sub?: string; stroke?: string; fill?: string; lit?: number } = {},
) {
  const lit = opts.lit ?? 0;
  ctx.save();
  if (lit > 0) {
    ctx.shadowColor = opts.stroke ?? C.gold;
    ctx.shadowBlur = 18 * lit;
  }
  rrect(ctx, x, y, w, h, 8);
  ctx.fillStyle = opts.fill ?? C.stone;
  ctx.fill();
  ctx.restore();
  rrect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 8);
  ctx.strokeStyle = opts.stroke ?? C.line;
  ctx.globalAlpha = 0.5 + 0.5 * Math.max(lit, opts.stroke ? 0.6 : 0);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.globalAlpha = 1;
  if (opts.label) text(ctx, opts.label, x + w / 2, y + (opts.sub ? h / 2 - 2 : h / 2 + 4), { font: FONT.body(12, 600), color: C.text, align: 'center' });
  if (opts.sub) text(ctx, opts.sub, x + w / 2, y + h / 2 + 13, { font: FONT.mono(10), color: C.dim, align: 'center' });
}

// A dot travelling along a polyline, t in 0..1.
export function along(pts: [number, number][], t: number): [number, number] {
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(d);
    total += d;
  }
  let d = clamp(t) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const k = segs[i] ? d / segs[i] : 0;
      return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)];
    }
    d -= segs[i];
  }
  return pts[pts.length - 1];
}

export function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, blur = 10) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function path(ctx: CanvasRenderingContext2D, pts: [number, number][], color: string, width = 1, dash: number[] = []) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.restore();
}

// Ash particles for things that get evicted / destroyed.
export class Ash {
  private ps: { x: number; y: number; vx: number; vy: number; life: number; c: string }[] = [];
  burst(x: number, y: number, w: number, h: number, color = C.ash, n = 10) {
    for (let i = 0; i < n; i++) {
      this.ps.push({
        x: x + Math.random() * w,
        y: y + Math.random() * h,
        vx: (Math.random() - 0.5) * 0.04,
        vy: 0.01 + Math.random() * 0.05,
        life: 1,
        c: Math.random() < 0.25 ? C.ember : color,
      });
    }
  }
  draw(ctx: CanvasRenderingContext2D, dt: number) {
    if (dt > 1000) {
      this.ps = [];
      return;
    }
    this.ps = this.ps.filter((p) => (p.life -= dt / 900) > 0);
    for (const p of this.ps) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.globalAlpha = p.life * 0.9;
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x, p.y, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
}

export function setHud(root: HTMLElement, html: string) {
  const hud = root.querySelector<HTMLElement>('.stage__hud');
  if (hud && hud.dataset.html !== html) {
    hud.dataset.html = html;
    hud.innerHTML = html;
  }
}
