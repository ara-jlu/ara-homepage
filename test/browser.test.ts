import { resolve } from "node:path";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { serveDir } from "./support/serve";

const DIST = resolve(import.meta.dirname, "../dist-test");
let browser: Browser;
let site: { url: string; close(): Promise<void> };
// テストごとに開いたコンテキストは、そのテストの後に閉じる（次のテストへ持ち越さない）。
const contexts: BrowserContext[] = [];
// ページの中で投げられた例外（pageerror）を集める。テストごとに空にする。
const errors: Error[] = [];

beforeAll(async () => {
  browser = await chromium.launch();
  site = await serveDir(DIST);
});
afterEach(async () => {
  await Promise.all(contexts.splice(0).map((c) => c.close()));
  errors.length = 0;
});
afterAll(async () => {
  await browser.close();
  await site.close();
});

// 外の通信（書体・Turnstile）は止めて、テストを手元だけで完結させる。
async function open(opts: { js?: boolean; reduce?: boolean; blockMain?: boolean; width?: number; path?: string } = {}): Promise<Page> {
  const ctx = await browser.newContext({
    javaScriptEnabled: opts.js ?? true,
    reducedMotion: opts.reduce ? "reduce" : "no-preference",
    viewport: { width: opts.width ?? 1440, height: 900 },
  });
  contexts.push(ctx);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e));
  await page.route(/^https:\/\//, (r) => r.abort());
  if (opts.blockMain) await page.route(/\/_astro\/.*\.js$/, (r) => r.fulfill({ status: 404, body: "" }));
  await page.goto(site.url + (opts.path ?? "/"));
  return page;
}

const visible = (page: Page, sel: string) =>
  page.$eval(sel, (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.opacity === "1" && s.visibility !== "hidden" && r.width > 0 && r.height > 0;
  });

async function readable(page: Page) {
  expect(await visible(page, "#headline")).toBe(true);
  expect(await visible(page, "#win")).toBe(true);
  for (const id of ["works", "writing", "about"]) {
    expect(await page.$eval(`#${id} .mask > span`, (el) => getComputedStyle(el).transform)).toBe("none");
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  // 横に流れる展示の全部のパネルが、画面の幅の中に縦に並ぶ
  const boxes = await page.$$eval("#htrack > .panel", (els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ left: r.left, right: r.right })));
  expect(boxes.length).toBe(5);
  for (const b of boxes) {
    expect(b.left).toBeGreaterThanOrEqual(0);
    expect(b.right).toBeLessThanOrEqual(1440);
  }
}

describe("JS が無い・失敗したとき", () => {
  it("JS を切っても、見出し・窓・各節が見え、下までスクロールでき、WORKS の全部が見える", async () => {
    const page = await open({ js: false });
    await readable(page);
  });

  it("本体のスクリプトだけが動かなくても、5秒後には同じように読める", async () => {
    const page = await open({ blockMain: true });
    await page.waitForFunction(() => !document.documentElement.classList.contains("js"), null, { timeout: 8000 });
    await readable(page);
  });
});

describe("JS が動くとき", () => {
  it("本体が data-ready を付け、打鍵が終わると見出しが同じ文言で見える", async () => {
    const page = await open();
    expect(await page.evaluate(() => document.documentElement.classList.contains("js"))).toBe(true);
    await page.waitForFunction(() => document.documentElement.hasAttribute("data-ready"));
    // 打鍵の途中でも h1 は DOM から消えない
    expect(await page.$$eval("h1", (els) => els.length)).toBe(1);
    // 打ち直しの途中で、見出しが透明になっていることを確かめる（静的な中身のままではない）
    await page.waitForFunction(() => getComputedStyle(document.querySelector("#headline")!).opacity === "0", null, { timeout: 10_000 });
    await page.waitForSelector("#screen[data-typed]", { timeout: 20_000 });
    expect(await visible(page, "#headline")).toBe(true);
    expect(await page.$eval("#headline", (el) => el.textContent)).toBe("人生を楽しみ、一歩上へ。");
    expect(await page.$$eval("#screen > .ln", (els) => els.length)).toBe(9);
  });

  it("流れる帯は JS が中身を複製して流す", async () => {
    const page = await open();
    await page.waitForFunction(() => document.documentElement.hasAttribute("data-ready"));
    expect(await page.$$eval("#mq1 span", (els) => els.length)).toBe(8);
  });
});

describe("動きを減らす設定", () => {
  it("幕を出さず、WORKS の盤面のカードと流れの図が見える", async () => {
    const page = await open({ reduce: true });
    await page.waitForFunction(() => document.documentElement.hasAttribute("data-ready"));
    expect(await page.$("#boot")).toBeNull();
    for (const sel of [".jf-card", ".flow .node"]) {
      expect(await page.$$eval(sel, (els) => els.every((e) => getComputedStyle(e).opacity === "1"))).toBe(true);
    }
    expect(await visible(page, "#headline")).toBe(true);
  });
});

describe("404", () => {
  it("例外を投げず、読み込みの幕もスクロールの止めも無い", async () => {
    const page = await open({ path: "/404" });
    await page.waitForTimeout(300);
    expect(errors.map((e) => e.message)).toEqual([]);
    expect(await page.evaluate(() => document.body.classList.contains("loading"))).toBe(false);
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe("hidden");
  });
});

describe("テスト用のサーバー", () => {
  it("壊れたパーセントの符号には 400 を返す", async () => {
    const res = await fetch(site.url + "/%E0%A4%A", { signal: AbortSignal.timeout(3000) });
    expect(res.status).toBe(400);
  });
});
