import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/noto-sans-runic/400.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';

import { initEasterEggs } from './fx/easterEggs';
import { initEmbers } from './fx/embers';
import { initLightning } from './fx/lightning';
import { reducedMotion } from './fx/loop';
import { initRavens } from './fx/ravens';
import { initRuneDecode } from './fx/runeDecode';
import { initSky } from './fx/starfield';

const $ = <T extends Element>(sel: string) => document.querySelector<T>(sel);

function initNav() {
  const nav = $<HTMLElement>('.nav');
  const toggle = $<HTMLButtonElement>('.nav__toggle');
  if (!nav || !toggle) return;
  const setOpen = (open: boolean) => {
    nav.classList.toggle('nav--open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.querySelectorAll('.nav__menu a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  // Highlight the realm currently in view.
  const links = new Map<string, HTMLAnchorElement>();
  nav.querySelectorAll<HTMLAnchorElement>('.nav__menu a').forEach((a) => links.set(a.hash.slice(1), a));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        links.forEach((a) => a.removeAttribute('aria-current'));
        links.get(e.target.id)?.setAttribute('aria-current', 'true');
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  document.querySelectorAll('main > section[id]').forEach((s) => io.observe(s));
}

function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (reducedMotion() || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  els.forEach((el) => io.observe(el));
}

// Addresses are only assembled into a mailto: when someone actually clicks.
function initMail() {
  document.querySelectorAll<HTMLAnchorElement>('a.mail').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      location.href = `mailto:${a.dataset.u}@${a.dataset.d}`;
    });
  });
}

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

  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    run();
  }, { threshold: 0.4 });
  io.observe(term);
}

initNav();
initReveal();
initMail();
initRavens();
initRuneDecode();
initLightning();
initTerminal();
initEasterEggs();

const sky = $<HTMLCanvasElement>('.hero__sky');
if (sky) initSky(sky);
const embers = $<HTMLCanvasElement>('.forge__embers');
if (embers) initEmbers(embers);
