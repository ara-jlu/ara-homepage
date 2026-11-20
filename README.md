# ara-homepage

joifup.com のサイト。アラという人のホームページで、やっていること（業務の自動化の事業・作ったもの）、書いたもの、自己紹介、問い合わせフォームを載せる。メモアプリの Joifup（将来は app.joifup.com）とは別物。

## 作り

- Astro の静的なサイトを、Cloudflare Workers の静的なアセットとして配る。動きと装飾は素の CSS と JavaScript
- `/api/contact` だけを Worker（`worker/`）が受け、Turnstile で確かめてから Resend でメールを送る。内容は保存しない
- 「最近書いたもの」はビルドのときに blog の `rss.xml` を読む（`src/lib/writing-feed.ts`）
- `mock/index.html` — 決めた形のモック。本番の見た目の正解で、テストが突き合わせに使う

## 手元で動かす

```bash
npm ci
npx playwright install chromium
npm test          # 型の検査は npm run typecheck
npm run build && npm run preview   # wrangler dev。問い合わせを試すときは .dev.vars に TURNSTILE_SECRET_KEY と RESEND_API_KEY を書く
```

Turnstile は、手元では Cloudflare のテスト用の鍵（site key `1x00000000000000000000AA`）を `PUBLIC_TURNSTILE_SITE_KEY` に入れて試せる。

## デプロイ

main への push と、手動の実行、blog のデプロイからの呼び出しで、GitHub Actions がデプロイする。repository variable `DEPLOY_ENABLED` が `true` のときだけ動く。Worker の入れ物とカスタムドメインは `infra/` の Terraform が持つ。

デプロイの設定は次のように置く。
- repository variable: `DEPLOY_ENABLED`。job の `if:` は environment に入る前に評価されるので、environment の variable は見えない。repository variable に置く。
- `production` environment（デプロイできるブランチを main だけに限る）: secrets の `CLOUDFLARE_API_TOKEN`・`CLOUDFLARE_ACCOUNT_ID`・`DISCORD_WEBHOOK_URL` と、variable の `PUBLIC_TURNSTILE_SITE_KEY`。
