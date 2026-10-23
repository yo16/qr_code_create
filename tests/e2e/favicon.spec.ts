import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * favicon / アイコン配信の E2E（サービスのアイコン qr_code_create-9zf）。
 *
 * ブラウザタブの favicon はスクリーンショットでは確認できないため、
 * 1. `/` の <head> に Next.js が自動生成する icon / apple-touch-icon の link があること
 * 2. 各アイコン URL が 200 と正しい Content-Type を返すこと
 * 3. 配信される icon.svg がリポジトリの元データ（public/brand/mark.svg）と同じ形であること
 * を検証する。
 *
 * dev モードでは href にキャッシュ用のクエリ（例: /icon.png?icon.xxxx.png）が付くので、
 * href はパス部分だけを正規表現で照合する。
 *
 * 実行例（dev サーバーを 3100 で起動している場合）:
 *   npx playwright test --config tmp/playwright.favicon.config.ts tests/e2e/favicon.spec.ts
 */

type LinkInfo = {
  rel: string | null;
  href: string | null;
  type: string | null;
};

/** href のパス部分が expected と一致するか（クエリ文字列は無視） */
function hrefIs(href: string | null, expectedPath: string): boolean {
  if (!href) return false;
  return href === expectedPath || href.startsWith(`${expectedPath}?`);
}

test.describe("<head> のアイコン link", () => {
  test("/ に icon（svg と png）と apple-touch-icon の link が出ること", async ({ page }) => {
    // dev サーバーでは初回アクセス時にページをコンパイルするため、余裕を持たせる
    test.setTimeout(120_000);

    const response = await page.goto("/", { timeout: 90_000 });
    expect(response?.status()).toBe(200);

    const links: LinkInfo[] = await page
      .locator('head link[rel="icon"], head link[rel="apple-touch-icon"]')
      .evaluateAll((elements) =>
        elements.map((el) => ({
          rel: el.getAttribute("rel"),
          href: el.getAttribute("href"),
          type: el.getAttribute("type"),
        }))
      );

    const icons = links.filter((link) => link.rel === "icon");
    expect(icons.length).toBeGreaterThan(0);

    // モダンブラウザ向けの SVG アイコン
    expect(
      icons.some((link) => link.type === "image/svg+xml" && hrefIs(link.href, "/icon.svg"))
    ).toBe(true);

    // SVG 非対応ブラウザ向けの PNG アイコン
    expect(icons.some((link) => hrefIs(link.href, "/icon.png"))).toBe(true);

    // iOS のホーム画面用
    const appleIcons = links.filter((link) => link.rel === "apple-touch-icon");
    expect(appleIcons.length).toBeGreaterThan(0);
    expect(appleIcons.some((link) => hrefIs(link.href, "/apple-icon.png"))).toBe(true);
  });
});

const ICON_ROUTES = [
  { pathname: "/icon.svg", contentType: /^image\/svg\+xml/ },
  { pathname: "/icon.png", contentType: /^image\/png/ },
  { pathname: "/apple-icon.png", contentType: /^image\/png/ },
  // favicon.ico の Content-Type はサーバーにより x-icon / vnd.microsoft.icon のどちらかになる
  { pathname: "/favicon.ico", contentType: /^image\/(x-icon|vnd\.microsoft\.icon)/ },
] as const;

test.describe("アイコン URL の配信", () => {
  for (const route of ICON_ROUTES) {
    test(`${route.pathname} が 200 で ${route.contentType.source} の Content-Type を返すこと`, async ({
      request,
    }) => {
      const response = await request.get(route.pathname, { timeout: 90_000 });
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"] ?? "").toMatch(route.contentType);
    });
  }

  test("/icon.svg の path が public/brand/mark.svg と同じであること（古いアイコンが配信されていない）", async ({
    request,
  }) => {
    const markSvg = fs.readFileSync(path.join(process.cwd(), "public", "brand", "mark.svg"), "utf8");
    const pathData = /(?:^|\s)d="([^"]*)"/.exec(markSvg)?.[1];
    expect(pathData).toBeTruthy();

    const response = await request.get("/icon.svg", { timeout: 90_000 });
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain(`d="${pathData}"`);
  });
});
