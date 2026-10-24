// GPU Act I: a DRAM bank — ACT/READ/PRE, refresh, double-sided hammering and a bit flip.
import type { StageFactory } from '../fx/story';
import { approach, C, dot, FONT, glow, mountCanvas, phase, rrect, setHud, text } from './kit';

const ROWS = 9;
const COLS = 14;
const VICTIM = 4;
const AGG = [3, 5];
const FLIP_COL = 9;

export const dramStage: StageFactory = (root) => {
  let step = 0;
  let stepT = 0;
  // Charge per cell, 0..1.
  const charge = Array.from({ length: ROWS }, () => new Float32Array(COLS).fill(1));
  let acts = 0;
  let flipped = false;
  let flipFlash = 0;
  let open = -1;
  let openAmt = 0;

  const view = mountCanvas(root, ({ ctx, w, h, t, dt, still }) => {
    stepT += dt;
    const pad = Math.max(16, w * 0.06);
    const gw = Math.min(w - pad * 2 - 90, 520);
    const gx = pad + 70;
    const cw = gw / COLS;
    const rh = Math.min(cw * 0.8, (h * 0.58) / (ROWS + 1.6));
    const gy = h * 0.1;
    const sdt = Math.min(dt, 64);

    // Behaviour per step.
    if (step === 0) {
      // Open a row, read, close; cycle through rows.
      const p = still ? 0.5 : phase(stepT, 1600);
      open = still ? 2 : Math.floor(stepT / 1600) % ROWS;
      openAmt = p < 0.75 ? Math.min(1, p * 4) : Math.max(0, 1 - (p - 0.75) * 4);
      charge.forEach((r) => r.fill(1));
    } else {
      openAmt = approach(openAmt, 0, dt, 8);
      // Leak, faster on the victim while it is being hammered.
      const hammer = step >= 2;
      for (let r = 0; r < ROWS; r++) {
        const leak = (r === VICTIM && hammer ? 0.00042 : 0.00005) * sdt;
        for (let c = 0; c < COLS; c++) charge[r][c] = Math.max(0, charge[r][c] - leak * (0.6 + 0.4 * Math.sin(c * 1.9 + r) ** 2));
      }
      // Periodic refresh sweep tops every row back up (the window is slower than the hammer).
      const period = step >= 2 ? 5200 : 3200;
      const rp = phase(stepT, period);
      const rr = Math.floor(rp * ROWS * 1.2);
      if (rr < ROWS && !(step === 3 && flipped)) charge[rr].fill(1);
      if (hammer) {
        acts += sdt * 9;
        if (rp < 0.01) acts = 0;
      }
      if (step === 3 && !flipped && charge[VICTIM][FLIP_COL] < 0.35) {
        flipped = true;
        flipFlash = 1;
      }
      if (still && step >= 2) {
        charge[VICTIM].fill(0.25);
        if (step === 3) flipped = true;
      }
    }
    flipFlash = approach(flipFlash, 0, dt, 1.5);

    // Rows.
    for (let r = 0; r < ROWS; r++) {
      const y = gy + r * rh;
      const isAgg = step >= 2 && AGG.includes(r);
      const strike = isAgg && !still ? (Math.floor(t / 90) % 2 === AGG.indexOf(r) ? 1 : 0.2) : isAgg ? 0.7 : 0;
      text(ctx, `row ${r}`, gx - 12, y + rh * 0.65, { font: FONT.mono(10), color: isAgg ? C.ember : r === VICTIM && step >= 2 ? C.frost : C.faint, align: 'right' });
      if (isAgg) {
        glow(ctx, C.ember, 14 * strike, () => {
          ctx.fillStyle = `rgba(255,106,43,${0.12 + 0.3 * strike})`;
          ctx.fillRect(gx - 4, y + 1, gw + 8, rh - 2);
        });
      }
      if (step === 0 && r === open) {
        ctx.fillStyle = `rgba(143,211,255,${0.15 * openAmt})`;
        ctx.fillRect(gx - 4, y + 1, gw + 8, rh - 2);
      }
      for (let c = 0; c < COLS; c++) {
        const x = gx + c * cw;
        const q = charge[r][c];
        rrect(ctx, x + 2, y + 2, cw - 4, rh - 4, 3);
        ctx.strokeStyle = C.line;
        ctx.stroke();
        const isFlip = step === 3 && flipped && r === VICTIM && c === FLIP_COL;
        // Charge level as the fill height of each capacitor.
        const fh = (rh - 6) * q;
        ctx.fillStyle = isFlip ? C.blood : r === VICTIM && step >= 2 ? C.frost : C.teal;
        ctx.globalAlpha = isFlip ? 0.95 : 0.35 + 0.45 * q;
        ctx.fillRect(x + 3, y + rh - 3 - fh, cw - 6, fh);
        ctx.globalAlpha = 1;
        if (isFlip) {
          text(ctx, '1→0', x + cw / 2, y - 4, { font: FONT.mono(11, 600), color: C.blood, align: 'center' });
          if (flipFlash > 0.05) glow(ctx, C.blood, 30 * flipFlash, () => dot(ctx, x + cw / 2, y + rh / 2, 4, C.blood, 0));
        }
      }
    }

    // Row buffer.
    const by = gy + ROWS * rh + rh * 0.6;
    rrect(ctx, gx - 4, by, gw + 8, rh, 4);
    ctx.fillStyle = C.stone2;
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.stroke();
    text(ctx, 'row buffer', gx - 12, by + rh * 0.65, { font: FONT.mono(10), color: C.faint, align: 'right' });
    if (step === 0 && open >= 0) {
      for (let c = 0; c < COLS; c++) {
        ctx.fillStyle = C.frost;
        ctx.globalAlpha = openAmt * 0.6;
        ctx.fillRect(gx + c * cw + 3, by + 3, cw - 6, rh - 6);
      }
      ctx.globalAlpha = 1;
      const col = Math.floor(phase(stepT, 1600) * COLS * 1.3) % COLS;
      if (openAmt > 0.6) glow(ctx, C.frost, 12, () => rrect(ctx, gx + col * cw + 1, by + 1, cw - 2, rh - 2, 3));
      ctx.strokeStyle = C.frost;
      ctx.stroke();
      const p = phase(stepT, 1600);
      const cmd = p < 0.3 ? 'ACTIVATE' : p < 0.72 ? 'READ' : 'PRECHARGE';
      text(ctx, `${cmd} row ${open}`, gx + gw / 2, by + rh + 22, { font: FONT.mono(12, 600), color: C.frost, align: 'center' });
    }

    if (step >= 1) {
      const label = step >= 2 ? `activations on aggressors: ${Math.round(acts).toLocaleString('en-US')}` : 'refresh sweeps every row within the window';
      text(ctx, label, gx + gw / 2, by + rh + 22, { font: FONT.mono(11), color: step >= 2 ? C.ember : C.dim, align: 'center' });
    }
    if (step === 3) {
      text(ctx, flipped ? 'bit flipped — the victim was never accessed' : 'charge draining faster than refresh…', gx + gw / 2, by + rh + 40, {
        font: FONT.body(13, 600),
        color: flipped ? C.blood : C.frost,
        align: 'center',
      });
    }
  });

  return {
    setStep(i) {
      if (i !== step) {
        charge.forEach((r) => r.fill(1));
        flipped = false;
        acts = 0;
      }
      step = i;
      stepT = 0;
      setHud(root, ['ACT · READ · PRE', 'Refresh', 'Double-sided hammer', 'Bit flip'][i] ?? '');
      view.redraw();
    },
  };
};
