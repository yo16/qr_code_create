import { defineConfig, devices } from "@playwright/test";

/**
 * 本物の GA を読み込むビルドで流す CSP の E2E の設定（qr_code_create-28o）。
 *
 * 実行は `npm run test:e2e:ga`（scripts/test-e2e-ga.cjs）。NEXT_PUBLIC_GA_MEASUREMENT_ID を付けて
 * `next build` してから流す。このスクリプトは .next を GA 入りのビルドで上書きする。
 * ポート 3101（通常の本番ビルド用の 3100 と分ける）。対象は csp-ga.spec.ts だけ。
 */

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["csp-ga.spec.ts"],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3101",
    trace: "off",
    acceptDownloads: true,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx next start -p 3101",
    url: "http://localhost:3101",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
