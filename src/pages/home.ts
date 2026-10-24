// Entry for the home page.
import { $, initCommon } from '../common';
import '../styles/home.css';
import { initCountUp } from '../fx/chartHover';
import { initEmbers } from '../fx/embers';
import { initLantern } from '../fx/lantern';
import { reducedMotion } from '../fx/loop';
import { initPool } from '../fx/pool';
import { initShatter } from '../fx/shatter';
import { initSky } from '../fx/starfield';
import type { StageFactory } from '../fx/story';
import { initYggdrasil } from '../fx/yggdrasil';
import { dramStage } from '../sagas/dram';
import { flowStage } from '../sagas/flow';
import { kvStage } from '../sagas/kv';

initCommon();

const hero = $<HTMLElement>('#bifrost');
const sky = $<HTMLCanvasElement>('.hero__sky');
if (sky) initSky(sky);
if (hero) {
  initLantern(hero);
  initShatter(hero);
}

const embers = $<HTMLCanvasElement>('.forge__embers');
if (embers) initEmbers(embers);

const ygg = $<HTMLElement>('.ygg');
if (ygg) initYggdrasil(ygg);

const pool = $<HTMLCanvasElement>('canvas.pool');
if (pool) initPool(pool);

initCountUp('.portal__v, .flip__v');

// Portals: the same stages as the saga pages, cycling through a few key steps on their own.
const stages: Record<string, StageFactory> = { kv: kvStage, dram: dramStage, flow: flowStage };
document.querySelectorAll<HTMLElement>('.portal__stage').forEach((el) => {
  const make = stages[el.dataset.stage ?? ''];
  if (!make) return;
  const api = make(el, null);
  const seq = (el.dataset.auto ?? '0').split(',').map(Number);
  let k = 0;
  api.setStep(seq[0]);
  if (reducedMotion() || seq.length < 2) {
    api.setStep(seq[seq.length - 1]);
    return;
  }
  let timer = 0;
  const run = () => {
    timer = window.setInterval(() => {
      k = (k + 1) % seq.length;
      api.setStep(seq[k]);
    }, 3400);
  };
  new IntersectionObserver(([e]) => {
    clearInterval(timer);
    if (e.isIntersecting) run();
  }).observe(el);
});

// Card fan: tap to draw a rune.
const NAMES: Record<string, string> = { ᚦ: 'Thurisaz — the hammer', ᚨ: 'Ansuz — wisdom', ᚱ: 'Raidō — the journey', ᚲ: 'Kenaz — the torch', ᛟ: 'Othala — home' };
document.querySelectorAll<HTMLElement>('.card-fan').forEach((fan) => {
  const cards = [...fan.querySelectorAll<HTMLElement>('.card-fan__card')];
  const label = fan.closest('.tile')?.querySelector<HTMLElement>('.tile__text p');
  label?.setAttribute('aria-live', 'polite');
  fan.addEventListener('click', () => {
    const pick = cards[Math.floor(Math.random() * cards.length)];
    cards.forEach((c) => c.classList.toggle('is-picked', c === pick));
    const r = pick.textContent?.trim() ?? '';
    if (label) label.textContent = `You drew ${r} ${NAMES[r] ?? ''}. Again?`;
  });
});

// Terminal in Valhalla types itself out once it scrolls into view.
function initTerminal() {
  const term = $<HTMLElement>('.term');
  if (!term || reducedMotion()) return;
  const lines = [...term.querySelectorAll<HTMLElement>('.term__line')];
  term.classList.add('is-typing');
  lines.forEach((l) => (l.hidden = true));
  const caret = document.createElement('span');
  caret.className = 'term__caret';
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const run = async () => {
    for (const line of lines) {
      line.hidden = false;
      const cmd = line.querySelector<HTMLElement>('.term__cmd');
      if (cmd) {
        const full = line.dataset.cmd ?? '';
        cmd.textContent = '';
        cmd.after(caret);
        for (const ch of full) {
          cmd.textContent += ch;
          await sleep(45 + Math.random() * 50);
        }
        await sleep(280);
      } else {
        await sleep(120);
      }
    }
    term.querySelector('.term__body')?.append(caret);
  };
  const io = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      run();
    },
    { threshold: 0.4 },
  );
  io.observe(term);
}
initTerminal();

// Flip stones also turn on tap (touch screens have no hover).
document.querySelectorAll<HTMLElement>('.flip').forEach((f) => f.addEventListener('click', () => f.classList.toggle('is-flipped')));
