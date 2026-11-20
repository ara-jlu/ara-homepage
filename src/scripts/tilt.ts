import { fine, reduce } from "./util";

export function heroTilt(): void {
  if (!fine || reduce) return;
  const hero = document.getElementById("top")!, win = document.getElementById("win")!, spot = document.getElementById("spot")!;
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    win.style.transform = `rotateY(${px * 10}deg) rotateX(${-py * 8}deg) translateZ(0)`;
    spot.style.left = e.clientX - r.left + "px";
    spot.style.top = e.clientY - r.top + "px";
    spot.classList.add("on");
  });
  hero.addEventListener("pointerleave", () => {
    win.style.transform = "";
    spot.classList.remove("on");
  });
}

export function cards(): void {
  document.querySelectorAll<HTMLElement>(".tilt").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", px * 100 + "%");
      card.style.setProperty("--my", py * 100 + "%");
      if (fine && !reduce) card.style.transform = `perspective(1000px) rotateY(${(px - 0.5) * 8}deg) rotateX(${-(py - 0.5) * 8}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => (card.style.transform = ""));
  });
}
