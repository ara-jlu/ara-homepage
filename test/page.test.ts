import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse, type HTMLElement } from "node-html-parser";
import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "..");
const read = (p: string) => readFileSync(resolve(ROOT, p), "utf8");
const built = parse(read("dist-test/index.html"));
const nofeed = parse(read("dist-test-nofeed/index.html"));
const mockSrc = read("mock/index.html");
const mock = parse(mockSrc);

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

// 本文のテキストの断片（テキストのノードごと）を集める。script と style は除く。
function texts(root: HTMLElement, skip: (el: HTMLElement) => boolean): string[] {
  const out: string[] = [];
  const walk = (node: HTMLElement) => {
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        const t = norm(child.text);
        if (t) out.push(t);
      } else if (child.nodeType === 1) {
        const el = child as HTMLElement;
        if (["script", "style"].includes(el.tagName?.toLowerCase())) continue;
        if (skip(el)) continue;
        walk(el);
      }
    }
  };
  walk(root.querySelector("body")!);
  return out;
}

describe("ページの骨格", () => {
  it("全部の節がある", () => {
    for (const id of ["top", "works", "writing", "about", "contact"]) expect(built.querySelector(`#${id}`)).not.toBeNull();
  });

  it("h1 はちょうど1つで、軸の見出し", () => {
    const h1 = built.querySelectorAll("h1");
    expect(h1).toHaveLength(1);
    expect(norm(h1[0].text)).toBe("人生を楽しみ、一歩上へ。");
  });

  it("src の無い script とインラインのイベントハンドラが無い", () => {
    for (const s of built.querySelectorAll("script")) expect(s.getAttribute("src")).toBeTruthy();
    expect(read("dist-test/index.html")).not.toMatch(/\son[a-z]+\s*=/i);
  });

  it("問い合わせの送信ボタンは、JS が使えるようにするまで押せない（JS が無いと静的なアセットへ POST されて内容が消えるため）", () => {
    expect(built.querySelector('#contact-form button[type="submit"]')!.hasAttribute("disabled")).toBe(true);
  });

  it("文言を CSS で隠す要素が無い", () => {
    expect(read("dist-test/index.html")).not.toMatch(/visually-hidden|sr-only/);
  });

  it("js-flag.js を head で同期に読む", () => {
    const s = built.querySelector('head script[src="/js-flag.js"]');
    expect(s).not.toBeNull();
    expect(s!.hasAttribute("async") || s!.hasAttribute("defer") || s!.getAttribute("type") === "module").toBe(false);
  });

  it("OGP と canonical がある", () => {
    const meta = (p: string) => built.querySelector(`meta[property="${p}"], meta[name="${p}"]`)?.getAttribute("content");
    expect(meta("og:title")).toBe("アラ | joifup.com");
    expect(meta("og:url")).toBe("https://joifup.com/");
    expect(meta("og:image")).toBe("https://joifup.com/og.png");
    expect(meta("twitter:card")).toBe("summary_large_image");
    expect(built.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://joifup.com/");
  });
});

describe("最近書いたもの", () => {
  it("フィードの上位3件を blog として並べる", () => {
    const rows = built.querySelectorAll("#writing .log a");
    expect(rows.map((a) => a.getAttribute("href"))).toEqual(["https://blog.joifup.com/qa", "https://blog.joifup.com/cdata", "https://blog.joifup.com/mid"]);
    expect(rows.map((a) => norm(a.querySelector(".tt")!.text))).toEqual(["Q&A の記事", "CDATA の記事 & 記号", "真ん中の記事"]);
    expect(rows.map((a) => a.querySelector("time")!.text)).toEqual(["2026-11-17", "2026-11-15", "2026-11-10"]);
    expect(rows.every((a) => a.querySelector(".src")!.text === "blog")).toBe(true);
  });

  it("フィードが取れないと一覧の箱を出さず、リンクのボタンは出す", () => {
    expect(nofeed.querySelector("#writing .log")).toBeNull();
    expect(nofeed.querySelectorAll("#writing .more a")).toHaveLength(3);
    expect(JSON.parse(read("writing-report.nofeed.json"))).toEqual({ count: 0, reason: "http 500" });
  });
});

describe("モックとの突き合わせ", () => {
  // モックの本文と、ビルドの出力の本文を、テキストの断片の集合として比べる。
  // 除外は3箇所だけ（件数を数えて確かめる）:
  //  1. 「最近書いたもの」の一覧（.log）— モックは X の記事の見本、本番は RSS から作る
  //  2. フォームの完了の文言（.done）— モックは「モックなので…」、本番は送信済みの案内
  //  3. ヒーローの #screen と流れる帯 — モックでは JS が出すので、下の別のテストで正解と比べる
  const EXCLUDE = (el: HTMLElement) =>
    el.classList?.contains("log") || el.classList?.contains("done") || el.id === "screen" || el.classList?.contains("mtrack");

  it("除外は3種類で、それ以外の文言はモックと一致する", () => {
    const kinds = new Set<string>();
    const skip = (el: HTMLElement) => {
      if (!EXCLUDE(el)) return false;
      kinds.add(el.id === "screen" || el.classList.contains("mtrack") ? "js" : el.classList.contains("log") ? "log" : "done");
      return true;
    };
    const fromMock = new Set(texts(mock, skip));
    const fromBuilt = new Set(texts(built, skip));
    expect([...kinds].sort()).toEqual(["done", "js", "log"]);
    expect([...fromBuilt].filter((t) => !fromMock.has(t))).toEqual([]);
    expect([...fromMock].filter((t) => !fromBuilt.has(t))).toEqual([]);
  });

  // モックのスクリプトの打鍵の台本（script の配列）と同じ文言。モックの側にあることも確かめる。
  const HERO = [
    "ara@joifup:~$ whoami",
    "ara — engineer / AI",
    "ara@joifup:~$ echo $MOTTO",
    "Enjoy Life, One Step Up.",
    "jo + if + up = joifup",
    "人生を楽しみ、一歩上へ。",
    "ara@joifup:~$ ls",
    "work/ 事務作業を仕組みで減らす事業 joifup/ 自分で毎日使っている記録のアプリ blog/ Notion で書いて静的に配信するブログ writing/ ブログ・X・Zenn での発信",
    "ara@joifup:~$",
  ];

  it("ヒーローの文言が打ち込み終わった後の形で静的にある", () => {
    const lines = built.querySelectorAll("#screen > .ln").map((l) => norm(l.text));
    expect(lines).toEqual(HERO);
    for (const s of ["ara — engineer / AI", "事務作業を仕組みで減らす事業", "人生を楽しみ、<em>一歩上へ</em>。", "En<b>jo</b>y L<b>if</b>e, One Step <b>Up</b>."]) expect(mockSrc).toContain(s);
  });

  it("ヒーローの ls の出力が改行つきのまま出力にある（compressHTML: false の番人）", () => {
    expect(read("dist-test/index.html")).toContain('事務作業を仕組みで減らす事業\n<span class="hl">joifup/</span>');
  });

  it("流れる帯の文言がモックの配列と同じで、静的にある", () => {
    const a = ["AUTOMATION", "DEVELOPMENT", "WRITING", "ENJOY LIFE, ONE STEP UP"];
    const b = ["TypeScript", "Python", "PHP", "Java", "Next.js", "Laravel", "PostgreSQL", "Google Cloud", "Cloudflare", "Terraform", "Docker", "n8n"];
    expect(built.querySelectorAll("#mq1 span").map((s) => s.text)).toEqual(a);
    expect(built.querySelectorAll("#mq2 span").map((s) => s.text)).toEqual(b);
    expect(mockSrc).toContain(a.map((x) => `'${x}'`).join(","));
    expect(mockSrc).toContain(b.map((x) => `'${x}'`).join(","));
  });
});

describe("404", () => {
  const page = parse(read("dist-test/404.html"));

  it("トップへのリンクがある", () => {
    expect(page.querySelector('a[href="/"]')).not.toBeNull();
  });

  it("src の無い script とインラインのイベントハンドラが無い", () => {
    for (const s of page.querySelectorAll("script")) expect(s.getAttribute("src")).toBeTruthy();
    expect(read("dist-test/404.html")).not.toMatch(/\son[a-z]+\s*=/i);
  });

  it("本体のスクリプトと読み込みの幕を持たない", () => {
    expect(page.querySelectorAll("script")).toHaveLength(0);
    expect(page.querySelector("body")!.classList.contains("loading")).toBe(false);
  });

  it("検索に載せず、canonical と og:url を持たない", () => {
    expect(page.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex");
    expect(page.querySelector('link[rel="canonical"]')).toBeNull();
    expect(page.querySelector('meta[property="og:url"]')).toBeNull();
  });
});
