import { test, expect } from "@playwright/test";

/**
 * 存在しない slug が 404 になること（qr_code_create-xjj）。
 * dynamicParams = false と slug 検証の回帰防止。
 *
 * 実行例（next start を 3100 で起動する設定）:
 *   npx playwright test --config tmp/playwright.xjj.config.ts
 */

test.setTimeout(120_000);
const NAV_TIMEOUT = 90_000;

test.describe("存在しない slug は 404", () => {
  // 意図: 存在しないガイド slug は 404
  test("/guide/no-such-guide は 404", async ({ page }) => {
    const response = await page.goto("/guide/no-such-guide", { timeout: NAV_TIMEOUT });
    expect(response?.status()).toBe(404);
  });

  // 意図: 存在しないブログ slug は 404
  test("/blog/no-such-post は 404", async ({ page }) => {
    const response = await page.goto("/blog/no-such-post", { timeout: NAV_TIMEOUT });
    expect(response?.status()).toBe(404);
  });

  // 意図: 存在しないユースケース slug は 404
  test("/use-cases/no-such-case は 404", async ({ page }) => {
    const response = await page.goto("/use-cases/no-such-case", { timeout: NAV_TIMEOUT });
    expect(response?.status()).toBe(404);
  });
});

test.describe("存在する slug は従来どおり", () => {
  // 意図: 回帰防止。実在するガイドは 200
  test("/guide/utm-setup は 200", async ({ page }) => {
    const response = await page.goto("/guide/utm-setup", { timeout: NAV_TIMEOUT });
    expect(response?.status()).toBe(200);
  });
});
