// 問い合わせのフォーム。Turnstile の確認を通してから /api/contact に JSON で送る。
// 失敗の文言は JS で差し込む（静的な HTML には置かない）。失敗の後は Turnstile を出し直す（トークンは1回しか使えないため）。
import { CONTACT_PATH } from "./contact-api";

type Turnstile = {
  render(el: HTMLElement, opts: { sitekey: string; theme: "dark" }): string;
  getResponse(id: string): string | undefined;
  reset(id: string): void;
};
declare global {
  interface Window { turnstile?: Turnstile }
}

const MESSAGES: Record<string, string> = {
  invalid: "入力の内容を確かめてください。",
  challenge: "確認に失敗しました。もう一度お試しください。",
};
const FALLBACK = "送信できませんでした。時間をおいてお試しください。";

export function errorMessage(code: unknown): string {
  const head = typeof code === "string" && Object.hasOwn(MESSAGES, code) ? MESSAGES[code] : FALLBACK;
  return `${head} X の DM でも受け付けています。`;
}

// Turnstile のスクリプトは async で読むので、読み終わるまで待ってから描く。
// 読み込みが止められた（広告ブロックなど）ときに見張りを回し続けないよう、limitMs で諦めて null を返す。
export function whenTurnstile(limitMs = 30_000): Promise<Turnstile | null> {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const tick = () => {
      if (window.turnstile) resolve(window.turnstile);
      else if (Date.now() - t0 >= limitMs) resolve(null);
      else setTimeout(tick, 100);
    };
    tick();
  });
}

export function initContactForm(): void {
  const form = document.getElementById("contact-form") as HTMLFormElement | null;
  const box = document.getElementById("turnstile");
  const errorEl = document.getElementById("contact-error");
  const button = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!form || !box || !errorEl || !button) return;
  const sitekey = box.dataset.sitekey ?? "";
  let widget: string | null = null;
  let ts: Turnstile | null = null;
  if (sitekey)
    void whenTurnstile().then((t) => {
      if (!t) return;
      ts = t;
      widget = t.render(box, { sitekey, theme: "dark" });
    });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (button.disabled) return;
    errorEl.textContent = "";
    const token = ts && widget !== null ? ts.getResponse(widget) : undefined;
    if (!token) {
      errorEl.textContent = errorMessage("challenge");
      return;
    }
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      kind: String(data.get("kind") ?? ""),
      message: String(data.get("message") ?? ""),
      token,
    };
    button.disabled = true;
    try {
      const res = await fetch(CONTACT_PATH, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        form.classList.add("sent");
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: unknown };
      errorEl.textContent = errorMessage(body.error);
    } catch {
      errorEl.textContent = errorMessage(undefined);
    } finally {
      button.disabled = false;
      if (!form.classList.contains("sent") && ts && widget !== null) ts.reset(widget);
    }
  });
  // HTML では押せない状態で出している（JS が無いと、内容が静的なアセットへ POST されて消えるため）。送る準備ができたここで押せるようにする。
  button.disabled = false;
}
