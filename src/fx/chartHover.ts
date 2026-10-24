// Tooltips for the build-time SVG charts: per-category tooltip on bars,
// crosshair + all-series tooltip on lines. Works with mouse, touch and keyboard focus.
export function initCharts() {
  document.querySelectorAll<HTMLElement>('.chart').forEach((chart) => {
    const plot = chart.querySelector<HTMLElement>('.chart__plot');
    const tip = chart.querySelector<HTMLElement>('.chart__tip');
    const svg = chart.querySelector<SVGSVGElement>('svg');
    const cross = chart.querySelector<SVGLineElement>('.chart__cross');
    if (!plot || !tip || !svg) return;

    const show = (hit: SVGRectElement) => {
      const [head, ...rows] = (hit.dataset.tip ?? '').split('|');
      tip.innerHTML = `<strong>${head}</strong>${rows.map((r) => `<span>${r}</span>`).join('')}`;
      const box = hit.getBBox();
      const scale = svg.clientWidth / svg.viewBox.baseVal.width;
      const cx = hit.dataset.x ? Number(hit.dataset.x) : box.x + box.width / 2;
      if (cross) {
        cross.setAttribute('x1', String(cx));
        cross.setAttribute('x2', String(cx));
        cross.classList.add('is-on');
      }
      chart.querySelectorAll('.chart__hit').forEach((h) => h.classList.toggle('is-hot', h === hit));
      tip.classList.add('is-on');
      const left = cx * scale; // the tip lives inside the scrolling plot, so no scroll offset
      const flip = left - plot.scrollLeft > plot.clientWidth * 0.6;
      tip.style.left = `${left}px`;
      tip.style.top = `${box.y * scale + 8}px`;
      tip.classList.toggle('is-flip', flip);
    };
    const hide = () => {
      tip.classList.remove('is-on');
      cross?.classList.remove('is-on');
      chart.querySelectorAll('.chart__hit').forEach((h) => h.classList.remove('is-hot'));
    };

    chart.querySelectorAll<SVGRectElement>('.chart__hit').forEach((hit) => {
      hit.addEventListener('pointerenter', () => show(hit));
      hit.addEventListener('focus', () => show(hit));
      hit.addEventListener('blur', hide);
    });
    plot.addEventListener('pointerleave', hide);
  });
}

// Counts the leading number in each stat up from zero once it scrolls into view.
export function initCountUp(selector: string) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = document.querySelectorAll<HTMLElement>(selector);
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const el = e.target as HTMLElement;
        const text = el.textContent ?? '';
        const m = text.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/s);
        // Only stats that start with the number (optionally a sign) count up.
        if (!m || !/^[~∼+−-]?$/.test(m[1])) continue;
        const [, pre, num, post] = m;
        const target = parseFloat(num.replace(/,/g, ''));
        const decimals = (num.split('.')[1] ?? '').length;
        const comma = num.includes(',');
        const start = performance.now();
        const dur = 1100;
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / dur);
          const v = target * (1 - Math.pow(1 - p, 3));
          let s = v.toFixed(decimals);
          if (comma) s = Number(s).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
          el.textContent = pre + s + post;
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = text;
        };
        requestAnimationFrame(tick);
      }
    },
    { threshold: 0.6 },
  );
  els.forEach((el) => io.observe(el));
}
