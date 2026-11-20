import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const ROOT = resolve(import.meta.dirname, "..");
const FEED = readFileSync(resolve(ROOT, "test/fixtures/feed.xml"));

// フィードを配るサーバー。/rss.xml は固定のフィード、/broken は 500 を返す。
// ビルドは非同期で走らせる（同期の子プロセスだとこのサーバーが応答できない）。
export default async function setup(): Promise<void> {
  const server = createServer((req, res) => {
    if (req.url === "/rss.xml") res.writeHead(200, { "Content-Type": "application/rss+xml" }).end(FEED);
    else res.writeHead(500).end();
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const build = (outDir: string, feed: string, report: string) =>
    run("npx", ["astro", "build"], {
      cwd: ROOT,
      env: { ...process.env, ASTRO_OUT_DIR: outDir, WRITING_FEED_URL: feed, WRITING_REPORT_PATH: report },
      maxBuffer: 64 * 1024 * 1024,
    });
  try {
    await build("./dist-test", `${base}/rss.xml`, "./writing-report.test.json");
    await build("./dist-test-nofeed", `${base}/broken`, "./writing-report.nofeed.json");
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
}
