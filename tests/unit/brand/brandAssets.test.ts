/**
 * @jest-environment node
 */
import fs from "fs";
import path from "path";

/**
 * サービスのアイコン（qr_code_create-9zf）の資産ガードテスト。
 *
 * 元データ `public/brand/mark.svg` と、Next.js のメタデータファイル規約で置いた
 * `src/app/icon.svg` / `icon.png` / `apple-icon.png` / `favicon.ico` が
 * 要件（単色・パスのみ・正方形・所定サイズ）を満たしているかを、
 * 新しい依存を入れずに Node の fs でファイルを直接読んで検証する。
 *
 * PNG と ICO は画像ライブラリを使わず、ヘッダのバイト列から幅・高さを読む。
 */

const ROOT = process.cwd();
const MARK_SVG = path.join(ROOT, "public", "brand", "mark.svg");
const ICON_SVG = path.join(ROOT, "src", "app", "icon.svg");
const ICON_PNG = path.join(ROOT, "src", "app", "icon.png");
const APPLE_ICON_PNG = path.join(ROOT, "src", "app", "apple-icon.png");
const FAVICON_ICO = path.join(ROOT, "src", "app", "favicon.ico");
const BRAND_MARK_TSX = path.join(ROOT, "src", "components", "layout", "Header", "BrandMark.tsx");

/** ブランドの藍（--palette-indigo）。要件で指定された 1 色 */
const BRAND_INDIGO = "#1f5fbf";

/** PNG ファイルの先頭 8 バイト（固定シグネチャ） */
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** ICO のヘッダ長（6 バイト）+ ディレクトリエントリ 1 件（16 バイト）= 画像データの開始位置 */
const ICO_FIRST_IMAGE_OFFSET = 22;

/**
 * PNG のバイト列から幅・高さを読む。
 * 構造: シグネチャ(8) → IHDR チャンク長(4) → "IHDR"(4) → 幅(4, ビッグエンディアン) → 高さ(4, ビッグエンディアン)
 */
function readPngSize(buf: Buffer): { width: number; height: number } {
  expect(buf.subarray(12, 16).toString("ascii")).toBe("IHDR");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** 先頭 8 バイトが PNG シグネチャであることを確認する */
function expectPngSignature(buf: Buffer): void {
  expect(buf.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)).toBe(true);
}

/**
 * SVG / TSX ソースから `d="..."` 属性の値をすべて抜き出す。
 * `id="..."` を拾わないよう、直前が空白（または行頭）の d だけを対象にする。
 */
function extractPathData(source: string): string[] {
  return [...source.matchAll(/(?:^|\s)d="([^"]*)"/g)].map((m) => m[1]);
}

describe("public/brand/mark.svg（マークの元データ）", () => {
  const markSvg = fs.readFileSync(MARK_SVG, "utf8");

  it("public/brand/mark.svg と src/app/icon.svg が存在し、内容が同一であること", () => {
    // favicon 用の icon.svg は元データのコピー。片方だけ直して食い違うのを防ぐ
    expect(fs.existsSync(MARK_SVG)).toBe(true);
    expect(fs.existsSync(ICON_SVG)).toBe(true);
    expect(fs.readFileSync(ICON_SVG, "utf8")).toBe(markSvg);
  });

  it("viewBox が 0 0 32 32（正方形）であること", () => {
    expect(markSvg).toContain('viewBox="0 0 32 32"');
  });

  it("path 要素を 1 つ以上含むこと", () => {
    expect(markSvg.match(/<path\b/g)?.length ?? 0).toBeGreaterThanOrEqual(1);
  });

  it(`塗りがブランドの藍 ${BRAND_INDIGO} であること`, () => {
    expect(markSvg).toContain(`fill="${BRAND_INDIGO}"`);
  });

  it("text・filter・グラデーション・image を含まない（パスのみ、単色）こと", () => {
    // 要件: グラデーション、影、立体感なし。テキスト要素やフィルタなし
    expect(markSvg).not.toMatch(/<text\b/);
    expect(markSvg).not.toMatch(/<filter\b/);
    expect(markSvg).not.toMatch(/Gradient/);
    expect(markSvg).not.toMatch(/<image\b/);
  });

  it("ファイルサイズが 2KB 以下であること", () => {
    // 手描きの単純なパスなら数百バイトで収まる。肥大化はツール出力の混入を疑う
    expect(fs.statSync(MARK_SVG).size).toBeLessThanOrEqual(2048);
  });

  it("BrandMark.tsx の path の d が mark.svg の d と一致すること", () => {
    // ヘッダの inline SVG と favicon の元データで形がずれないことを保証する
    const svgPaths = extractPathData(markSvg);
    const tsxPaths = extractPathData(fs.readFileSync(BRAND_MARK_TSX, "utf8"));
    expect(svgPaths.length).toBeGreaterThanOrEqual(1);
    expect(tsxPaths).toEqual(svgPaths);
  });
});

describe("src/app/icon.png（既定 favicon.ico の置き換え）", () => {
  const buf = fs.readFileSync(ICON_PNG);

  it("PNG シグネチャで始まること", () => {
    expectPngSignature(buf);
  });

  it("48×48 であること", () => {
    // 要件: 32×32 または 48×48。実装は 48×48（1 モジュール 6px で画素に揃う）
    expect(readPngSize(buf)).toEqual({ width: 48, height: 48 });
  });
});

