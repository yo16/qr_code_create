import { test, expect } from "@playwright/test";

/**
 * 英語ガイド（/en/guide/getting-started）の E2E（qr_code_create-01z.5）。
 *
 * 実行例（dev サーバーを 3100 で起動している場合）:
 *   npx playwright test --config tmp/playwright.favicon.config.ts tests/e2e/en-guide.spec.ts
 */

test.setTimeout(120_000);
const NAV_TIMEOUT = 90_000;

const JAPANESE = /[぀-ゟ゠-ヿ一-鿿]/;
const EN_GUIDE = "/en/guide/getting-started";

test.describe("/en/guide/getting-started", () => {
  // 意図: 200 で html[lang]="en"、h1 が英語、canonical が自身
  test('200 で html[lang]="en"、h1 が英語、canonical が /en/guide/getting-started', async ({ page }) => {
    const response = await page.goto(EN_GUIDE, { timeout: NAV_TIMEOUT });
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    const h1 = page.locator("h1");
    await expect(h1).toContainText("Getting started");
    expect(await h1.innerText()).not.toMatch(JAPANESE);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical ?? "", "http://x").pathname).toBe(EN_GUIDE);
  });

  // 意図: パンくずは Home（/en）› 記事の 2 段
  test("パンくずの Home が /en を指し、2 段", async ({ page }) => {
    await page.goto(EN_GUIDE, { timeout: NAV_TIMEOUT });
    const crumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(crumb.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/en");
    await expect(crumb.getByRole("listitem")).toHaveCount(2);
  });

  // 意図: 本文中の /en/create リンクで英語版ツールへ遷移できる
  test("本文の /en/create リンクで英語版ツールへ遷移できる", async ({ page }) => {
    await page.goto(EN_GUIDE, { timeout: NAV_TIMEOUT });
    const link = page.locator("article").getByRole("link", { name: "Open the QR code generator" });
    await expect(link).toHaveAttribute("href", "/en/create");
    await Promise.all([page.waitForURL("**/en/create", { timeout: NAV_TIMEOUT }), link.click()]);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("h1")).toHaveText("Create a QR code");
  });

  // 意図: 本文に日本語が無く、内部リンクは /en 系か規約系だけ
  test("本文に日本語が無く、内部リンクは /en 系か規約系だけ", async ({ page }) => {
    await page.goto(EN_GUIDE, { timeout: NAV_TIMEOUT });
    // 言語切り替え（a[hreflang]、qr_code_create-01z.6）の「日本語」と行き先 /guide/getting-started は仕様なので除く
    const switchLink = page.locator('header a[hreflang="ja"]');
    await expect(switchLink).toHaveAttribute("lang", "ja");
    await expect(switchLink).toHaveAttribute("href", "/guide/getting-started");
    const text = await page.locator("body").innerText();
    expect(
      text
        .split("\n")
        .filter((line) => line.trim() !== "日本語")
        .filter((line) => JAPANESE.test(line))
    ).toEqual([]);
    const hrefs = await page
      .locator('a[href^="/"]:not([hreflang])')
      .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
    expect(hrefs.length).toBeGreaterThan(0);
    const bad = hrefs.filter(
      (h) => !/^\/en(\/|$|\?|#)/.test(h) && !["/privacy", "/terms", "/contact"].includes(h)
    );
    expect(bad).toEqual([]);
  });

  // 意図: 390px 幅で横スクロールが出ない
  test("390px 幅で横スクロールが出ない", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(EN_GUIDE, { timeout: NAV_TIMEOUT });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("英語の無いガイド", () => {
  // 意図: 英語の MDX が無い slug は 404（dynamicParams = false）
  test("/en/guide/utm-setup は 404", async ({ page }) => {
    const response = await page.goto("/en/guide/utm-setup", { timeout: NAV_TIMEOUT });
    expect(response?.status()).toBe(404);
  });
});

test.describe("/en からガイドへの導線", () => {
  // 意図: Header のナビから英語ガイドへ行ける
  test("Header の Getting started から英語ガイドへ遷移できる", async ({ page }) => {
    await page.goto("/en", { timeout: NAV_TIMEOUT });
    const link = page.locator("header").getByRole("link", { name: "Getting started" }).first();
    await expect(link).toHaveAttribute("href", EN_GUIDE);
    await Promise.all([page.waitForURL(`**${EN_GUIDE}`, { timeout: NAV_TIMEOUT }), link.click()]);
    await expect(page.locator("h1")).toContainText("Getting started");
  });

  // 意図: トップ本文（ヒーロー）からも英語ガイドへ行ける
  test("トップ本文のガイド導線が /en/guide/getting-started を指し、遷移できる", async ({ page }) => {
    await page.goto("/en", { timeout: NAV_TIMEOUT });
    // トップページには <main> が無い（ja も同じ既存構造）ので、ヒーローのボタン付きリンクを名前で取る
    const link = page.getByRole("link", { name: "Read the guide" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", EN_GUIDE);
    await expect(page.locator("header").getByRole("link", { name: "Read the guide" })).toHaveCount(0);
    await Promise.all([page.waitForURL(`**${EN_GUIDE}`, { timeout: NAV_TIMEOUT }), link.click()]);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

test.describe("日本語版ガイド（従来どおり）", () => {
  // 意図: /guide/getting-started は lang="ja"、日本語の h1、パンくず ホーム › 使い方ガイド › 記事
  test("/guide/getting-started の h1 とパンくずが従来どおり", async ({ page }) => {
    const response = await page.goto("/guide/getting-started", { timeout: NAV_TIMEOUT });
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await expect(page.locator("h1")).toHaveText("はじめてのQRコード作成ガイド");
    const crumb = page.getByRole("navigation", { name: "パンくずリスト" });
    await expect(crumb.getByRole("listitem")).toHaveCount(3);
    await expect(crumb.getByRole("link", { name: "ホーム" })).toHaveAttribute("href", "/");
    await expect(crumb.getByRole("link", { name: "使い方ガイド" })).toHaveAttribute("href", "/guide");
  });
});
