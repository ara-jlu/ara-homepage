import { reduce } from "./util";

type Cell = { x: number; y: number; g: string; p: number };

export function makeField(canvas: HTMLCanvasElement, opts: { size?: number } = {}): void {
  const cx = canvas.getContext("2d")!;
  const glyphs = "01{}[]<>/$#*+=-_.:;".split("");
  const S = opts.size || 22;
  let W = 0, H = 0, cells: Cell[] = [], mx = -999, my = -999, vis = true;
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cells = [];
    for (let y = 0; y < Math.ceil(H / S); y++) for (let x = 0; x < Math.ceil(W / S); x++) cells.push({ x, y, g: glyphs[(Math.random() * glyphs.length) | 0], p: Math.random() * 6.28 });
  }
  addEventListener("resize", resize);
  resize();
  const host = canvas.parentElement!;
  host.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
  });
  host.addEventListener("pointerleave", () => {
    mx = my = -999;
  });
  new IntersectionObserver((es) => (vis = es[0].isIntersecting)).observe(canvas);
  function frame(t: number) {
    if (vis) {
      cx.clearRect(0, 0, W, H);
      cx.font = '12px "JetBrains Mono", monospace';
      cx.textAlign = "center";
      cx.textBaseline = "middle";
      for (const c of cells) {
        const px = c.x * S + S / 2, py = c.y * S + S / 2;
        const wave = (Math.sin(c.x * 0.35 + t * 0.0007 + c.p * 0.2) + Math.cos(c.y * 0.3 - t * 0.0005)) * 0.5;
        const d = Math.hypot(px - mx, py - my), near = Math.max(0, 1 - d / 170);
        const a = 0.04 + Math.max(0, wave) * 0.11 + near * 0.32;
        if (Math.random() < 0.0008) c.g = glyphs[(Math.random() * glyphs.length) | 0];
        cx.fillStyle = near > 0.15 ? `rgba(199,144,56,${a})` : `rgba(239,231,216,${a})`;
        cx.fillText(c.g, px + near * (px - mx) * 0.06, py + near * (py - my) * 0.06);
      }
    }
    if (!reduce) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
