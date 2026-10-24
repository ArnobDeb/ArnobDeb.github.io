// Original inline SVG art for the home page (no third-party assets).

// Rune lines hidden in the hero sky; the cursor lantern reveals them.
const LINES = [
  'ᚨᚱᚾᛟᛒ ᛞᛖᛒ ᛫ ᛋᛁᛋᛏᛖᛗᛋ ᛫ ᛗᛖᛗᛟᚱᛁ ᛫ ᛁᚾᚠᛖᚱᛖᚾᚲᛖ',
  'ᚲᚨᚲᚺᛖ ᛫ ᚲᛖᚱᚾᛖᛚ ᛫ ᚹᚨᚱᛈ ᛫ ᛒᛚᛟᚲᚲ ᛫ ᚱᛟᚹ ᛫ ᛒᚨᚾᚲ',
  'ᛖᚹᛁᚲᛏ ᚹᛁᚦᛟᚢᛏ ᚠᛟᚱᚷᛖᛏᛏᛁᚾᚷ ᛫ ᚱᛖᛋᛏᛟᚱᛖ ᛫ ᚱᛖᛗᛖᛗᛒᛖᚱ',
  'ᚺᚨᛗᛗᛖᚱ ᛫ ᚨᚾᚹᛁᛚ ᛫ ᚠᛟᚱᚷᛖ ᛫ ᛒᛁᚠᚱᛟᛋᛏ ᛫ ᛗᛁᛞᚷᚨᚱᛞ',
];
export const INSCRIPTION = Array.from({ length: 9 }, (_, i) => `<p>${LINES[i % LINES.length]} ᛫ ${LINES[(i + 2) % LINES.length]}</p>`).join('');

// Crown of the world tree (top of the timeline) and its roots (bottom).
export const YGG_CROWN = `<svg class="ygg__crown" viewBox="0 0 400 120" aria-hidden="true">
  <g fill="none" stroke="currentColor" stroke-linecap="round">
    <path class="ygg__branch" d="M200 120V70M200 86C178 70 150 66 120 48M200 80c22-16 52-22 82-38M200 70c-8-22-30-36-56-44M200 70c10-24 34-36 62-42M120 48c-16-6-34-6-52 2M282 42c18-8 36-8 52 0M144 26c-10-10-24-14-40-12M262 28c12-10 26-12 42-8M200 70V30m0 0c-6-12-6-20 0-28m0 28c6-12 6-20 0-28" stroke-width="2.2"/>
  </g>
  <g class="ygg__leaves" fill="currentColor">
    <circle cx="68" cy="50" r="2.5"/><circle cx="104" cy="14" r="2.5"/><circle cx="200" cy="2" r="3"/><circle cx="304" cy="20" r="2.5"/><circle cx="334" cy="42" r="2.5"/><circle cx="144" cy="26" r="2"/><circle cx="262" cy="28" r="2"/><circle cx="120" cy="48" r="2"/><circle cx="282" cy="42" r="2"/>
  </g>
</svg>`;

export const YGG_ROOTS = `<svg class="ygg__roots" viewBox="0 0 400 90" aria-hidden="true">
  <path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M200 0v26m0 0c-14 18-40 28-74 34-22 4-40 12-52 24M200 26c14 18 40 28 74 34 22 4 40 12 52 24M200 26c-6 22-18 38-36 52M200 26c6 22 18 38 36 52M200 26v58"/>
</svg>`;

// --- Valhalla tile art ---

export const RADAR = `<svg class="radar" viewBox="0 0 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="rad-bg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#0f1a17"/><stop offset="1" stop-color="#07090d"/></radialGradient>
    <linearGradient id="rad-sweep" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3ee6c1" stop-opacity="0"/><stop offset="1" stop-color="#3ee6c1" stop-opacity=".55"/></linearGradient>
  </defs>
  <circle cx="100" cy="100" r="92" fill="url(#rad-bg)" stroke="#1f3a33"/>
  <g fill="none" stroke="#1f3a33"><circle cx="100" cy="100" r="62"/><circle cx="100" cy="100" r="32"/><path d="M8 100h184M100 8v184"/></g>
  <g class="radar__sweep"><path d="M100 100 L192 100 A92 92 0 0 0 165 35 Z" fill="url(#rad-sweep)"/></g>
  <g class="radar__blips" fill="#ff6a2b"><circle cx="140" cy="62" r="4"/><circle cx="58" cy="128" r="4"/><circle cx="124" cy="150" r="4"/></g>
  <g fill="none" stroke="#8fd3ff" stroke-width="2" opacity=".7"><path d="M14 30V14h16M186 30V14h-16M14 170v16h16M186 170v16h-16"/></g>
</svg>`;

export const LANTERN = `<svg class="lantern" viewBox="0 0 120 160" aria-hidden="true">
  <defs><radialGradient id="lan-g" cx="50%" cy="55%" r="55%"><stop offset="0" stop-color="#7dffa8" stop-opacity=".9"/><stop offset="1" stop-color="#7dffa8" stop-opacity="0"/></radialGradient></defs>
  <circle class="lantern__halo" cx="60" cy="88" r="58" fill="url(#lan-g)"/>
  <g fill="none" stroke="#9aa6b6" stroke-width="3" stroke-linejoin="round">
    <path d="M48 18a12 12 0 0 1 24 0"/>
    <path d="M38 34h44l-6-12H44Z"/>
    <path d="M36 34h48v10H36zM36 132h48v10H36z"/>
    <path d="M42 44v88M78 44v88M60 44v88"/>
  </g>
  <path class="lantern__flame" d="M60 70c10 12 12 22 6 32-3 5-9 7-12 2-4-6 0-10 2-14-6 4-9 10-7 16-8-8-6-24 11-36Z" fill="#7dffa8"/>
</svg>`;

