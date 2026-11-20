import { fine, lerp, reduce } from "./util";

export function cursor(): void {
  if (!fine || reduce) return;
  const c = document.getElementById("cur")!, r = document.getElementById("ring")!;
  let x = -100, y = -100, rx = x, ry = y, moved = false;
  c.style.opacity = r.style.opacity = "0";
  addEventListener("pointermove", (e) => {
    x = e.clientX;
    y = e.clientY;
    if (!moved) {
      moved = true;
      rx = x;
      ry = y;
      c.style.opacity = r.style.opacity = "1";
    }
    c.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
  });
  (function f() {
    rx = lerp(rx, x, 0.16);
    ry = lerp(ry, y, 0.16);
    r.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(f);
  })();
  document.querySelectorAll("[data-hot]").forEach((el) => {
    el.addEventListener("pointerenter", () => r.classList.add("hot"));
    el.addEventListener("pointerleave", () => r.classList.remove("hot"));
  });
}
