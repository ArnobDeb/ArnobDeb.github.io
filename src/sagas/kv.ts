// Act III of RestoreKV: one layer of the paged KV cache. Prefill, decode, OpenVINO eviction,
// forgetting, then RestoreKV's 8 restore tokens writing a protected block that the question recalls.
import type { StageFactory } from '../fx/story';
import { approach, Ash, C, dot, FONT, glow, mountCanvas, phase, rrect, setHud, text } from './kit';

const HEADS = 4;
const START = 2; // 32 tokens = 2 blocks of 16
const DOC = 16;
const RECENT = 2;
const NEEDLE = 9; // document block that holds the answer
// Block scores from the last prompt tokens (fixed, so the story is repeatable). The needle scores low.
const SCORE = [0.42, 0.9, 0.31, 0.66, 0.2, 0.78, 0.37, 0.55, 0.25, 0.28, 0.83, 0.18, 0.47, 0.71, 0.34, 0.6];
const keepTop = (n: number) => new Set([...SCORE.keys()].sort((a, b) => SCORE[b] - SCORE[a]).slice(0, n));
const KEEP_PLAIN = keepTop(5); // budget: 9 blocks = 2 start + 5 doc + 2 recent
const KEEP_RESTORE = keepTop(4); // same budget with RestoreKV: 2 start + 4 doc + 1 restore + 2 recent

interface Col { kind: 'start' | 'doc' | 'restore' | 'recent'; i: number; alive: number; fill: number; heat: number; shield: number }