export const EPISODE = `<svg class="episode" viewBox="0 0 120 120" aria-hidden="true">
  <circle cx="60" cy="60" r="50" fill="none" stroke="#222a36" stroke-width="8"/>
  <circle class="episode__ring" cx="60" cy="60" r="50" fill="none" stroke="#8a6cff" stroke-width="8" stroke-linecap="round" pathLength="100" stroke-dasharray="100" transform="rotate(-90 60 60)"/>
  <text x="60" y="54" text-anchor="middle" class="episode__label">next ep in</text>
  <g class="episode__count"><text x="60" y="82" text-anchor="middle">5</text><text x="60" y="82" text-anchor="middle">4</text><text x="60" y="82" text-anchor="middle">3</text><text x="60" y="82" text-anchor="middle">2</text><text x="60" y="82" text-anchor="middle">1</text></g>
</svg>`;

export const PC = `<svg class="pc" viewBox="0 0 220 150" aria-hidden="true">
  <rect x="20" y="10" width="180" height="130" rx="8" fill="#0d1218" stroke="#2c3646"/>
  <g stroke="#1f2a36"><path d="M30 120h160M30 108h160M150 20v80"/></g>
  <rect x="40" y="24" width="56" height="56" rx="4" fill="#141a23" stroke="#33404f"/>
  <g class="pc__fan"><circle cx="68" cy="52" r="22" fill="none" stroke="#3a4657"/><path d="M68 52l0-18M68 52l16 9M68 52l-16 9" stroke="#8fd3ff" stroke-width="5" stroke-linecap="round"/></g>
  <g class="pc__ram"><rect x="110" y="20" width="7" height="62" rx="1.5" fill="#d9a441"/><rect x="122" y="20" width="7" height="62" rx="1.5" fill="#d9a441"/><rect x="134" y="20" width="7" height="62" rx="1.5" fill="#d9a441"/></g>
  <g class="pc__gpu"><rect x="34" y="92" width="150" height="24" rx="4" fill="#1b2330" stroke="#8a6cff"/><circle cx="70" cy="104" r="8" fill="none" stroke="#8a6cff"/><circle cx="110" cy="104" r="8" fill="none" stroke="#8a6cff"/><circle cx="150" cy="104" r="8" fill="none" stroke="#8a6cff"/></g>
  <circle class="pc__led" cx="186" cy="20" r="3" fill="#3ee6c1"/>
</svg>`;

export const CARDS = ['ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᛟ']
  .map((r, i) => `<span class="card-fan__card" style="--k:${i - 2}"><span class="rune">${r}</span></span>`)
  .join('');

export const FIELD = `<svg class="field" viewBox="0 0 220 120" aria-hidden="true">
  <path d="M10 104h200" stroke="#2c3646"/>
  <path d="M110 104V56" stroke="#9aa6b6" stroke-width="2"/><path d="M110 58h0" stroke="#9aa6b6"/>
  <g stroke="#56657a" stroke-width="1"><path d="M106 60h8M106 68h8M106 76h8M106 84h8M106 92h8"/></g>
  <g class="field__shuttle"><path d="M0 0l-9-4 1 8Z" fill="#e7ecf3"/><circle cx="1" cy="0" r="2.5" fill="#d9a441"/></g>
  <g class="field__ball"><circle r="7" fill="#e7ecf3"/><path d="M-3-2l3-3 3 3-1 4h-4Z" fill="#141a23"/></g>
</svg>`;

export const ROUTE = `<svg class="route" viewBox="0 0 220 120" aria-hidden="true">
  <path d="M8 96c30-10 40-60 80-56s44 50 80 42 40-40 46-60" fill="none" stroke="#2c3646" stroke-width="2"/>
  <path class="route__line" d="M8 96c30-10 40-60 80-56s44 50 80 42 40-40 46-60" fill="none" stroke="#8fd3ff" stroke-width="2" stroke-dasharray="5 6" pathLength="100"/>
  <g fill="#d9a441"><circle cx="8" cy="96" r="4"/><circle cx="88" cy="40" r="4"/><circle cx="168" cy="82" r="4"/><circle cx="214" cy="22" r="4"/></g>
</svg>`;

export const TORC = `<svg class="torc" viewBox="0 0 100 100" aria-hidden="true">
  <circle cx="50" cy="50" r="40" fill="none" stroke="#c9d3df" stroke-width="6" stroke-dasharray="210 40" transform="rotate(110 50 50)"/>
  <circle cx="22" cy="74" r="7" fill="#c9d3df"/><circle cx="78" cy="74" r="7" fill="#c9d3df"/>
</svg>`;

export const TRAIL = `<svg class="trail" viewBox="0 0 220 60" aria-hidden="true">
  <path d="M6 44c30-30 50 10 80-10s50-24 70 0 40 10 58-20" fill="none" stroke="#2c3646" stroke-width="3" stroke-linecap="round"/>
  <path class="trail__line" d="M6 44c30-30 50 10 80-10s50-24 70 0 40 10 58-20" fill="none" stroke="#3ee6c1" stroke-width="3" stroke-linecap="round" pathLength="100"/>
</svg>`;
