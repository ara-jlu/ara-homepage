import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("OGP の画像", () => {
  it("public/og.png は 1200×630 の PNG", () => {
    const png = readFileSync(resolve(import.meta.dirname, "../public/og.png"));
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    // IHDR の幅と高さ（16〜23 バイト目、ビッグエンディアン）
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });
});
