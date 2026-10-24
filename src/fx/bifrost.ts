// Bifröst travel. Clicking a link to a section calls down a rainbow beam that pulls you to it:
// the bridge opens around the click, the page is dragged through the light to the target,
// and a ring of runes burns where you land, like the bridge in the films.
// Links to another page of the site play the departure; the new page plays the landing.
// Reduced motion: none of this, links jump as normal.
import { reducedMotion } from './loop';

const KEY = 'bifrost-arrive';
const OPEN = 320; // beam opens
const PULL = 560; // page is dragged to the target
const LAND = 900; // beam closes, rune ring fades
const RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';

interface Streak { x: number; y: number; len: number; v: number; hue: number; w: number }

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

let busy = false;

function overlay() {
  const c = document.createElement('canvas');
  c.className = 'bifrost';
  c.setAttribute('aria-hidden', 'true');
  document.body.append(c);
  const dpr = Math.min(2, devicePixelRatio || 1);
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  const ctx = c.getContext('2d')!;
  ctx.scale(dpr, dpr);
  return { c, ctx, w: innerWidth, h: innerHeight };
}

function makeStreaks(w: number, h: number, cx: number) {
  return Array.from({ length: 70 }, (): Streak => ({
    x: cx + (Math.random() - 0.5) * Math.min(w, 520),
    y: Math.random() * h,
    len: 40 + Math.random() * 160,
    v: 0.8 + Math.random() * 1.8,
    hue: Math.random() * 360,
    w: 0.6 + Math.random() * 2,
  }));
}

