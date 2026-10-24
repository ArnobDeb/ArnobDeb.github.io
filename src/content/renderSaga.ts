// Renders a project "saga" page: a hero, then acts where a sticky animated stage
// changes as the reader scrolls through the steps beside it.
import { decodable, esc, externalIcon, footer, nav } from './render.ts';
import { site } from './site.ts';
import { sagas, type Block, type Saga, type Stat } from './sagas.ts';

const HOME = 'index.html';

const stats = (items: Stat[], cls = 'rstats') =>
  `<ul class="${cls}">${items
    .map((s, i) => `<li class="reveal" style="--i:${i}"><span class="rstats__v">${esc(s.v)}</span><span class="rstats__l">${esc(s.l)}</span></li>`)
    .join('')}</ul>`;

const blockHead = (b: Block) => `
  <header class="act__head reveal">
    <p class="act__numeral" aria-hidden="true">${b.numeral}</p>
    <h2 id="${b.id}-title" class="act__title">${decodable(b.title)}</h2>
    ${b.intro ? `<p class="act__intro">${esc(b.intro)}</p>` : ''}
  </header>`;

function block(b: Block) {
  if (b.kind === 'act') {
    const steps = b.steps
      .map(
        (s, i) => `
        <article class="step" data-step="${i}">
          <p class="step__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</p>
          <h3 class="step__title">${esc(s.title)}</h3>
          <p>${esc(s.text)}</p>
          ${s.stats ? stats(s.stats, 'rstats rstats--sm') : ''}
        </article>`,
      )
      .join('');
    return `
    <section class="act" id="${b.id}" aria-labelledby="${b.id}-title">
      ${blockHead(b)}
      <div class="act__body">
        <div class="act__stage">
          <div class="stage" data-stage="${b.stage}">
            <canvas class="stage__canvas" aria-hidden="true"></canvas>
            <div class="stage__hud" aria-hidden="true"></div>
          </div>
          ${b.controls ?? ''}
        </div>
        <div class="act__steps">${steps}</div>
      </div>
    </section>`;
  }
  if (b.kind === 'charts') {
    return `
    <section class="act act--charts" id="${b.id}" aria-labelledby="${b.id}-title">
      ${blockHead(b)}
      <div class="charts${b.charts.length > 1 ? ' charts--multi' : ''}">${b.charts.join('')}</div>
      ${b.stats ? stats(b.stats) : ''}
    </section>`;
  }
  return `
    <section class="act act--stones" id="${b.id}" aria-labelledby="${b.id}-title">
      ${blockHead(b)}
      <ul class="stones">${b.stones
        .map(
          (s, i) => `
        <li class="stone reveal" style="--i:${i}">
          <span class="stone__rune" aria-hidden="true">${s.rune}</span>
          ${s.stat ? `<p class="stone__stat">${esc(s.stat)}</p>` : ''}
          <h3 class="stone__title">${esc(s.title)}</h3>
          <p>${esc(s.text)}</p>
        </li>`,
        )
        .join('')}</ul>
    </section>`;
}

export function renderSagaPage(saga: Saga) {
  const i = sagas.indexOf(saga);
  const next = sagas[(i + 1) % sagas.length];
  const rail = saga.blocks
    .map((b) => `<li><a href="#${b.id}"><span class="rail__num">${b.numeral}</span><span class="rail__label">${esc(b.title.split(/ — | \(/)[0])}</span></a></li>`)
    .join('');
  const links = (saga.links ?? [])
    .map((l) => `<a class="btn btn--ghost btn--sm" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} ${externalIcon}<span class="sr-only">(opens in a new tab)</span></a>`)
    .join('');

  return `${nav(HOME)}
  <main id="main" class="saga" data-saga="${saga.slug}">
    <section id="top" class="saga-hero" aria-labelledby="saga-title">
      <canvas class="hero__sky" aria-hidden="true"></canvas>
      <div class="saga-hero__inner">
        <a class="crumb" href="${HOME}#forge">← Back to the Forge</a>
        <p class="saga-hero__realm"><span class="rune" aria-hidden="true">${saga.rune}</span> ${esc(saga.realm)}</p>
        <h1 id="saga-title" class="saga-hero__title">${decodable(saga.title)}</h1>
        <p class="saga-hero__sub">${esc(saga.sub)}</p>
        <p class="saga-hero__meta">${esc(saga.meta)}</p>
        ${stats(saga.heroStats, 'rstats rstats--hero')}
        ${links ? `<div class="saga-hero__links">${links}</div>` : ''}
      </div>
    </section>
    <nav class="rail" aria-label="Chapters"><ol>${rail}</ol></nav>
    <div class="saga__body">
      ${saga.blocks.map(block).join('')}
      ${saga.disclaimer ? `<p class="saga__note">${esc(saga.disclaimer)}</p>` : ''}
      <a class="next-saga" href="${next.file}">
        <span class="next-saga__label">Next saga</span>
        <span class="next-saga__title"><span class="rune" aria-hidden="true">${next.rune}</span> ${esc(next.title)} →</span>
      </a>
    </div>
  </main>
  ${footer(HOME)}`;
}

export function renderSagaHead(saga: Saga) {
  const title = `${saga.title} · ${site.name}`;
  return `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(saga.sub)}">
    <meta name="robots" content="index, follow">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(saga.sub)}">
    <meta property="og:image" content="og-image.png">
    <meta name="twitter:card" content="summary_large_image">`;
}
