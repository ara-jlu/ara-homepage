function count(el: HTMLElement): void {
  const to = +el.dataset.count!, t0 = performance.now(), d = 1400;
  (function f() {
    const p = Math.min(1, (performance.now() - t0) / d), e = 1 - Math.pow(1 - p, 4);
    el.textContent = String(Math.round(to * e));
    if (p < 1) requestAnimationFrame(f);
  })();
}

export function observers(): void {
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        el.classList.add("on");
        if (el.id === "stack") el.classList.add("on");
        el.querySelectorAll<HTMLElement>("[data-count]").forEach(count);
        io.unobserve(el);
      }),
    { threshold: 0.2 },
  );
  document.querySelectorAll(".reveal,#stack").forEach((el) => io.observe(el));
  const mio = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("play");
          mio.unobserve(e.target);
        }
      }),
    { threshold: 0.35 },
  );
  document.querySelectorAll(".mock").forEach((m) => mio.observe(m));
  const themes = [...document.querySelectorAll<HTMLElement>("[data-theme]")];
  const tio = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) document.body.classList.toggle("light", (e.target as HTMLElement).dataset.theme === "light");
      }),
    { rootMargin: "-50% 0px -50% 0px" },
  );
  themes.forEach((s) => tio.observe(s));
}

export function onScroll(): void {
  const prog = document.getElementById("progress")!, wrap = document.getElementById("works")!, track = document.getElementById("htrack")!, bar = document.getElementById("hbar")!, num = document.getElementById("hnum")!;
  const panels = track.children.length;
  function sizeWrap() {
    if (innerWidth <= 860) {
      wrap.style.height = "";
      return;
    }
    const extra = track.scrollWidth - innerWidth;
    wrap.style.height = innerHeight + extra + "px";
  }
  addEventListener("resize", sizeWrap);
  sizeWrap();
  setTimeout(sizeWrap, 600);
  function f() {
    const h = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
    if (innerWidth > 860) {
      const r = wrap.getBoundingClientRect(), total = wrap.offsetHeight - innerHeight, p = Math.min(1, Math.max(0, -r.top / total));
      const extra = track.scrollWidth - innerWidth;
      track.style.transform = `translate3d(${-extra * p}px,0,0)`;
      bar.style.transform = `scaleX(${p})`;
      num.textContent = String(Math.min(panels, Math.floor(p * panels * 0.999) + 1)).padStart(2, "0") + " / " + String(panels).padStart(2, "0");
    }
    requestAnimationFrame(f);
  }
  requestAnimationFrame(f);
}
