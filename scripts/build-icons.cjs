/**
 * public/brand/mark.svg から favicon / icon / apple-icon を生成する。
 * 実行: npm run build:icons
 */
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS スクリプト */
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const root = path.resolve(__dirname, "..");
const appDir = path.join(root, "src", "app");
const svg = fs
  .readFileSync(path.join(root, "public", "brand", "mark.svg"), "utf8")
  .replace(/<\?xml[^>]*\?>/, "")
  .trim();

/** SVG を size px で表示し、背景色 bg（null なら透明）の canvas px 四方で撮影する */
async function render(browser, { canvas, size, bg }) {
  const page = await browser.newPage({
    viewport: { width: canvas, height: canvas },
    deviceScaleFactor: 1,
  });
  const sizePattern = /width="32" height="32"/;
  if (!sizePattern.test(svg)) {
    throw new Error('mark.svg に width="32" height="32" が見つかりません');
  }
  const sized = svg.replace(sizePattern, `width="${size}" height="${size}"`);
  const background = bg ? bg : "transparent";
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:${background}">` +
      `<div id="c" style="width:${canvas}px;height:${canvas}px;display:flex;align-items:center;justify-content:center;background:${background}">${sized}</div>` +
      `</body></html>`,
  );
  const buf = await page.locator("#c").screenshot({ omitBackground: !bg });
  await page.close();
  return buf;
}

/** PNG を 1 枚だけ埋め込んだ ICO を作る（幅・高さは 256 未満） */
function wrapIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);
  entry.writeUInt8(size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}

async function main() {
  const browser = await chromium.launch();
  try {
    fs.writeFileSync(path.join(appDir, "icon.svg"), svg + "\n");

    const icon = await render(browser, { canvas: 48, size: 48, bg: null });
    fs.writeFileSync(path.join(appDir, "icon.png"), icon);

    const apple = await render(browser, { canvas: 180, size: 120, bg: "#ffffff" });
    fs.writeFileSync(path.join(appDir, "apple-icon.png"), apple);

    const fav = await render(browser, { canvas: 32, size: 32, bg: null });
    fs.writeFileSync(path.join(appDir, "favicon.ico"), wrapIco(fav, 32));
  } finally {
    await browser.close();
  }
  console.log("icons generated in src/app");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
