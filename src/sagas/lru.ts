// HTTP Act II: an interactive toy LRU cache (8 slots) with popular vs uniform request streams.
import type { StageFactory } from '../fx/story';
import { approach, Ash, C, FONT, mountCanvas, rrect, setHud, text } from './kit';

const SLOTS = 8;

interface Entry { key: number; y: number; flash: number; hit: boolean; fresh?: boolean }

export const lruStage: StageFactory = (root, controls) => {
  let step = 0;
  let list: Entry[] = [];
  let hits = 0;
  let misses = 0;
  let queue: number[] = [];
  let lastKey: { key: number; hit: boolean } | null = null;
  let userDriven = false;
  let acc = 0;
  const ash = new Ash();
  let geom = { x: 0, y: 0, sw: 0, sh: 0 };

  // Skewed: a dozen hot employees get most traffic. Uniform: any of 1,000.
  const popular = () => {
    const r = Math.random();
    return r < 0.85 ? Math.floor(Math.pow(Math.random(), 2) * 10) + 1 : Math.floor(Math.random() * 1000) + 1;
  };
  const uniform = () => Math.floor(Math.random() * 1000) + 1;

  const request = (key: number) => {
    const at = list.findIndex((e) => e.key === key);
    if (at >= 0) {
      hits++;
      const [e] = list.splice(at, 1);
      e.flash = 1;
      e.hit = true;
      list.unshift(e);
    } else {
      misses++;
      list.unshift({ key, y: 0, flash: 1, hit: false, fresh: true });
      if (list.length > SLOTS) {
        const gone = list.pop()!;
        ash.burst(geom.x + (SLOTS - 1) * geom.sw, geom.y, geom.sw - 6, geom.sh, C.ash, 16);
        void gone;
      }
    }
    lastKey = { key, hit: at >= 0 };
  };

  controls?.querySelectorAll<HTMLButtonElement>('button').forEach((b) =>
    b.addEventListener('click', () => {
      userDriven = true;
      const k = b.dataset.k;
      if (k === 'reset') {
        list = [];
        hits = misses = 0;
        queue = [];
        lastKey = null;
      } else {
        for (let i = 0; i < 20; i++) queue.push(k === 'popular' ? popular() : uniform());
      }
      view.redraw();
    }),
  );

  const view = mountCanvas(root, ({ ctx, w, h, dt, still }) => {
    // Feed queued requests at a readable pace; auto-play when the reader hasn't clicked.
    acc += Math.min(dt, 1000);
    const pace = still ? 0 : 220;
    if (still) while (queue.length) request(queue.shift()!);
    while (pace && acc > pace) {
      acc -= pace;
      if (queue.length) request(queue.shift()!);
      else if (!userDriven) request(step === 0 ? popular() : uniform());
    }

    const pad = Math.max(12, w * 0.05);
    const sw = (w - pad * 2) / SLOTS;
    const sh = Math.min(sw * 0.9, h * 0.22);
    const y0 = h * 0.3;
    geom = { x: pad, y: y0, sw, sh };
    text(ctx, 'most recent', pad, y0 - 12, { font: FONT.mono(10), color: C.faint });
    text(ctx, 'evicted next', w - pad, y0 - 12, { font: FONT.mono(10), color: C.faint, align: 'right' });

    for (let i = 0; i < SLOTS; i++) {
      rrect(ctx, pad + i * sw + 3, y0, sw - 6, sh, 6);
      ctx.strokeStyle = C.line;
      ctx.stroke();
    }
    list.forEach((e, i) => {
      const tx = i;
      if (e.fresh) {
        e.fresh = false;
        e.y = tx - 0.6;
      }
      e.y = approach(e.y, tx, dt, 10);
      e.flash = approach(e.flash, 0, dt, 2.5);
      const x = pad + e.y * sw + 3;
      rrect(ctx, x, y0, sw - 6, sh, 6);
      ctx.fillStyle = e.hit ? `rgba(240,196,106,${0.18 + 0.5 * e.flash})` : `rgba(138,108,255,${0.18 + 0.5 * e.flash})`;
      ctx.fill();
      text(ctx, `#${e.key}`, x + (sw - 6) / 2, y0 + sh / 2 + 5, { font: FONT.mono(Math.min(14, sw * 0.24), 600), color: C.text, align: 'center' });
    });
    ash.draw(ctx, dt);

    const total = hits + misses;
    const rate = total ? hits / total : 0;
    const by = y0 + sh + 46;
    text(ctx, `hits ${hits} · misses ${misses}`, pad, by, { font: FONT.mono(12), color: C.dim });
    text(ctx, `hit rate ${(rate * 100).toFixed(0)}%`, w - pad, by, { font: FONT.display(20), color: rate > 0.5 ? C.goldB : C.violet, align: 'right' });
    rrect(ctx, pad, by + 14, w - pad * 2, 8, 4);
    ctx.fillStyle = C.bg;
    ctx.fill();
    rrect(ctx, pad, by + 14, (w - pad * 2) * rate, 8, 4);
    ctx.fillStyle = C.gold;
    ctx.fill();
    if (lastKey) {
      text(ctx, `GET /employee/${lastKey.key} → ${lastKey.hit ? 'hit (cache)' : 'miss (MySQL)'}`, w / 2, h * 0.16, {
        font: FONT.mono(12, 600),
        color: lastKey.hit ? C.goldB : C.violet,
        align: 'center',
      });
    }
    text(ctx, 'toy simulation · 8 slots instead of 64', w / 2, h * 0.95, { font: FONT.mono(10), color: C.faint, align: 'center' });
  });

  return {
    setStep(i) {
      if (i !== step && !userDriven) {
        list = [];
        hits = misses = 0;
      }
      step = i;
      setHud(root, ['Skewed reads (get_popular)', 'Uniform reads (get_all)'][i] ?? '');
      if (view.still && !userDriven) {
        for (let k = 0; k < 40; k++) request(i === 0 ? popular() : uniform());
      }
      view.redraw();
    },
  };
};
