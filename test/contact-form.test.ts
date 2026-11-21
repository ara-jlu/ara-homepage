import { afterEach, describe, expect, it, vi } from "vitest";
import { errorMessage, whenTurnstile } from "../src/scripts/contact-form";

describe("送信の失敗の文言", () => {
  it.each([
    ["invalid", "入力の内容を確かめてください。"],
    ["challenge", "確認に失敗しました。もう一度お試しください。"],
    ["origin", "送信できませんでした。時間をおいてお試しください。"],
    ["send", "送信できませんでした。時間をおいてお試しください。"],
    [undefined, "送信できませんでした。時間をおいてお試しください。"],
  ])("%s", (code, head) => {
    expect(errorMessage(code)).toBe(`${head} X の DM でも受け付けています。`);
  });
});

describe("Turnstile の読み込みを待つ", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("読み込まれたら、その Turnstile を返す", async () => {
    vi.useFakeTimers();
    const w: { turnstile?: unknown } = {};
    vi.stubGlobal("window", w);
    const p = whenTurnstile();
    const ts = { render: vi.fn() };
    setTimeout(() => (w.turnstile = ts), 250);
    await vi.advanceTimersByTimeAsync(400);
    await expect(p).resolves.toBe(ts);
  });

  it("render の無い途中の turnstile では返さず、本体が読み込まれて render ができてから返す", async () => {
    vi.useFakeTimers();
    const w: { turnstile?: unknown } = {};
    vi.stubGlobal("window", w);
    const p = whenTurnstile();
    let settled = false;
    void p.then(() => (settled = true));
    // ローダーが先に置く、render を持たない仮の turnstile
    w.turnstile = {};
    await vi.advanceTimersByTimeAsync(300);
    expect(settled).toBe(false);
    const ts = { render: vi.fn() };
    w.turnstile = ts;
    await vi.advanceTimersByTimeAsync(200);
    await expect(p).resolves.toBe(ts);
  });

  it("30秒たっても読み込まれなければ、待つのをやめて null を返す", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", {});
    const p = whenTurnstile();
    await vi.advanceTimersByTimeAsync(30_100);
    await expect(p).resolves.toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
});
