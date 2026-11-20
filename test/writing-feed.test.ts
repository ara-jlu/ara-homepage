import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadWriting, parseFeed } from "../src/lib/writing-feed";

const FEED = readFileSync(resolve(import.meta.dirname, "fixtures/feed.xml"), "utf8");
const rss = (items: string) => `<?xml version="1.0"?><rss version="2.0"><channel><title>t</title>${items}</channel></rss>`;
const item = (title: string, link: string, date: string) => `<item><title>${title}</title><link>${link}</link><pubDate>${date}</pubDate></item>`;

describe("parseFeed", () => {
  it("新しい順に3件、blog の URL だけ、日付は JST", () => {
    expect(parseFeed(FEED)).toEqual([
      { title: "Q&A の記事", url: "https://blog.joifup.com/qa", date: "2026-11-17" },
      { title: "CDATA の記事 & 記号", url: "https://blog.joifup.com/cdata", date: "2026-11-15" },
      { title: "真ん中の記事", url: "https://blog.joifup.com/mid", date: "2026-11-10" },
    ]);
  });

  it("項目が1つでも配列として読む", () => {
    expect(parseFeed(rss(item("一つ", "https://blog.joifup.com/a", "Tue, 17 Nov 2026 00:00:00 +0900")))).toHaveLength(1);
  });

  it("3件未満ならあるだけ返す、0件なら空", () => {
    expect(parseFeed(rss(""))).toEqual([]);
  });

  it("題・URL・日付のどれかが欠けた項目、日付が読めない項目は捨てる", () => {
    const xml = rss(
      item("", "https://blog.joifup.com/a", "Tue, 17 Nov 2026 00:00:00 +0900") +
        item("日付なし", "https://blog.joifup.com/b", "not a date") +
        item("正しい", "https://blog.joifup.com/c", "Tue, 17 Nov 2026 00:00:00 +0900"),
    );
    expect(parseFeed(xml).map((i) => i.title)).toEqual(["正しい"]);
  });

  it("blog のホストに見せかけた URL を捨てる", () => {
    const xml = rss(item("偽", "https://blog.joifup.com.evil.example/x", "Tue, 17 Nov 2026 00:00:00 +0900"));
    expect(parseFeed(xml)).toEqual([]);
  });

  it("壊れた XML は invalid xml を投げる", () => {
    expect(() => parseFeed("<rss><channel><item>")).toThrow("invalid xml");
  });

  it("UTC では前の日でも JST の日付にする", () => {
    const xml = rss(item("朝", "https://blog.joifup.com/a", "Mon, 16 Nov 2026 16:30:00 GMT"));
    expect(parseFeed(xml)[0].date).toBe("2026-11-17");
  });
});

describe("loadWriting", () => {
  const report = () => join(mkdtempSync(join(tmpdir(), "wf-")), "report.json");
  afterEach(() => vi.unstubAllGlobals());

  it("取れたら項目を返し、件数を報告に書く", async () => {
    vi.stubGlobal("fetch", async () => new Response(FEED, { status: 200 }));
    const path = report();
    const result = await loadWriting({ url: "https://feed.test/rss.xml", reportPath: path });
    expect(result.items).toHaveLength(3);
    expect(result.reason).toBeNull();
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual({ count: 3, reason: null });
  });

  it.each([
    ["HTTP のエラー", async () => new Response("x", { status: 503 }), "http 503"],
    ["通信の失敗", async () => { throw new TypeError("network"); }, "fetch failed"],
    ["壊れた XML", async () => new Response("<rss>", { status: 200 }), "invalid xml"],
    ["0件", async () => new Response(rss(""), { status: 200 }), "no items"],
  ])("%s なら空の一覧と理由を返し、例外を投げない", async (_label, impl, reason) => {
    vi.stubGlobal("fetch", impl);
    const path = report();
    const result = await loadWriting({ url: "https://feed.test/rss.xml", reportPath: path });
    expect(result).toEqual({ items: [], reason });
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual({ count: 0, reason });
  });
});
