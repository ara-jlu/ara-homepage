// ヒーローの窓の中身は、打ち込み終わった後の形で HTML にある（JS が無くても、検索エンジンにも読めるように）。
// 動きを減らす設定でないときだけ、見出しの h1 以外の行を消して、モックと同じ打鍵の演出で打ち直す。
// h1 は DOM から消さず、出番まで透明にしておき、モックの big の行と同じぼかしの演出で見せる。
import { reduce, sleep } from "./util";

type Step = { t: "cmd" | "out" | "big"; s: string } | { t: "motto" };

// モックの 610〜618 行目の台本と同じ文言（Hero.astro の静的な中身とも同じ）。
const script: Step[] = [
  { t: "cmd", s: "whoami" },
  { t: "out", s: "ara — engineer / AI" },
  { t: "cmd", s: "echo $MOTTO" },
  { t: "motto" },
  { t: "big", s: "人生を楽しみ、<em>一歩上へ</em>。" },
  { t: "cmd", s: "ls" },
  { t: "out", s: '<span class="hl">work/</span>    事務作業を仕組みで減らす事業\n<span class="hl">joifup/</span>  自分で毎日使っている記録のアプリ\n<span class="hl">blog/</span>    Notion で書いて静的に配信するブログ\n<span class="hl">writing/</span> ブログ・X・Zenn での発信' },
];

const GL = "!<>-_\\/[]{}—=+*^?#01";
const EASE = "cubic-bezier(.2,.8,.2,1)";

function scramble(el: { textContent: string | null }, final: string, dur = 700): Promise<void> {
  return new Promise((res) => {
    const t0 = performance.now();
    const chars = [...final];
    (function f() {
      const p = Math.min(1, (performance.now() - t0) / dur);
      el.textContent = chars.map((c, i) => (i / chars.length < p || c === " " ? c : GL[(Math.random() * GL.length) | 0])).join("");
      p < 1 ? requestAnimationFrame(f) : res();
    })();
  });
}

async function typeLine(el: Element, text: string, speed: number): Promise<void> {
  for (const ch of text) {
    el.textContent += ch;
    await sleep(speed + Math.random() * 35);
  }
}

const PROMPT = '<span class="p">ara@joifup</span>:<span class="hl">~</span>$ ';

export async function runTerm(): Promise<void> {
  if (reduce) return;
  const screenEl = document.getElementById("screen")!;
  const headline = document.getElementById("headline")!;
  for (const child of [...screenEl.children]) if (child !== headline) child.remove();
  headline.style.opacity = "0";
  let after = false; // 見出しより後の行は h1 の後ろに足す
  const place = (ln: HTMLElement) => (after ? screenEl.appendChild(ln) : screenEl.insertBefore(ln, headline));
  try {
    for (const step of script) {
      const ln = document.createElement("div");
      ln.className = "ln";
      if (step.t === "cmd") {
        ln.innerHTML = `${PROMPT}<span class="cmd"></span><span class="caret"></span>`;
        place(ln);
        await sleep(300);
        await typeLine(ln.querySelector(".cmd")!, step.s, 55);
        await sleep(220);
        ln.querySelector(".caret")!.remove();
      } else if (step.t === "motto") {
        ln.className = "ln out motto";
        ln.innerHTML = "En<b>jo</b>y L<b>if</b>e, One Step <b>Up</b>.";
        place(ln);
        ln.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
        await sleep(700);
        ln.classList.add("lit");
        const eq = document.createElement("div");
        eq.className = "ln out eq";
        eq.innerHTML = '<span class="part">jo</span> + <span class="part">if</span> + <span class="part">up</span> = <span class="name">joifup</span>';
        place(eq);
        for (const el of eq.querySelectorAll(".part,.name")) {
          el.animate([{ opacity: 0, transform: "translateY(-8px)" }, { opacity: 1, transform: "none" }], { duration: 450, easing: EASE });
          await sleep(220);
        }
        await sleep(300);
      } else if (step.t === "big") {
        headline.style.opacity = "";
        headline.animate([{ opacity: 0, filter: "blur(8px)", transform: "translateY(14px)" }, { opacity: 1, filter: "blur(0)", transform: "none" }], { duration: 900, easing: EASE });
        await sleep(600);
        after = true;
      } else {
        ln.className = "ln out";
        ln.innerHTML = step.s;
        place(ln);
        const first = ln.childNodes[0];
        if (first && first.nodeType === 3) {
          const text = first.textContent ?? "";
          await scramble({ set textContent(v: string | null) { first.textContent = v; } } as { textContent: string | null }, text, 500);
        } else {
          ln.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
          await sleep(250);
        }
      }
    }
    const end = document.createElement("div");
    end.className = "ln";
    end.innerHTML = `${PROMPT}<span class="caret"></span>`;
    screenEl.appendChild(end);
    // 打ち終わった印。テストはこれを待つ（打ち直す前の静的な中身と区別するため）。
    screenEl.dataset.typed = "";
  } finally {
    // 途中で失敗しても見出しを透明のまま残さない
    headline.style.opacity = "";
  }
}

export async function popWindow(): Promise<void> {
  const w = document.getElementById("win")!;
  if (reduce) {
    w.classList.remove("pre");
    return;
  }
  await sleep(750); // 読み込みの幕が上がり終わるのに合わせて始める
  const a = w.animate(
    [
      { transform: "scale(.02,.006)", opacity: 0, filter: "brightness(1.4)" },
      { transform: "scale(.02,.006)", opacity: 1, filter: "brightness(1.4)", offset: 0.08 },
      { transform: "scale(1.04,.006)", opacity: 1, filter: "brightness(1.2)", offset: 0.42 },
      { transform: "scale(1,1.03)", opacity: 1, filter: "brightness(1)", offset: 0.82 },
      { transform: "scale(1,1)", opacity: 1, filter: "brightness(1)" },
    ],
    { duration: 900, easing: EASE },
  );
  w.classList.remove("pre");
  await a.finished;
}
