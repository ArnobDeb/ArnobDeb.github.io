// Act V of RestoreKV: the C++ integration. The worked example from the report:
// 4,000-token prompt = 250 blocks; restore IDs land in block 244; a 10% budget keeps 25 blocks;
// after eviction block 244 becomes logical block 19.
import type { StageFactory } from '../fx/story';
import { approach, C, FONT, glow, mountCanvas, phase, rrect, setHud, text } from './kit';

const BLOCKS = 250;
const R = 244;
const QUESTION_FROM = 245; // 8 question tokens share block 244; the rest of the question follows
const START = 2;
const RECENT = 2;
// The 20 document blocks that survive (fixed pseudo-random choice, all before block 244).
const KEEP = new Set([3, 17, 26, 41, 52, 60, 77, 89, 101, 113, 126, 138, 150, 163, 171, 189, 198, 207, 222, 236]);

export const patchStage: StageFactory = (root) => {
  let step = 0;
  let stepT = 0;
  const vis = new Float32Array(BLOCKS).fill(1); // visibility per block
  const pos = new Float32Array(BLOCKS); // animated x position (0..1 of track)
  for (let i = 0; i < BLOCKS; i++) pos[i] = i / BLOCKS;
  let build = 0;

  const survives = (i: number) => i < START || i >= BLOCKS - RECENT || i === R || KEEP.has(i);

  const view = mountCanvas(root, ({ ctx, w, h, t, dt, still }) => {
    stepT += dt;
    const pad = Math.max(14, w * 0.04);
    const trackW = w - pad * 2;
    const y = h * 0.34;
    const bh = h * 0.2;
    build = approach(build, step === 0 && !still ? Math.min(1, stepT / 2200) : 1, dt, 8);
    const compact = step >= 3;

    // Layout after eviction: 25 survivors spread across the track.
    const order = [...Array(BLOCKS).keys()].filter(survives);
    for (let i = 0; i < BLOCKS; i++) {
      const visT = compact && !survives(i) ? 0 : i / BLOCKS <= build ? 1 : 0;
      vis[i] = approach(vis[i], visT, dt, compact ? 5 : 12);
      const posT = compact && step >= 4 && survives(i) ? order.indexOf(i) / order.length : i / BLOCKS;
      pos[i] = approach(pos[i], posT, dt, 3);
    }

    const bw = step >= 4 ? trackW / order.length : trackW / BLOCKS;
    for (let i = 0; i < BLOCKS; i++) {
      if (vis[i] < 0.02) continue;
      const x = pad + pos[i] * trackW;
      const isR = i === R;
      const isQ = i >= QUESTION_FROM;
      ctx.globalAlpha = vis[i] * (isR ? 1 : 0.75);
      ctx.fillStyle = isR ? C.goldB : isQ ? C.frost : i < START ? C.frost : C.teal;
      const ww = Math.max(1, (step >= 4 ? bw : trackW / BLOCKS) - (step >= 4 ? 3 : 0.6));
      rrect(ctx, x, y, ww, bh, step >= 4 ? 3 : 0.5);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    const rx = pad + pos[R] * trackW;
    const rw = Math.max(3, step >= 4 ? bw - 3 : trackW / BLOCKS);

    // Step 0: the prompt layout.
    if (step === 0) {
      text(ctx, '[ document … 3,904 tokens ]', pad + trackW * 0.45, y - 14, { font: FONT.mono(11), color: C.teal, align: 'center' });
      text(ctx, 'ᚱ×8', rx, y - 14, { font: FONT.mono(11, 600), color: C.goldB, align: 'right' });
      text(ctx, 'question', w - pad, y + bh + 18, { font: FONT.mono(10), color: C.frost, align: 'right' });
      text(ctx, 'IDs V … V+7 sit just past the vocabulary', w / 2, h * 0.86, { font: FONT.mono(11), color: C.dim, align: 'center' });
    }

    // Step 1: prefill sweeps; when it passes the restore IDs they read everything before them.
    if (step === 1) {
      const p = still ? 1 : phase(stepT, 3200);
      const sx = pad + p * trackW;
      ctx.fillStyle = 'rgba(143,211,255,.25)';
      ctx.fillRect(sx - 2, y - 6, 3, bh + 12);
      if (p > R / BLOCKS || still) {
        for (let k = 0; k < 24; k++) {
          const tx = pad + (k / 24) * (rx - pad);
          ctx.save();
          ctx.strokeStyle = C.goldB;
          ctx.globalAlpha = 0.25;
          ctx.beginPath();
          ctx.moveTo(rx, y);
          ctx.quadraticCurveTo((rx + tx) / 2, y - h * 0.18, tx, y);
          ctx.stroke();
          ctx.restore();
        }
      }
      text(ctx, 'ordinary prefill → restore tokens read the whole document', w / 2, h * 0.86, { font: FONT.mono(11), color: C.goldB, align: 'center' });
    }

    // Step 2: block 244 is protected in all 36 layers.
    if (step === 2) {
      const ly = y + bh + 16;
      for (let l = 0; l < 36; l++) {
        ctx.fillStyle = l % 2 ? 'rgba(44,54,70,.8)' : 'rgba(44,54,70,.55)';
        ctx.fillRect(pad, ly + l * 2.2, trackW, 1.4);
        ctx.fillStyle = C.goldB;
        ctx.fillRect(rx, ly + l * 2.2, rw, 1.4);
      }
      glow(ctx, C.goldB, 18, () => {
        ctx.strokeStyle = C.goldB;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(rx - 3, y - 6, rw + 6, bh + 12);
      });
      text(ctx, 'block 244 · protected × 36 layers', rx, y - 14, { font: FONT.mono(11, 600), color: C.goldB, align: 'right' });
    }

    // Steps 3–4: eviction to the 10% budget, then compaction and renumbering.
    if (step >= 3) {
      text(ctx, `${step === 3 ? 'evicting' : 'kept'}: 2 start + 20 document + ᚱ + 2 recent = 25 blocks (10%)`, w / 2, h * 0.86, {
        font: FONT.mono(11),
        color: C.dim,
        align: 'center',
      });
      if (step === 4) {
        glow(ctx, C.goldB, 14, () => {
          ctx.strokeStyle = C.goldB;
          ctx.strokeRect(rx - 2, y - 4, rw + 4, bh + 8);
        });
        const label = stepT > 900 || still ? 'logical block 19' : 'block 244';
        text(ctx, label, rx + rw / 2, y - 14, { font: FONT.mono(12, 600), color: C.goldB, align: 'center' });
        text(ctx, '244 → 19 · still protected', rx + rw / 2, y + bh + 22, { font: FONT.mono(10), color: C.dim, align: 'center' });
      }
    }
    void t;
  });

  return {
    setStep(i) {
      step = i;
      stepT = 0;
      setHud(root, ['Prompt layout', 'Prefill = restore pass', 'Protect', 'Evict', 'Renumber'][i] ?? '');
      view.redraw();
    },
  };
};
