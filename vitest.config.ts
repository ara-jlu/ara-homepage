import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    globalSetup: ["./test/global-setup.ts"],
    // ビルドを2回走らせ、ブラウザも起動するので既定のタイムアウトでは足りない。
    hookTimeout: 300_000,
    testTimeout: 60_000,
  },
});
