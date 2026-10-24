/**
 * scripts/og-template.html から OG 画像 public/images/og/default.png（1200x630）を生成する。
 * 実行: npm run build:og
 */
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS スクリプト */
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "scripts", "og-template.html"), "utf8");
const outFile = path.join(root, "public", "images", "og", "default.png");

async function main() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 630 },
      deviceScaleFactor: 1,
    });
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    const og = page.locator("#og");
    if ((await og.count()) === 0) {
      throw new Error("og-template.html に #og が見つかりません");
    }
    const buf = await og.screenshot();
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, buf);
    await page.close();
  } finally {
    await browser.close();
  }
  console.log("og image generated: public/images/og/default.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
