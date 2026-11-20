// scripts/og/og.html を 1200×630 で撮り、public/og.png に書く。画像を直したいときだけ手で回す（ビルドのたびには作らない）。
import { chromium } from "playwright";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(resolve(root, "scripts/og/og.html")).href);
await page.evaluate(() => document.fonts.ready);
// 書体の読み込み結果を報告する。Google Fonts に届かないと代替書体で撮れてしまうので、作り直すときはここが true か見る
const fonts = await page.evaluate(() => ({
  mono: document.fonts.check('500 26px "JetBrains Mono"'),
  jp: document.fonts.check('900 76px "Noto Sans JP"', "人生"),
  loaded: [...document.fonts].filter((f) => f.status === "loaded").length,
}));
console.log("fonts", JSON.stringify(fonts));
await page.screenshot({ path: resolve(root, "public/og.png") });
await browser.close();