export const kvStage: StageFactory = (root) => {
  let step = 0;
  let stepT = 0; // ms since the step began
  const ash = new Ash();
  const cols: Col[] = [
    ...Array.from({ length: START }, (_, i) => ({ kind: 'start' as const, i })),
    ...Array.from({ length: DOC }, (_, i) => ({ kind: 'doc' as const, i })),
    { kind: 'restore' as const, i: 0 },
    ...Array.from({ length: RECENT }, (_, i) => ({ kind: 'recent' as const, i })),
  ].map((c) => ({ ...c, alive: c.kind === 'restore' ? 0 : 1, fill: 1, heat: 0, shield: 0 }));

  const view = mountCanvas(root, ({ ctx, w, h, t, dt, still }) => {
    stepT += dt;
    const restoreMode = step >= 5;
    const evicted = step >= 2 && step <= 4 ? KEEP_PLAIN : step >= 6 ? KEEP_RESTORE : null;
    const evictAt = step === 2 || step === 6 ? 900 : 0; // a beat of scoring before blocks fall

    const pad = Math.max(14, w * 0.04);
    const gridW = w - pad * 2;
    const n = cols.length;
    const cw = gridW / n;
    const ch = Math.min(cw * 1.1, (h * 0.46) / HEADS);
    const gy = Math.max(h * 0.3, 84);
    const gap = 3;

    // Prefill: blocks fill left to right (and replays every few seconds in step 0).
    const prefillP = step === 0 ? phase(stepT, 6000) * 1.3 : 1;

    cols.forEach((c, k) => {
      const x = pad + k * cw;
      const isRestore = c.kind === 'restore';
      // Targets.
      let aliveT = 1;
      if (isRestore) aliveT = restoreMode && (step >= 6 || stepT > 600) ? 1 : 0;
      else if (c.kind === 'doc' && evicted && stepT > evictAt && !evicted.has(c.i)) aliveT = 0;
      const fillT = step === 0 && !still ? (k / n < prefillP ? 1 : 0) : 1;
      const heatT = c.kind === 'doc' && (step === 2 || step === 6) && stepT < evictAt + 400 ? SCORE[c.i] : 0;
      const shieldT = isRestore && step >= 6 ? 1 : 0;

      if (c.alive > 0.5 && aliveT === 0 && !still) ash.burst(x + gap, gy, cw - gap * 2, ch * HEADS, C.ash, 14);
      c.alive = aliveT === 0 && c.alive > 0.5 ? 0.49 : approach(c.alive, aliveT, dt, 5);
      if (aliveT === 0) c.alive = approach(c.alive, 0, dt, 9);
      c.fill = approach(c.fill, fillT, dt, 14);
      c.heat = approach(c.heat, heatT, dt, 6);
      c.shield = approach(c.shield, shieldT, dt, 4);

      const a = Math.min(c.alive, c.fill);
      for (let r = 0; r < HEADS; r++) {
        const y = gy + r * ch;
        // Empty slot outline.
        rrect(ctx, x + gap / 2, y + gap / 2, cw - gap, ch - gap, 3);
        ctx.strokeStyle = 'rgba(44,54,70,.7)';
        ctx.lineWidth = 1;
        ctx.stroke();
        if (a < 0.02) continue;
        let color: string = C.teal;
        if (c.kind === 'start' || c.kind === 'recent') color = C.frost;
        if (isRestore) color = C.goldB;
        ctx.save();
        ctx.globalAlpha = a * (c.kind === 'doc' ? 0.35 + 0.5 * (0.4 + 0.6 * c.heat) : 0.8);
        // Per-head shading varies a little; the keep/drop decision does not (that's the point of step 3).
        if (c.kind === 'doc') ctx.globalAlpha *= 0.75 + 0.25 * Math.sin(c.i * 2.3 + r * 1.7) ** 2;
        rrect(ctx, x + gap / 2 + 1, y + gap / 2 + 1, cw - gap - 2, ch - gap - 2, 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
        if (c.kind === 'doc' && c.i === NEEDLE) dot(ctx, x + cw / 2, y + ch / 2, 1.8 * a, '#fff6dc', 6);
      }

      // Locked areas never evicted.
      if ((c.kind === 'start' || c.kind === 'recent') && step >= 2) {
        text(ctx, 'ᛟ', x + cw / 2, gy - 6, { font: FONT.rune(11), color: C.gold, align: 'center' });
      }
      // Restore block: runic glyph and shield.
      if (isRestore && c.alive > 0.05) {
        text(ctx, 'ᚱ', x + cw / 2, gy + (ch * HEADS) / 2 + 5, { font: FONT.rune(Math.min(16, cw * 0.8)), color: '#1a1207', align: 'center', alpha: c.alive });
        if (c.shield > 0.05) {
          glow(ctx, C.goldB, 16 * c.shield, () => {
            rrect(ctx, x - 1, gy - 3, cw + 2, ch * HEADS + 6, 5);
            ctx.strokeStyle = C.goldB;
            ctx.globalAlpha = c.shield;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          });
        }
      }
    });
    ash.draw(ctx, dt);

    const colX = (k: number) => pad + k * cw + cw / 2;
    const docK = (i: number) => START + i;
    const rK = START + DOC;
    const bottom = gy + ch * HEADS;

    // Step 1: decoding reads the whole cache for every token.
    if (step === 1 && !still) {
      const p = phase(t, 1400);
      const sx = pad + p * gridW;
      const g = ctx.createLinearGradient(sx - 40, 0, sx + 4, 0);
      g.addColorStop(0, 'rgba(143,211,255,0)');
      g.addColorStop(1, 'rgba(143,211,255,.45)');
      ctx.fillStyle = g;
      ctx.fillRect(sx - 40, gy - 4, 44, ch * HEADS + 8);
    }

    // Step 3: one decision shared by all heads.
    if (step === 3) {
      const k = docK(4);
      ctx.save();
      ctx.strokeStyle = C.blood;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(pad + k * cw + 1, gy - 6, cw - 2, ch * HEADS + 12);
      ctx.restore();
      text(ctx, 'all heads drop it together', colX(k), bottom + 22, { font: FONT.mono(10), color: C.blood, align: 'center' });
    }

    // Steps 4 and 7: the question looks for the answer.
    if (step === 4 || step === 7) {
      const qx = colX(cols.length - 1);
      const qy = bottom + 30;
      const target = step === 4 ? colX(docK(NEEDLE)) : colX(rK);
      const p = still ? 1 : Math.min(1, stepT / 1200);
      ctx.save();
      ctx.strokeStyle = step === 4 ? C.frost : C.goldB;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -t / 30;
      ctx.beginPath();
      ctx.moveTo(qx, qy);
      ctx.quadraticCurveTo((qx + target) / 2, qy + 40, qx + (target - qx) * p, qy - (qy - bottom - 4) * p);
      ctx.stroke();
      ctx.restore();
      dot(ctx, qx, qy, 4, C.frost);
      text(ctx, 'question', qx, qy + 18, { font: FONT.mono(10), color: C.frost, align: 'center' });
      if (p >= 1) {
        const ok = step === 7;
        text(ctx, ok ? '✓ recalled through the restore entries' : '✗ the answer was evicted', target, gy - 14, {
          font: FONT.body(13, 600),
          color: ok ? C.goldB : C.blood,
          align: target > w * 0.7 ? 'right' : 'center',
        });
      }
    }

    // Step 5: the 8 restore tokens read every block.
    if (step === 5) {
      const rx = colX(rK);
      const ry = gy - 26;
      for (let i = 0; i < 8; i++) {
        text(ctx, 'ᚱᚢᚾᛖᛊᛏᚨᚠ'[i], rx - 28 + i * 8, ry, { font: FONT.rune(11), color: C.goldB, align: 'center' });
      }
      const p = still ? 1 : phase(stepT, 2200);
      for (let i = 0; i < START + DOC; i++) {
        const x = colX(i);
        ctx.save();
        ctx.strokeStyle = C.goldB;
        ctx.globalAlpha = 0.12 + 0.35 * Math.max(0, 1 - Math.abs(p - i / (START + DOC)) * 4);
        ctx.beginPath();
        ctx.moveTo(rx, ry + 4);
        ctx.quadraticCurveTo((rx + x) / 2, ry - 30, x, gy);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Labels.
    const lab = (from: number, to: number, s: string, color: string = C.faint) => {
      const x0 = pad + from * cw + 2;
      const x1 = pad + (to + 1) * cw - 2;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(x0, bottom + 6);
      ctx.lineTo(x1, bottom + 6);
      ctx.stroke();
      ctx.restore();
      if (x1 - x0 > 30) text(ctx, s, (x0 + x1) / 2, bottom + 18, { font: FONT.mono(10), color, align: 'center' });
    };
    if (step !== 3) {
      lab(0, START - 1, 'start', C.frost);
      lab(START, START + DOC - 1, 'document');
      lab(cols.length - RECENT, cols.length - 1, 'recent', C.frost);
    }
    const headY = Math.max(h * 0.12, 52);
    if (w > 520) text(ctx, 'one layer · rows = heads · each block = 16 tokens', pad, headY, { font: FONT.mono(10), color: C.faint });

    const kept = cols.filter((c) => c.alive > 0.5).length;
    text(ctx, `${kept} / ${cols.length - (restoreMode ? 0 : 1)} blocks held`, w - pad, headY, { font: FONT.mono(11, 600), color: C.dim, align: 'right' });
  });

  return {
    setStep(i) {
      step = i;
      stepT = 0;
      setHud(root, ['Prefill', 'Decode', 'Evict to budget', 'Head-shared blocks', 'Forgetting', 'Restore pass', 'Protected block', 'Recall'][i] ?? '');
      view.redraw();
    },
  };
};
