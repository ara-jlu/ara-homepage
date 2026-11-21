# 文章と画像の扱い

このリポジトリのコードは MIT ライセンスです（[LICENSE](LICENSE)）。ただし、次の文章と画像は MIT ライセンスの対象外です。著作権はアラ（Ara）に残り、許可なく複製・転載・利用はできません。

## 文章

- サイトとモックに書かれた文言（見出し・本文・自己紹介・作ったものの説明など）。`src/` のコンポーネント・レイアウト・ページと `mock/index.html` に入っているもの
- OGP の画像の文言（`scripts/og/og.html` に入っているもの）
- 上の文言をそのまま写したテスト（`test/page.test.ts` など）の中の文言

これらのファイルのうち、文言以外のコード（HTML の構造・CSS・スクリプト）は MIT ライセンスです。

## 画像

- アイコン: `public/img/avatar.png`、`mock/img/avatar.png`
- 3段の印（ロゴ）: `public/favicon.svg` と、サイトやモックの中で描いている同じ形。SVG の記述がコードの中にあっても、印としての使用はできません
- サイトのスクリーンショット: `public/img/*.webp`、`mock/img/*.webp`
- OGP の画像: `public/og.png`

---

## Content license (English)

The source code in this repository is licensed under the MIT License (see [LICENSE](LICENSE)). The following content is not covered by it; all rights are reserved by Ara, and it may not be copied, republished or reused without permission:

- Text: the copy on the site and in the mock (`src/` components, layouts and pages, `mock/index.html`), the text in the OGP image (`scripts/og/og.html`), and that copy where it is reproduced in tests. The non-text code in those files (markup structure, CSS, scripts) remains under the MIT License.
- Images: the avatar (`public/img/avatar.png`, `mock/img/avatar.png`), the three-step logo mark (`public/favicon.svg` and the same shape drawn in the site and the mock; the mark may not be used even where its SVG markup sits in code), the site screenshots (`public/img/*.webp`, `mock/img/*.webp`), and the OGP image (`public/og.png`).
