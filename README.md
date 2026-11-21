# ara-homepage

[joifup.com](https://joifup.com) のソースです。joifup.com は、私の個人のホームページで、やっていること、書いたもの、自己紹介、お仕事の相談のフォームを載せています。

## 作り

- Astro で作った静的なサイトを、Cloudflare Workers の静的なアセットとして配っています。動きと装飾は素の CSS と TypeScript で書いています。
- `/api/contact` だけを Worker が受け、Turnstile で確認してから Resend でメールを送ります。問い合わせの内容は保存しません。

| 場所 | 中身 |
| --- | --- |
| `src/pages/` | ページ（トップと 404） |
| `src/components/` | トップの各節 |
| `src/layouts/` | 全ページに共通の `<head>` |
| `src/styles/` | CSS |
| `src/scripts/` | ブラウザで動くスクリプト（読み込みの演出、ヒーローの打鍵、問い合わせのフォームなど） |
| `src/lib/writing-feed.ts` | 「最近書いたもの」の一覧をビルドのときに作る処理 |
| `worker/` | `/api/contact` を受ける Worker |
| `infra/` | Worker とカスタムドメインを作る Terraform |
| `scripts/og.mjs` | OGP の画像（`public/og.png`）を作り直すスクリプト。`npm run og` で動きます |
| `mock/index.html` | デザインの見本です。テストが、ビルドしたページの文言をこれと突き合わせます |
| `test/` | テスト（Vitest と Playwright） |

### 「最近書いたもの」の一覧

ビルドのときに、別のリポジトリで管理しているブログのフィード <https://blog.joifup.com/rss.xml> を読んで作ります。フィードが取れないときは一覧を出さずに、ビルドはそのまま続けます。

## ライセンス

コードは MIT ライセンスです（[LICENSE](LICENSE)）。

ただし、サイトの文章（文言・自己紹介・OGP の画像の文言）と画像（アイコン・3段の印・スクリーンショット・OGP の画像）は MIT ライセンスの対象外です。著作権は作者に残り、許可なく複製・転載・利用はできません。対象のファイルは [CONTENT-LICENSE.md](CONTENT-LICENSE.md) に挙げています。
