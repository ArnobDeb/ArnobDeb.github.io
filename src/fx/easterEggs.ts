// Konami code → thunder + the Valhalla quote. Typing "odin" → the All-father opens an eye.
// Both are optional extras; nothing on the page depends on them.
import { site } from '../content/site';
import { reducedMotion } from './loop';
import { strike } from './lightning';

let toastTimer = 0;

export function toast(html: string, ms = 4200) {
  const el = document.querySelector<HTMLElement>('.toast');
  if (!el) return;
  el.innerHTML = html;
  requestAnimationFrame(() => el.classList.add('is-on'));
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    el.classList.remove('is-on');
    setTimeout(() => {
      if (!el.classList.contains('is-on')) el.textContent = '';
    }, 350);
  }, ms);
}

const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];

export function initEasterEggs() {
  let keys: string[] = [];
  let typed = '';
  const q = site.valhalla.quote;

  addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
    const k = e.key.toLowerCase();

    keys = [...keys, k].slice(-KONAMI.length);
    if (keys.join() === KONAMI.join()) {
      keys = [];
      strike(document.querySelector('.hero__name') ?? document.body);
      toast(`“${q.text}”`);
    }

    if (k.length === 1) {
      typed = (typed + k).slice(-4);
      if (typed === 'odin') {
        typed = '';
        if (!reducedMotion()) {
          const eye = document.createElement('div');
          eye.className = 'fx-eye';
          eye.setAttribute('aria-hidden', 'true');
          document.body.append(eye);
          setTimeout(() => eye.remove(), 1700);
        }
        toast('<span class="rune" aria-hidden="true">ᚨ</span> All-father approves.');
      }
    }
  });
}
