// /api/contact だけを受け、それ以外は静的なアセットに渡す。
// アセットに当たらないパス（404）も Worker を通るので、Worker が返す応答にはここでセキュリティのヘッダを付ける。
import { CONTACT_PATH } from "../src/scripts/contact-api";
import { SECURITY_HEADERS } from "../src/security-headers";
import { handleContact, type ContactEnv } from "./contact";

export interface Env extends ContactEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

function withSecurityHeaders(res: Response): Response {
  const out = new Response(res.body, res);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) if (!out.headers.has(name)) out.headers.set(name, value);
  return out;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    const res = pathname === CONTACT_PATH ? await handleContact(request, env) : await env.ASSETS.fetch(request);
    return withSecurityHeaders(res);
  },
};