describe("src/app/apple-icon.png（apple-touch-icon）", () => {
  const buf = fs.readFileSync(APPLE_ICON_PNG);

  it("PNG シグネチャで始まること", () => {
    expectPngSignature(buf);
  });

  it("180×180 であること", () => {
    expect(readPngSize(buf)).toEqual({ width: 180, height: 180 });
  });
});

describe("src/app/favicon.ico（旧ブラウザ向け）", () => {
  const buf = fs.readFileSync(FAVICON_ICO);

  it("ICONDIR ヘッダが reserved=0, type=1（ICO）, count=1 であること", () => {
    // 先頭 6 バイト（リトルエンディアン）: reserved(2) / type(2) / count(2)
    expect(buf.readUInt16LE(0)).toBe(0);
    expect(buf.readUInt16LE(2)).toBe(1);
    expect(buf.readUInt16LE(4)).toBe(1);
  });

  it("エントリの幅・高さが 32 であること", () => {
    // ICONDIRENTRY: 幅(1) / 高さ(1) / 色数(1) / 予約(1) / planes(2) / bpp(2) / サイズ(4) / オフセット(4)
    // ICO では 0 が 256 を表すが、32 はそのまま 32 が入る
    expect(buf.readUInt8(6)).toBe(32);
    expect(buf.readUInt8(7)).toBe(32);
  });

  it("エントリのオフセットが 22 で、その位置に PNG シグネチャがあること（PNG 埋め込み ICO）", () => {
    expect(buf.readUInt32LE(18)).toBe(ICO_FIRST_IMAGE_OFFSET);
    expectPngSignature(buf.subarray(ICO_FIRST_IMAGE_OFFSET));
  });

  it("エントリの画像サイズがファイル末尾までの長さと一致し、埋め込み PNG も 32×32 であること", () => {
    // ヘッダの宣言と実データの不整合（切り詰め・余分なバイト）を検出する
    expect(buf.readUInt32LE(14)).toBe(buf.length - ICO_FIRST_IMAGE_OFFSET);
    expect(readPngSize(buf.subarray(ICO_FIRST_IMAGE_OFFSET))).toEqual({ width: 32, height: 32 });
  });
});

describe("OG 画像（qr_code_create-1ge）", () => {
  /** buildMetadata.ts が全ページの og:image / twitter:image の既定値として参照する画像 */
  const OG_PNG = path.join(ROOT, "public", "images", "og", "default.png");
  /** `npm run build:og` が Chromium でレンダリングして PNG 化する元の HTML */
  const OG_TEMPLATE_HTML = path.join(ROOT, "scripts", "og-template.html");
  /** OGP の推奨サイズ。buildMetadata.ts の openGraph.images の width / height と同じ値 */
  const OG_SIZE = { width: 1200, height: 630 };

  it("public/images/og/default.png が存在し、PNG シグネチャで始まること", () => {
    // 以前は .gitkeep しかなく 404 だった（タスクの発端）。SNS や ChatGPT のリンクプレビューで
    // 画像が出ない状態に戻らないよう、ファイルの存在と PNG であることを固定する
    expect(fs.existsSync(OG_PNG)).toBe(true);
    expectPngSignature(fs.readFileSync(OG_PNG));
  });

  it("default.png が 1200×630 であること", () => {
    // buildMetadata.ts は width: 1200, height: 630 と宣言して配信する。実ファイルと食い違うと
    // プレビューの切り抜きや縮尺が崩れるため、IHDR の幅・高さを宣言値と一致させる
    expect(readPngSize(fs.readFileSync(OG_PNG))).toEqual(OG_SIZE);
  });

  it("scripts/og-template.html が存在し、マークの path の d が public/brand/mark.svg と一致すること", () => {
    // テンプレートは mark.svg を読み込まず、同じ path を inline SVG として持つ（外部依存をなくすため）。
    // マークの形を変えたときにテンプレートだけ古いまま残り、再生成した OG 画像が
    // ヘッダや favicon と別の形になるのを防ぐ手動同期ガード
    expect(fs.existsSync(OG_TEMPLATE_HTML)).toBe(true);
    const svgPaths = extractPathData(fs.readFileSync(MARK_SVG, "utf8"));
    const templatePaths = extractPathData(fs.readFileSync(OG_TEMPLATE_HTML, "utf8"));
    expect(svgPaths.length).toBeGreaterThanOrEqual(1);
    expect(templatePaths).toEqual(svgPaths);
  });

  it("og-template.html が外部リソースを参照しないこと（link / script / http(s) URL / url()）", () => {
    // 生成をネットワークや CDN に依存させない。オフラインでも同じ PNG を再生成できることの保証。
    // inline SVG の xmlns 属性は名前空間の識別子であり通信は発生しないので、判定前に取り除く
    const html = fs
      .readFileSync(OG_TEMPLATE_HTML, "utf8")
      .replace(/\sxmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, "");
    expect(html).not.toMatch(/<link\b/i);
    expect(html).not.toMatch(/<script\b/i);
    expect(html).not.toContain("http://");
    expect(html).not.toContain("https://");
    expect(html).not.toContain("url(");
  });

  it('og-template.html に id="og" の要素があること', () => {
    // 生成スクリプトは page.locator("#og").screenshot() でこの要素だけを撮る。
    // id を変えると生成が失敗する（またはページ全体が撮られる）ので固定する
    expect(fs.readFileSync(OG_TEMPLATE_HTML, "utf8")).toContain('id="og"');
  });
});
