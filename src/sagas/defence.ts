// GPU Act III: PARA, TRR (16-entry sampler vs 17 aggressors) and RFM (counter → bank blocked).
import type { StageFactory } from '../fx/story';
import { approach, C, dot, FONT, glow, mountCanvas, phase, rrect, setHud, text } from './kit';

export const defenceStage: StageFactory = (root) => {
  let step = 0;
  let stepT = 0;
  let counter = 0;
  const spikes: number[] = [];

  const view = mountCanvas(root, ({ ctx, w, h, t, dt, still }) => {
    stepT += dt;
    const pad = Math.max(16, w * 0.06);

    if (step === 0) {
      // PARA: each activation flips a weighted coin; rarely, neighbours get refreshed.
      const rows = 7;
      const rh = (h * 0.6) / rows;
      const gy = h * 0.12;
      const k = Math.floor(stepT / 260);
      const hit = (k * 2654435761) % 97 < 9; // ~1 in 10 for visibility (real p is far smaller)
      for (let r = 0; r < rows; r++) {
        const y = gy + r * rh;
        const agg = r === 3;
        const nb = (r === 2 || r === 4) && hit && !still;
        rrect(ctx, pad + 60, y + 3, w - pad * 2 - 60, rh - 6, 4);
        ctx.fillStyle = agg ? 'rgba(255,106,43,.35)' : nb ? 'rgba(62,230,193,.45)' : C.stone2;
        ctx.fill();
        text(ctx, agg ? 'aggressor' : nb ? 'refreshed' : `row ${r}`, pad + 52, y + rh / 2 + 4, { font: FONT.mono(10), color: agg ? C.ember : nb ? C.teal : C.faint, align: 'right' });
      }
      const coinY = h * 0.84;
      const flip = still ? 0 : phase(stepT, 260);
      ctx.save();
      ctx.translate(w / 2, coinY);
      ctx.scale(Math.cos(flip * Math.PI), 1);
      dot(ctx, 0, 0, 12, hit ? C.teal : C.faint, 8);
      ctx.restore();
      text(ctx, 'each ACT: refresh neighbours with probability p (sped up to be visible)', w / 2, coinY + 30, { font: FONT.mono(11), color: C.dim, align: 'center' });
      return;
    }

    if (step === 1) {
      // TRR: 17 aggressors take turns; the 16-entry sampler keeps the most recent 16.
      const n = 17;
      const slots = 16;
      const k = still ? 40 : Math.floor(stepT / 180);
      const order = (i: number) => i % n;
      const tracked = new Set<number>();
      for (let i = Math.max(0, k - slots + 1); i <= k; i++) tracked.add(order(i));
      const ax = pad;
      const ah = Math.min(18, (h * 0.75) / n);
      const ay = h * 0.1;
      for (let i = 0; i < n; i++) {
        const y = ay + i * ah;
        const active = order(k) === i;
        const isTracked = tracked.has(i);
        rrect(ctx, ax, y + 1, w * 0.36, ah - 2, 3);
        ctx.fillStyle = active ? C.ember : isTracked ? 'rgba(255,106,43,.25)' : 'rgba(224,70,77,.55)';
        ctx.fill();
        text(ctx, `A${i + 1}${isTracked ? '' : '  untracked'}`, ax + 6, y + ah * 0.7, { font: FONT.mono(9, 600), color: isTracked && !active ? C.dim : '#0a0d13' });
      }
      // The sampler.
      const sx = w * 0.56;
      const sw = w - pad - sx;
      text(ctx, 'TRR sampler · 16 entries', sx, ay - 6, { font: FONT.mono(10), color: C.faint });
      const sh = Math.min(18, (h * 0.75) / slots);
      [...tracked].forEach((a, i) => {
        rrect(ctx, sx, ay + 4 + i * sh, sw, sh - 3, 3);
        ctx.fillStyle = C.stone2;
        ctx.fill();
        text(ctx, `A${a + 1}`, sx + 8, ay + 4 + i * sh + sh * 0.62, { font: FONT.mono(9), color: C.dim });
      });
      text(ctx, '17 aggressors > 16 slots → one always slips through', w / 2, h * 0.95, { font: FONT.mono(11, 600), color: C.blood, align: 'center' });
      return;
    }

    // RFM: a per-bank counter; at T_init an RFM refresh, at T_max the bank blocks.
    const T_INIT = 0.6;
    const T_MAX = 1;
    counter += (still ? 0 : dt) * 0.00042;
    let blocked = false;
    if (counter >= T_MAX) {
      spikes.push(stepT);
      counter = 0.2;
    }
    if (spikes.length && stepT - spikes[spikes.length - 1] < 500) blocked = true;
    const bx = pad + 20;
    const bh = h * 0.5;
    const by = h * 0.12;
    rrect(ctx, bx, by, 34, bh, 6);
    ctx.fillStyle = C.bg;
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.stroke();
    const shown = still ? 0.85 : counter;
    rrect(ctx, bx + 3, by + bh * (1 - shown) + 3, 28, bh * shown - 6, 4);
    ctx.fillStyle = shown > T_INIT ? C.ember : C.gold;
    ctx.fill();
    [[T_INIT, 'T_init → RFM'], [T_MAX, 'T_max → block']].forEach(([v, l]) => {
      const y = by + bh * (1 - (v as number));
      ctx.strokeStyle = C.blood;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(bx - 6, y);
      ctx.lineTo(bx + 44, y);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, l as string, bx + 50, y + 4, { font: FONT.mono(10), color: C.dim });
    });
    text(ctx, 'bank counter', bx + 17, by + bh + 18, { font: FONT.mono(10), color: C.faint, align: 'center' });

    // Latency timeline with spikes when the bank is blocked.
    const tx = w * 0.42;
    const tw = w - pad - tx;
    const ty = by + bh;
    ctx.strokeStyle = C.line;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + tw, ty);
    ctx.stroke();
    const span = 6000;
    ctx.strokeStyle = C.frost;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const at = stepT - span + (i / 120) * span;
      let lat = 0.08 + 0.03 * Math.sin(at / 90);
      for (const s of spikes) if (Math.abs(at - s) < 160) lat = 0.85;
      if (still && i > 80 && i < 84) lat = 0.85;
      const x = tx + (i / 120) * tw;
      const y = ty - lat * bh;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
    text(ctx, 'access latency over time', tx, by - 6, { font: FONT.mono(10), color: C.faint });
    if (blocked || still) glow(ctx, C.blood, 10, () => text(ctx, 'BANK BLOCKED — 10–15× spike', tx + tw / 2, by + bh * 0.08, { font: FONT.mono(11, 600), color: C.blood, align: 'center' }));
    text(ctx, 'the stall itself is observable: a timing side channel', w / 2, h * 0.9, { font: FONT.mono(11), color: C.dim, align: 'center' });
    void approach;
    void t;
  });

  return {
    setStep(i) {
      step = i;
      stepT = 0;
      counter = 0;
      spikes.length = 0;
      setHud(root, ['PARA', 'TRR', 'RFM'][i] ?? '');
      view.redraw();
    },
  };
};
