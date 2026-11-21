// 静的なアセットには public/_headers が付ける。Worker が返す応答（404 と /api/contact）には _headers が効かないので、Worker が同じ値を付ける。
// 2箇所の値が同じであることは test/headers.test.ts が確かめる。
export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; frame-src https://challenges.cloudflare.com; connect-src 'self' https://cloudflareinsights.com; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // joifup.com のゾーンには別のサービスのサブドメインもあるので、includeSubDomains と preload は付けない（そちらの HTTPS の都合を縛らない）
  "Strict-Transport-Security": "max-age=31536000",
};
