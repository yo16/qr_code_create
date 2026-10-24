import { test, expect, type Page } from "@playwright/test";
import { jaClient } from "../../src/i18n/jaClient";
import { enClient } from "../../src/i18n/enClient";

/**
 * 言語切り替え（qr_code_create-01z.6）の E2E。
 * 設計: doc/design/i18n-en.md 8 節・10.2 節
 *
 * 実行例（dev サーバーを 3100 で起動している場合）:
 *   npx playwright test --config tmp/playwright.favicon.config.ts tests/e2e/language-switch.spec.ts
 */

test.setTimeout(120_000);
const NAV_TIMEOUT = 90_000;

/** ヘッダー内の切り替えリンク（hreflang 付きの a はこれだけ） */
function switchLink(page: Page) {
  return page.locator("header a[hreflang]");
}

/** 切り替えを押して遷移を待ち、行き先のパス・クエリ・html[lang] を確かめる */
async function clickSwitchAndExpect(page: Page, expectedPath: string, expectedLang: "ja" | "en") {
  const link = switchLink(page);
  await expect(link).toHaveCount(1);
  await Promise.all([
    page.waitForURL((url) => url.pathname === expectedPath, { timeout: NAV_TIMEOUT }),
    link.click(),
  ]);
  const url = new URL(page.url());
  expect(url.pathname).toBe(expectedPath);
  expect(url.search).toBe("");
  expect(url.hash).toBe("");
  await expect(page.locator("html")).toHaveAttribute("lang", expectedLang);
}

test.describe("切り替えで対応ページへ往復する", () => {
  // 意図: トップで EN → /en（html lang="en"）、そこで「日本語」→ / に戻る
  test("/ → /en → /", async ({ page }) => {
    await page.goto("/", { timeout: NAV_TIMEOUT });
    await expect(switchLink(page)).toHaveText(new RegExp(`^${jaClient.common.languageSwitch.label}`));
    await clickSwitchAndExpect(page, "/en", "en");
    await expect(switchLink(page)).toHaveText(new RegExp(`^${enClient.common.languageSwitch.label}`));
    await clickSwitchAndExpect(page, "/", "ja");
  });

  test("/create → /en/create → /create", async ({ page }) => {
    await page.goto("/create", { timeout: NAV_TIMEOUT });
    await clickSwitchAndExpect(page, "/en/create", "en");
    await clickSwitchAndExpect(page, "/create", "ja");
  });

  test("/guide/getting-started → /en/guide/getting-started → /guide/getting-started", async ({ page }) => {
    await page.goto("/guide/getting-started", { timeout: NAV_TIMEOUT });
    await clickSwitchAndExpect(page, "/en/guide/getting-started", "en");
    await clickSwitchAndExpect(page, "/guide/getting-started", "ja");
  });

  // 意図: 英語版の無いページからは英語トップへ
  test("/faq で EN → /en", async ({ page }) => {
    await page.goto("/faq", { timeout: NAV_TIMEOUT });
    await clickSwitchAndExpect(page, "/en", "en");
  });

  // 意図: /en 配下の 404 は、どちらのシェルで描かれても
  // 「表示されている切り替えリンクが自分自身を指さない」「クリック後のページが 200 で / か /en」を満たす
  for (const path of ["/en/foo", "/en/guide/utm-setup"]) {
    test(`${path}（404）: 切り替えは自分自身を指さず、押すと 200 の / か /en へ`, async ({ page }) => {
      const response = await page.goto(path, { timeout: NAV_TIMEOUT });
      expect(response?.status()).toBe(404);
      const link = switchLink(page);
      await expect(link).toHaveCount(1);
      const href = await link.getAttribute("href");
      expect(href).not.toBe(path);
      expect(["/", "/en"]).toContain(href);

      const [navResponse] = await Promise.all([
        page.waitForResponse(
          (r) => r.request().isNavigationRequest() && new URL(r.url()).pathname === href,
          { timeout: NAV_TIMEOUT },
        ),
        link.click(),
      ]);
      await page.waitForURL((u) => u.pathname === href, { timeout: NAV_TIMEOUT });
      expect(navResponse?.status()).toBe(200);
      const url = new URL(page.url());
      expect(["/", "/en"]).toContain(url.pathname);
      expect(url.pathname).toBe(href);
      await expect(page.locator("html")).toHaveAttribute("lang", url.pathname === "/en" ? "en" : "ja");
    });
  }

  // 意図: /en/foo は global-not-found（ja のシェル、日本語の 404）で描かれるので「EN」→ /en（lang="en"）
  test("/en/foo（404、global-not-found）で EN → /en", async ({ page }) => {
    const response = await page.goto("/en/foo", { timeout: NAV_TIMEOUT });
    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await expect(switchLink(page)).toHaveText(new RegExp(`^${jaClient.common.languageSwitch.label}`));
    await expect(switchLink(page)).toHaveAttribute("href", "/en");
    await clickSwitchAndExpect(page, "/en", "en");
  });

  // 意図: 英語 MDX の無い slug は dynamicParams = false で「ルート不一致」扱いになり、
  // en/not-found.tsx ではなく global-not-found（ja のシェル）で描かれる（dev・next start とも実測）。
  // そのため切り替えは「EN」→ /en になる
  test("/en/guide/utm-setup（404、global-not-found）で EN → /en", async ({ page }) => {
    const response = await page.goto("/en/guide/utm-setup", { timeout: NAV_TIMEOUT });
    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await expect(switchLink(page)).toHaveText(new RegExp(`^${jaClient.common.languageSwitch.label}`));
    await expect(switchLink(page)).toHaveAttribute("href", "/en");
    await clickSwitchAndExpect(page, "/en", "en");
  });

  // 意図: クエリは引き継がない
  test("/create?utm_source=x で EN → /en/create（クエリなし）", async ({ page }) => {
    await page.goto("/create?utm_source=x", { timeout: NAV_TIMEOUT });
    await expect(switchLink(page)).toHaveAttribute("href", "/en/create");
    await clickSwitchAndExpect(page, "/en/create", "en");
  });

  // 意図: リンクの属性（hreflang / lang）が行き先の言語
  test("ja では hreflang/lang=en、en では hreflang/lang=ja", async ({ page }) => {
    await page.goto("/", { timeout: NAV_TIMEOUT });
    await expect(switchLink(page)).toHaveAttribute("hreflang", "en");
    await expect(switchLink(page)).toHaveAttribute("lang", "en");
    await page.goto("/en", { timeout: NAV_TIMEOUT });
    await expect(switchLink(page)).toHaveAttribute("hreflang", "ja");
    await expect(switchLink(page)).toHaveAttribute("lang", "ja");
  });
});

