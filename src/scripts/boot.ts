import { reduce, sleep } from "./util";

export async function boot(): Promise<void> {
  const box = document.getElementById("boot")!;
  if (reduce) {
    box.remove();
    document.body.classList.remove("loading");
    return;
  }
  const lines = ["booting joifup.com …", 'loading fonts ……………… <span class="ok">ok</span>', 'mounting /news /fde /joifup … <span class="ok">ok</span>', 'warming up the terminal … <span class="ok">ok</span>'];
  const bl = document.getElementById("bootlines")!, pct = document.getElementById("pct")!, bar = document.getElementById("bootbar")!;
  let i = 0;
  const t0 = performance.now(), dur = 1500;
  (function tick() {
    const p = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    pct.textContent = String(Math.round(e * 100));
    bar.style.transform = `scaleX(${e})`;
    if (i < lines.length && p > i / lines.length) {
      const d = document.createElement("div");
      d.className = "bl";
      d.innerHTML = lines[i++];
      bl.appendChild(d);
    }
    if (p < 1) requestAnimationFrame(tick);
  })();
  await sleep(dur + 250);
  box.classList.add("done");
  document.body.classList.remove("loading");
  setTimeout(() => box.remove(), 1100);
}
