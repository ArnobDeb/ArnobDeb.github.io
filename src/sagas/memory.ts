// Act I of RestoreKV: one 30 GB pool shared by CPU, iGPU and NPU; weights + KV cache.
import type { StageFactory } from '../fx/story';
import { approach, box, C, FONT, mountCanvas, phase, rrect, setHud, text } from './kit';

const POOL = 30; // GB visible to the OS
const WEIGHTS = 16.4; // Qwen3-8B FP16
const CTX = [4, 8, 16, 32, 64]; // K tokens
const KV_PER_K = (144 * 1024) / 1e9 * 1024; // 144 KiB per token → GB per 1K tokens
const SEQS = [1, 2, 4, 8];

export const memoryStage: StageFactory = (root, controls) => {
  let step = 0;
  let ctxI = 2;
  let seqI = 0;
  let touched = false;
  const s = { chips: 0, weights: 0, kv: 0, seqs: 1 };

  const ctxIn = controls?.querySelector<HTMLInputElement>('[data-k="ctx"]');
  const seqIn = controls?.querySelector<HTMLInputElement>('[data-k="seq"]');
  const sync = () => {
    if (ctxIn) {
      ctxIn.value = String(ctxI);
      ctxIn.nextElementSibling!.textContent = `${CTX[ctxI]}K`;
    }
    if (seqIn) {
      seqIn.value = String(seqI);
      seqIn.nextElementSibling!.textContent = String(SEQS[seqI]);
    }
  };
  const onInput = () => {
    touched = true;
    ctxI = Number(ctxIn?.value ?? ctxI);
    seqI = Number(seqIn?.value ?? seqI);
    sync();
    view.redraw();
  };
  ctxIn?.addEventListener('input', onInput);
  seqIn?.addEventListener('input', onInput);
  sync();

  const kvGB = (i: number) => CTX[i] * KV_PER_K;

  const view = mountCanvas(root, ({ ctx, w, h, t, dt }) => {
    // Targets for this step.
    let kvTarget = 0;
    let seqs = 1;
    if (touched || step >= 3) {
      kvTarget = kvGB(ctxI);
      seqs = SEQS[seqI];
    } else if (step === 2) {
      // Context grows 4K → 64K and repeats.
      const p = phase(t, 7000);
      kvTarget = kvGB(Math.min(4, Math.floor(p * 5.2)));
    }
    s.chips = approach(s.chips, 1, dt, 3);
    s.weights = approach(s.weights, step >= 1 || touched ? WEIGHTS : 0, dt, 3);
    s.kv = approach(s.kv, kvTarget, dt, 4);
    s.seqs = seqs;

    const pad = Math.max(16, w * 0.05);
    const barY = h * 0.62;
    const barH = Math.max(34, h * 0.11);
    const barW = w - pad * 2;
    const scale = barW / POOL;

    // The three compute units on one chip.
    const chipW = Math.min(110, (w - pad * 2 - 40) / 3);
    const chipH = 46;
    const chipY = Math.max(h * 0.14, 64);
    const names: [string, string][] = [['CPU', '8 cores'], ['iGPU', 'Arc'], ['NPU', 'AI Boost']];
    const totalChips = chipW * 3 + 40;
    const cx0 = (w - totalChips) / 2;
    rrect(ctx, cx0 - 14, chipY - 22, totalChips + 28, chipH + 36, 12);
    ctx.strokeStyle = C.line;
    ctx.setLineDash([3, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'Core Ultra 7 258V — one chip', cx0 - 4, chipY - 8, { font: FONT.mono(10), color: C.faint });
    names.forEach(([n, sub], i) => {
      const x = cx0 + i * (chipW + 20);
      const pulse = 0.4 + 0.6 * Math.max(0, Math.sin(t / 500 - i));
      box(ctx, x, chipY, chipW, chipH, { label: n, sub, stroke: C.frost, lit: s.chips * (step === 0 ? pulse : 0.15) });
      // Every unit reaches into the same pool.
      ctx.save();
      ctx.strokeStyle = C.frost;
      ctx.globalAlpha = 0.25 + (step === 0 ? 0.4 * pulse : 0);
      ctx.setLineDash([2, 5]);
      ctx.lineDashOffset = -t / 40;
      ctx.beginPath();
      ctx.moveTo(x + chipW / 2, chipY + chipH);
      ctx.lineTo(pad + barW * (0.2 + i * 0.3), barY);
      ctx.stroke();
      ctx.restore();
    });

    // The pool.
    rrect(ctx, pad, barY, barW, barH, 8);
    ctx.fillStyle = C.bg;
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.stroke();

    let x = pad;
    const seg = (gb: number, color: string, label: string) => {
      const ww = gb * scale;
      if (ww < 0.5) return;
      ctx.save();
      rrect(ctx, x + 1, barY + 1, Math.max(0, ww - 2), barH - 2, 6);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.restore();
      if (ww > 70) text(ctx, label, x + 8, barY + barH / 2 + 4, { font: FONT.mono(11, 600), color: '#0a0d13' });
      x += ww;
    };
    seg(s.weights, C.violet, `weights ${s.weights.toFixed(1)} GB`);
    for (let i = 0; i < s.seqs; i++) seg(s.kv, i % 2 ? '#c99a3c' : C.gold, s.seqs === 1 ? `KV ${s.kv.toFixed(1)} GB` : `KV ${i + 1}`);

    const used = s.weights + s.kv * s.seqs;
    const over = used > POOL + 0.05;
    // Overflow spills past the end of the pool.
    if (over) {
      const shake = Math.sin(t / 40) * 1.5;
      ctx.save();
      ctx.strokeStyle = C.blood;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pad + barW + shake, barY - 10);
      ctx.lineTo(pad + barW + shake, barY + barH + 10);
      ctx.stroke();
      ctx.restore();
    }
    text(ctx, '0', pad, barY + barH + 16, { font: FONT.mono(10), color: C.faint });
    text(ctx, `${POOL} GB visible`, pad + barW, barY + barH + 16, { font: FONT.mono(10), color: over ? C.blood : C.faint, align: 'right' });
    text(ctx, 'shared memory pool', pad, barY - 10, { font: FONT.mono(10), color: C.faint });

    const verdict = over ? 'does not fit' : 'fits';
    text(ctx, `${used.toFixed(1)} GB of ${POOL} — ${verdict}`, w / 2, h * 0.9, {
      font: FONT.body(15, 600),
      color: over ? C.blood : C.text,
      align: 'center',
    });
  });

  return {
    setStep(i) {
      step = i;
      if (i >= 3 && !touched) {
        ctxI = 4;
        seqI = 1;
        sync();
      }
      setHud(
        root,
        ['One chip · one pool', 'Weights: 16.4 GB', 'KV cache: 144 KiB / token', 'Try the sliders below'][i] ?? '',
      );
      view.redraw();
    },
  };
};
