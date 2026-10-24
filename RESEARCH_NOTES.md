# Animation research notes

Bounded pass on techniques before building. Everything here was implemented from scratch; no demo code was pasted.

- **Text scramble / decode.** Standard approach: per-character "settle" times, re-roll unsettled glyphs on a timer, render with rAF.
  Ours swaps random Latin glyphs for Elder Futhark (U+16A0–16FF) and re-rolls every ~60 ms to avoid strobing.
  Ref: [Cruip — text scramble with JavaScript](https://cruip.com/making-a-text-scramble-animation-with-javascript/)
  ([DEV mirror](https://dev.to/cruip_com/making-a-text-scramble-animation-with-javascript-2nb3)).
  Accessibility: keep the real text in an `.sr-only` sibling and animate an `aria-hidden` copy.
- **Constellation star fields.** Common pattern: particles + lines between neighbours within a radius.
  Naive all-pairs is O(n²); [constellation_particles](https://pub.dev/packages/constellation_particles/versions/0.2.1) uses a spatial hash.
  Ours only links stars already inside the cursor radius (a handful), which keeps it cheap without a grid.
  Refs: [cssscript constellation demo](https://www.cssscript.com/interactive-constellation-effectas/), [Dust Steller](https://github.com/saeez/Dust-Steller) (attract/repel modes).
- **Parallax depth.** Give each star a depth `z`; offset by `(cursor − centre) × z` so near stars move more. Ease everything with
  frame-rate-independent smoothing (`1 − 0.001^(dt/1000)`).
- **Aurora without shaders.** Draw curtains at 1/6 resolution into an offscreen canvas and upscale: bilinear smoothing gives the
  soft glow for free, far cheaper than `ctx.filter = blur()` per frame.
- **Glowing card borders.** Register an angle with `@property`, feed it to a `conic-gradient` on a masked pseudo-element, animate on hover.
  Without `@property` the gradient can't interpolate and jumps. Supported in Chromium and Firefox 128+; in older browsers the border simply doesn't spin.
  Refs: [css-tip.com glowing border](https://css-tip.com/glowing-border/), [Ryan Mulligan — @property](https://ryanmulligan.dev/blog/css-property-new-style/), [codetv — animated gradient border](https://codetv.dev/blog/animated-css-gradient-border).
- **Lightning.** Recursive midpoint displacement for a jagged path, two strokes (glow + white core), short forks, ≤150 ms flash.
- **Performance hygiene.** Pause rAF loops with `IntersectionObserver` + `visibilitychange`; cap canvas DPR at 2; transform/opacity-only reveals.
- **Scroll reveals.** The brief suggested GSAP + ScrollTrigger; the reveals needed here (fade + 20 px rise, staggered) are a few lines with
  `IntersectionObserver` and CSS transitions, so no animation library is shipped. Total JS is ~9 KB gzipped.
- **Friend's site (cse.iitb.ac.in/~sahilshahane).** Fetched as text only (no headless Chromium here), which confirmed the structure
  (hero, terminal widget, experience timeline, toolkit tags, closing CTA, Astro build) but not the motion details. Interaction design
  above follows the brief's description of what Arnob liked: stars that react to the cursor.

## Second pass (project pages)

- **Scrollytelling pattern**: sticky visual + stepped text, the step at mid-viewport drives the visual. Accessibility: steps are focusable and drive the stage too; reduced motion shows final states.
  Refs: [Maglr scrollytelling roundup](https://www.maglr.com/blog/best-scrollytelling-examples), [Lovable on scroll patterns & a11y](https://lovable.dev/guides/scrolling-designs-patterns-when-to-use),
  [Josh Comeau — scroll-driven animations](https://joshwcomeau.com/animation/scroll-driven-animations), [MDN view()](https://developer.mozilla.org/docs/Web/CSS/animation-timeline/view).
  CSS `animation-timeline` wasn't used for the stages (they need state machines, not tweens); IntersectionObserver keeps it simple and broadly supported.
- **IITB CSE student pages reviewed**: [Sahil Shahane](https://www.cse.iitb.ac.in/~sahilshahane/) (scramble-in name, letters that scatter on scroll, cursor spotlight, mini-games — studied, not copied),
  [Pratham Shah](https://www.cse.iitb.ac.in/~prathamshah/), [Tejas Shinde](https://www.cse.iitb.ac.in/~tejasshinde/), [Prathamesh Yeole](https://www.cse.iitb.ac.in/~prathamy/), [Kislay](https://www.cse.iitb.ac.in/~kislay/).
  Most present projects as bullet lists; the gap this site fills is showing *how the work works*.
- Norse takes on those ideas: rune decode (scramble), shattering ice name (scatter), lantern revealing carved runes (spotlight), pool table (mini-game).
