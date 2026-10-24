// Aurora (Bifröst) curtains, painted at low resolution into an offscreen canvas and
// upscaled, which gives the soft glow for free instead of an expensive blur.

const SCALE = 1 / 6;

interface Band {
  color: string;
  base: number; // vertical position, 0..1 of height
  amp: number;
  freq: number;
  speed: number;
  height: number; // curtain height, 0..1 of height
  phase: number;
}

const BANDS: Band[] = [
  { color: '62,230,193', base: 0.3, amp: 0.07, freq: 2.2, speed: 0.00006, height: 0.42, phase: 0 },
  { color: '138,108,255', base: 0.22, amp: 0.06, freq: 1.6, speed: -0.00005, height: 0.36, phase: 2.1 },
  { color: '143,211,255', base: 0.38, amp: 0.05, freq: 3.1, speed: 0.00008, height: 0.25, phase: 4.2 },
];

export class Aurora {
  private buf = document.createElement('canvas');
  private bctx = this.buf.getContext('2d')!;
  private strips: HTMLCanvasElement[] = [];

  resize(w: number, h: number) {
    this.buf.width = Math.max(8, Math.round(w * SCALE));
    this.buf.height = Math.max(8, Math.round(h * SCALE));
    // One 1px-wide vertical gradient strip per band, stretched per column when drawing.
    this.strips = BANDS.map((b) => {
      const s = document.createElement('canvas');
      s.width = 1;
      s.height = 64;
      const c = s.getContext('2d')!;
      const g = c.createLinearGradient(0, 0, 0, 64);
      g.addColorStop(0, `rgba(${b.color},0)`);
      g.addColorStop(0.55, `rgba(${b.color},0.55)`);
      g.addColorStop(0.8, `rgba(${b.color},0.9)`);
      g.addColorStop(1, `rgba(${b.color},0)`);
      c.fillStyle = g;
      c.fillRect(0, 0, 1, 64);
      return s;
    });
  }

  // mx/my: smoothed cursor in CSS px, or null when there is no cursor.
  draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, mx: number | null, intensity = 1) {
    const { buf, bctx } = this;
    const bw = buf.width;
    const bh = buf.height;
    bctx.clearRect(0, 0, bw, bh);
    bctx.globalCompositeOperation = 'lighter';

    const cx = mx === null ? -1 : mx * SCALE;
    const sigma = bw * 0.12;

    BANDS.forEach((b, i) => {
      const strip = this.strips[i];
      for (let x = 0; x < bw; x++) {
        const u = x / bw;
        let y =
          b.base +
          b.amp * Math.sin(u * b.freq * Math.PI * 2 + t * b.speed * 6 + b.phase) +
          b.amp * 0.5 * Math.sin(u * b.freq * 5.3 - t * b.speed * 9 + b.phase);
        // The curtain lifts gently toward the cursor.
        if (cx >= 0) y -= 0.06 * Math.exp(-((x - cx) ** 2) / (2 * sigma * sigma));
        const shimmer = 0.5 + 0.5 * Math.sin(u * 40 + t * 0.0012 + b.phase * 3);
        bctx.globalAlpha = (0.18 + 0.22 * shimmer) * intensity;
        const hh = b.height * bh;
        bctx.drawImage(strip, x, y * bh - hh * 0.7, 1, hh);
      }
    });

    bctx.globalAlpha = 1;
    bctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(buf, 0, 0, w, h);
  }
}
