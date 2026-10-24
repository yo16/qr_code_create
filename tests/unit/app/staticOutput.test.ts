/**
 * @jest-environment node
 */
// 静的出力（qr_code_create-01z.1）: ルートレイアウトを (ja) と en に分割した後も、
// 主要ページが静的 HTML として出力され、動的レンダリングを招く API を使っていないことを固定する。
// ビルド成果物のブロックは .next/server/app が無ければ skip（REQUIRE_BUILD_OUTPUT=1 なら fail）。
import fs from "fs";
import path from "path";
import { en } from "@/i18n/en";
import { enClient } from "@/i18n/enClient";

const ROOT = process.cwd();
const APP = path.join(ROOT, "src", "app");
const BUILD_APP = path.join(ROOT, ".next", "server", "app");

// 前提: このブロックは `npm run build` の成果物（.next/server/app）に依存する。
// - .next/server/app が無ければ skip する（ビルドしていない環境で jest 全件を回せるように）。
// - 環境変数 REQUIRE_BUILD_OUTPUT=1 のときは skip せず、成果物が無ければ
//   「`npm run build` 後に実行してください」で fail する（ビルド後の検証で使う）。
// 下の「動的レンダリングを招く API」ブロックはソースだけを読むので常に実行する。
const REQUIRE_BUILD_OUTPUT = process.env.REQUIRE_BUILD_OUTPUT === "1";
const describeBuildOutput =
  REQUIRE_BUILD_OUTPUT || fs.existsSync(BUILD_APP) ? describe : describe.skip;

describeBuildOutput("ビルド成果物の静的 HTML", () => {
  it.each(["index.html", "en.html", "create.html", "guide/getting-started.html"])(
    ".next/server/app/%s が存在すること",
    (file) => {
      const full = path.join(BUILD_APP, ...file.split("/"));
      if (!fs.existsSync(full)) {
        throw new Error(
          `${full} がありません。静的に出力されていないか、ビルド前です。\`npm run build\` 後に実行してください。`
        );
      }
      expect(fs.existsSync(full)).toBe(true);
    }
  );

  // 意図（qr_code_create-01z.5）: 英語ガイドが lang="en" の静的 HTML として出力され、
  // 英語の MDX が無い slug（utm-setup）は dynamicParams = false で生成されない
  it("en/guide/getting-started.html が lang=\"en\" で生成されていること", () => {
    const full = path.join(BUILD_APP, "en", "guide", "getting-started.html");
    if (!fs.existsSync(full)) {
      throw new Error(`${full} がありません。\`npm run build\` 後に実行してください。`);
    }
    const html = fs.readFileSync(full, "utf8");
    expect(html).toMatch(/<html[^>]*\slang="en"/);
    expect(html).toContain("Getting started");
  });

  // 意図: MDX 本文が実際に描画されている（タイトルや CTA など MDX 外の部品だけで素通りしない）。
  // 本文の h2 と、本文中のリンク（ヘッダーや ArticleCta の /en/create はクラス付きなので、
  // クラスなし・本文の文言付きのアンカーで本文由来に限定する）を確かめる
  it("en/guide/getting-started.html に MDX 本文の h2 と本文中の /en/create リンクがあること", () => {
    const full = path.join(BUILD_APP, "en", "guide", "getting-started.html");
    if (!fs.existsSync(full)) {
      throw new Error(`${full} がありません。\`npm run build\` 後に実行してください。`);
    }
    const html = fs.readFileSync(full, "utf8");
    expect(html).toMatch(/<h2[^>]*>What QR Code Create does<\/h2>/);
    expect(html).toContain('<a href="/en/create">Open the QR code generator</a>');
  });

  it("en/guide/utm-setup.html が生成されていないこと", () => {
    // 対照: ja 側の utm-setup は生成されている（パスの組み立て違いで素通りしない）
    expect(fs.existsSync(path.join(BUILD_APP, "guide", "utm-setup.html"))).toBe(true);
    expect(fs.existsSync(path.join(BUILD_APP, "en", "guide", "utm-setup.html"))).toBe(false);
  });

  // 意図（qr_code_create-01z.4）: en の文言が Client バンドル（.next/static）に入っていない。
  // en は getDict 経由で Server からだけ読まれ、Client へは RSC ペイロード（HTML 内）で渡る想定。
  // needle は辞書から導出し、Server スライス（hero の説明文）と Client スライス（ボタン・aria-label・ラベル）の両方を含める。
  const SERVER_NEEDLES = [en.home.hero.description];
  const CLIENT_NEEDLES = [
    enClient.tool.download.pngButton,
    enClient.tool.qrPreview.ariaGenerated,
    enClient.decoration.caption.textLabel,
  ];

  // 意図: 対照。同じ文字列がサーバー出力の HTML には入っている（needle が正しく、空振りでない）
  it("対照: needle が .next/server/app の en.html / en/create.html に含まれること", () => {
    const enHtml = fs.readFileSync(path.join(BUILD_APP, "en.html"), "utf8");
    const createHtml = fs.readFileSync(path.join(BUILD_APP, "en", "create.html"), "utf8");
    for (const n of SERVER_NEEDLES) expect(enHtml).toContain(n);
    for (const n of CLIENT_NEEDLES) expect(createHtml).toContain(n);
  });

  it(".next/static に en 固有の文字列（Server / Client スライスの代表）が無いこと", () => {
    const STATIC = path.join(ROOT, ".next", "static");
    if (!fs.existsSync(STATIC)) {
      throw new Error(`${STATIC} がありません。\`npm run build\` 後に実行してください。`);
    }
    const walk = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full);
        return /\.(js|html|json|txt)$/.test(entry.name) ? [full] : [];
      });
    const files = walk(STATIC);
    expect(files.length).toBeGreaterThan(0);
    const needles = [...SERVER_NEEDLES, ...CLIENT_NEEDLES];
    const hits = files.flatMap((file) => {
      const text = fs.readFileSync(file, "utf8");
      return needles
        .filter((n) => text.includes(n))
        .map((n) => `${path.relative(ROOT, file)}: ${n}`);
    });
    expect(hits).toEqual([]);
  });
});

describe("動的レンダリングを招く API を使っていないこと", () => {
  const DYNAMIC_API = /\bheaders\(|\bcookies\(|\bsearchParams\b/;

  const listFiles = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return listFiles(full);
      return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
    });

  const targets = [
    ...listFiles(path.join(APP, "en")),
    path.join(ROOT, "src", "components", "layout", "RootShell", "RootShell.tsx"),
    path.join(APP, "(ja)", "layout.tsx"),
  ];

  it("対象ファイルが 1 件以上あること", () => {
    expect(targets.length).toBeGreaterThan(2);
  });

  it.each(targets.map((t) => [path.relative(ROOT, t), t]))(
    "%s に headers( / cookies( / searchParams が無いこと",
    (_label, file) => {
      expect(fs.readFileSync(file, "utf8")).not.toMatch(DYNAMIC_API);
    }
  );
});
