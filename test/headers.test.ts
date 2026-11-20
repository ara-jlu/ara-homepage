import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS } from "../src/security-headers";

// public/_headers の "/*" の節を読み、Worker が付ける値と同じかを確かめる（片方だけ直して食い違うのを防ぐ）。
function headersForAll(): Record<string, string> {
  const lines = readFileSync(resolve(import.meta.dirname, "../public/_headers"), "utf8").split("\n");
  const out: Record<string, string> = {};
  let inAll = false;
  for (const line of lines) {
    if (!line.startsWith(" ") && line.trim() !== "") inAll = line.trim() === "/*";
    else if (inAll && line.trim()) {
      const i = line.indexOf(":");
      out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return out;
}

describe("セキュリティのヘッダ", () => {
  it("_headers と Worker の値が一致する", () => {
    expect(headersForAll()).toEqual({ ...SECURITY_HEADERS });
  });

  it("HSTS は1年で、includeSubDomains と preload を含めない", () => {
    expect(SECURITY_HEADERS["Strict-Transport-Security"]).toBe("max-age=31536000");
  });

  it("CSP は決めた値", () => {
    expect(SECURITY_HEADERS["Content-Security-Policy"]).toBe(
      "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; frame-src https://challenges.cloudflare.com; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
    );
  });
});
