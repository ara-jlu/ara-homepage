import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "..");

describe("ビルド", () => {
  it("フィードが取れる版と取れない版の両方がビルドされる", () => {
    expect(existsSync(resolve(ROOT, "dist-test/index.html"))).toBe(true);
    expect(existsSync(resolve(ROOT, "dist-test-nofeed/index.html"))).toBe(true);
  });

  it("404 のページが出る", () => {
    expect(existsSync(resolve(ROOT, "dist-test/404.html"))).toBe(true);
  });
});