// One frame of the beam. `open` 0→1 is its width, `dir` is the travel direction (−1 up, 1 down).
function drawBeam(ctx: CanvasRenderingContext2D, w: number, h: number, cx: number, open: number, dir: number, t: number, streaks: Streak[], dt: number) {
  ctx.clearRect(0, 0, w, h);
  if (open <= 0.001) return;
  ctx.fillStyle = `rgba(3, 5, 10, ${0.72 * open})`;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const bw = Math.max(w * 0.42, 260) * open;
  const g = ctx.createLinearGradient(cx - bw, 0, cx + bw, 0);
  const shift = (t / 6) % 360;
  g.addColorStop(0, 'hsla(0, 100%, 60%, 0)');
  for (let i = 1; i < 8; i++) g.addColorStop(i / 8, `hsla(${(shift + i * 45) % 360}, 95%, 62%, ${0.32 * open})`);
  g.addColorStop(1, 'hsla(0, 100%, 60%, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - bw, 0, bw * 2, h);

  // White-hot core.
  const cw = bw * 0.28;
  const core = ctx.createLinearGradient(cx - cw, 0, cx + cw, 0);
  core.addColorStop(0, 'rgba(255,255,255,0)');
  core.addColorStop(0.5, `rgba(235,245,255,${0.85 * open})`);
  core.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = core;
  ctx.fillRect(cx - cw, 0, cw * 2, h);

  // Streaks of light racing the way you're being pulled.
  ctx.lineCap = 'round';
  for (const s of streaks) {
    s.y += dir * s.v * dt * (0.6 + open * 1.6);
    if (dir < 0 && s.y + s.len < 0) s.y = h + Math.random() * 80;
    if (dir > 0 && s.y - s.len > h) s.y = -Math.random() * 80;
    const off = (s.x - cx) * open;
    const x = cx + off;
    const fade = 1 - Math.min(1, Math.abs(off) / (bw + 1));
    if (fade <= 0) continue;
    ctx.strokeStyle = `hsla(${(s.hue + shift) % 360}, 100%, 75%, ${0.75 * fade * open})`;
    ctx.lineWidth = s.w;
    ctx.beginPath();
    ctx.moveTo(x, s.y);
    ctx.lineTo(x, s.y - dir * s.len);
    ctx.stroke();
  }
  ctx.restore();
}

// The rune circle burned into the ground where you land.
function drawRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, a: number, spin: number) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, 0.32);
  ctx.globalAlpha = a;
  ctx.strokeStyle = 'rgba(240, 196, 106, .9)';
  ctx.shadowColor = 'rgba(240, 196, 106, .9)';
  ctx.shadowBlur = 18;
  ctx.lineWidth = 2;
  for (const rr of [r, r * 0.78]) {
    ctx.beginPath();
    ctx.arc(0, 0, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (document.fonts?.check('16px "Noto Sans Runic"', 'ᚠ')) {
    ctx.fillStyle = 'rgba(255, 226, 160, .95)';
    ctx.font = `${Math.round(r * 0.16)}px "Noto Sans Runic"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const n = RUNES.length;
    for (let i = 0; i < n; i++) {
      const ang = spin + (i / n) * Math.PI * 2;
      ctx.save();
      ctx.rotate(ang);
      ctx.translate(0, -r * 0.89);
      ctx.fillText(RUNES[i], 0, 0);
      ctx.restore();
    }
  }
  ctx.restore();
}

function targetTop(el: HTMLElement) {
  if (el.id === 'bifrost') return 0;
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const top = el.getBoundingClientRect().top + scrollY - pad;
  return Math.max(0, Math.min(top, document.documentElement.scrollHeight - innerHeight));
}

function land(el: HTMLElement) {
  if (!el.matches('a, button, input, [tabindex]')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

// Open the bridge at x, drag the page to `el`, close it with a rune ring.
function travel(el: HTMLElement, cx: number, hash: string) {
  busy = true;
  const { c, ctx, w, h } = overlay();
  const from = scrollY;
  const to = targetTop(el);
  const dir = to < from ? -1 : 1;
  const streaks = makeStreaks(w, h, cx);
  const t0 = performance.now();
  let last = t0;
  let arrived = false;
  history.pushState(null, '', hash);

  const frame = (now: number) => {
    const t = now - t0;
    const dt = Math.min(50, now - last);
    last = now;
    const open = t < OPEN ? ease(t / OPEN) : t < OPEN + PULL ? 1 : 1 - ease(clamp01((t - OPEN - PULL) / (LAND * 0.6)));
    if (t >= OPEN && !arrived) {
      const p = ease(clamp01((t - OPEN) / PULL));
      window.scrollTo({ top: from + (to - from) * p, behavior: 'instant' });
      if (p >= 1) {
        arrived = true;
        land(el);
      }
    }
    drawBeam(ctx, w, h, cx, open, dir, t, streaks, dt);
    if (t > OPEN + PULL) {
      const k = clamp01((t - OPEN - PULL) / LAND);
      drawRing(ctx, cx, Math.min(h * 0.32, 220), Math.min(w * 0.38, 240) * (0.7 + 0.3 * ease(k)), 1 - k, t / 900);
    }
    if (t < OPEN + PULL + LAND) requestAnimationFrame(frame);
    else {
      c.remove();
      busy = false;
    }
  };
  requestAnimationFrame(frame);
}

// Leave for another page: open the beam, then go.
function depart(href: string, cx: number) {
  busy = true;
  const { c, ctx, w, h } = overlay();
  const streaks = makeStreaks(w, h, cx);
  const t0 = performance.now();
  let last = t0;
  try {
    sessionStorage.setItem(KEY, String(cx / w));
  } catch {
    /* storage blocked: the new page simply won't play the landing */
  }
  const frame = (now: number) => {
    const t = now - t0;
    drawBeam(ctx, w, h, cx, ease(clamp01(t / (OPEN + 120))), -1, t, streaks, Math.min(50, now - last));
    last = now;
    if (t < OPEN + 180) requestAnimationFrame(frame);
    else location.href = href;
  };
  requestAnimationFrame(frame);
  // If the page comes back from the back/forward cache, clear the beam.
  addEventListener(
    'pageshow',
    (e) => {
      if (!e.persisted) return;
      c.remove();
      busy = false;
    },
    { once: true },
  );
}

// Arrive from another page: start inside the beam and let it close.
function arrive() {
  let x = 0.5;
  try {
    const v = sessionStorage.getItem(KEY);
    if (v === null) return;
    sessionStorage.removeItem(KEY);
    x = parseFloat(v) || 0.5;
  } catch {
    return;
  }
  const { c, ctx, w, h } = overlay();
  const cx = x * w;
  const streaks = makeStreaks(w, h, cx);
  const t0 = performance.now();
  let last = t0;
  const frame = (now: number) => {
    const t = now - t0;
    drawBeam(ctx, w, h, cx, 1 - ease(clamp01(t / (LAND * 0.7))), -1, t, streaks, Math.min(50, now - last));
    last = now;
    drawRing(ctx, cx, Math.min(h * 0.32, 220), Math.min(w * 0.38, 240), 1 - clamp01(t / LAND), t / 900);
    if (t < LAND) requestAnimationFrame(frame);
    else c.remove();
  };
  requestAnimationFrame(frame);
}

export function initBifrost() {
  if (reducedMotion()) return;
  arrive();
  document.addEventListener('click', (e) => {
    if (busy || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!a || a.target || a.hasAttribute('download') || a.classList.contains('skip')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    const cx = e.detail && e.clientX ? e.clientX : innerWidth / 2;
    if (url.pathname === location.pathname) {
      const el = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!el) return;
      e.preventDefault();
      travel(el, cx, url.hash);
    } else if (/\.html$|\/$/.test(url.pathname)) {
      e.preventDefault();
      depart(url.href, cx);
    }
  });
}
