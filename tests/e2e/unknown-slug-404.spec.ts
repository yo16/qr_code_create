import { test, expect } from "@playwright/test";

/**
 * 存在しない slug が 404 になること（qr_code_create-xjj）。
 * dynamicParams = false と slug 検証の回帰防止。
 *
 * あわせて、404 のサーバー HTML（JS を実行しない生の HTML）が Next のエラー骨組みでないこと
 * （lang="ja"、title、h1、__next_error__ が無い）を固定する（qr_code_create-a2s）。
 *
 * 本番ビルドで流す（dev サーバーでは挙動が違う）:
 *   npm run build のあと npm run test:e2e:prod
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

test.describe("404 のサーバー HTML（JS を実行しない生の HTML）", () => {
  // 意図: notFound() の 404 が Next のエラー骨組み（id="__next_error__"、lang なし、既定 title）にならない
  for (const url of ["/guide/no-such-guide", "/blog/no-such-post", "/use-cases/no-such-case"]) {
    test(`${url} の生 HTML が 404 用のページになっている`, async ({ request }) => {
      const response = await request.get(url, { timeout: NAV_TIMEOUT });
      expect(response.status()).toBe(404);
      const html = await response.text();
      expect(html).toContain('<html lang="ja"');
      expect(html).not.toContain('id="__next_error__"');
      expect(html).toMatch(/<title>ページが見つかりません \| QR Code Create<\/title>/);
      expect(html).toMatch(/<h1[^>]*>ページが見つかりません<\/h1>/);
    });
  }
});

test.describe("存在する slug は従来どおり", () => {
  // 意図: 回帰防止。実在するガイドは 200
  test("/guide/utm-setup は 200", async ({ page }) => {
    const response = await page.goto("/guide/utm-setup", { timeout: NAV_TIMEOUT });
    expect(response?.status()).toBe(200);
  });
});
