import { reduce } from "./util";

export function makeGrid(canvas: HTMLCanvasElement): void {
  const cx = canvas.getContext("2d")!;
  let W = 0, H = 0, vis = true;
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener("resize", resize);
  resize();
  new IntersectionObserver((es) => (vis = es[0].isIntersecting)).observe(canvas);
  function frame(t: number) {
    if (vis) {
      cx.clearRect(0, 0, W, H);
      const hz = H * 0.62, vx = W / 2;
      const g = cx.createLinearGradient(0, hz, 0, H);
      g.addColorStop(0, "rgba(199,144,56,0)");
      g.addColorStop(1, "rgba(199,144,56,.55)");
      cx.strokeStyle = g;
      cx.lineWidth = 1;
      for (let i = -24; i <= 24; i++) {
        cx.beginPath();
        cx.moveTo(vx + i * 8, hz);
        cx.lineTo(vx + i * W * 0.09, H);
        cx.stroke();
      }
      const off = (t * 0.00025) % 1;
      for (let k = 0; k < 18; k++) {
        const z = (k + off) / 18;
        const y = hz + (H - hz) * Math.pow(z, 2.2);
        cx.globalAlpha = z;
        cx.beginPath();
        cx.moveTo(0, y);
        cx.lineTo(W, y);
        cx.stroke();
      }
      cx.globalAlpha = 1;
    }
    if (!reduce) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
