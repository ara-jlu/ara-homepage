// ビルドのときに blog の RSS を読み、「最近書いたもの」に並べる項目を作る。
// 取れなくてもビルドは止めない。代わりに件数と理由を報告のファイルに書き、デプロイの通知で気づけるようにする。
import { writeFileSync } from "node:fs";
import { XMLParser, XMLValidator } from "fast-xml-parser";

export type WritingItem = { title: string; url: string; date: string };
export type WritingResult = { items: WritingItem[]; reason: string | null };

const DEFAULT_FEED_URL = "https://blog.joifup.com/rss.xml";
const BLOG_ORIGIN = "https://blog.joifup.com";
const LIMIT = 3;
const TIMEOUT_MS = 10_000;

// sv-SE の書式は YYYY-MM-DD になる。
const JST_DATE = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" });

// フィードの中身をそのままリンクにしない。blog の上のページだけを許す。
function blogUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value.trim());
    return url.origin === BLOG_ORIGIN ? url.href : null;
  } catch {
    return null;
  }
}

export function parseFeed(xml: string): WritingItem[] {
  if (XMLValidator.validate(xml) !== true) throw new Error("invalid xml");
  const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false, isArray: (name) => name === "item" });
  const doc = parser.parse(xml) as { rss?: { channel?: { item?: unknown[] } } };
  const raw = doc.rss?.channel?.item ?? [];
  const items: { title: string; url: string; time: number }[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue;
    const { title, link, pubDate } = entry as Record<string, unknown>;
    const url = blogUrl(link);
    const time = typeof pubDate === "string" ? Date.parse(pubDate) : Number.NaN;
    if (typeof title !== "string" || title.trim() === "" || url === null || Number.isNaN(time)) continue;
    items.push({ title: title.trim(), url, time });
  }
  return items
    .sort((a, b) => b.time - a.time)
    .slice(0, LIMIT)
    .map(({ title, url, time }) => ({ title, url, date: JST_DATE.format(new Date(time)) }));
}

async function fetchItems(url: string): Promise<WritingResult> {
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    return { items: [], reason: "fetch failed" };
  }
  if (!res.ok) return { items: [], reason: `http ${res.status}` };
  let items: WritingItem[];
  try {
    items = parseFeed(await res.text());
  } catch {
    return { items: [], reason: "invalid xml" };
  }
  return items.length === 0 ? { items, reason: "no items" } : { items, reason: null };
}

export async function loadWriting(options: { url?: string; reportPath?: string } = {}): Promise<WritingResult> {
  const url = options.url ?? process.env.WRITING_FEED_URL ?? DEFAULT_FEED_URL;
  const reportPath = options.reportPath ?? process.env.WRITING_REPORT_PATH ?? "writing-report.json";
  const result = await fetchItems(url);
  writeFileSync(reportPath, JSON.stringify({ count: result.items.length, reason: result.reason }));
  if (result.reason !== null) console.warn(`writing: 最近書いたものを出さない (${result.reason})`);
  return result;
}
