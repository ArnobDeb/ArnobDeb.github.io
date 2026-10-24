// HTTP Act I: clients → CivetWeb workers → LRU cache → MySQL. Gold = cache hit, violet = miss.
import type { StageFactory } from '../fx/story';
import { along, box, C, dot, FONT, glow, mountCanvas, rrect, setHud, text } from './kit';

const hash = (k: number) => ((k * 2654435761) >>> 0) / 4294967296;

export const flowStage: StageFactory = (root) => {
  let step = 0;
  let stepT = 0;

  const view = mountCanvas(root, ({ ctx, w, h, t, dt, still }) => {
    stepT += dt;
    const pad = Math.max(10, w * 0.03);
    const colW = Math.min(118, (w - pad * 2) / 5);
    const xs = [pad, w * 0.3 - colW / 2, w * 0.62 - colW / 2, w - pad - colW];
    const top = Math.max(h * 0.14, 56);
    const H = h * 0.6;

    // Clients (closed-loop load generator threads).
    const n = 8;
    const ch = (H - (n - 1) * 4) / n;
    for (let i = 0; i < n; i++) {
      rrect(ctx, xs[0], top + i * (ch + 4), colW * 0.7, ch, 4);
      ctx.fillStyle = C.stone2;
      ctx.fill();
      text(ctx, `client ${i + 1}`, xs[0] + 6, top + i * (ch + 4) + ch * 0.68, { font: FONT.mono(Math.min(10, ch * 0.6)), color: C.dim });
    }
    text(ctx, 'loadgen · cores 2–3', xs[0], top - 10, { font: FONT.mono(10), color: C.faint });

    // Server with 8 worker threads.
    box(ctx, xs[1], top, colW, H, { stroke: C.frost, lit: step === 0 ? 0.4 : 0 });
    text(ctx, 'CivetWeb', xs[1] + colW / 2, top - 10, { font: FONT.mono(11, 600), color: C.frost, align: 'center' });
    text(ctx, 'cores 0–1', xs[1] + colW / 2, top + H + 16, { font: FONT.mono(10), color: C.faint, align: 'center' });
    const wh = (H - 20 - 7 * 4) / 8;
    for (let i = 0; i < 8; i++) {
      const busy = !still && Math.sin(t / 300 + i * 1.3) > 0.2;
      rrect(ctx, xs[1] + 10, top + 10 + i * (wh + 4), colW - 20, wh, 3);
      ctx.fillStyle = busy ? 'rgba(143,211,255,.3)' : 'rgba(255,255,255,.04)';
      ctx.fill();
      text(ctx, `worker ${i}`, xs[1] + colW / 2, top + 10 + i * (wh + 4) + wh * 0.68, { font: FONT.mono(Math.min(9, wh * 0.6)), color: C.dim, align: 'center' });
    }

    // LRU cache (8 visible of 64 slots), most recent at the top.
    const cache = { x: xs[2], y: top + H * 0.08, w: colW, h: H * 0.84 };
    box(ctx, cache.x, cache.y, cache.w, cache.h, { stroke: C.gold, lit: step === 1 || step === 3 ? 0.5 : 0 });
    text(ctx, 'LRU · 64 entries', cache.x + cache.w / 2, cache.y - 10, { font: FONT.mono(11, 600), color: C.goldB, align: 'center' });
    const sh = (cache.h - 16) / 8;
    const shift = step === 2 && !still ? (t % 1600) / 1600 : 0;
    for (let i = 0; i < 8; i++) {
      const y = cache.y + 8 + (i + shift) * sh;
      if (y + sh > cache.y + cache.h - 4) continue;
      rrect(ctx, cache.x + 8, y + 1, cache.w - 16, sh - 4, 3);
      ctx.fillStyle = i === 0 ? 'rgba(240,196,106,.35)' : 'rgba(240,196,106,.1)';
      ctx.fill();
      text(ctx, `emp #${[17, 4, 42, 8, 23, 15, 31, 9][i]}`, cache.x + cache.w / 2, y + sh * 0.6, { font: FONT.mono(Math.min(9, sh * 0.55)), color: C.dim, align: 'center' });
    }
    if (step === 3) {
      // The mutex: one thread inside at a time.
      glow(ctx, C.goldB, 12, () => text(ctx, 'mutex · one thread at a time', cache.x + cache.w / 2, cache.y + cache.h + 18, { font: FONT.mono(11, 600), color: C.goldB, align: 'center' }));
    }

    // MySQL.
    const db = { x: xs[3], y: top + H * 0.25, w: colW, h: H * 0.5 };
    const cyl = (y: number) => {
      ctx.beginPath();
      ctx.ellipse(db.x + db.w / 2, y, db.w / 2, 9, 0, 0, Math.PI * 2);
    };
    ctx.fillStyle = C.stone;
    ctx.fillRect(db.x, db.y, db.w, db.h);
    ctx.strokeStyle = step === 2 ? C.violet : C.line;
    ctx.beginPath();
    ctx.moveTo(db.x, db.y);
    ctx.lineTo(db.x, db.y + db.h);
    ctx.moveTo(db.x + db.w, db.y);
    ctx.lineTo(db.x + db.w, db.y + db.h);
    ctx.stroke();
    cyl(db.y + db.h);
    ctx.fillStyle = C.stone;
    ctx.fill();
    ctx.stroke();
    cyl(db.y);
    ctx.fillStyle = C.stone2;
    ctx.fill();
    ctx.stroke();
    text(ctx, 'MySQL', db.x + db.w / 2, db.y + db.h / 2 + 4, { font: FONT.body(12, 600), color: C.text, align: 'center' });
    text(ctx, 'thread-local conns', db.x + db.w / 2, db.y + db.h / 2 + 18, { font: FONT.mono(9), color: C.dim, align: 'center' });

    // Requests.
    const iv = 260;
    const now = still ? 2000 : t;
    for (let k = Math.max(0, Math.floor((now - 3200) / iv)); k <= Math.floor(now / iv); k++) {
      const c = Math.floor(hash(k) * n);
      const wk = Math.floor(hash(k + 3) * 8);
      const hitP = step === 2 ? 0.25 : step === 0 ? 0.5 : 0.75;
      const hit = hash(k + 11) < hitP;
      const travel = hit ? 1700 : 3200;
      const age = (now - k * iv) / travel;
      if (age < 0 || age > 1) continue;
      const cp: [number, number] = [xs[0] + colW * 0.7, top + c * (ch + 4) + ch / 2];
      const wp: [number, number] = [xs[1] + colW / 2, top + 10 + wk * (wh + 4) + wh / 2];
      const cIn: [number, number] = [cache.x, cache.y + cache.h / 2];
      const dbIn: [number, number] = [db.x, db.y + db.h / 2];
      const route: [number, number][] = hit ? [cp, wp, cIn, wp, cp] : [cp, wp, cIn, dbIn, cIn, wp, cp];
      // Queue at the lock in step 3: requests hesitate just outside the cache.
      let a = age;
      if (step === 3 && a > 0.3 && a < 0.45) a = 0.3 + (a - 0.3) * 0.2;
      const [x, y] = along(route, a);
      const color = a > 0.5 ? (hit ? C.goldB : C.violet) : C.frost;
      dot(ctx, x, y, 2.8, color, 8);
    }

    const cap = [
      'each request is handed to one of 8 worker threads',
      'hits return straight from memory',
      'misses go to MySQL, then fill the cache and push out the oldest entry',
      'one mutex guards the cache; PUT and DELETE invalidate entries',
    ][step];
    if (w > 460) text(ctx, cap ?? '', w / 2, h * 0.93, { font: FONT.mono(11), color: C.dim, align: 'center' });
  });

  return {
    setStep(i) {
      step = i;
      stepT = 0;
      setHud(root, ['Front door', 'Cache hit', 'Cache miss', 'Shared lock'][i] ?? '');
      view.redraw();
    },
  };
};
