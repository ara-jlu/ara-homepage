import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker, { type Env } from "../worker/index";

const URL_ = "https://joifup.com/api/contact";
const ORIGIN = "https://joifup.com";

type Call = { url: string; init: RequestInit };

function env(over: Partial<Env> = {}): Env {
  return {
    ASSETS: { fetch: async () => new Response("asset", { status: 404 }) },
    TURNSTILE_SECRET_KEY: "ts-secret",
    RESEND_API_KEY: "re-secret",
    ...over,
  };
}

const valid = { name: "田中 太郎", email: "taro@example.co.jp", kind: "automation", message: "請求書の転記を\n減らしたい", token: "tok" };

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(URL_, {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json", Origin: ORIGIN, ...headers },
  });
}

let calls: Call[];
let turnstile: () => Response | Promise<Response>;
let resend: () => Response | Promise<Response>;

beforeEach(() => {
  calls = [];
  turnstile = () => Response.json({ success: true });
  resend = () => Response.json({ id: "x" });
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return url.includes("siteverify") ? turnstile() : resend();
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const resendCalls = () => calls.filter((c) => c.url === "https://api.resend.com/emails");
const sent = () => JSON.parse(resendCalls()[0].init.body as string);

describe("POST /api/contact の検査", () => {
  it("POST 以外は 405", async () => {
    const res = await worker.fetch(new Request(URL_), env());
    expect(res.status).toBe(405);
    expect(res.headers.get("Allow")).toBe("POST");
  });

  it("Origin が無い・違うと 403 origin で、外へ通信しない", async () => {
    const none = new Request(URL_, { method: "POST", body: JSON.stringify(valid), headers: { "Content-Type": "application/json" } });
    for (const req of [none, post(valid, { Origin: "https://evil.example" })]) {
      const res = await worker.fetch(req, env());
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "origin" });
    }
    expect(calls).toHaveLength(0);
  });

  it("JSON でない Content-Type は 415", async () => {
    const res = await worker.fetch(post(valid, { "Content-Type": "text/plain" }), env());
    expect(res.status).toBe(415);
  });

  it("16KB を超える本文は 413", async () => {
    const res = await worker.fetch(post(JSON.stringify({ ...valid, message: "あ".repeat(6000) })), env());
    expect(res.status).toBe(413);
    expect(calls).toHaveLength(0);
  });

  it.each([
    ["壊れた JSON", "{"],
    ["配列", "[]"],
    ["名前が空", { ...valid, name: " " }],
    ["名前が長すぎる", { ...valid, name: "あ".repeat(101) }],
    ["メールの形が違う", { ...valid, email: "taro" }],
    ["種類が3つの値以外", { ...valid, kind: "sales" }],
    ["種類が無い", { ...valid, kind: undefined }],
    ["内容が空", { ...valid, message: "  " }],
    ["内容が長すぎる", { ...valid, message: "あ".repeat(4001) }],
    ["トークンが無い", { ...valid, token: "" }],
  ])("%s は 400 invalid で、外へ通信しない", async (_label, body) => {
    const res = await worker.fetch(post(body), env());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid" });
    expect(calls).toHaveLength(0);
  });

  it("秘密が無ければ 503 send で、外へ通信しない", async () => {
    const res = await worker.fetch(post(valid), env({ RESEND_API_KEY: undefined }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "send" });
    expect(calls).toHaveLength(0);
  });

  it("Turnstile が落とすか通信に失敗すると 403 challenge で、Resend を呼ばない", async () => {
    for (const impl of [() => Response.json({ success: false, "error-codes": ["invalid-input-response"] }), () => { throw new Error("down"); }]) {
      calls = [];
      turnstile = impl as () => Response;
      vi.spyOn(console, "error").mockImplementation(() => {});
      const res = await worker.fetch(post(valid), env());
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "challenge" });
      expect(resendCalls()).toHaveLength(0);
    }
  });

  it("Resend が 2xx でないか通信に失敗すると 502 send", async () => {
    for (const impl of [() => new Response("no", { status: 500 }), () => { throw new Error("down"); }]) {
      calls = [];
      resend = impl as () => Response;
      vi.spyOn(console, "error").mockImplementation(() => {});
      const res = await worker.fetch(post(valid), env());
      expect(res.status).toBe(502);
      expect(await res.json()).toEqual({ error: "send" });
    }
  });
});

describe("送るメール", () => {
  it("成功で 200 を返し、Turnstile の後に Resend を1回呼ぶ", async () => {
    const res = await worker.fetch(post(valid), env());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(calls.map((c) => (c.url.includes("siteverify") ? "ts" : "re"))).toEqual(["ts", "re"]);
  });

  it("宛先・差出人・Reply-To・件名・本文が決めたとおりで、HTML を送らない", async () => {
    await worker.fetch(post(valid), env());
    const mail = sent();
    expect(mail.to).toEqual(["contact@joifup.com"]);
    expect(mail.from).toBe("サイトの相談フォーム <form@joifup.com>");
    expect(mail.reply_to).toBe("taro@example.co.jp");
    expect(mail.subject).toBe("サイトからの相談（業務の自動化のご相談）: 田中 太郎");
    expect(mail.text).toBe("お名前: 田中 太郎\nメール: taro@example.co.jp\nご相談の種類: 業務の自動化のご相談\n\nご相談の内容:\n請求書の転記を\n減らしたい");
    expect(mail.html).toBeUndefined();
  });

  it("名前の改行と不可視の文字は件名と本文で取り除く", async () => {
    await worker.fetch(post({ ...valid, name: "田中\n太郎​" }), env());
    expect(sent().subject).toBe("サイトからの相談（業務の自動化のご相談）: 田中太郎");
    expect(sent().text.startsWith("お名前: 田中太郎\n")).toBe(true);
  });

  it("ログに入力の値とトークンと秘密が出ない", async () => {
    const logs: string[] = [];
    vi.spyOn(console, "error").mockImplementation((...a) => void logs.push(a.join(" ")));
    turnstile = () => Response.json({ success: false, "error-codes": ["timeout-or-duplicate"] });
    await worker.fetch(post(valid), env());
    const all = logs.join("\n");
    for (const secret of ["田中", "taro@example", "請求書", "tok", "ts-secret", "re-secret"]) expect(all).not.toContain(secret);
    expect(all).toContain("timeout-or-duplicate");
  });
});

describe("経路とヘッダ", () => {
  it("/api/contact 以外はアセットへ渡す", async () => {
    const res = await worker.fetch(new Request("https://joifup.com/nope"), env());
    expect(await res.text()).toBe("asset");
  });

  it("Worker が返す応答（404 と API）にもセキュリティのヘッダを付ける", async () => {
    for (const req of [new Request("https://joifup.com/nope"), post(valid)]) {
      const res = await worker.fetch(req, env());
      expect(res.headers.get("Content-Security-Policy")).toContain("default-src 'self'");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    }
  });
});
