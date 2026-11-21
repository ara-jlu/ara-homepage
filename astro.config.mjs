import { defineConfig } from "astro/config";

// ASTRO_OUT_DIR はテスト専用。フィードの有無を変えた版を別の場所にビルドし、本番の dist/ と混ぜない。
export default defineConfig({
  site: "https://joifup.com",
  output: "static",
  trailingSlash: "never",
  // ヒーローの ls の出力は .ln が pre-wrap で、改行と空白がそのまま見える。圧縮されると行が潰れるので止める。
  compressHTML: false,
  build: { format: "file" },
  outDir: process.env.ASTRO_OUT_DIR ?? "./dist",
  // 既定の CSS の圧縮（Lightning CSS）は、backdrop-filter と -webkit-backdrop-filter が並ぶと -webkit- の方だけを残す。
  // Chromium は接頭辞の無い方しか読まないので、すりガラスのぼかしが消えて透けすぎる。esbuild の圧縮は両方を残す。
  vite: { build: { cssMinify: "esbuild" } },
});
