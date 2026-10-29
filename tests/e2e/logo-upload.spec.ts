import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * ロゴのアップロードの E2E（qr_code_create-ljk）。
 * SVG の PNG 化は canvas と Image を使うため、jsdom ではなく実ブラウザで確かめる。
 * `npm run build` のあと `npm run test:e2e:prod`（本番ビルド、ポート 3100）で流す。
 */

const OUT_DIR = path.join(process.cwd(), "tmp", "screenshots", "ljk");
const PNG_BUTTON = "PNG形式でダウンロード";
const UNSUPPORTED = "対応していない形式のファイルです。";
const CONVERT_FAILED = "画像を読み込めませんでした。別のファイルをお試しください。";
const REMOVE_LOGO = "ロゴを削除";

const SIMPLE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60">' +
  '<rect width="120" height="60" fill="#d33"/><circle cx="60" cy="30" r="20" fill="#fff"/></svg>';

const FOREIGN_OBJECT_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">' +
  '<foreignObject width="100" height="100">' +
  '<div xmlns="http://www.w3.org/1999/xhtml" style="background:#36c;color:#fff;font-size:20px">Hi</div>' +
  "</foreignObject></svg>";

// 8x8 の赤い PNG
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAEklEQVR4nGP8z8Dwn4EIwDiqEAB3pAf9dQKJWQAAAABJRU5ErkJggg==";

function pngBuffer(): Buffer {
  return Buffer.from(PNG_BASE64, "base64");
}

async function openCreateWithUrl(page: Page): Promise<void> {
  await page.goto("/create");
  await page.getByPlaceholder("https://example.com").first().fill("https://example.com/logo");
  await expect(page.getByLabel("生成されたQRコード")).toBeVisible({ timeout: 30_000 });
}

function logoInput(page: Page) {
  return page.locator('input[type="file"]').first();
}

async function downloadPng(page: Page, saveAs: string): Promise<number> {
  const button = page.getByRole("button", { name: PNG_BUTTON });
  await expect(button).toBeEnabled();
  const [download] = await Promise.all([page.waitForEvent("download", { timeout: 30_000 }), button.click()]);
  expect(download.suggestedFilename()).toMatch(/\.png$/);
  const target = path.join(OUT_DIR, saveAs);
  await download.saveAs(target);
  const bytes = fs.readFileSync(target);
  expect(bytes.length).toBeGreaterThan(0);
  expect(bytes.subarray(1, 4).toString("latin1")).toBe("PNG");
  return bytes.length;
}

test.describe("ロゴのアップロード", () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  });

  test("SVG のロゴが受け付けられ、エラーが出ず、PNG をダウンロードできる", async ({ page }) => {
    await openCreateWithUrl(page);
    await logoInput(page).setInputFiles({
      name: "mark.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(SIMPLE_SVG),
    });

    const thumb = page.getByAltText("ロゴ: mark.svg");
    await expect(thumb).toBeVisible({ timeout: 15_000 });
    // 保持される dataURL は PNG に変換されている
    await expect(thumb).toHaveAttribute("src", /^data:image\/png;base64,/);
    await expect(page.getByRole("button", { name: REMOVE_LOGO })).toBeVisible();
    await expect(page.getByText(CONVERT_FAILED)).toHaveCount(0);
    await expect(page.getByText(UNSUPPORTED)).toHaveCount(0);

    const size = await downloadPng(page, "svg-logo.png");
    expect(size).toBeGreaterThan(100);
  });

  test("対照: PNG のロゴも受け付けられ、PNG をダウンロードできる", async ({ page }) => {
    await openCreateWithUrl(page);
    await logoInput(page).setInputFiles({ name: "mark.png", mimeType: "image/png", buffer: pngBuffer() });

    const thumb = page.getByAltText("ロゴ: mark.png");
    await expect(thumb).toBeVisible({ timeout: 15_000 });
    await expect(thumb).toHaveAttribute("src", /^data:image\/png;base64,/);
    await expect(page.getByText(UNSUPPORTED)).toHaveCount(0);
    await downloadPng(page, "png-logo.png");
  });

  test("text/html のファイルは受け付けられず、unsupportedType の文言が出る", async ({ page }) => {
    await openCreateWithUrl(page);
    await logoInput(page).setInputFiles({
      name: "evil.html",
      mimeType: "text/html",
      buffer: Buffer.from("<script>alert(1)</script>"),
    });

    await expect(page.getByText(UNSUPPORTED)).toBeVisible();
    await expect(page.getByAltText("ロゴ: evil.html")).toHaveCount(0);
    await expect(page.getByRole("button", { name: REMOVE_LOGO })).toHaveCount(0);
    // ロゴなしで PNG はダウンロードできる
    await downloadPng(page, "html-rejected.png");
  });

  test("foreignObject を含む SVG: 変換の成否を記録し、どちらでもダウンロードは壊れない", async ({ page }) => {
    await openCreateWithUrl(page);
    await logoInput(page).setInputFiles({
      name: "fo.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(FOREIGN_OBJECT_SVG),
    });

    const thumb = page.getByAltText("ロゴ: fo.svg");
    const failed = page.getByText(CONVERT_FAILED);
    await expect(thumb.or(failed)).toBeVisible({ timeout: 15_000 });
    const converted = await thumb.isVisible();
    test.info().annotations.push({
      type: "foreignObject の結果",
      description: converted ? "PNG 化に成功した" : "PNG 化に失敗し convertFailed が出た",
    });
    console.log(`foreignObject SVG: ${converted ? "converted to PNG" : "convertFailed shown"}`);

    if (converted) {
      await expect(thumb).toHaveAttribute("src", /^data:image\/png;base64,/);
    } else {
      await expect(page.getByRole("button", { name: REMOVE_LOGO })).toHaveCount(0);
    }
    await downloadPng(page, "foreign-object.png");
  });

  test("ロゴを付けたまま /poster へ進むと、ポスターに引き継がれる", async ({ page }) => {
    test.setTimeout(90_000);
    await openCreateWithUrl(page);
    await logoInput(page).setInputFiles({
      name: "mark.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(SIMPLE_SVG),
    });
    await expect(page.getByAltText("ロゴ: mark.svg")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /印刷用ポスターを作る/ }).click();
    await expect(page).toHaveURL(/\/poster$/);

    // 型ガードで弾かれずに、URL とロゴが引き継がれている
    await expect(page.getByLabel("QRコードに埋め込むURL")).toHaveValue("https://example.com/logo");
    await expect(page.getByLabel("適用される装飾")).toContainText("ロゴあり");
    await page.getByLabel("説明文（Markdown）").fill("## ロゴ付き");
    await expect(page.getByRole("button", { name: "PDFをダウンロード（A4印刷用）" })).toBeEnabled({
      timeout: 15_000,
    });
    await page.screenshot({ path: path.join(OUT_DIR, "poster-with-logo.png"), fullPage: true });
  });
});
