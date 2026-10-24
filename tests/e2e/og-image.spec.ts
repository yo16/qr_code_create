import { test, expect, type Page } from "@playwright/test";

/**
 * OG 画像配信の E2E（qr_code_create-1ge）。
 *
 * SNS や ChatGPT のリンクプレビューは「<head> の og:image の URL を取りに行き、画像が返るか」で決まる。
 * この 2 点をそれぞれ検証する:
 * 1. `/` の <head> に og:image / og:image:width / og:image:height / twitter:image があり、
 *    既定の `/images/og/default.png` を指すこと
 * 2. `/images/og/default.png` が 200 と image/png を返し、本文が本当に 1200×630 の PNG であること
 * 3. `/guide` でも同じ既定画像を指すこと（buildMetadata.ts の既定値が全ページに効いている確認）
 *
 * og:image の content は `${NEXT_PUBLIC_SITE_URL}/images/og/default.png` の絶対 URL になり、
 * ドメインは環境で変わるので、パス部分（末尾）だけを照合する。
 *
 * 実行例（dev サーバーを 3100 で起動している場合）:
 *   npx playwright test --config tmp/playwright.favicon.config.ts tests/e2e/og-image.spec.ts
 */

/** buildMetadata.ts の ogImagePath の既定値 */
const OG_IMAGE_PATH = "/images/og/default.png";
/** OGP の推奨サイズ。buildMetadata.ts の宣言値と同じ */
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/** PNG ファイルの先頭 8 バイト（固定シグネチャ） */
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * PNG のバイト列から幅・高さを読む。
 * 構造: シグネチャ(8) → IHDR チャンク長(4) → "IHDR"(4) → 幅(4, BE) → 高さ(4, BE)
 */
function readPngSize(buf: Buffer): { width: number; height: number } {
  expect(buf.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)).toBe(true);
  expect(buf.subarray(12, 16).toString("ascii")).toBe("IHDR");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

type MetaInfo = {
  /** property 属性（og:*）または name 属性（twitter:*）の値 */
  key: string | null;
  content: string | null;
};

/** <head> の og:image 系と twitter:image の meta を集める */
async function collectImageMeta(page: Page): Promise<MetaInfo[]> {
  return page
    .locator('head meta[property^="og:image"], head meta[name="twitter:image"]')
    .evaluateAll((elements) =>
      elements.map((el) => ({
        key: el.getAttribute("property") ?? el.getAttribute("name"),
        content: el.getAttribute("content"),
      }))
    );
}

/** key が一致する meta の content を返す（複数あればすべて） */
function contentsOf(metas: MetaInfo[], key: string): (string | null)[] {
  return metas.filter((meta) => meta.key === key).map((meta) => meta.content);
}

test.describe("<head> の OG 画像メタ", () => {
  test("/ の og:image と twitter:image が既定の /images/og/default.png を指し、サイズが 1200×630 と宣言されること", async ({
    page,
  }) => {
    // dev サーバーでは初回アクセス時にページをコンパイルするため、余裕を持たせる
    test.setTimeout(120_000);

    const response = await page.goto("/", { timeout: 90_000 });
    expect(response?.status()).toBe(200);

    const metas = await collectImageMeta(page);

    // og:image は 1 つだけで、既定画像を指す。OGP の仕様上、絶対 URL であること
    const ogImages = contentsOf(metas, "og:image");
    expect(ogImages).toHaveLength(1);
    expect(ogImages[0]).toMatch(/^https?:\/\//);
    expect(ogImages[0]?.endsWith(OG_IMAGE_PATH)).toBe(true);

    // 宣言サイズは実ファイル（1200×630）と同じ値
    expect(contentsOf(metas, "og:image:width")).toEqual([String(OG_WIDTH)]);
    expect(contentsOf(metas, "og:image:height")).toEqual([String(OG_HEIGHT)]);

    // X（Twitter）のカードも同じ画像
    const twitterImages = contentsOf(metas, "twitter:image");
    expect(twitterImages).toHaveLength(1);
    expect(twitterImages[0]?.endsWith(OG_IMAGE_PATH)).toBe(true);
  });

  test("/guide でも og:image が同じ既定画像を指すこと（全ページ既定の確認）", async ({ page }) => {
    test.setTimeout(120_000);

    const response = await page.goto("/guide", { timeout: 90_000 });
    expect(response?.status()).toBe(200);

    const metas = await collectImageMeta(page);
    const ogImages = contentsOf(metas, "og:image");
    expect(ogImages).toHaveLength(1);
    expect(ogImages[0]?.endsWith(OG_IMAGE_PATH)).toBe(true);
  });
});

test.describe("OG 画像の配信", () => {
  test(`${OG_IMAGE_PATH} が 200 で image/png を返し、本文が 1200×630 の PNG であること`, async ({
    request,
  }) => {
    // 以前は .gitkeep しかなく 404 だった。ヘッダだけでなく本文の IHDR まで読み、
    // 空ファイルや別サイズの画像が置かれていないことまで確認する
    const response = await request.get(OG_IMAGE_PATH, { timeout: 90_000 });
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"] ?? "").toMatch(/^image\/png/);

    const body = await response.body();
    expect(body.length).toBeGreaterThan(PNG_SIGNATURE.length + 16);
    expect(readPngSize(body)).toEqual({ width: OG_WIDTH, height: OG_HEIGHT });
  });
});
