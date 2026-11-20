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

// js-flag.js が4秒で js のクラスを外した後に本体が届いたとき（回線が遅いなど）は、CSS が静的な表示（WORKS を縦に積む・ヒーローは打ち終わった形）に切り替え済み。
// そこへ高さの指定や打ち直しを足すと崩れるので、配置に触れない処理だけを動かす。
const live = document.documentElement.classList.contains("js");
marquee();
clock();
initContactForm();
if (live) start();
// 本体が起動したことを js-flag.js に知らせる（無いと 4 秒後に静的な表示へ戻される）。
document.documentElement.setAttribute("data-ready", "");

function start(): void {
  makeGrid(document.getElementById("grid") as HTMLCanvasElement);
  makeField(document.getElementById("field") as HTMLCanvasElement);
  makeField(document.getElementById("field2") as HTMLCanvasElement, { size: 26 });
  cursor();
  heroTilt();
  cards();
  magnets();
  observers();
  onScroll();
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
}
