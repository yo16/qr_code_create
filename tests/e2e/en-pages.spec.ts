import { test, expect, type Page } from "@playwright/test";
import { enClient } from "../../src/i18n/enClient";

/**
 * 英語版トップ（/en）と英語版ツール（/en/create）の E2E（qr_code_create-01z.4）。
 *
 * 実行例（dev サーバーを 3100 で起動している場合）:
 *   npx playwright test --config tmp/playwright.favicon.config.ts tests/e2e/en-pages.spec.ts
 */

test.setTimeout(120_000);
const NAV_TIMEOUT = 90_000;

// 仮名・漢字（全角記号は英語ページでも出ないはずだが、© 等の誤検出を避けるため仮名・漢字に絞る）
const JAPANESE = /[぀-ゟ゠-ヿ一-鿿]/;
/** 英語ページから日本語ページへ張ってよいリンク（規約系。リンク名は英語で「(Japanese)」付き） */
const ALLOWED_JA_LINKS = ["/privacy", "/terms", "/contact"];

async function expectNoJapanese(page: Page) {
  const text = await page.locator("body").innerText();
  const found = text.split("\n").filter((line) => JAPANESE.test(line));
  expect(found).toEqual([]);
}

/** 画面に出ない文字列（aria-label・placeholder・title・alt と document.title）にも日本語が無い */
async function expectNoJapaneseInAttributes(page: Page) {
  const values = await page.evaluate(() => {
    const out: string[] = [`document.title: ${document.title}`];
    const pick = (selector: string, attr: string) =>
      document.querySelectorAll(selector).forEach((el) => {
        out.push(`${el.tagName.toLowerCase()}[${attr}]: ${el.getAttribute(attr) ?? ""}`);
      });
    pick("[aria-label]", "aria-label");
    pick("[placeholder]", "placeholder");
    pick("[title]", "title");
    pick("img[alt]", "alt");
    return out;
  });
  // 空振り防止: document.title に加えて aria-label などを 1 件以上拾っている（/en はハンバーガーと QR 画像の alt など）
  expect(values.length).toBeGreaterThan(1);
  expect(values.filter((v) => JAPANESE.test(v))).toEqual([]);
}

/** 内部リンクが /en 系か、英語版の無い規約系（日本語ページ）だけを指す */
async function expectInternalLinksEnOnly(page: Page) {
  const hrefs = await page
    .locator('a[href^="/"]')
    .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
  expect(hrefs.length).toBeGreaterThan(0);
  const bad = hrefs.filter(
    (h) => !/^\/en(\/|$|\?|#)/.test(h) && !ALLOWED_JA_LINKS.includes(h)
  );
  expect(bad).toEqual([]);
  return hrefs;
}

test.describe("/en", () => {
  // 意図: 英語トップが 200 で lang="en"、インデックス対象（robots の指定自体が無い）、canonical が /en
  test('200 で html[lang]="en"、meta robots が無く canonical が /en', async ({ page }) => {
    const response = await page.goto("/en", { timeout: NAV_TIMEOUT });
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical ?? "", "http://x").pathname).toBe("/en");
  });

  // 意図: 見出しが英語
  test("h1 が英語の見出し", async ({ page }) => {
    await page.goto("/en", { timeout: NAV_TIMEOUT });
    const h1 = page.locator("h1");
    await expect(h1).toContainText("Create QR codes with");
    await expect(h1).toContainText("UTM parameters, free");
  });

  // 意図: 内部リンクが英語版か、英語版の無い規約系（日本語ページ）だけを指す
  test("内部リンクは /en 始まりか /privacy /terms /contact", async ({ page }) => {
    await page.goto("/en", { timeout: NAV_TIMEOUT });
    const hrefs = await expectInternalLinksEnOnly(page);
    expect(hrefs).toContain("/en/create");
  });

  // 意図: 画面に日本語が出ていない（属性値と document.title を含む）
  test("本文と属性値に日本語が無い", async ({ page }) => {
    await page.goto("/en", { timeout: NAV_TIMEOUT });
    await expectNoJapanese(page);
    await expectNoJapaneseInAttributes(page);
  });
});

test.describe("/en/create", () => {
  // 意図: URL を入れると QR が出て、PNG / SVG / PDF を英語のボタンからダウンロードできる
  test("URL 入力 → プレビュー → PNG / SVG / PDF をダウンロードできる", async ({ page }) => {
    const response = await page.goto("/en/create", { timeout: NAV_TIMEOUT });
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("h1")).toHaveText("Create a QR code");

    await page.getByRole("textbox", { name: "URL", exact: true }).fill("https://example.com");
    await expect(page.getByLabel("Generated QR code")).toBeVisible({ timeout: 30_000 });

    for (const [name, ext] of [
      ["Download PNG", ".png"],
      ["Download SVG", ".svg"],
      ["Download PDF", ".pdf"],
    ] as const) {
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 30_000 }),
        page.getByRole("button", { name }).click(),
      ]);
      expect(download.suggestedFilename()).toMatch(new RegExp(`\\${ext}$`));
    }
  });

  // 意図: ?preset=business の初期キャプションが英語
  test("?preset=business でキャプション欄が英語", async ({ page }) => {
    await page.goto("/en/create?preset=business", { timeout: NAV_TIMEOUT });
    await expect(page.getByLabel("Caption text")).toHaveValue(enClient.decoration.presets.business.caption, { timeout: 30_000 });
  });

  // 意図: ツール画面（URL 入力後を含む）に日本語が出ていない（属性値と document.title を含む）
  test("本文と属性値に日本語が無い", async ({ page }) => {
    await page.goto("/en/create", { timeout: NAV_TIMEOUT });
    await page.getByRole("textbox", { name: "URL", exact: true }).fill("https://example.com");
    await expect(page.getByLabel("Generated QR code")).toBeVisible({ timeout: 30_000 });
    await expectNoJapanese(page);
    await expectNoJapaneseInAttributes(page);
  });

  // 意図: ツール画面の内部リンクも /en 系か規約系だけ、canonical は /en/create で robots 指定なし
  test("内部リンクは /en 系か規約系だけ、canonical が /en/create", async ({ page }) => {
    await page.goto("/en/create", { timeout: NAV_TIMEOUT });
    await expectInternalLinksEnOnly(page);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical ?? "", "http://x").pathname).toBe("/en/create");
  });
});
