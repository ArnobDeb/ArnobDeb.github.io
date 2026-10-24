// Pure string rendering of site.ts into HTML. Runs at build time (vite.config.ts),
// so it must not touch the DOM.
import { site, type Project, type Resume } from './site.ts';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Visually decodable heading text: screen readers and crawlers get the real text,
// the aria-hidden copy is what the rune-decode effect animates.
const decodable = (text: string) =>
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

const hammerIcon = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 5.5 6 3h12l2 2.5V10l-2 2H6l-2-2Z" fill="currentColor" opacity=".9"/><path d="M7 6h10M7 9h10" stroke="#07090d" stroke-width="1" opacity=".5"/><rect x="10.5" y="12" width="3" height="9" rx="1" fill="currentColor"/><circle cx="12" cy="21.4" r="1.4" fill="currentColor"/></svg>`;

const externalIcon = `<svg class="icon icon--sm" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function nav() {
  const items = site.nav
    .map(
      (n) =>
        `<li><a href="#${n.id}"><span class="rune" aria-hidden="true">${n.rune}</span><span class="nav__realm">${esc(n.realm)}</span><span class="nav__sep" aria-hidden="true">·</span><span class="nav__label">${esc(n.label)}</span></a></li>`,
    )
    .join('');
  return `
  <a class="skip" href="#main">Skip to content</a>
  <div class="ravens" aria-hidden="true">
    <div class="ravens__track"><div class="ravens__fill"></div></div>
    <svg class="ravens__bird" viewBox="0 0 48 32"><path d="M2 20c6-1 10-4 14-8 3-3 7-6 12-6 3 0 5 1 6 3l6 1-5 3c0 5-3 9-9 11l4 6-6-3-4 2 1-4c-7 0-13-2-19-5Z" fill="currentColor"/><circle cx="31" cy="8.6" r="1" fill="#07090d"/></svg>
  </div>
  <nav class="nav" aria-label="Main">
    <a class="nav__brand" href="#bifrost" aria-label="${esc(site.name)}, back to top"><span class="rune" aria-hidden="true">ᚨ</span> Arnob Deb</a>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-menu"><span class="nav__toggle-bars" aria-hidden="true"></span><span class="sr-only">Menu</span></button>
    <ul id="nav-menu" class="nav__menu">${items}</ul>
  </nav>`;
}

function hero() {
  const h = site.hero;
  return `
  <section id="bifrost" class="hero" aria-labelledby="hero-title">
    <canvas class="hero__sky" aria-hidden="true"></canvas>
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
  const edu = a.education
    .map(
      (e, i) => `
      <li class="card card--edu reveal" style="--i:${i}">
        <span class="card__rune" aria-hidden="true">${e.rune}</span>
        <h3 class="card__title">${esc(e.title)}</h3>
        <p class="card__place">${esc(e.place)}</p>
        <p class="card__meta">${esc(e.meta)}</p>
      </li>`,
    )
    .join('');
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
    <ul class="grid grid--3 edu" aria-label="Education and achievements">${edu}</ul>
  </section>`;
}

function projectCard(p: Project, i: number) {
  return `
    <article class="card card--project reveal" style="--i:${i}">
      <span class="card__rune" aria-hidden="true">${p.rune}</span>
      <h3 class="card__title">${esc(p.title)}</h3>
      <p class="card__meta">${esc(p.meta)}</p>
      <ul class="card__points">${p.points.map((pt) => `<li>${esc(pt)}</li>`).join('')}</ul>
      ${tags(p.tags)}
      ${p.link ? `<a class="link-arrow" href="${esc(p.link.href)}" target="_blank" rel="noopener">${esc(p.link.label)} ${externalIcon}<span class="sr-only">(opens in a new tab)</span></a>` : ''}
    </article>`;
}

function forge() {
  const f = site.forge;
  const t = f.thesis;
  return `
  <section id="forge" class="section section--forge" aria-labelledby="forge-title">
    ${sectionHead('forge', f.realm, f.label, runeOf('forge'), f.intro)}
    <div class="forge__hearth">
      <canvas class="forge__embers" aria-hidden="true"></canvas>
      <article class="card card--thesis reveal">
        <p class="status"><span class="ember-dot" aria-hidden="true"></span>Currently forging · ${esc(t.status)}</p>
        <h3 class="card__title card__title--lg">${esc(t.title)}</h3>
        <p class="card__meta">${esc(t.meta)}</p>
        <ul class="card__points">${t.points.map((pt) => `<li>${esc(pt)}</li>`).join('')}</ul>
        ${tags(t.tags)}
        <span class="card__rune" aria-hidden="true">ᚲ</span>
      </article>
    </div>
    <div class="grid grid--2 projects">${f.projects.map(projectCard).join('')}</div>
    <details class="more reveal">
      <summary><span class="rune" aria-hidden="true">ᛟ</span> More from the forge <span class="more__count">(${f.more.length})</span></summary>
      <ul>${f.more.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
    </details>
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

function valhalla() {
  const v = site.valhalla;
  const s = v.siege;
  const siegeDetails = [s.platform && `Platform: ${s.platform}`, s.handle && `Handle: ${s.handle}`].filter(Boolean) as string[];
  const term = v.terminal
    .map(
      (l) =>
        `<p class="term__line" data-cmd="${esc(l.cmd)}"><span class="term__prompt">$</span> <span class="term__cmd">${esc(l.cmd)}</span></p>` +
        l.out.map((o) => `<p class="term__line term__out">${esc(o)}</p>`).join(''),
    )
    .join('');
  return `
  <section id="valhalla" class="section" aria-labelledby="valhalla-title">
    ${sectionHead('valhalla', v.realm, v.label, runeOf('valhalla'), v.intro)}
    <div class="grid grid--3 hall">
      <article class="card reveal" style="--i:0">
        <span class="card__rune" aria-hidden="true">ᛏ</span>
        <h3 class="card__title">${esc(s.title)}</h3>
        <p>${esc(s.text)}</p>
        <p class="card__meta">${siegeDetails.length ? siegeDetails.map(esc).join(' · ') : esc(s.fallback)}</p>
      </article>
      <article class="card reveal" style="--i:1">
        <span class="card__rune" aria-hidden="true">ᛃ</span>
        <h3 class="card__title">${esc(v.anime.title)}</h3>
        <p>${esc(v.anime.text)}</p>
        ${v.anime.favorites.length ? tags(v.anime.favorites) : ''}
      </article>
      <article class="card card--lantern reveal" style="--i:2">
        <span class="card__rune" aria-hidden="true">ᛟ</span>
        <h3 class="card__title">${esc(v.comics.title)}</h3>
        <p>${esc(v.comics.text)}</p>
      </article>
    </div>
    <div class="hall__row">
      <figure class="quote reveal">
        <blockquote><p>“${esc(v.quote.text)}”</p></blockquote>
        <figcaption>— ${esc(v.quote.who)}, <cite>${esc(v.quote.source)}</cite></figcaption>
      </figure>
      <div class="term reveal" role="group" aria-label="Terminal">
        <div class="term__bar" aria-hidden="true"><span></span><span></span><span></span><em>valhalla — zsh</em></div>
        <div class="term__body">${term}</div>
      </div>
    </div>
    <div class="grid grid--2 hall__extra">
      <div class="reveal">
        <h3 class="mini-title">Beyond the screen</h3>
        ${tags(v.hobbies).replace('aria-label="Technologies"', 'aria-label="Hobbies"')}
      </div>
      <div class="reveal">
        <h3 class="mini-title">Honours of the hall</h3>
        <ul class="honours">${v.honours.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
      </div>
    </div>
  </section>`;
}

function contact() {
  const c = site.contact;
  const emails = c.emails
    .map(
      (e) =>
        `<li><span class="contact__label">${esc(e.label)} email</span><a class="mail" href="#ravens" data-u="${esc(e.user)}" data-d="${esc(e.domain)}">${esc(e.user)}&#64;${esc(e.domain)}</a></li>`,
    )
    .join('');
  const links = c.links
    .map(
      (l) =>
        `<li><span class="contact__label">${esc(l.label)}</span><a href="${esc(l.href)}" target="_blank" rel="noopener me">${esc(l.handle)} ${externalIcon}<span class="sr-only">(${esc(l.label)}, opens in a new tab)</span></a></li>`,
    )
    .join('');
  const primary = c.emails[0];
  return `
  <section id="ravens" class="section section--ravens" aria-labelledby="ravens-title">
    ${sectionHead('ravens', c.realm, c.label, runeOf('ravens'), c.intro)}
    <div class="contact reveal">
      <ul class="contact__list">${emails}${links}</ul>
      <a class="btn btn--gold mail" href="#ravens" data-u="${esc(primary.user)}" data-d="${esc(primary.domain)}" data-lightning>Send a raven</a>
    </div>
  </section>`;
}

function footer() {
  return `
  <footer class="footer">
    <p>Carved by hand by Arnob Deb · Norse runes are public domain; all art on this page is original.</p>
    <a href="#bifrost" class="footer__top">Return to the Bifröst ↑</a>
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
