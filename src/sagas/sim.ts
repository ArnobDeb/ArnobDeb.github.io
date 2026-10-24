// GPU Act IV: the GPGPU-Sim ↔ dramsim3 wrapper ↔ DRAMSim3 integration, animated.
import type { StageFactory } from '../fx/story';
import { along, box, C, dot, FONT, mountCanvas, phase, rrect, setHud, text } from './kit';

const CH_COLORS = [C.teal, C.violet, C.frost, C.goldB];
const hash = (k: number) => ((k * 2654435761) >>> 0) / 4294967296;

export const simStage: StageFactory = (root) => {
  let step = 0;
  let stepT = 0;

  const view = mountCanvas(root, ({ ctx, w, h, t, dt, still }) => {
    stepT += dt;
    const pad = Math.max(10, w * 0.03);
    const colW = Math.min(110, (w - pad * 2) / 5.2);
    const xs = [pad, w * 0.34 - colW / 2, w * 0.58 - colW * 0.65, w - pad - colW];
    const top = Math.max(h * 0.12, 54);
    const H = h * 0.62;

    // SMs.
    const smH = (H - 18) / 4;
    for (let i = 0; i < 4; i++) box(ctx, xs[0], top + i * (smH + 6), colW, smH, { label: `SM${i}`, sub: 'warps · L1' });
    // L2.
    const l2 = { x: xs[1], y: top + H * 0.15, w: colW, h: H * 0.7 };
    box(ctx, l2.x, l2.y, l2.w, l2.h, { label: 'L2 cache', sub: 'MSHRs', stroke: step === 4 ? C.goldB : undefined, lit: step === 4 ? 0.6 : 0 });
    // Wrapper.
    const wr = { x: xs[2], y: top, w: colW * 1.3, h: H };
    box(ctx, wr.x, wr.y, wr.w, wr.h, { stroke: C.gold, lit: 0.35, fill: '#1a1710' });
    text(ctx, 'dramsim3 wrapper', wr.x + wr.w / 2, wr.y - 8, { font: FONT.mono(11, 600), color: C.goldB, align: 'center' });
    const ports = ['AddTransaction()', 'WillAccept…()', 'ClockTick()', 'callbacks'];
    ports.forEach((p, i) => {
      const lit = (step === 0 && (i === 0 || i === 3)) || (step === 1 && i === 2) || (step === 2 && i === 1);
      const py = wr.y + 12 + i * (wr.h - 24) / 4;
      rrect(ctx, wr.x + 8, py, wr.w - 16, (wr.h - 24) / 4 - 8, 5);
      ctx.fillStyle = lit ? 'rgba(240,196,106,.22)' : 'rgba(255,255,255,.03)';
      ctx.fill();
      text(ctx, p, wr.x + wr.w / 2, py + (wr.h - 24) / 8, { font: FONT.mono(Math.max(8, Math.min(10, wr.w / 14))), color: lit ? C.goldB : C.dim, align: 'center' });
    });
    // DRAM channels.
    const chH = (H - 18) / 4;
    for (let i = 0; i < 4; i++) box(ctx, xs[3], top + i * (chH + 6), colW, chH, { label: `GDDR6 ch${i}`, sub: 'DRAMSim3', stroke: CH_COLORS[i] });

    const l2In: [number, number] = [l2.x, l2.y + l2.h / 2];
    const l2Out: [number, number] = [l2.x + l2.w, l2.y + l2.h / 2];
    const wrIn: [number, number] = [wr.x, wr.y + wr.h * 0.18];
    const wrOut: [number, number] = [wr.x + wr.w, wr.y + wr.h * 0.18];

    // Queue occupancy (step 2): oscillates around the high-water mark.
    const occ = step === 2 ? (still ? 0.7 : 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(stepT / 900))) : 0.3;
    const gateClosed = step === 2 && occ > 0.6;

    // Packets.
    const iv = step === 4 ? 140 : 220;
    const travel = 2600;
    const now = still ? travel * 0.6 : t;
    const first = Math.floor((now - travel) / iv);
    for (let k = first; k <= Math.floor(now / iv); k++) {
      if (k < 0) continue;
      const age = (now - k * iv) / travel;
      if (age < 0 || age > 1) continue;
      const sm = Math.floor(hash(k) * 4);
      const ch = Math.floor(hash(k + 7) * 4);
      const smOut: [number, number] = [xs[0] + colW, top + sm * (smH + 6) + smH / 2];
      const chIn: [number, number] = [xs[3], top + ch * (chH + 6) + chH / 2];
      const hit = step === 4 ? hash(k + 13) < 0.4 : hash(k + 13) < 0.2;
      let route: [number, number][];
      if (hit) route = [smOut, l2In, [l2.x + l2.w / 2, l2.y + l2.h / 2], l2In, smOut];
      else if (gateClosed && age > 0.3 && age < 0.75) route = [smOut, l2In, l2Out, l2Out];
      else route = [smOut, l2In, l2Out, wrIn, wrOut, chIn, wrOut, wrIn, l2Out, l2In, smOut];
      const [x, y] = along(route, age);
      const back = age > 0.5;
      dot(ctx, x, y, 2.6, hit ? C.goldB : back ? C.dim : CH_COLORS[ch], hit ? 10 : 6);
    }

    // Per-step overlays.
    const capY = h * 0.86;
    if (step === 1) {
      const gx = wr.x + wr.w / 2;
      const ring = (cx: number, period: number, color: string, label: string) => {
        const a = (still ? 0.3 : phase(t, period)) * Math.PI * 2;
        ctx.strokeStyle = C.line;
        ctx.beginPath();
        ctx.arc(cx, capY - 6, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, capY - 6);
        ctx.lineTo(cx + Math.cos(a) * 11, capY - 6 + Math.sin(a) * 11);
        ctx.stroke();
        ctx.lineWidth = 1;
        text(ctx, label, cx, capY + 20, { font: FONT.mono(10), color, align: 'center' });
      };
      ring(gx - 70, 700, C.frost, 'SIMT clock');
      ring(gx + 70, 1100, C.goldB, 'DRAM clock');
      text(ctx, '⇄', gx, capY, { font: FONT.body(16), color: C.dim, align: 'center' });
    } else if (step === 2) {
      const mx = wr.x + wr.w + 6;
      rrect(ctx, wr.x + 8, capY - 10, wr.w - 16, 10, 4);
      ctx.fillStyle = C.bg;
      ctx.fill();
      rrect(ctx, wr.x + 8, capY - 10, (wr.w - 16) * occ, 10, 4);
      ctx.fillStyle = gateClosed ? C.blood : C.teal;
      ctx.fill();
      const hwm = wr.x + 8 + (wr.w - 16) * 0.6;
      ctx.strokeStyle = C.text;
      ctx.beginPath();
      ctx.moveTo(hwm, capY - 14);
      ctx.lineTo(hwm, capY + 4);
      ctx.stroke();
      text(ctx, gateClosed ? 'queue past high-water mark → L2 waits' : 'queue has room → accept', w / 2, capY + 22, { font: FONT.mono(11, 600), color: gateClosed ? C.blood : C.teal, align: 'center' });
      text(ctx, 'dropped: 0', mx, capY, { font: FONT.mono(10), color: C.dim });
    } else if (step === 3) {
      const cx = xs[3];
      const bars = 8;
      for (let i = 0; i < bars; i++) {
        const v = 0.25 + 0.7 * Math.abs(Math.sin(i * 1.7 + (still ? 0 : t / 1400)));
        const bx = cx + (i * colW) / bars;
        const bh = 40 * v;
        ctx.fillStyle = v > 0.85 ? C.blood : C.teal;
        ctx.fillRect(bx + 1, capY - bh + 8, colW / bars - 2, bh);
      }
      ctx.strokeStyle = C.blood;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, capY + 8 - 40 * 0.85);
      ctx.lineTo(cx + colW, capY + 8 - 40 * 0.85);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'ACTs per row since last REF · T_RH', cx + colW, capY + 24, { font: FONT.mono(10), color: C.dim, align: 'right' });
      text(ctx, 'hooks: PARA · TRR · RFM', wr.x + wr.w / 2, capY + 24, { font: FONT.mono(11, 600), color: C.goldB, align: 'center' });
    } else if (step === 4) {
      text(ctx, 'gold = served by L2 · effective hammering rate ≈ 40% lower', w / 2, capY + 10, { font: FONT.mono(11, 600), color: C.goldB, align: 'center' });
    } else {
      text(ctx, 'L2 miss → wrapper → the channel that owns the address → callback', w / 2, capY + 10, { font: FONT.mono(11), color: C.dim, align: 'center' });
    }
  });

  return {
    setStep(i) {
      step = i;
      stepT = 0;
      setHud(root, ['Transactions', 'Clock bridge', 'Backpressure', 'Activation counters', 'L2 throttle'][i] ?? '');
      view.redraw();
    },
  };
};
