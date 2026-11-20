import { fine, reduce } from "./util";

export function magnets(): void {
  if (!fine || reduce) return;
  document.querySelectorAll<HTMLElement>(".magnet").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.3}px,${(e.clientY - r.top - r.height / 2) * 0.4}px)`;
    });
    b.addEventListener("pointerleave", () => {
      b.style.transform = "";
      b.animate([{ transform: getComputedStyle(b).transform }, { transform: "none" }], { duration: 500, easing: "cubic-bezier(.2,.8,.2,1)" });
    });
  });
}
