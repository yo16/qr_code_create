import { test, expect } from "@playwright/test";

/**
 * ルートレイアウト分割（qr_code_create-01z.1）の E2E。
 *
 * - (ja) 配下のページは <html lang="ja">、/en は <html lang="en"> になること
 * - 一致するルートが無い URL は global-not-found（日本語、lang="ja"）が 404 で出ること
 * - ページ内で notFound() を呼ぶ経路（/blog/[slug] と /guide/[slug]）は、(ja)/not-found.tsx
 *   （NotFoundContent locale="ja"）が (ja) のレイアウト内で 404 として出ること。
 *   lang="ja"、h1「ページが見つかりません」、ヘッダー（「QR Code Create」のロゴリンク）が付き、
 *   Next.js 既定の英語 404（"This page could not be found"）は出ないこと
 * - アイコンと sitemap が src/app 直下から配信され、sitemap に /en が含まれないこと
 *
 * 実行例（dev サーバーを 3100 で起動している場合）:
 *   npx playwright test --config tmp/playwright.favicon.config.ts tests/e2e/root-layout.spec.ts
 */

// dev サーバーは初回アクセス時にページをコンパイルするため、余裕を持たせる
test.setTimeout(120_000);
const NAV_TIMEOUT = 90_000;

const NOT_FOUND_JA = "ページが見つかりません";
const NOT_FOUND_NEXT_DEFAULT = "This page could not be found";

test.describe("html[lang] の切り替え", () => {
  const cases = [
    { pathname: "/", lang: "ja" },
    { pathname: "/create", lang: "ja" },
    { pathname: "/guide/getting-started", lang: "ja" },
    { pathname: "/en", lang: "en" },
  ] as const;

  for (const { pathname, lang } of cases) {
    test(`${pathname} が 200 で html[lang]="${lang}" であること`, async ({ page }) => {
      const response = await page.goto(pathname, { timeout: NAV_TIMEOUT });
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
    });
  }

  test("/en の meta robots に noindex が含まれること", async ({ page }) => {
    await page.goto("/en", { timeout: NAV_TIMEOUT });
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "").toContain("noindex");
  });
});

test.describe("ルートメタデータの ja / en 取り違え", () => {
  test("/ の title に日本語の既定タイトルが含まれること", async ({ page }) => {
    await page.goto("/", { timeout: NAV_TIMEOUT });
    await expect(page).toHaveTitle(/UTMパラメータ付きQRコード生成ツール/);
  });

  test("/en の title に英語の既定タイトルが含まれ、日本語を含まないこと", async ({ page }) => {
    await page.goto("/en", { timeout: NAV_TIMEOUT });
    // rootMetadataEn.title.default の一部
    await expect(page).toHaveTitle(/Free QR code generator with UTM parameters/);
    await expect(page).not.toHaveTitle(/UTMパラメータ付き/);
  });
});

test.describe("favicon の HTML 出力", () => {
  for (const pathname of ["/", "/en"]) {
    test(`${pathname} に link[rel~="icon"] があり、その href が 200 を返すこと`, async ({
      page,
      request,
    }) => {
      await page.goto(pathname, { timeout: NAV_TIMEOUT });
      const links = page.locator('link[rel~="icon"]');
      expect(await links.count()).toBeGreaterThan(0);
      const hrefs = await links.evaluateAll((els) =>
        els.map((el) => (el as HTMLLinkElement).getAttribute("href") ?? "")
      );
      for (const href of hrefs) {
        expect(href).not.toBe("");
        const response = await request.get(href, { timeout: NAV_TIMEOUT });
        expect(response.status(), href).toBe(200);
      }
    });
  }

  for (const pathname of ["/icon.png", "/apple-icon.png"]) {
    test(`${pathname} が 200 で Content-Type が image であること`, async ({ request }) => {
      const response = await request.get(pathname, { timeout: NAV_TIMEOUT });
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"] ?? "").toMatch(/^image\//);
    });
  }
});

test.describe("一致するルートが無い URL（global-not-found）", () => {
  for (const pathname of ["/foo", "/en/foo"]) {
    test(`${pathname} が 404 で「${NOT_FOUND_JA}」を表示し、html[lang]="ja" であること`, async ({
      page,
    }) => {
      const response = await page.goto(pathname, { timeout: NAV_TIMEOUT });
      expect(response?.status()).toBe(404);
      await expect(page.locator("h1")).toHaveText(NOT_FOUND_JA);
      await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    });
  }
});

test.describe("notFound() を呼ぶ経路", () => {
  for (const pathname of ["/blog/no-such-slug-xyz", "/guide/no-such-slug-xyz"]) {
    test(`${pathname} が 404 で日本語の not-found（lang="ja"・ヘッダー付き）を表示すること`, async ({
      page,
    }) => {
      const response = await page.goto(pathname, { timeout: NAV_TIMEOUT });
      expect(response?.status()).toBe(404);
      await expect(page.locator("html")).toHaveAttribute("lang", "ja");
      await expect(page.locator("h1")).toHaveText(NOT_FOUND_JA);
      await expect(
        page.locator("header").getByRole("link", { name: /QR Code Create/ }).first()
      ).toBeVisible();
      await expect(page.locator("body")).not.toContainText(NOT_FOUND_NEXT_DEFAULT);
    });
  }
});

test.describe("src/app 直下のメタデータファイル", () => {
  for (const pathname of ["/icon.svg", "/favicon.ico", "/sitemap.xml"]) {
    test(`${pathname} が 200 を返すこと`, async ({ request }) => {
      const response = await request.get(pathname, { timeout: NAV_TIMEOUT });
      expect(response.status()).toBe(200);
    });
  }

  test("sitemap.xml に /en の URL が含まれないこと", async ({ request }) => {
    const response = await request.get("/sitemap.xml", { timeout: NAV_TIMEOUT });
    const xml = await response.text();
    const locs = Array.from(xml.matchAll(/<loc>([^<]*)<\/loc>/g), (m) => m[1]);
    expect(locs.length).toBeGreaterThan(0);
    for (const loc of locs) {
      expect(new URL(loc).pathname).not.toMatch(/^\/en(\/|$)/);
    }
  });
});
