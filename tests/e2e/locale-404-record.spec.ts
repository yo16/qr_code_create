import { test, expect } from "@playwright/test";

/**
 * 多言語化 M2（app/en を app/[locale] に移す）の前後で 404 の出方が変わらないことの記録
 * （qr_code_create-38x.2）。HTTP ステータス、<html lang>、h1 の文言を固定する。
 *
 * 本番ビルドで流す（dev サーバーでは 404 の挙動が違う）:
 *   npm run build のあと npm run test:e2e:prod
 */

test.setTimeout(120_000);
const NAV_TIMEOUT = 90_000;

interface Case {
  url: string;
  status: number;
  lang: string;
  h1: string;
}

const NOT_FOUND_JA = "ページが見つかりません";

const CASES: Case[] = [
  { url: "/en/foo", status: 404, lang: "ja", h1: NOT_FOUND_JA },
  { url: "/en/guide/unknown-slug", status: 404, lang: "ja", h1: NOT_FOUND_JA },
  { url: "/foo", status: 404, lang: "ja", h1: NOT_FOUND_JA },
  { url: "/ja", status: 404, lang: "ja", h1: NOT_FOUND_JA },
  { url: "/ja/create", status: 404, lang: "ja", h1: NOT_FOUND_JA },
  { url: "/xx", status: 404, lang: "ja", h1: NOT_FOUND_JA },
];

test.describe("未定義 URL の 404 の出方", () => {
  for (const c of CASES) {
    // 意図: 移動の前後で、ステータス・html lang・見出しが同じであること
    test(`${c.url} は ${c.status}、lang="${c.lang}"、h1「${c.h1}」`, async ({ page }) => {
      const response = await page.goto(c.url, { timeout: NAV_TIMEOUT });
      expect(response?.status()).toBe(c.status);
      expect(await page.locator("html").getAttribute("lang")).toBe(c.lang);
      expect((await page.locator("h1").first().textContent())?.trim()).toBe(c.h1);
    });
  }
});

test.describe("存在するページ", () => {
  // 意図: /ja は 404 だが、ja の通常ページと en のページは 200 のまま
  for (const [url, lang] of [
    ["/create", "ja"],
    ["/en", "en"],
    ["/en/create", "en"],
    ["/en/guide/getting-started", "en"],
  ] as const) {
    test(`${url} は 200、lang="${lang}"`, async ({ page }) => {
      const response = await page.goto(url, { timeout: NAV_TIMEOUT });
      expect(response?.status()).toBe(200);
      expect(await page.locator("html").getAttribute("lang")).toBe(lang);
    });
  }
});

test.describe("静的ファイル", () => {
  // 意図: [locale] の動的セグメントがあっても静的ファイルが今どおり返る
  for (const path of ["/favicon.ico", "/icon.svg", "/robots.txt", "/sitemap.xml"]) {
    test(`${path} は 200`, async ({ request }) => {
      const response = await request.get(path, { timeout: NAV_TIMEOUT });
      expect(response.status()).toBe(200);
    });
  }
});
