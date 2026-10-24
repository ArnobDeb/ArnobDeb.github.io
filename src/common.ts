// Shared by every page: fonts, styles, nav, reveals, mail links, raven progress,
// rune-decode headings, lightning buttons, Bifröst travel between sections and the easter eggs.
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/noto-sans-runic/400.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';
import './styles/saga.css';

import { initBifrost } from './fx/bifrost';
import { initEasterEggs } from './fx/easterEggs';
import { initLightning } from './fx/lightning';
import { reducedMotion } from './fx/loop';
import { initRavens } from './fx/ravens';
import { initRuneDecode } from './fx/runeDecode';

export const $ = <T extends Element>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);

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

  // Highlight the realm currently in view (home page only; saga pages link away).
  const links = new Map<string, HTMLAnchorElement>();
  nav.querySelectorAll<HTMLAnchorElement>('.nav__menu a').forEach((a) => {
    if (a.pathname === location.pathname) links.set(a.hash.slice(1), a);
  });
  if (!links.size) return;
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

// Canvas text can't trigger web-font loading; fetch the faces the stages draw with up front.
function preloadFonts() {
  if (!document.fonts) return;
  const faces: [string, string][] = [
    ['16px "Noto Sans Runic"', 'ᚠᚢᚦᚨᚱᚲᛟ'],
    ['600 16px Cinzel', 'Aa'],
    ['400 16px "JetBrains Mono"', 'Aa0'],
    ['500 16px "Inter Variable"', 'Aa0'],
  ];
  for (const [font, sample] of faces) document.fonts.load(font, sample).catch(() => {});
}

export function initCommon() {
  preloadFonts();
  initNav();
  initReveal();
  initMail();
  initRavens();
  initRuneDecode();
  initLightning();
  initEasterEggs();
  initBifrost();
}
