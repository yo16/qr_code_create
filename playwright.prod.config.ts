import { defineConfig, devices } from "@playwright/test";

/**
 * 本番ビルドで流す E2E の設定（ポスター qr_code_create-ro1 / l1a、/create の QR の収まり b0w）。
 *
 * 実行手順:
 *   1. npm run build
 *   2. npm run test:e2e:prod   （または npx playwright test --config playwright.prod.config.ts）
 * 本番ビルドを next start（ポート 3100）で起動して流す。対象は poster-flow.spec.ts、create-qr-fit.spec.ts、unknown-slug-404.spec.ts。
 * /poster が 404 だと poster-flow.spec.ts の beforeAll が失敗する。
 */

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["poster-flow.spec.ts", "create-qr-fit.spec.ts", "blog-utm-on-off-fit.spec.ts", "unknown-slug-404.spec.ts"],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "off",
    acceptDownloads: true,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
