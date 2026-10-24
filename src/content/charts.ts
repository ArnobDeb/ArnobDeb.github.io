// Build-time SVG charts. Rendered into the HTML so they read without JavaScript;
// src/fx/chartHover.ts adds tooltips / crosshair on top. Palette validated with the
// dataviz skill's validator against the card surface #10141b (dark band, CVD-safe).

export const SERIES = {
  teal: '#21a68a',
  violet: '#8a74ec',
  gold: '#bd8a33',
  rose: '#d65c80',
} as const;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n: number) => (Number.isInteger(n) ? n.toLocaleString('en-US') : n.toLocaleString('en-US', { maximumFractionDigits: 2 }));

// "Nice" upper bound and tick step for an axis starting at zero.
function niceScale(max: number, ticks = 4) {
  const raw = max / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  return { top: Math.ceil(max / step) * step, step };
}

// Bar with only the data end rounded (4px), anchored square to the baseline.
function barPath(x: number, y: number, w: number, h: number, r = 4) {
  if (h <= 0) return '';
  const rr = Math.min(r, w / 2, h);
  return `M${x} ${y + h}V${y + rr}Q${x} ${y} ${x + rr} ${y}H${x + w - rr}Q${x + w} ${y} ${x + w} ${y + rr}V${y + h}Z`;
}

interface Legend { name: string; color: string; dash?: boolean }
const legend = (items: Legend[]) =>
  `<ul class="chart__legend">${items
    .map((l) => `<li><span class="chart__key${l.dash ? ' chart__key--dash' : ''}" style="--c:${l.color}"></span>${esc(l.name)}</li>`)
    .join('')}</ul>`;

function table(caption: string, head: string[], rows: (string | number)[][]) {
  return `<details class="chart__table"><summary>View as table</summary><table><caption class="sr-only">${esc(caption)}</caption><thead><tr>${head
    .map((h) => `<th scope="col">${esc(h)}</th>`)
    .join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${esc(String(c))}</th>` : `<td>${typeof c === 'number' ? fmt(c) : esc(c)}</td>`)).join('')}</tr>`)
    .join('')}</tbody></table></details>`;
}

export interface BarSeries { name: string; color: string; values: number[] }

export interface BarChartOpts {
  title: string;
  caption?: string;
  categories: string[];
  series: BarSeries[];
  unit?: string; // appended in tooltips/labels, e.g. " s"
  yLabel: string;
  yMax?: number;
  reference?: { value: number; label: string };
  labelSeries?: number; // index of the series that gets direct value labels
  height?: number;
}

