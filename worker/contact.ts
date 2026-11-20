// 問い合わせの受け口。Turnstile で判定してから Resend でメールを1通送る。内容は保存しない。
// ログには状態と Turnstile の理由のコードだけを出し、入力・トークン・秘密は出さない。
import { CONTACT_KINDS, CONTACT_LIMITS, isContactEmail, isContactKind, type ContactKind } from "../src/scripts/contact-api";
import { readCapped } from "./shared";

export interface ContactEnv {
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
}

const MAX_BODY = 16 * 1024;
const MAX_TOKEN = 4096;
const TIMEOUT_MS = 10_000;
const TO = "contact@joifup.com";
const FROM = "サイトの相談フォーム <form@joifup.com>";
const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RESEND = "https://api.resend.com/emails";

// 件名と1行の欄から除く文字: 制御文字・書式文字（ゼロ幅・方向指定）・行区切りと段落区切り。
const LINE_STRIP = /[\p{C}\p{Zl}\p{Zp}]/gu;
const oneLine = (value: string): string => value.replace(LINE_STRIP, "");
const within = (value: string, limit: number): boolean => Array.from(value).length <= limit;

const reply = (status: number, body: object): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

type Inquiry = { name: string; email: string; kind: ContactKind; message: string; token: string };

function parse(body: unknown): Inquiry | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const { name, email, kind, message, token } = body as Record<string, unknown>;
  if (typeof name !== "string" || oneLine(name).trim() === "" || !within(name, CONTACT_LIMITS.name)) return null;
  if (!isContactEmail(email)) return null;
  if (!isContactKind(kind)) return null;
  if (typeof message !== "string" || message.trim() === "" || !within(message, CONTACT_LIMITS.message)) return null;
  if (typeof token !== "string" || token === "" || token.length > MAX_TOKEN) return null;
  return { name: oneLine(name).trim(), email, kind, message: message.trim(), token };
}

function mailText(i: Inquiry): string {
  // 利用者が自由に書ける内容は最後に置く。上の行を本文から偽装できないようにするため。
  return [`お名前: ${i.name}`, `メール: ${i.email}`, `ご相談の種類: ${CONTACT_KINDS[i.kind]}`, "", "ご相談の内容:", i.message].join("\n");
}

async function verified(token: string, secret: string): Promise<boolean> {
  try {
    const res = await fetch(SITEVERIFY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = (await res.json()) as { success?: unknown; "error-codes"?: unknown };
    if (data.success === true) return true;
    const codes = Array.isArray(data["error-codes"]) ? data["error-codes"].filter((c): c is string => typeof c === "string") : [];
    console.error("contact: siteverify failed", codes);
    return false;
  } catch {
    console.error("contact: siteverify request failed");
    return false;
  }
}

async function send(i: Inquiry, key: string): Promise<boolean> {
  try {
    const res = await fetch(RESEND, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: i.email,
        subject: `サイトからの相談（${CONTACT_KINDS[i.kind]}）: ${i.name}`,
        text: mailText(i),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) console.error(`contact: resend responded ${res.status}`);
    return res.ok;
  } catch {
    console.error("contact: resend request failed");
    return false;
  }
}

export async function handleContact(request: Request, env: ContactEnv): Promise<Response> {
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST" } });
  if (request.headers.get("Origin") !== new URL(request.url).origin) return reply(403, { error: "origin" });
  if (!(request.headers.get("Content-Type") ?? "").toLowerCase().startsWith("application/json")) return reply(415, { error: "invalid" });
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BODY) return reply(413, { error: "invalid" });

  let text: string | null;
  try {
    text = await readCapped(request, MAX_BODY);
  } catch {
    return reply(400, { error: "invalid" });
  }
  if (text === null) return reply(request.body === null ? 400 : 413, { error: "invalid" });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return reply(400, { error: "invalid" });
  }
  const inquiry = parse(body);
  if (inquiry === null) return reply(400, { error: "invalid" });

  if (!env.TURNSTILE_SECRET_KEY || !env.RESEND_API_KEY) return reply(503, { error: "send" });
  if (!(await verified(inquiry.token, env.TURNSTILE_SECRET_KEY))) return reply(403, { error: "challenge" });
  if (!(await send(inquiry, env.RESEND_API_KEY))) return reply(502, { error: "send" });
  return reply(200, { ok: true });
}
