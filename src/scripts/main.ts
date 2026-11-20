import { boot } from "./boot";
import { clock } from "./clock";
import { initContactForm } from "./contact-form";
import { cursor } from "./cursor";
import { makeField } from "./field";
import { makeGrid } from "./grid";
import { popWindow, prepareTerm, runTerm } from "./hero";
import { magnets } from "./magnets";
import { marquee } from "./marquee";
import { observers, onScroll } from "./observers";
import { cards, heroTilt } from "./tilt";
import { reduce, sleep } from "./util";

makeGrid(document.getElementById("grid") as HTMLCanvasElement);
makeField(document.getElementById("field") as HTMLCanvasElement);
makeField(document.getElementById("field2") as HTMLCanvasElement, { size: 26 });
marquee();
cursor();
heroTilt();
cards();
magnets();
observers();
onScroll();
clock();
initContactForm();
// 本体が起動したことを js-flag.js に知らせる（無いと 4 秒後に静的な表示へ戻される）。
document.documentElement.setAttribute("data-ready", "");
// 静的な行は、窓が開く前（読み込みの幕と透明な窓 .window.pre の裏にあるうち）に消しておき、開いた窓に打ち込む。
prepareTerm();
boot()
  .then(popWindow)
  .then(() => sleep(reduce ? 0 : 200))
  .then(runTerm)
  .catch(() => {
    // 演出のどこかで失敗しても、幕や透明な窓のまま止めない
    document.body.classList.remove("loading");
    document.getElementById("boot")?.remove();
    document.getElementById("win")?.classList.remove("pre");
  });
