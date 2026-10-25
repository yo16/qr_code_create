import { test, expect, type Page } from "@playwright/test";
import path from "path";

/**
 * /create の QR プレビューの canvas が、親（role="img"）の枠に収まり、正方形で、幅が枠とほぼ等しいことを実測する
 * （qr_code_create-b0w）。qrcode の toCanvas は canvas にインラインで px の寸法を書き込むため、
 * スマホ幅の CSS（--preview-max）が効かずにはみ出さないかを確かめる。
 * `npm run build` のあと `npm run test:e2e:prod`（本番ビルド、ポート 3100）で流す。
 */

const OUT_DIR = path.join(process.cwd(), "tmp", "screenshots", "b0w");

interface Case {
  name: string;
  width: number;
  height: number;
  query: string;
  /** フレームを画像フレームにするためクリックするボタン名 */
  frameButton?: string;
}

const CASES: Case[] = [
  { name: "390-noframe", width: 390, height: 844, query: "" },
  { name: "390-canvasframe-business", width: 390, height: 844, query: "?preset=business" },
  { name: "390-canvasframe-rounded", width: 390, height: 844, query: "?preset=casual" },
  { name: "390-imageframe", width: 390, height: 844, query: "", frameButton: "フレーム: ブラック" },
  { name: "1280-noframe", width: 1280, height: 900, query: "" },
];

async function measure(page: Page) {
  return page.getByRole("img", { name: "生成されたQRコード" }).evaluate((frame) => {
    const canvas = frame.querySelector("canvas") as HTMLCanvasElement;
    const c = canvas.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    return {
      canvas: { l: c.left, t: c.top, r: c.right, b: c.bottom, w: c.width, h: c.height },
      frame: { l: f.left, t: f.top, r: f.right, b: f.bottom, w: f.width, h: f.height },
      inline: { w: canvas.style.width, h: canvas.style.height },
      attr: { w: canvas.width, h: canvas.height },
    };
  });
}

for (const c of CASES) {
  test(`/create の QR が枠に収まる: ${c.name}`, async ({ page }) => {
    await page.setViewportSize({ width: c.width, height: c.height });
    await page.goto(`/create${c.query}`);
    await page.getByPlaceholder("https://example.com").first().fill("https://example.com/");
    if (c.frameButton) {
      await page.getByRole("button", { name: c.frameButton }).click();
    }
    const qr = page.getByRole("img", { name: "生成されたQRコード" });
    await expect(qr).toBeVisible();
    // デバウンス（500ms）と描画の完了を待つ
    await page.waitForTimeout(1500);

    const m = await measure(page);
    console.log(`[${c.name}] ${JSON.stringify(m)}`);

    await page.screenshot({ path: path.join(OUT_DIR, `create-${c.name}.png`), fullPage: false });
    await qr.screenshot({ path: path.join(OUT_DIR, `create-${c.name}-closeup.png`) });

    const tolerance = 1;
    expect(m.canvas.w).toBeGreaterThan(20);
    expect(m.canvas.l).toBeGreaterThanOrEqual(m.frame.l - tolerance);
    expect(m.canvas.t).toBeGreaterThanOrEqual(m.frame.t - tolerance);
    expect(m.canvas.r).toBeLessThanOrEqual(m.frame.r + tolerance);
    expect(m.canvas.b).toBeLessThanOrEqual(m.frame.b + tolerance);
    expect(Math.abs(m.canvas.w - m.canvas.h)).toBeLessThanOrEqual(2);
    expect(Math.abs(m.canvas.w - m.frame.w)).toBeLessThanOrEqual(3);
  });
}
