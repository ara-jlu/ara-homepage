// 問い合わせの受け口の形。ブラウザのフォームと Worker がこの1つを使う。

export const CONTACT_PATH = "/api/contact";

export const CONTACT_LIMITS = { name: 100, email: 254, message: 4000 } as const;

export const CONTACT_KINDS = {
  automation: "業務の自動化のご相談",
  development: "開発のご依頼",
  other: "その他",
} as const;

export type ContactKind = keyof typeof CONTACT_KINDS;

export const isContactKind = (value: unknown): value is ContactKind => typeof value === "string" && Object.hasOwn(CONTACT_KINDS, value);

// 空白・@・宛名や複数宛先の記号・制御文字と書式文字（方向指定など）を含まない。
const PART = String.raw`[^\s@<>,;:"()\[\]\\\p{C}]+`;
const EMAIL = new RegExp(`^${PART}@${PART}\\.${PART}$`, "u");

/** 形だけを見る。実在は確かめない。 */
export function isContactEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= CONTACT_LIMITS.email && EMAIL.test(value);
}
