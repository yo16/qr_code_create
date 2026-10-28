import { test, expect } from "@playwright/test";

/**
 * es / pt-br / de の未定義 URL の 404 の出方（qr_code_create-38x.9）。
 * locale-404-record.spec.ts（ja / en の記録）に言語を足す形。global-not-found（html lang="ja"）で描かれる。
 *
 * 本番ビルドで流す: npm run build のあと npm run test:e2e:prod
 */

test.setTimeout(120_000);
const NAV_TIMEOUT = 90_000;
const NOT_FOUND_JA = "ページが見つかりません";

const NOT_FOUND_URLS = ["/fr", "/es/foo", "/pt-br/foo", "/de/foo", "/es/guide/unknown-slug", "/pt-br/guide/unknown-slug", "/de/guide/utm-setup"];
const FOUND_URLS = ["/es", "/pt-br", "/de"];

test.describe("未定義 URL は 404（global-not-found）", () => {
  for (const url of NOT_FOUND_URLS) {
    test(`${url} は 404、lang="ja"、h1「${NOT_FOUND_JA}」`, async ({ page }) => {
      const response = await page.goto(url, { timeout: NAV_TIMEOUT });
      expect(response?.status()).toBe(404);
      expect(await page.locator("html").getAttribute("lang")).toBe("ja");
      expect((await page.locator("h1").first().textContent())?.trim()).toBe(NOT_FOUND_JA);
    });
  }
});

test.describe("対照: 存在するページは 404 にならない", () => {
  for (const url of FOUND_URLS) {
    test(`${url} は 200 で見出しが「${NOT_FOUND_JA}」ではない`, async ({ page }) => {
      const response = await page.goto(url, { timeout: NAV_TIMEOUT });
      expect(response?.status()).toBe(200);
      expect((await page.locator("h1").first().textContent())?.trim()).not.toBe(NOT_FOUND_JA);
    });
  }
});
