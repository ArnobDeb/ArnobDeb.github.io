// Act IV of RestoreKV: self-distillation (teacher vs student), the tiny trained sliver,
// and the replica check against the real OpenVINO runtime.
import type { StageFactory } from '../fx/story';
import { approach, C, dot, FONT, glow, mountCanvas, phase, rrect, setHud, text } from './kit';

// Next-token distributions over a handful of vocabulary entries (shape only).
const TEACHER = [0.05, 0.12, 0.46, 0.18, 0.08, 0.06, 0.03, 0.02];
const STUDENT0 = [0.14, 0.2, 0.17, 0.12, 0.16, 0.1, 0.06, 0.05];

export const trainStage: StageFactory = (root) => {
  let step = 0;
  let stepT = 0;
  const learn = { v: 0 }; // 0 = untrained student, 1 = matches the teacher

  const view = mountCanvas(root, ({ ctx, w, h, t, dt, still }) => {
    stepT += dt;
    const learnT = step === 0 ? 0 : step === 1 ? (still ? 0.85 : 0.15 + 0.7 * Math.min(1, phase(stepT, 6000) * 1.4)) : 0.85;
    learn.v = approach(learn.v, learnT, dt, 3);
    const pad = Math.max(14, w * 0.05);

    if (step <= 1) {
      // Two lanes: teacher (full cache) and student (evicted cache + restore block).
      const laneH = h * 0.3;
      const lanes = [
        { y: h * 0.12, name: 'Teacher', sub: 'full cache', student: false },
        { y: h * 0.52, name: 'Student', sub: 'evicted cache + 8 restore entries', student: true },
      ];
      const cacheW = (w - pad * 2) * 0.48;
      const distX = pad + cacheW + 40;
      const distW = w - pad - distX;
      for (const lane of lanes) {
        text(ctx, lane.name, pad, lane.y, { font: FONT.display(15), color: lane.student ? C.goldB : C.frost });
        text(ctx, lane.sub, pad, lane.y + 16, { font: FONT.mono(10), color: C.faint });
        const n = 14;
        const bw = cacheW / n;
        for (let i = 0; i < n; i++) {
          const kept = !lane.student || [0, 1, 3, 6, 9, 12, 13].includes(i);
          const isR = lane.student && i === 11;
          rrect(ctx, pad + i * bw + 1, lane.y + 28, bw - 2, laneH * 0.42, 2);
          ctx.fillStyle = isR ? C.goldB : kept ? C.teal : 'rgba(58,66,80,.35)';
          ctx.globalAlpha = isR ? 0.95 : kept ? 0.6 : 1;
          ctx.fill();
          ctx.globalAlpha = 1;
          if (isR) text(ctx, 'ᚱ', pad + i * bw + bw / 2, lane.y + 28 + laneH * 0.27, { font: FONT.rune(12), color: '#1a1207', align: 'center' });
        }
        // Next-token distribution.
        const dist = lane.student ? STUDENT0.map((v, i) => v + (TEACHER[i] - v) * learn.v) : TEACHER;
        const dbw = distW / dist.length;
        const base = lane.y + 28 + laneH * 0.6;
        dist.forEach((v, i) => {
          const bh = v * laneH * 1.1;
          rrect(ctx, distX + i * dbw + 2, base - bh, dbw - 4, bh, 3);
          ctx.fillStyle = lane.student ? C.gold : C.frost;
          ctx.globalAlpha = 0.85;
          ctx.fill();
          ctx.globalAlpha = 1;
        });
        text(ctx, 'next-token distribution', distX, lane.y + 16, { font: FONT.mono(10), color: C.faint });
      }
      // KL between the two distributions.
      const kl = STUDENT0.reduce((acc, s0, i) => {
        const p = TEACHER[i];
        const q = s0 + (p - s0) * learn.v;
        return acc + 0.5 * (p * Math.log(p / q) + q * Math.log(q / p));
      }, 0);
      const mx = distX + distW / 2;
      ctx.save();
      ctx.strokeStyle = C.dim;
      ctx.setLineDash([3, 4]);
      ctx.lineDashOffset = -t / 50;
      ctx.beginPath();
      ctx.moveTo(mx, h * 0.12 + 28 + laneH * 0.62);
      ctx.lineTo(mx, h * 0.52 + 20);
      ctx.stroke();
      ctx.restore();
      text(ctx, `symmetric KL ≈ ${kl.toFixed(3)}`, mx, h * 0.47, { font: FONT.mono(12, 600), color: kl < 0.02 ? C.teal : C.text, align: 'center' });
      if (step === 1) text(ctx, 'gradients flow only into ᚱ and the LoRA side paths', w / 2, h * 0.96, { font: FONT.mono(10), color: C.goldB, align: 'center' });
      return;
    }

    if (step === 2) {
      // How small the trained part is: 21.9M of ~8B parameters.
      const cx = w / 2;
      const cy = h * 0.48;
      const r = Math.min(w, h) * 0.3;
      ctx.save();
      ctx.lineWidth = r * 0.28;
      ctx.strokeStyle = C.ash;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      const sliver = (0.003 * Math.PI * 2) * Math.min(1, stepT / 600 + (still ? 1 : 0));
      ctx.strokeStyle = C.goldB;
      ctx.shadowColor = C.goldB;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.max(sliver, 0.02));
      ctx.stroke();
      ctx.restore();
      text(ctx, '0.3%', cx, cy + 8, { font: FONT.display(30), color: C.goldB, align: 'center' });
      text(ctx, '21.9 M trained · rest frozen', cx, cy + 30, { font: FONT.mono(11), color: C.dim, align: 'center' });
      // Eight adapters, one per model × policy.
      const labels = ['Qwen3-8B · H2O', 'Qwen3-8B · ADAPTIVE_RKV', 'Qwen3-4B · H2O', 'Llama-3.1-8B · H2O'];
      text(ctx, '8 adapters · ~3 h each on one A40 (Prajna)', cx, h * 0.92, { font: FONT.mono(11), color: C.dim, align: 'center' });
      labels.forEach((l, i) => text(ctx, l, i % 2 ? w - pad : pad, h * (0.14 + Math.floor(i / 2) * 0.07), { font: FONT.mono(10), color: C.faint, align: i % 2 ? 'right' : 'left' }));
      return;
    }

    // Step 3: our eviction replica vs the real runtime, block for block.
    const rows = 12;
    const colsN = 36;
    const top = h * 0.2;
    const cw = (w - pad * 2) / colsN;
    const rh = (h * 0.56) / rows;
    const reveal = still ? 1 : Math.min(1, stepT / 2500);
    let match = 0;
    let total = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < colsN; c++) {
        if ((r * colsN + c) / (rows * colsN) > reveal) continue;
        const evicted = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453 % 1 > 0.1;
        const tie = r === 7 && c === 22; // near-tie: FP16 on the GPU vs FP32 in our code
        total++;
        if (!tie) match++;
        rrect(ctx, pad + c * cw + 1, top + r * rh + 1, cw - 2, rh - 2, 2);
        ctx.fillStyle = tie ? C.blood : evicted ? 'rgba(58,66,80,.6)' : C.teal;
        ctx.globalAlpha = tie ? 1 : 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;
        if (tie) glow(ctx, C.blood, 10, () => dot(ctx, pad + c * cw + cw / 2, top + r * rh + rh / 2, 1.5, '#fff'));
      }
    }
    text(ctx, 'layer rows: replica decision vs OpenVINO GenAI log', pad, top - 12, { font: FONT.mono(10), color: C.faint });
    text(ctx, `${total ? ((match / total) * 100).toFixed(1) : '0.0'}% identical (report: 99.7–99.9% over 1,296 rows)`, w / 2, h * 0.88, {
      font: FONT.mono(11, 600),
      color: C.text,
      align: 'center',
    });
    text(ctx, 'red = a near-tie (FP16 on the GPU vs FP32)', w / 2, h * 0.94, { font: FONT.mono(10), color: C.blood, align: 'center' });
  });

  return {
    setStep(i) {
      step = i;
      stepT = 0;
      setHud(root, ['Teacher vs student', 'Distil', 'What learns', 'Replica check'][i] ?? '');
      view.redraw();
    },
  };
};
