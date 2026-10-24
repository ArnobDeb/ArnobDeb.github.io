// GPU Act VI (seminar): four warps on one SM, issue slots over time.
// A tiny cycle simulator: in-order issue per warp, round-robin across warps, optional OoO
// issue of instructions that don't depend on a pending load.
import type { StageFactory } from '../fx/story';
import { C, FONT, mountCanvas, phase, rrect, setHud, text } from './kit';

interface Ins { load: boolean; dep: number } // dep = index of the instruction it waits on, or -1
type Slot = { warp: number; load: boolean; ooo: boolean } | null;

const LAT = 12; // load latency in cycles (scaled down for the picture)
const CYCLES = 40;

function program(staggered: boolean, warp: number): Ins[] {
  // load, then its consumer, then independent work.
  const pre = staggered ? warp * 2 : 0;
  const p: Ins[] = [];
  for (let i = 0; i < pre; i++) p.push({ load: false, dep: -1 });
  const l = p.length;
  p.push({ load: true, dep: -1 });
  p.push({ load: false, dep: l });
  for (let i = 0; i < 6; i++) p.push({ load: false, dep: -1 });
  p.push({ load: true, dep: -1 });
  p.push({ load: false, dep: p.length - 1 });
  for (let i = 0; i < 4; i++) p.push({ load: false, dep: -1 });
  return p;
}

function simulate(staggered: boolean, ooo: boolean) {
  const W = 4;
  const progs = Array.from({ length: W }, (_, w) => program(staggered, w));
  const issued = progs.map((p) => new Array(p.length).fill(-1) as number[]); // cycle each instr issued
  const rows: Slot[][] = Array.from({ length: W }, () => new Array(CYCLES).fill(null));
  const pipe: Slot[] = new Array(CYCLES).fill(null);
  let rr = 0;
  const ready = (w: number, i: number, cyc: number) => {
    const d = progs[w][i].dep;
    if (d < 0) return true;
    if (issued[w][d] < 0) return false;
    return cyc >= issued[w][d] + (progs[w][d].load ? LAT : 1);
  };
  for (let cyc = 0; cyc < CYCLES; cyc++) {
    for (let k = 0; k < W; k++) {
      const w = (rr + k) % W;
      const next = issued[w].indexOf(-1);
      if (next < 0) continue;
      let pick = -1;
      if (ready(w, next, cyc)) pick = next;
      else if (ooo) {
        // Look a few instructions ahead for one that's independent of anything not yet issued.
        for (let j = next + 1; j < Math.min(next + 5, progs[w].length); j++) {
          const d = progs[w][j].dep;
          if (issued[w][j] < 0 && (d < 0 || (issued[w][d] >= 0 && ready(w, j, cyc)))) {
            pick = j;
            break;
          }
        }
      }
      if (pick >= 0) {
        issued[w][pick] = cyc;
        const slot = { warp: w, load: progs[w][pick].load, ooo: pick !== next };
        rows[w][cyc] = slot;
        pipe[cyc] = slot;
        rr = w + 1;
        break;
      }
    }
  }
  return { rows, pipe };
}

const SCENES = [simulate(true, false), simulate(false, false), simulate(false, true)];
const WARP_COLORS = [C.teal, C.violet, C.frost, C.gold];

export const warpsStage: StageFactory = (root) => {
  let step = 0;
  let stepT = 0;

  const view = mountCanvas(root, ({ ctx, w, h, dt, still }) => {
    stepT += dt;
    const { rows, pipe } = SCENES[step] ?? SCENES[0];
    const pad = Math.max(12, w * 0.04);
    const lx = pad + 64;
    const cw = (w - lx - pad) / CYCLES;
    const rh = Math.min(cw * 1.1, h * 0.1);
    const top = h * 0.14;
    const shown = still ? CYCLES : Math.min(CYCLES, Math.floor(phase(stepT, 7000) * CYCLES * 1.25));

    const drawRow = (y: number, slots: Slot[], label: string, isPipe: boolean) => {
      text(ctx, label, lx - 10, y + rh * 0.68, { font: FONT.mono(10), color: isPipe ? C.text : C.dim, align: 'right' });
      for (let c = 0; c < CYCLES; c++) {
        const x = lx + c * cw;
        rrect(ctx, x + 1, y + 1, cw - 2, rh - 2, 2);
        if (c >= shown) {
          ctx.strokeStyle = 'rgba(44,54,70,.5)';
          ctx.stroke();
          continue;
        }
        const s = slots[c];
        if (!s) {
          ctx.fillStyle = isPipe ? 'rgba(224,70,77,.55)' : 'rgba(44,54,70,.35)';
          ctx.fill();
          continue;
        }
        ctx.fillStyle = s.ooo ? C.goldB : WARP_COLORS[s.warp];
        ctx.globalAlpha = s.load ? 1 : 0.6;
        ctx.fill();
        ctx.globalAlpha = 1;
        if (s.load) text(ctx, 'L', x + cw / 2, y + rh * 0.7, { font: FONT.mono(Math.min(10, cw * 0.7), 600), color: '#0a0d13', align: 'center' });
      }
    };
    rows.forEach((r, i) => drawRow(top + i * (rh + 6), r, `warp ${i}`, false));
    const py = top + 4 * (rh + 6) + 18;
    drawRow(py, pipe, 'issue', true);

    const used = pipe.slice(0, shown).filter(Boolean).length;
    const idle = shown - used;
    text(ctx, `cycles ${shown} · busy ${used} · idle ${idle}`, lx, py + rh + 26, { font: FONT.mono(11, 600), color: idle > 4 ? C.blood : C.teal });
    const legend: [string, string][] = [['L = load', C.dim], ['red = idle issue slot', C.blood], ...(step === 2 ? [['gold = issued out of order', C.goldB] as [string, string]] : [])];
    legend.forEach(([s, c], i) => text(ctx, s, lx, py + rh + 46 + i * 15, { font: FONT.mono(10), color: c }));
  });

  return {
    setStep(i) {
      step = i;
      stepT = 0;
      setHud(root, ['TLP hides latency', 'Everyone stalls', 'Out-of-order fills the gaps'][i] ?? '');
      view.redraw();
    },
  };
};
