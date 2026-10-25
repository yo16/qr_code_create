import { defineConfig, devices } from "@playwright/test";

/**
 * 印刷用ポスター（/poster）の E2E 用設定（qr_code_create-ro1 / l1a）。
 *
 * 実行手順:
 *   1. npm run build
 *   2. npm run test:e2e:poster   （または npx playwright test --config playwright.poster.config.ts）
 * 本番ビルドを next start（ポート 3100）で起動して流す。/poster が 404 だと poster-flow.spec.ts の beforeAll が失敗する。
 */

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "poster-flow.spec.ts",
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
