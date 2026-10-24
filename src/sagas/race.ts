// GPU Act II: activations per refresh window — one thread vs many warps (GPUHammer's numbers).
import type { StageFactory } from '../fx/story';
import { approach, C, dot, FONT, mountCanvas, phase, rrect, setHud, text } from './kit';

const MAX = 700_000; // tREFW / tRC = 23 ms / 45 ns

export const raceStage: StageFactory = (root) => {
  let step = 0;
  let stepT = 0;
  const bars = { one: 0, warps: 0 };

  const view = mountCanvas(root, ({ ctx, w, h, t, dt, still }) => {
    stepT += dt;
    const pad = Math.max(16, w * 0.06);

    if (step === 1) {
      // Hidden mappings: probe pairs of addresses; high latency means same bank.
      const n = 8;
      const cell = Math.min((w - pad * 2) / n, (h * 0.55) / 4);
      const ox = (w - cell * n) / 2;
      const oy = h * 0.16;
      const bankOf = (i: number) => (i * 5 + 3) % 4;
      const probes = still ? 32 : Math.floor(stepT / 160);
      for (let i = 0; i < 32; i++) {
        const x = ox + (i % n) * cell;
        const y = oy + Math.floor(i / n) * cell;
        const known = i < probes;
        rrect(ctx, x + 3, y + 3, cell - 6, cell - 6, 4);
        ctx.fillStyle = known ? [C.teal, C.violet, C.gold, C.frost][bankOf(i)] : C.stone2;
        ctx.globalAlpha = known ? 0.55 : 1;
        ctx.fill();
        ctx.globalAlpha = 1;
        text(ctx, known ? `b${bankOf(i)}` : '?', x + cell / 2, y + cell / 2 + 4, { font: FONT.mono(11, 600), color: known ? '#0a0d13' : C.faint, align: 'center' });
      }
      const i = probes % 32;
      const conflict = bankOf(i) === bankOf(0);
      text(ctx, `probe ref ↔ addr ${i}: ${conflict ? 'slower · same bank (row conflict)' : 'faster · different bank'}`, w / 2, h * 0.86, {
        font: FONT.mono(12, 600),
        color: conflict ? C.ember : C.dim,
        align: 'center',
      });
      text(ctx, '256-byte steps · row-buffer conflicts are slower', w / 2, h * 0.93, { font: FONT.mono(10), color: C.faint, align: 'center' });
      return;
    }

    // Latency pulses: CPU vs GPU memory.
    const ly = h * 0.16;
    const pulse = (label: string, ns: number, y: number, color: string) => {
      text(ctx, label, pad, y + 4, { font: FONT.mono(11), color: C.dim });
      const x0 = pad + 120;
      const len = w - pad - x0;
      ctx.strokeStyle = C.line;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + len, y);
      ctx.stroke();
      const p = still ? 0.5 : phase(t, ns * 6);
      dot(ctx, x0 + p * len, y, 4, color);
      text(ctx, `${ns} ns`, x0 + len, y - 8, { font: FONT.mono(10), color: C.faint, align: 'right' });
    };
    pulse('CPU DRAM', 60, ly, C.frost);
    pulse('GPU GDDR6', 300, ly + 28, C.ember);

    // Activations per window.
    const oneT = 100_000;
    const warpsT = step >= 2 ? 620_000 : 0;
    const p = still ? 1 : Math.min(1, phase(stepT, 4000) * 1.6);
    bars.one = approach(bars.one, oneT * p, dt, 6);
    bars.warps = approach(bars.warps, warpsT * p, dt, 6);

    const bx = pad + 120;
    const bw = w - pad - bx;
    const by = h * 0.42;
    const bh = Math.max(22, h * 0.08);
    const row = (label: string, v: number, y: number, color: string, sub: string) => {
      text(ctx, label, pad, y + bh / 2 + 4, { font: FONT.mono(11), color: C.dim });
      rrect(ctx, bx, y, bw, bh, 5);
      ctx.fillStyle = C.bg;
      ctx.fill();
      rrect(ctx, bx, y, Math.max(0, (v / MAX) * bw), bh, 5);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      text(ctx, `${Math.round(v / 1000)}K ${sub}`, bx + 8, y + bh / 2 + 4, { font: FONT.mono(11, 600), color: '#0a0d13' });
    };
    row('1 thread', bars.one, by, C.frost, '');
    row('8 warps', bars.warps, by + bh + 14, C.gold, step >= 2 ? '· 93% of max' : '');
    // Theoretical maximum.
    ctx.save();
    ctx.strokeStyle = C.blood;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(bx + bw - 1, by - 10);
    ctx.lineTo(bx + bw - 1, by + bh * 2 + 24);
    ctx.stroke();
    ctx.restore();
    text(ctx, 'max ≈ 700K per 23 ms', bx + bw, by - 14, { font: FONT.mono(10), color: C.blood, align: 'right' });

    // Eight warps taking turns at the memory controller.
    if (step >= 2) {
      const wy = by + bh * 2 + 44;
      for (let k = 0; k < 8; k++) {
        const x = bx + (k / 8) * bw;
        const on = still ? 1 : phase(t + k * 75, 600) < 0.5 ? 1 : 0.25;
        rrect(ctx, x + 2, wy, bw / 8 - 4, 14, 3);
        ctx.fillStyle = C.gold;
        ctx.globalAlpha = on * 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      text(ctx, 'when one warp stalls, the next one issues', bx + bw / 2, wy + 32, { font: FONT.mono(10), color: C.dim, align: 'center' });
    } else {
      text(ctx, '~100K per window from one CUDA thread', bx + bw / 2, by + bh * 2 + 52, { font: FONT.mono(11), color: C.dim, align: 'center' });
    }
  });

  return {
    setStep(i) {
      step = i;
      stepT = 0;
      setHud(root, ['Slow memory, short window', 'Learning the map by timing', 'Multi-warp hammering'][i] ?? '');
      view.redraw();
    },
  };
};
