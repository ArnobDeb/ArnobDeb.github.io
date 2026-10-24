// Pure string rendering of site.ts into HTML. Runs at build time (vite.config.ts),
// so it must not touch the DOM.
import { CARDS, EPISODE, FIELD, INSCRIPTION, LANTERN, PC, RADAR, ROUTE, SABER, YGG_CROWN, YGG_ROOTS } from './art.ts';
import { site, type Resume } from './site.ts';

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Visually decodable heading text: screen readers and crawlers get the real text,
// the aria-hidden copy is what the rune-decode effect animates.
export const decodable = (text: string) =>
  `<span class="sr-only">${esc(text)}</span><span class="decode" aria-hidden="true" data-decode>${esc(text)}</span>`;

const sectionHead = (id: string, realm: string, label: string, rune: string, intro?: string) => `
  <header class="section-head reveal">
    <p class="section-head__label"><span class="rune" aria-hidden="true">${rune}</span> ${esc(label)}</p>
    <h2 id="${id}-title" class="section-head__title">${decodable(realm)}</h2>
    ${intro ? `<p class="section-head__intro">${esc(intro)}</p>` : ''}
  </header>`;

const runeOf = (id: string) => site.nav.find((n) => n.id === id)?.rune ?? '';

const tags = (items: string[]) =>
  `<ul class="tags" aria-label="Technologies">${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;

export const hammerIcon = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 5.5 6 3h12l2 2.5V10l-2 2H6l-2-2Z" fill="currentColor" opacity=".9"/><path d="M7 6h10M7 9h10" stroke="#07090d" stroke-width="1" opacity=".5"/><rect x="10.5" y="12" width="3" height="9" rx="1" fill="currentColor"/><circle cx="12" cy="21.4" r="1.4" fill="currentColor"/></svg>`;

