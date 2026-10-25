import { defineConfig, devices } from "@playwright/test";

/**
 * 印刷用ポスター（/poster）の E2E 用設定（qr_code_create-ro1）。
 *
 * 実行手順（/poster は機能フラグ ON でビルドしたときだけ存在する）:
 *   1. NEXT_PUBLIC_FEATURE_POSTER_PAGE=1 npm run build
 *   2. npm run test:e2e:poster   （または npx playwright test --config playwright.poster.config.ts）
 * ビルドをフラグなしで行うと /poster が 404 になり、poster-flow.spec.ts の beforeAll が失敗する。
 * 終わったら、フラグなしで npm run build をやり直して .next を元に戻す。
 *
 * 環境変数は、テストのプロセス（spec の FLAG_ON 判定）と next start のプロセスの両方に渡す。
 */
process.env.NEXT_PUBLIC_FEATURE_POSTER_PAGE = "1";

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
    env: { NEXT_PUBLIC_FEATURE_POSTER_PAGE: "1" },
  },
});
