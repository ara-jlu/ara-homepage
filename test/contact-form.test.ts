import { describe, expect, it } from "vitest";
import { errorMessage } from "../src/scripts/contact-form";

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