export function barChart(o: BarChartOpts) {
  const W = 640;
  const H = o.height ?? 300;
  const m = { t: 18, r: 12, b: 34, l: 44 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const peak = Math.max(...o.series.flatMap((s) => s.values), o.reference?.value ?? 0);
  const { top, step } = niceScale(o.yMax ?? peak);
  const y = (v: number) => m.t + ih - (v / top) * ih;
  const band = iw / o.categories.length;
  const groupW = Math.min(band * 0.62, 34 * o.series.length + 2 * (o.series.length - 1));
  const gap = 2;
  const barW = (groupW - gap * (o.series.length - 1)) / o.series.length;
  const unit = o.unit ?? '';

  let grid = '';
  for (let v = 0; v <= top + 1e-9; v += step) {
    grid += `<line class="chart__grid" x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}"/><text class="chart__tick" x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">${fmt(+v.toFixed(2))}</text>`;
  }

  let bars = '';
  let labels = '';
  o.categories.forEach((cat, ci) => {
    const gx = m.l + band * ci + (band - groupW) / 2;
    const tip = o.series.map((s) => `${s.name}: ${fmt(s.values[ci])}${unit}`).join('|');
    o.series.forEach((s, si) => {
      const v = s.values[ci];
      const x = gx + si * (barW + gap);
      bars += `<path class="chart__bar" style="--d:${ci * 70 + si * 40}ms" fill="${s.color}" d="${barPath(x, y(v), barW, y(0) - y(v))}"/>`;
      if (o.labelSeries === si) labels += `<text class="chart__val" x="${x + barW / 2}" y="${y(v) - 6}" text-anchor="middle">${fmt(v)}</text>`;
    });
    // Hit target bigger than the marks: the whole category band.
    bars += `<rect class="chart__hit" x="${m.l + band * ci}" y="${m.t}" width="${band}" height="${ih}" data-tip="${esc(`${cat}|${tip}`)}" tabindex="0" role="img" aria-label="${esc(`${cat}: ${tip.replace(/\|/g, ', ')}`)}"/>`;
    labels += `<text class="chart__tick" x="${m.l + band * ci + band / 2}" y="${H - 12}" text-anchor="middle">${esc(cat)}</text>`;
  });

  const ref = o.reference
    ? `<line class="chart__ref" x1="${m.l}" x2="${W - m.r}" y1="${y(o.reference.value)}" y2="${y(o.reference.value)}"/><text class="chart__ref-label" x="${W - m.r}" y="${y(o.reference.value) - 6}" text-anchor="end">${esc(o.reference.label)}</text>`
    : '';

  const items: Legend[] = o.series.length > 1 ? o.series.map((s) => ({ name: s.name, color: s.color })) : [];
  if (o.reference) items.push({ name: o.reference.label, color: '#9aa6b6', dash: true });

  return `
  <figure class="chart reveal" data-chart="bar">
    <figcaption class="chart__title">${esc(o.title)}</figcaption>
    ${items.length ? legend(items) : ''}
    <div class="chart__plot">
      <svg viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(o.title)}">
        <text class="chart__axis-label" x="${m.l}" y="10">${esc(o.yLabel)}</text>
        ${grid}${ref}<line class="chart__base" x1="${m.l}" x2="${W - m.r}" y1="${y(0)}" y2="${y(0)}"/>${bars}${labels}
      </svg>
      <div class="chart__tip" aria-hidden="true"></div>
    </div>
    ${o.caption ? `<p class="chart__caption">${esc(o.caption)}</p>` : ''}
    ${table(o.title, ['', ...o.series.map((s) => s.name + (unit ? ` (${unit.trim()})` : ''))], o.categories.map((c, i) => [c, ...o.series.map((s) => s.values[i])]))}
  </figure>`;
}

export interface LineSeries { name: string; color: string; values: number[] }

export interface LineChartOpts {
  title: string;
  caption?: string;
  x: number[];
  xLabel: string;
  yLabel: string;
  unit?: string;
  series: LineSeries[];
  height?: number;
}

export function lineChart(o: LineChartOpts) {
  const W = 640;
  const H = o.height ?? 300;
  const m = { t: 18, r: 96, b: 40, l: 52 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const { top, step } = niceScale(Math.max(...o.series.flatMap((s) => s.values)));
  const xmin = o.x[0];
  const xmax = o.x[o.x.length - 1];
  const X = (v: number) => m.l + ((v - xmin) / (xmax - xmin)) * iw;
  const Y = (v: number) => m.t + ih - (v / top) * ih;
  const unit = o.unit ?? '';

  let grid = '';
  for (let v = 0; v <= top + 1e-9; v += step) {
    grid += `<line class="chart__grid" x1="${m.l}" x2="${m.l + iw}" y1="${Y(v)}" y2="${Y(v)}"/><text class="chart__tick" x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end">${fmt(v)}</text>`;
  }
  const xt = o.x.map((v) => `<text class="chart__tick" x="${X(v)}" y="${m.t + ih + 18}" text-anchor="middle">${v}</text>`).join('');

  // Direct end labels, nudged apart so they never collide.
  const ends = o.series.map((s, i) => ({ i, y: Y(s.values[s.values.length - 1]) })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 14) ends[k].y = ends[k - 1].y + 14;
  const endY = new Map(ends.map((e) => [e.i, e.y]));

  const lines = o.series
    .map((s, si) => {
      const pts = s.values.map((v, i) => `${X(o.x[i]).toFixed(1)},${Y(v).toFixed(1)}`);
      const marks = s.values
        .map((v, i) => `<circle class="chart__dot" cx="${X(o.x[i])}" cy="${Y(v)}" r="4" fill="${s.color}"/>`)
        .join('');
      return `<polyline class="chart__line" style="--d:${si * 120}ms" fill="none" stroke="${s.color}" points="${pts.join(' ')}"/>${marks}<text class="chart__end" x="${m.l + iw + 8}" y="${(endY.get(si) ?? 0) + 4}">${esc(s.name)}</text>`;
    })
    .join('');

  const cols = o.x
    .map((xv, i) => {
      const left = i === 0 ? X(xv) : (X(o.x[i - 1]) + X(xv)) / 2;
      const right = i === o.x.length - 1 ? X(xv) : (X(xv) + X(o.x[i + 1])) / 2;
      const tip = `${o.xLabel} ${xv}|` + o.series.map((s) => `${s.name}: ${fmt(s.values[i])}${unit}`).join('|');
      return `<rect class="chart__hit" x="${left}" y="${m.t}" width="${Math.max(right - left, 1)}" height="${ih}" data-x="${X(xv)}" data-tip="${esc(tip)}" tabindex="0" role="img" aria-label="${esc(tip.replace(/\|/g, ', '))}"/>`;
    })
    .join('');

  return `
  <figure class="chart reveal" data-chart="line">
    <figcaption class="chart__title">${esc(o.title)}</figcaption>
    ${legend(o.series.map((s) => ({ name: s.name, color: s.color })))}
    <div class="chart__plot">
      <svg viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(o.title)}">
        <text class="chart__axis-label" x="${m.l}" y="10">${esc(o.yLabel)}</text>
        ${grid}<line class="chart__base" x1="${m.l}" x2="${m.l + iw}" y1="${Y(0)}" y2="${Y(0)}"/>${xt}
        <text class="chart__axis-label" x="${m.l + iw / 2}" y="${H - 4}" text-anchor="middle">${esc(o.xLabel)}</text>
        <line class="chart__cross" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}"/>
        ${lines}${cols}
      </svg>
      <div class="chart__tip" aria-hidden="true"></div>
    </div>
    ${o.caption ? `<p class="chart__caption">${esc(o.caption)}</p>` : ''}
    ${table(o.title, [o.xLabel, ...o.series.map((s) => s.name)], o.x.map((xv, i) => [String(xv), ...o.series.map((s) => s.values[i])]))}
  </figure>`;
}
