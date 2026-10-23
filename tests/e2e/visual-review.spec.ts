import { test, expect } from "@playwright/test";
import path from "path";

/**
 * 目視レビュー用スクリーンショット（デザインブラッシュアップ qr_code_create-h58）。
 *
 * 主要ページをモバイル幅とデスクトップ幅で全画面撮影し、
 * `tmp/screenshots/{SCREENSHOT_LABEL（既定: review）}/{slug}-{mobile|desktop}.png` に保存する。
 * 作業前は `SCREENSHOT_LABEL=before`、作業後は `SCREENSHOT_LABEL=after` で実行して見比べる。
 *
 * アサーションはページが 200 で表示されることのみ（見た目の良し悪しは人が判断する）。
 * ファイル名を `.spec.ts` にしているのは、Jest の testMatch（*.test.ts）に拾われないようにするため。
 */

const LABEL = process.env.SCREENSHOT_LABEL ?? "review";
const OUT_DIR = path.join(process.cwd(), "tmp", "screenshots", LABEL);

const PAGES = [
  "/",
  "/create",
  "/guide",
  "/guide/getting-started",
  "/use-cases",
  "/faq",
  "/blog",
] as const;

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 900 },
] as const;

/** `/` は `top`、それ以外はパスの `/` を `-` に置換したものをファイル名の slug にする */
function toSlug(pathname: string): string {
  if (pathname === "/") return "top";
  return pathname.replace(/^\//, "").replace(/\//g, "-");
}

for (const viewport of VIEWPORTS) {
  for (const pathname of PAGES) {
    test(`${pathname} を ${viewport.name}（${viewport.width}x${viewport.height}）で撮影する`, async ({
      page,
    }) => {
      // dev サーバーでは初回アクセス時にページをコンパイルするため、余裕を持たせる
      test.setTimeout(120_000);

      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      const response = await page.goto(pathname, { timeout: 90_000 });
      expect(response?.status()).toBe(200);

      await page.waitForLoadState("networkidle");

      await page.screenshot({
        path: path.join(OUT_DIR, `${toSlug(pathname)}-${viewport.name}.png`),
        fullPage: true,
      });
    });
  }
}
