import { boot } from "./boot";
import { clock } from "./clock";
import { cursor } from "./cursor";
import { makeField } from "./field";
import { makeGrid } from "./grid";
import { popWindow, runTerm } from "./hero";
import { magnets } from "./magnets";
import { marquee } from "./marquee";
import { observers, onScroll } from "./observers";
import { cards, heroTilt } from "./tilt";
import { reduce } from "./util";

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
// 本体が起動したことを js-flag.js に知らせる（無いと 4 秒後に静的な表示へ戻される）。
document.documentElement.setAttribute("data-ready", "");
// 打ち直す前の静的な行は、読み込みの幕と透明な窓（.window.pre）の裏にあるので、消して打ち直しても見えない。
boot().then(popWindow).then(() => setTimeout(runTerm, reduce ? 0 : 200));
