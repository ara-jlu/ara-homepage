import { defineConfig } from "astro/config";

// ASTRO_OUT_DIR はテスト専用。フィードの有無を変えた版を別の場所にビルドし、本番の dist/ と混ぜない。
export default defineConfig({
  site: "https://joifup.com",
  output: "static",
  trailingSlash: "never",
  build: { format: "file" },
  outDir: process.env.ASTRO_OUT_DIR ?? "./dist",
});
