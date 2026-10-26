import { test, expect } from "@playwright/test";
import matter from "gray-matter";
import fs from "fs";
import path from "path";

/**
 * /blog/utm-on-off-when-to-use がスマホ幅（390px）で横にはみ出さないこと（qr_code_create-33a）。
 * 表と長い URL のインラインコードが画面内に収まることを実測する。
 * `npm run build` のあと `npm run test:e2e:prod`（本番ビルド、ポート 3100）で流す。
 */

const SLUG = "utm-on-off-when-to-use";
const URL_PATH = `/blog/${SLUG}`;
const title = matter(fs.readFileSync(path.join(process.cwd(), "src/content/blog", `${SLUG}.mdx`), "utf-8")).data.title as string;
const NAV_TIMEOUT = 90_000;
const VIEWPORT_W = 390;

test.describe("390px 幅の記事ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: VIEWPORT_W, height: 844 });
  });

  test("200 で開け、h1 が記事タイトルであること", async ({ page }) => {
    const response = await page.goto(URL_PATH, { timeout: NAV_TIMEOUT });
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(title);
  });

  test("横スクロールが無い（scrollWidth が clientWidth を超えない）", async ({ page }) => {
    await page.goto(URL_PATH, { timeout: NAV_TIMEOUT });
    const m = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
      bsw: document.body.scrollWidth,
      iw: window.innerWidth,
    }));
    expect(m.cw).toBeLessThanOrEqual(m.iw);
    expect(m.sw).toBeLessThanOrEqual(m.cw);
    expect(m.bsw).toBeLessThanOrEqual(m.cw);
  });

  test("表の右端がビューポート内にある", async ({ page }) => {
    await page.goto(URL_PATH, { timeout: NAV_TIMEOUT });
    const table = page.locator("table");
    await expect(table).toHaveCount(1);
    const box = await table.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { l: r.left, r: r.right };
    });
    expect(box.l).toBeGreaterThanOrEqual(0);
    expect(box.r).toBeLessThanOrEqual(VIEWPORT_W + 1);
  });

  test("長い URL のコード要素（utm_ を含む）の右端がビューポート内にある", async ({ page }) => {
    await page.goto(URL_PATH, { timeout: NAV_TIMEOUT });
    const codes = page.locator("code", { hasText: "utm_source=store" });
    const n = await codes.count();
    expect(n).toBeGreaterThanOrEqual(2); // 本文の URL 例と表の ON 行
    for (let i = 0; i < n; i++) {
      const r = await codes.nth(i).evaluate((el) => {
        const b = el.getBoundingClientRect();
        return { l: b.left, r: b.right };
      });
      expect(r.l).toBeGreaterThanOrEqual(0);
      expect(r.r).toBeLessThanOrEqual(VIEWPORT_W + 1);
    }
  });
});

test.describe("異常系・一覧", () => {
  test("存在しない slug は 404", async ({ page }) => {
    const response = await page.goto("/blog/no-such-post", { timeout: NAV_TIMEOUT });
    expect(response?.status()).toBe(404);
  });

  test("/blog 一覧に新記事へのリンクがある", async ({ page }) => {
    await page.goto("/blog", { timeout: NAV_TIMEOUT });
    await expect(page.locator(`a[href="${URL_PATH}"]`).first()).toBeVisible();
  });
});