test.describe("モバイル幅（390px）", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const path of ["/", "/en", "/en/create", "/en/guide/getting-started"]) {
    // 意図: ロゴ・切り替え・メニューボタンが 1 行に収まり、ヘッダーからはみ出さない
    test(`${path}: ヘッダーが 1 行に収まり横スクロールが出ない`, async ({ page }) => {
      await page.goto(path, { timeout: NAV_TIMEOUT });
      const header = page.locator("header").first();
      const logo = header.getByRole("link", { name: /QR Code Create/ });
      const link = switchLink(page);
      const menuButton = header.locator("button[aria-expanded]");

      await expect(link).toBeVisible();
      await expect(menuButton).toBeVisible();

      const headerBox = (await header.boundingBox())!;
      const boxes = {
        logo: (await logo.boundingBox())!,
        link: (await link.boundingBox())!,
        menu: (await menuButton.boundingBox())!,
      };
      // 縦中心がほぼ同じ（折り返していない）
      const centers = Object.values(boxes).map((b) => b.y + b.height / 2);
      expect(Math.max(...centers) - Math.min(...centers)).toBeLessThanOrEqual(8);
      // 各要素がヘッダーの内側
      for (const [name, b] of Object.entries(boxes)) {
        expect.soft(b.x, `${name} left`).toBeGreaterThanOrEqual(headerBox.x - 0.5);
        expect.soft(b.x + b.width, `${name} right`).toBeLessThanOrEqual(headerBox.x + headerBox.width + 0.5);
        expect.soft(b.y, `${name} top`).toBeGreaterThanOrEqual(headerBox.y - 0.5);
        expect.soft(b.y + b.height, `${name} bottom`).toBeLessThanOrEqual(headerBox.y + headerBox.height + 0.5);
      }
      // 左から ロゴ → 切り替え → メニューボタン
      expect(boxes.logo.x + boxes.logo.width).toBeLessThanOrEqual(boxes.link.x);
      expect(boxes.link.x + boxes.link.width).toBeLessThanOrEqual(boxes.menu.x);

      const overflow = await page.evaluate(() => {
        const el = document.scrollingElement!;
        return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
      });
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
    });
  }

  // 意図: 日本語が読めない人でもメニューを開かずに切り替えられる
  test("/ でメニューを開かずに切り替えをクリックでき /en へ", async ({ page }) => {
    await page.goto("/", { timeout: NAV_TIMEOUT });
    const menuButton = page.locator("header button[aria-expanded]");
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await clickSwitchAndExpect(page, "/en", "en");
  });

  test("/en/create でメニューを開かずに「日本語」をクリックでき /create へ", async ({ page }) => {
    await page.goto("/en/create", { timeout: NAV_TIMEOUT });
    await expect(page.locator("header button[aria-expanded]")).toHaveAttribute("aria-expanded", "false");
    await clickSwitchAndExpect(page, "/create", "ja");
  });

  // 意図: メニューのパネル内には重ねて置かない
  test("メニューを開いても切り替えリンクは 1 つのまま", async ({ page }) => {
    await page.goto("/", { timeout: NAV_TIMEOUT });
    await page.locator("header button[aria-expanded]").click();
    await expect(page.locator("header button[aria-expanded]")).toHaveAttribute("aria-expanded", "true");
    await expect(switchLink(page)).toHaveCount(1);
  });
});

test.describe("デスクトップ幅", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const [path, cta] of [
    ["/", "/create"],
    ["/en", "/en/create"],
  ] as const) {
    // 意図: 切り替えは CTA の右にあり、同じ行に並ぶ
    test(`${path}: 切り替えが CTA の右にある`, async ({ page }) => {
      await page.goto(path, { timeout: NAV_TIMEOUT });
      const ctaLink = page.locator(`header nav a[href="${cta}"]`).last();
      const link = switchLink(page);
      await expect(ctaLink).toBeVisible();
      await expect(link).toBeVisible();
      const ctaBox = (await ctaLink.boundingBox())!;
      const linkBox = (await link.boundingBox())!;
      expect(linkBox.x).toBeGreaterThanOrEqual(ctaBox.x + ctaBox.width);
      const ctaCenter = ctaBox.y + ctaBox.height / 2;
      const linkCenter = linkBox.y + linkBox.height / 2;
      expect(Math.abs(ctaCenter - linkCenter)).toBeLessThanOrEqual(8);
      // デスクトップではメニューボタンが見えない
      await expect(page.locator("header button[aria-expanded]")).toBeHidden();
    });
  }
});
