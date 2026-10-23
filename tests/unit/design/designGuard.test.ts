import fs from "fs";
import path from "path";

/**
 * デザインブラッシュアップ（qr_code_create-h58）のガードテスト。
 *
 * 「AI 生成風の既定値」の兆候（Tailwind 既定パレット、グラデーション背景、
 * !important、ホバーの浮き上がり、絵文字アイコン）がソースに残っていないことを
 * ファイル走査で検証する。新しい依存は入れず、Node の fs による自前の再帰走査で
 * glob 相当を実現する。
 *
 * TDD: 修正前（2026-10-23 時点）はすべて失敗し、web-designer の修正後に成功する。
 */

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

/** 失敗メッセージを読みやすくするため、ルートからの相対パス（POSIX 区切り）にする */
function rel(filePath: string): string {
  return path.relative(ROOT, filePath).split(path.sep).join("/");
}

/**
 * dir 直下（recursive=false）または配下すべて（recursive=true）を走査し、
 * predicate に合うファイルの絶対パスをソートして返す（glob 相当の自前実装）
 */
function listFiles(
  dir: string,
  predicate: (fileName: string) => boolean,
  recursive: boolean
): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) {
        results.push(...listFiles(full, predicate, true));
      }
    } else if (entry.isFile() && predicate(entry.name)) {
      results.push(full);
    }
  }
  return results.sort();
}

const isModuleCss = (fileName: string): boolean =>
  fileName.endsWith(".module.css");
const isTsx = (fileName: string): boolean => fileName.endsWith(".tsx");

function read(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

/** CSS コメントを除去する（コメント内の記述を誤検出しないため） */
function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * `:hover` を含むセレクタの `{ ... }` ブロックを列挙する簡易パーサ。
 * セレクタ部・本体部ともに `{` `}` を含まない範囲でマッチさせるため、
 * `@media { .card:hover { ... } }` のような入れ子でも内側のブロックだけを取り出せる。
 */
function extractHoverBlocks(
  css: string
): { selector: string; body: string }[] {
  const source = stripCssComments(css);
  const blocks: { selector: string; body: string }[] = [];
  const re = /([^{}]*:hover[^{}]*)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    blocks.push({ selector: match[1].trim(), body: match[2] });
  }
  return blocks;
}

/** 絵文字・絵文字候補の記号（Unicode の Extended_Pictographic プロパティ） */
const PICTOGRAPHIC = /\p{Extended_Pictographic}/gu;

describe("デザインガード: globals.css のデザイントークン", () => {
  // 意図: Tailwind の既定パレットをそのまま使うと「既定値のまま」に見えるため、
  // 自分で選んだ色に置き換えたことを、既定 hex 値が存在しないことで確認する
  const TAILWIND_DEFAULT_HEX = [
    "#2563eb", // blue-600
    "#1d4ed8", // blue-700
    "#dbeafe", // blue-100
    "#7c3aed", // violet-600
    "#6b7280", // gray-500
    "#e5e7eb", // gray-200
    "#f9fafb", // gray-50
    "#171717", // neutral-900
  ];

  it("src/app/globals.css に Tailwind 既定の hex 値が含まれないこと（大文字小文字を問わない）", () => {
    const css = read(path.join(SRC, "app", "globals.css")).toLowerCase();
    const found = TAILWIND_DEFAULT_HEX.filter((hex) => css.includes(hex));
    expect(found).toEqual([]);
  });
});

describe("デザインガード: トップページのセクション CSS", () => {
  // 意図: 淡いグラデーション背景は AI 生成風の典型的な兆候なので、
  // トップページのセクション（Hero / Features / Cta）の CSS Modules から排除する
  it("src/components/top/*.module.css に linear-gradient がないこと", () => {
    const files = listFiles(
      path.join(SRC, "components", "top"),
      isModuleCss,
      false
    );
    expect(files.length).toBeGreaterThan(0);

    const violations = files
      .filter((file) => stripCssComments(read(file)).includes("linear-gradient"))
      .map(rel);
    expect(violations).toEqual([]);
  });
});

describe("デザインガード: !important の排除", () => {
  // 意図: !important は場当たり的な上書きの痕跡であり、後からの統一的なメンテナンスを妨げる。
  // 修飾クラスや CSS 変数で置き換え、全 CSS Modules からなくす。
  // ただし QrGeneratorSkeleton のシマー用グラデーションは機能的なものなので対象外とする。
  const EXCLUDED_FILES = ["QrGeneratorSkeleton.module.css"];

  it("src/**/*.module.css（QrGeneratorSkeleton を除く）に !important がないこと", () => {
    const files = listFiles(SRC, isModuleCss, true).filter(
      (file) => !EXCLUDED_FILES.includes(path.basename(file))
    );
    expect(files.length).toBeGreaterThan(0);

    const violations: string[] = [];
    for (const file of files) {
      const lines = stripCssComments(read(file)).split(/\r?\n/);
      lines.forEach((line, index) => {
        if (line.includes("!important")) {
          violations.push(`${rel(file)}:${index + 1}: ${line.trim()}`);
        }
      });
    }
    expect(violations).toEqual([]);
  });
});

describe("デザインガード: 一覧カードのホバー挙動", () => {
  // 意図: カードがホバーで浮き上がる（translateY + 影）演出は既定値感が強いため、
  // マーケティングページ配下の CSS Modules では、:hover ブロック内で translateY を使わない
  // （色変化・下線などの静かなフィードバックに置き換える）
  it("src/app/(marketing)/**/*.module.css の :hover ブロック内に translateY( がないこと", () => {
    const files = listFiles(
      path.join(SRC, "app", "(marketing)"),
      isModuleCss,
      true
    );
    expect(files.length).toBeGreaterThan(0);

    const violations: string[] = [];
    for (const file of files) {
      for (const block of extractHoverBlocks(read(file))) {
        if (block.body.includes("translateY(")) {
          violations.push(`${rel(file)}: ${block.selector}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});

describe("デザインガード: 絵文字アイコンの排除", () => {
  // 意図: 機能カードなどの絵文字アイコンは「AI が作ったサイト」に見える典型例なので、
  // トップページのセクションとヘッダーの TSX に絵文字（Extended_Pictographic）を置かない
  it("src/components/top/*.tsx と src/components/layout/Header/*.tsx に絵文字がないこと", () => {
    const files = [
      ...listFiles(path.join(SRC, "components", "top"), isTsx, false),
      ...listFiles(
        path.join(SRC, "components", "layout", "Header"),
        isTsx,
        false
      ),
    ];
    expect(files.length).toBeGreaterThan(0);

    const violations: string[] = [];
    for (const file of files) {
      const chars = Array.from(new Set(read(file).match(PICTOGRAPHIC) ?? []));
      if (chars.length > 0) {
        violations.push(`${rel(file)}: ${chars.join(" ")}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
