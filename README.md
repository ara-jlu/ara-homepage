# ara-homepage

[joifup.com](https://joifup.com) のソースです。joifup.com は、エンジニアのアラの個人のホームページで、やっていること、書いたもの、自己紹介、お仕事の相談のフォームを載せています。

同じ名前のメモアプリ「Joifup」のサイトではありません。

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

## 手元で動かす

Node.js 24 を使っています（`package.json` の `engines` は `>=20.11` です）。

```bash
npm ci
npx playwright install chromium
npm test            # dist-test/ にビルドしてから、Playwright のブラウザでも確かめます
npm run typecheck
```

ビルドして Worker ごと手元で動かすときは、`wrangler dev` を使います。

```bash
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build
npm run preview     # wrangler dev
```

`1x00000000000000000000AA` は、Cloudflare が公開している Turnstile のテスト用の site key です。問い合わせのフォームを試すときは、リポジトリの直下に `.dev.vars` を作り、次のように書きます（`.dev.vars` は `.gitignore` に入っています）。

```
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
RESEND_API_KEY=...
```

このテスト用の secret key は、ローカルの `.dev.vars` だけで使うものです。本番では、Turnstile のダッシュボードにある本物の secret key を `npx wrangler secret put TURNSTILE_SECRET_KEY` で設定してください。

## デプロイ

GitHub Actions の `.github/workflows/deploy.yml` が、main への push か手動の実行で Cloudflare Workers にデプロイします。ブログのリポジトリのデプロイのワークフローも、記事を公開した後にこの手動の実行を起動します（「最近書いたもの」を新しくするためです）。

### 設定

- repository variable `DEPLOY_ENABLED`: `true` のときだけデプロイが動きます。Worker と secrets の準備ができるまで、デプロイを止めておくためのものです。job の `if:` は environment に入る前に評価されるので、environment の variable では見えません。そのため repository variable に置いています。
- `production` environment: Settings → Environments → Deployment branches で main だけに限ります。ここに次の値を置きます。
  - secret `CLOUDFLARE_API_TOKEN`（Workers Scripts の編集の権限）
  - secret `CLOUDFLARE_ACCOUNT_ID`
  - secret `DISCORD_WEBHOOK_URL`（任意。空ならデプロイの通知を送りません）
  - variable `PUBLIC_TURNSTILE_SITE_KEY`（公開される値です。空のときはデプロイが失敗します）
- Worker が実行時に使う secrets の `TURNSTILE_SECRET_KEY` と `RESEND_API_KEY` は、CI からではなく `npx wrangler secret put` で設定します。

### infra/

`infra/terraform.tfvars.example` を `infra/terraform.tfvars` にコピーして値を入れます（`terraform.tfvars` はコミットしません）。Terraform は Worker を作り、`attach_custom_domain = true` のときは joifup.com のカスタムドメインも付けます。Terraform は、一時的な worktree ではなく、普段使っている checkout で動かしてください（state のファイルが checkout の中にできるためです）。

## フォークして使うとき

- `worker/contact.ts` の `TO`（問い合わせの宛先）と `FROM`（送信元）を変えてください。送信元のドメインは Resend で確認しておく必要があります。
- ホスト名（`astro.config.mjs` の `site`、`src/layouts/Base.astro`、`infra/variables.tf`、`src/lib/writing-feed.ts` のフィードの URL など）を自分のものに変えてください。
- `infra/variables.tf` は、検証（validation）で `site_hostname` に `joifup.com` しか受け付けません。フォークするときは、この検証も書き換えてください。
- 下の「ライセンス」のとおり、文章と画像は使えません。自分のものに差し替えてください。

## ライセンス

コードは MIT ライセンスです（[LICENSE](LICENSE)）。

ただし、次のものは MIT ライセンスの対象外です。著作権はアラに残り、転載や利用はできません。

- 文章: ページ（`src/`）とモック（`mock/index.html`）に書かれた文言、自己紹介、OGP の画像の文言
- 画像: アイコン（`public/img/avatar.png`、`mock/img/avatar.png`）、サイトのスクリーンショット（`public/img/*.webp`、`mock/img/*.webp`）、OGP の画像（`public/og.png`）
