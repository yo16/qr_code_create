import { test, expect, type Page } from "@playwright/test";
import { enClient } from "../../src/i18n/enClient";
import { jaClient } from "../../src/i18n/jaClient";

/**
 * 英語版の受け入れ（要件 doc/requirements.md 9.6、qr_code_create-01z.7）。
 * 英語版 Epic の最後に、受け入れ条件を 1 ファイルで固定する。
 * 設計: doc/design/i18n-en.md 7 節・10.2 節
 *
 * - `/en/create` で URL 入力 → PNG / SVG / PDF のダウンロードは tests/e2e/en-pages.spec.ts
 *   「URL 入力 → プレビュー → PNG / SVG / PDF をダウンロードできる」で固定済みのため、ここでは重ねない。
 * - 日本語版の表示は既存の E2E に任せる。
 *
 * 実行例（dev サーバーを 3100 で起動している場合）:
 *   npx playwright test --config tmp/playwright.favicon.config.ts tests/e2e/en-acceptance.spec.ts
 */

test.setTimeout(120_000);
const NAV_TIMEOUT = 90_000;

const JAPANESE = /[぀-ゟ゠-ヿ一-鿿]/;

/** 両言語が揃う 3 組。h1 は英語版の見出し（en 辞書の値。ここでは要件の文言で直書き） */
const PAIRS = [
  { name: "home", ja: "/", en: "/en", enH1: /Create QR codes with[\s\S]*UTM parameters, free/ },
  { name: "create", ja: "/create", en: "/en/create", enH1: /^Create a QR code$/ },
  {
    name: "getting-started",
    ja: "/guide/getting-started",
    en: "/en/guide/getting-started",
    enH1: /Getting started/,
  },
] as const;

/** URL の比較用（https://example.com と https://example.com/ を同じとみなす） */
const norm = (href: string | null) => new URL(href ?? "", "http://invalid.invalid").href;
const pathOf = (href: string | null) => new URL(href ?? "", "http://invalid.invalid").pathname;

function switchLink(page: Page) {
  return page.locator("header a[hreflang]");
}

async function clickSwitch(page: Page, expectedPath: string, expectedLang: "ja" | "en") {
  await expect(switchLink(page)).toHaveCount(1);
  await Promise.all([
    page.waitForURL((url) => url.pathname === expectedPath, { timeout: NAV_TIMEOUT }),
    switchLink(page).click(),
  ]);
  await expect(page.locator("html")).toHaveAttribute("lang", expectedLang);
}

test.describe("英語ページの表示と言語切り替えの往復", () => {
  for (const { name, ja, en, enH1 } of PAIRS) {
    // 意図: 英語ページが lang="en" で英語の h1、「日本語」で対応する ja ページ（lang="ja"）へ、「EN」で戻る
    test(`${name}: ${en} は lang="en" で h1 が英語、「日本語」→ ${ja} →「EN」→ ${en}`, async ({ page }) => {
      const response = await page.goto(en, { timeout: NAV_TIMEOUT });
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      const h1 = page.locator("h1");
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText(enH1);
      expect(await h1.innerText()).not.toMatch(JAPANESE);

      await expect(switchLink(page)).toHaveText(new RegExp(`^${enClient.common.languageSwitch.label}`));
      await clickSwitch(page, ja, "ja");
      // ja ページの h1 は日本語を含む
      expect(await page.locator("h1").first().innerText()).toMatch(JAPANESE);

      await expect(switchLink(page)).toHaveText(new RegExp(`^${jaClient.common.languageSwitch.label}`));
      await clickSwitch(page, en, "en");
      await expect(page.locator("h1")).toHaveText(enH1);
    });
  }
});

test.describe("head の hreflang / canonical / og:locale", () => {
  for (const { name, ja, en } of PAIRS) {
    for (const lang of ["ja", "en"] as const) {
      const self = lang === "ja" ? ja : en;
      // 意図: 6 ページそれぞれが ja / en / x-default の 3 本を出し、canonical が自己 URL、og:locale が言語どおり
      test(`${name} (${self}): hreflang 3 本、canonical 自己参照、og:locale`, async ({ page }) => {
        const response = await page.goto(self, { timeout: NAV_TIMEOUT });
        expect(response?.status()).toBe(200);

        const links = await page.locator("head link[rel=alternate][hreflang]").evaluateAll((els) =>
          els.map((el) => ({ hreflang: el.getAttribute("hreflang"), href: el.getAttribute("href") }))
        );
        expect(links).toHaveLength(3);
        const byLang = Object.fromEntries(links.map((l) => [l.hreflang, l.href]));
        expect(Object.keys(byLang).sort()).toEqual(["en", "ja", "x-default"]);
        expect(pathOf(byLang.ja)).toBe(ja);
        expect(pathOf(byLang.en)).toBe(en);
        expect(pathOf(byLang["x-default"])).toBe(ja);
        // 3 本とも同じオリジン（SITE_URL）の絶対 URL
        const origins = new Set(Object.values(byLang).map((h) => new URL(h ?? "").origin));
        expect(origins.size).toBe(1);

        const canonical = await page.locator('head link[rel="canonical"]').getAttribute("href");
        expect(pathOf(canonical)).toBe(self);
        // 自己参照: canonical が hreflang の自分の言語と同じ URL
        expect(norm(canonical)).toBe(norm(byLang[lang]));
        // 表記も同じ: 正規化しない生の文字列で一致（末尾スラッシュの有無などの揺れを許さない）
        expect(canonical).toBe(byLang[lang]);

        await expect(page.locator('head meta[property="og:locale"]')).toHaveAttribute(
          "content",
          lang === "ja" ? "ja_JP" : "en_US"
        );
        await expect(page.locator('head meta[property="og:locale:alternate"]')).toHaveAttribute(
          "content",
          lang === "ja" ? "en_US" : "ja_JP"
        );
      });
    }
  }

  // 意図: 英語版の無いページは hreflang を出さない（対照）
  test("/guide/utm-setup と /faq の head に hreflang が無い", async ({ page }) => {
    for (const path of ["/guide/utm-setup", "/faq"]) {
      await page.goto(path, { timeout: NAV_TIMEOUT });
      await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1);
      await expect(page.locator("head link[hreflang]")).toHaveCount(0);
    }
  });
});

test.describe("/sitemap.xml", () => {
  // 意図: 配信される sitemap に en 3 件と xhtml:link（hreflang）がある
  test("en 3 件と xhtml:link を含む", async ({ request }) => {
    const res = await request.get("/sitemap.xml", { timeout: NAV_TIMEOUT });
    expect(res.status()).toBe(200);
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    expect(locs.filter((p) => /^\/en(\/|$)/.test(p)).sort()).toEqual(
      ["/en", "/en/create", "/en/guide/getting-started"].sort()
    );
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    // 両言語が揃う 6 エントリ × 3 本
    expect((xml.match(/<xhtml:link rel="alternate" hreflang="/g) ?? []).length).toBe(18);
    for (const lang of ["ja", "en", "x-default"]) {
      expect(xml).toContain(`hreflang="${lang}"`);
    }
  });
});