export const externalIcon = `<svg class="icon icon--sm" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function nav(base = '') {
  const items = site.nav
    .map(
      (n) =>
        `<li><a href="${base}#${n.id}"><span class="rune" aria-hidden="true">${n.rune}</span><span class="nav__realm">${esc(n.realm)}</span><span class="nav__sep" aria-hidden="true">·</span><span class="nav__label">${esc(n.label)}</span></a></li>`,
    )
    .join('');
  return `
  <a class="skip" href="#main">Skip to content</a>
  <div class="ravens" aria-hidden="true">
    <div class="ravens__track"><div class="ravens__fill"></div></div>
    <svg class="ravens__bird" viewBox="0 0 48 32"><path d="M2 20c6-1 10-4 14-8 3-3 7-6 12-6 3 0 5 1 6 3l6 1-5 3c0 5-3 9-9 11l4 6-6-3-4 2 1-4c-7 0-13-2-19-5Z" fill="currentColor"/><circle cx="31" cy="8.6" r="1" fill="#07090d"/></svg>
  </div>
  <nav class="nav" aria-label="Main">
    <a class="nav__brand" href="${base || ''}#bifrost" aria-label="${esc(site.name)}, back to top"><span class="rune" aria-hidden="true">ᚨ</span> Arnob Deb</a>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-menu"><span class="nav__toggle-bars" aria-hidden="true"></span><span class="sr-only">Menu</span></button>
    <ul id="nav-menu" class="nav__menu">${items}</ul>
  </nav>`;
}

function hero() {
  const h = site.hero;
  return `
  <section id="bifrost" class="hero" aria-labelledby="hero-title">
    <canvas class="hero__sky" aria-hidden="true"></canvas>
    <div class="hero__inscription" aria-hidden="true">${INSCRIPTION}</div>
    <div class="hero__inner">
      <p class="hero__kicker">${esc(h.kicker)}</p>
      <h1 id="hero-title" class="hero__name">${decodable(site.name)}</h1>
      <p class="hero__runes" aria-hidden="true">${site.runeName}</p>
      <p class="hero__tagline">${esc(h.tagline)}</p>
      <p class="hero__sub"><span class="ember-dot" aria-hidden="true"></span>${esc(h.sub)}</p>
      <ul class="chips" aria-label="Focus areas">${h.roles.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
      <div class="hero__cta">
        <a class="btn btn--gold" href="#scrolls" data-lightning>${hammerIcon}<span>Choose your resume</span></a>
        <a class="btn btn--ghost" href="#ravens">Contact</a>
      </div>
    </div>
    <a class="hero__scroll" href="#midgard" aria-label="Scroll to About"><span aria-hidden="true">ᛞ</span></a>
  </section>`;
}

function about() {
  const a = site.about;
  const realms: Record<string, { rune: string; name: string }> = {
    asgard: { rune: 'ᚨ', name: 'Asgard' },
    midgard: { rune: 'ᛗ', name: 'Midgard' },
    roots: { rune: 'ᛉ', name: 'The Roots' },
  };
  let realm = '';
  const nodes = [...a.timeline]
    .reverse()
    .map((e, i) => {
      const band =
        e.realm !== realm
          ? `<li class="ygg__realm ygg__realm--${e.realm}" aria-hidden="true"><span><b class="rune">${realms[e.realm].rune}</b> ${esc(realms[e.realm].name)}</span></li>`
          : '';
      realm = e.realm;
      return `${band}
      <li class="ygg__node${i % 2 ? ' ygg__node--r' : ''}${e.stat === 'now' ? ' ygg__node--now' : ''}">
        <span class="ygg__knot" aria-hidden="true"><span class="rune">${e.rune}</span></span>
        <span class="ygg__twig" aria-hidden="true"></span>
        <div class="ygg__card reveal">
          <time class="ygg__when">${esc(e.when)}</time>
          <h3 class="ygg__title">${esc(e.title)}</h3>
          <p class="ygg__where">${esc(e.where)}</p>
          ${e.stat && e.stat !== 'now' ? `<span class="ygg__stat" aria-hidden="true">${esc(e.stat)}</span>` : ''}
        </div>
      </li>`;
    })
    .join('');
  const motes = Array.from({ length: 14 }, (_, i) => `<i style="--k:${i}"></i>`).join('');
  return `
  <section id="midgard" class="section" aria-labelledby="midgard-title">
    ${sectionHead('midgard', a.realm, a.label, runeOf('midgard'))}
    <div class="about">
      <div class="about__seal reveal" aria-hidden="true">
        <svg viewBox="0 0 200 200">
          <defs>
            <radialGradient id="seal-g" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#1b2230"/><stop offset="1" stop-color="#0b0e14"/></radialGradient>
            <path id="seal-ring" d="M100 100m-72 0a72 72 0 1 1 144 0a72 72 0 1 1-144 0"/>
          </defs>
          <circle cx="100" cy="100" r="94" fill="url(#seal-g)" stroke="#2c3646" stroke-width="2"/>
          <circle cx="100" cy="100" r="84" fill="none" stroke="#d9a441" stroke-opacity=".35" stroke-dasharray="2 6"/>
          <text class="seal__ring"><textPath href="#seal-ring" startOffset="0">ᚨᚱᚾᛟᛒ ᛞᛖᛒ · ᛁᛁᛏ ᛒᛟᛗᛒᚨᛁ · ᚨᚱᚾᛟᛒ ᛞᛖᛒ ·</textPath></text>
          <circle cx="100" cy="100" r="52" fill="none" stroke="#2c3646"/>
          <text x="100" y="114" text-anchor="middle" class="seal__mono">AD</text>
        </svg>
      </div>
      <div class="about__text reveal">${a.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
    </div>
    <div class="ygg">
      <h3 class="ygg__heading reveal">Yggdrasil <span>· from the roots to the crown</span></h3>
      ${YGG_CROWN}
      <div class="ygg__trunk" aria-hidden="true"><span class="ygg__fill"></span><span class="ygg__sap"></span><span class="ygg__motes">${motes}</span></div>
      <ol class="ygg__list">${nodes}</ol>
      ${YGG_ROOTS}
    </div>
  </section>`;
}

function forge() {
  const f = site.forge;
  const portals = f.portals
    .map(
      (p, i) => `
      <a class="portal${p.featured ? ' portal--featured' : ''} reveal" style="--i:${i}" href="${esc(p.file)}">
        <div class="portal__stage stage" data-stage="${p.stage}" data-auto="${p.auto.join(',')}">
          <canvas class="stage__canvas" aria-hidden="true"></canvas>
          <div class="stage__hud" aria-hidden="true"></div>
        </div>
        <div class="portal__body">
          <p class="status">${p.featured ? '<span class="ember-dot" aria-hidden="true"></span>' : `<span class="rune" aria-hidden="true">${p.rune}</span>`}${esc(p.status)}</p>
          <h3 class="portal__title">${esc(p.title)}</h3>
          <p class="portal__hook">${esc(p.hook)}</p>
          <ul class="portal__stats">${p.stats.map((st) => `<li><span class="portal__v">${esc(st.v)}</span><span class="portal__l">${esc(st.l)}</span></li>`).join('')}</ul>
          ${tags(p.tags)}
          <span class="portal__cta">Enter the saga <span aria-hidden="true">→</span></span>
        </div>
      </a>`,
    )
    .join('');
  return `
  <section id="forge" class="section section--forge" aria-labelledby="forge-title">
    ${sectionHead('forge', f.realm, f.label, runeOf('forge'), f.intro)}
    <div class="forge__hearth">
      <canvas class="forge__embers" aria-hidden="true"></canvas>
      <div class="portals">${portals}</div>
    </div>
    <div class="anvil reveal">
      <span class="anvil__rune" aria-hidden="true">ᚷ</span>
      <p>${esc(f.github.text)}</p>
      <a class="btn btn--ghost" href="${esc(f.github.href)}" target="_blank" rel="noopener">${esc(f.github.label)} ${externalIcon}<span class="sr-only">(opens in a new tab)</span></a>
    </div>
  </section>`;
}

function skills() {
  const s = site.skills;
  const all = s.groups.flatMap((g) => g.items);
  const band = all.map((x) => `<span>${esc(x)}</span><span class="rune">᛫</span>`).join('');
  return `
  <section id="runes" class="section" aria-labelledby="runes-title">
    ${sectionHead('runes', s.realm, s.label, runeOf('runes'))}
    <div class="marquee" aria-hidden="true"><div class="marquee__track">${band}${band}</div></div>
    <div class="grid grid--4 skills">
      ${s.groups
        .map(
          (g, i) => `
        <div class="card card--skills reveal" style="--i:${i}">
          <span class="card__rune" aria-hidden="true">${g.rune}</span>
          <h3 class="card__title">${esc(g.name)}</h3>
          <ul class="tags">${g.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        </div>`,
        )
        .join('')}
    </div>
  </section>`;
}

function resumeCard(r: Resume, i: number) {
  return `
    <article class="card scroll${r.featured ? ' scroll--featured' : ''} reveal" style="--i:${i}">
      ${r.featured ? '<p class="scroll__badge">Start here</p>' : ''}
      <span class="scroll__rune" aria-hidden="true">${r.rune}</span>
      <p class="scroll__rune-name">${esc(r.runeName)}</p>
      <h3 class="card__title"><span class="scroll__track">${esc(r.track)}</span> ${esc(r.title)}</h3>
      <p class="card__meta">${esc(r.subtitle)}</p>
      <div class="scroll__actions">
        <a class="btn btn--gold btn--sm" href="${esc(r.file)}" target="_blank" rel="noopener">View<span class="sr-only"> ${esc(r.track)} resume (PDF, opens in a new tab)</span></a>
        <a class="btn btn--ghost btn--sm" href="${esc(r.file)}" download>Download<span class="sr-only"> ${esc(r.track)} resume (PDF)</span></a>
      </div>
    </article>`;
}

function resumes() {
  const r = site.resumes;
  return `
  <section id="scrolls" class="section section--scrolls" aria-labelledby="scrolls-title">
    ${sectionHead('scrolls', r.realm, r.label, runeOf('scrolls'), r.intro)}
    <div class="grid grid--3 scrolls">${r.items.map(resumeCard).join('')}</div>
  </section>`;
}

// A gamer tag that copies itself to the clipboard (wired up in pages/home.ts).
const gamerId = (id: { label: string; value: string }) => `
          <button type="button" class="gamer-id" data-copy="${esc(id.value)}">
            <span class="gamer-id__label">${esc(id.label)}</span>
            <span class="gamer-id__v">${esc(id.value)}</span>
            <span class="gamer-id__hint" aria-hidden="true">copy</span>
          </button>`;

function valhalla() {
  const v = site.valhalla;
  const s = v.siege;
  const term = v.terminal
    .map(
      (l) =>
        `<p class="term__line" data-cmd="${esc(l.cmd)}"><span class="term__prompt">$</span> <span class="term__cmd">${esc(l.cmd)}</span></p>` +
        l.out.map((o) => `<p class="term__line term__out">${esc(o)}</p>`).join(''),
    )
    .join('');
  const tile = (cls: string, art: string, title: string, body: string, i: number, extra = '') => `
      <article class="tile ${cls} reveal" style="--i:${i}">
        <div class="tile__art">${art}</div>
        <div class="tile__text">
          <h3 class="tile__title">${esc(title)}</h3>
          <p>${body}</p>
          ${extra}
        </div>
      </article>`;
  return `
  <section id="valhalla" class="section" aria-labelledby="valhalla-title">
    ${sectionHead('valhalla', v.realm, v.label, runeOf('valhalla'), v.intro)}
    <div class="bento">
      ${tile('tile--siege', RADAR, s.title, esc(s.text), 0, gamerId(s.id))}
      <article class="tile tile--pool reveal" style="--i:1">
        <div class="tile__art"><canvas class="pool" aria-label="Mini pool table: drag back from the white ball and release to shoot" role="img"></canvas></div>
        <div class="tile__text">
          <h3 class="tile__title">${esc(v.pool.title)}</h3>
          <p>${esc(v.pool.text)}</p>
          <p class="tile__meta"><span class="pool__score">Potted: 0</span> · <button type="button" class="pool__reset">Rack again</button></p>
        </div>
      </article>
      ${tile('tile--lantern', LANTERN, v.comics.title, esc(v.comics.text), 2)}
      ${tile('tile--anime', EPISODE, v.anime.title, esc(v.anime.text), 3, v.anime.favorites.length ? `<p class="tile__meta">${esc(v.anime.favLabel)}:</p>${tags(v.anime.favorites)}` : '')}
      ${tile('tile--pc', PC, v.pc.title, esc(v.pc.text), 4)}
      ${tile('tile--cards', `<button type="button" class="card-fan" aria-label="Draw a rune card">${CARDS}</button>`, v.cards.title, esc(v.cards.text), 5)}
      ${tile('tile--field', FIELD, v.field.title, esc(v.field.text), 6)}
      ${tile('tile--travel', ROUTE, v.travel.title, esc(v.travel.text), 7)}
      ${tile('tile--saber', SABER, v.starwars.title, esc(v.starwars.text), 8, gamerId(v.starwars.id))}
    </div>
    <div class="hall__row">
      <figure class="quote reveal">
        <blockquote><p>“${esc(v.quote.text)}”</p></blockquote>
      </figure>
      <div class="term reveal" role="group" aria-label="Terminal">
        <div class="term__bar" aria-hidden="true"><span></span><span></span><span></span><em>valhalla — zsh</em></div>
        <div class="term__body">${term}</div>
      </div>
    </div>
  </section>`;
}

const ICONS: Record<string, string> = {
  mail: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5Z"/><path d="m3.5 6 8.5 7 8.5-7"/>',
  code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.8a3.2 3.2 0 0 1 0 6.4M18 14.4c1.8.8 3 2.6 3 4.6"/>',
};
const icon = (k: string) =>
  `<svg class="raven__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`;
const RAVEN = `<svg class="raven__bird" viewBox="0 0 48 32" aria-hidden="true"><path d="M2 20c6-1 10-4 14-8 3-3 7-6 12-6 3 0 5 1 6 3l6 1-5 3c0 5-3 9-9 11l4 6-6-3-4 2 1-4c-7 0-13-2-19-5Z" fill="currentColor"/></svg>`;

function contact() {
  const c = site.contact;
  const card = (i: number, rune: string, kind: string, label: string, value: string, action: string, attrs: string, mail = false) => `
      <li class="raven reveal" style="--i:${i}">
        <a class="raven__link${mail ? ' mail' : ''}" ${attrs}>
          ${RAVEN}
          <span class="raven__seal" aria-hidden="true"><span class="rune">${rune}</span></span>
          ${icon(kind)}
          <span class="raven__label">${esc(label)}</span>
          <span class="raven__value">${value}</span>
          <span class="raven__action" aria-hidden="true">${esc(action)} <span>→</span></span>
        </a>
      </li>`;
  const emails = c.emails.map((e, i) =>
    card(i, i ? 'ᛗ' : 'ᛁ', 'mail', `${e.label} email`, `${esc(e.user)}<wbr>&#64;${esc(e.domain)}`, 'Write', `href="#ravens" data-u="${esc(e.user)}" data-d="${esc(e.domain)}"`, true),
  );
  const links = c.links.map((l, i) =>
    card(
      c.emails.length + i,
      i ? 'ᛚ' : 'ᚷ',
      l.label === 'GitHub' ? 'code' : 'people',
      l.label,
      esc(l.handle),
      'Visit',
      `href="${esc(l.href)}" target="_blank" rel="noopener me" aria-label="${esc(l.label)}: ${esc(l.handle)} (opens in a new tab)"`,
    ),
  );
  const primary = c.emails[0];
  return `
  <section id="ravens" class="section section--ravens" aria-labelledby="ravens-title">
    ${sectionHead('ravens', c.realm, c.label, runeOf('ravens'), c.intro)}
    <ul class="ravens-post">${[...emails, ...links].join('')}</ul>
    <div class="ravens-post__cta reveal">
      <a class="btn btn--gold mail" href="#ravens" data-u="${esc(primary.user)}" data-d="${esc(primary.domain)}" data-lightning>Send a raven</a>
    </div>
  </section>`;
}

export function footer(base = '') {
  return `
  <footer class="footer">
    <a href="${base}#bifrost" class="footer__top">${base ? 'Back to the Bifröst ↑' : 'Return to the Bifröst ↑'}</a>
  </footer>
  <div class="toast" role="status" aria-live="polite"></div>`;
}

export function renderPage() {
  return `${nav()}
  <main id="main">${hero()}${about()}${forge()}${skills()}${resumes()}${valhalla()}${contact()}</main>
  ${footer()}`;
}

export function renderHead() {
  const m = site.meta;
  const base = m.siteUrl.replace(/\/?$/, '/');
  const abs = m.siteUrl
    ? `
    <link rel="canonical" href="${esc(base)}">
    <meta property="og:url" content="${esc(base)}">
    <meta property="og:image" content="${esc(base)}og-image.png">
    <meta name="twitter:image" content="${esc(base)}og-image.png">`
    : `
    <meta property="og:image" content="og-image.png">`;
  return `
    <title>${esc(m.title)}</title>
    <meta name="description" content="${esc(m.description)}">
    <meta name="robots" content="index, follow">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${esc(m.title)}">
    <meta property="og:description" content="${esc(m.description)}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(m.title)}">
    <meta name="twitter:description" content="${esc(m.description)}">${abs}`;
}
