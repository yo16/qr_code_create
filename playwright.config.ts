import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // ポスター（poster-flow）、/create の QR の収まり（create-qr-fit）、未知 slug の 404（unknown-slug-404）の E2E は、
  // 本番ビルド + ポート 3100 の `npm run test:e2e:prod` だけで流す。
  // dev サーバーでは PDF 生成（html2canvas）が遅く、ポート 3000 も別のプロセスと衝突しやすい。
  // 404 の HTML（lang・title・エラー骨組み）も dev と本番で挙動が違うため
  testIgnore: ["**/poster-flow.spec.ts", "**/create-qr-fit.spec.ts", "**/unknown-slug-404.spec.ts", "**/locale-404-record.spec.ts", "**/multi-locale-pages.spec.ts", "**/not-found-locales.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
