import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const TARGET_DIRS = [
  "src/components/qr",
  "src/components/ui",
  // T2b: トップ / 共通系
  "src/components/layout",
  "src/components/top",
  "src/components/marketing",
  "src/components/analytics",
];

/**
 * ひらがな・カタカナ・漢字（CJK 統合漢字）と、全角の記号・句読点
 * （CJK 記号 　-〿、全角英数・記号 ＀-￯。「、。！（）」など）
 */
const JAPANESE = /[　-〿぀-ゟ゠-ヿ一-鿿＀-￯]/;

/** ディレクトリ配下の .tsx を再帰的に列挙する */
function listTsx(dir: string): string[] {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) return listTsx(rel);
    return entry.isFile() && entry.name.endsWith(".tsx") ? [rel] : [];
  });
}

/**
 * コメント（// と /* *\/、JSX の {/* *\/} を含む）を空白に置き換える。
 * 文字列リテラル（' " `）の中の // は残す（URL などを誤って消さない）。
 * 改行は残すので、行番号は元のファイルと一致する。
 */
function stripComments(source: string): string {
  let out = "";
  let i = 0;
  let quote: string | null = null;
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    if (quote) {
      out += ch;
      if (ch === "\\") {
        out += next ?? "";
        i += 2;
        continue;
      }
      if (ch === quote) quote = null;
      i += 1;
      continue;
    }
    if (ch === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") {
        out += " ";
        i += 1;
      }
      continue;
    }
    if (ch === "/" && next === "*") {
      const end = source.indexOf("*/", i + 2);
      const stop = end === -1 ? source.length : end + 2;
      out += source.slice(i, stop).replace(/[^\n]/g, " ");
      i = stop;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    out += ch;
    i += 1;
  }
  return out;
}

describe("stripComments（検査用ヘルパーの確認）", () => {
  // 意図: 3 種類のコメントを消し、文字列中の // は残す
  it("コメントだけを消し、文字列の中身と行数は保つ", () => {
    const src = [
      'const a = "https://example.com"; // 説明',
      "/* 複数行",
      "   コメント */ const b = 1;",
      "<div>{/* JSX コメント */}</div>",
    ].join("\n");
    const stripped = stripComments(src);
    expect(stripped.split("\n")).toHaveLength(4);
    expect(stripped).toContain('"https://example.com"');
    expect(stripped).toContain("const b = 1;");
    expect(JAPANESE.test(stripped)).toBe(false);
  });

  // 意図: 文字列中の日本語は消さない（検出漏れを防ぐ）
  it("文字列中の日本語は残す", () => {
    expect(JAPANESE.test(stripComments('const a = "日本語";'))).toBe(true);
  });

  // 意図: 全角記号だけの直書き（「！」「（」など）も検出する
  it("全角記号だけの文字列も検出する", () => {
    expect(JAPANESE.test('const a = "！";')).toBe(true);
    expect(JAPANESE.test('const a = "（1）";')).toBe(true);
    expect(JAPANESE.test('const a = "、";')).toBe(true);
    expect(JAPANESE.test('const a = "a/b - c";')).toBe(false);
  });
});

describe("辞書化済みコンポーネントに日本語の直書きが無い", () => {
  const files = TARGET_DIRS.flatMap(listTsx);

  // 意図: 走査対象が空でない（パスの誤りで空振りしない）
  it("対象の .tsx を走査している", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  // 意図: 追加したディレクトリそれぞれが実際に走査されている（1 つでもパス誤りなら落ちる）
  it.each(TARGET_DIRS)("%s 配下の .tsx を 1 つ以上走査している", (dir) => {
    expect(files.some((f) => f.startsWith(`${dir}/`))).toBe(true);
  });

  // 意図: 文言は辞書（useDict）から引く。コメント以外に日本語が残っていたらファイルと行を出す
  it("コメントを除いた本文に日本語が無い", () => {
    const violations: string[] = [];
    for (const file of files) {
      const source = fs.readFileSync(path.join(ROOT, file), "utf8");
      stripComments(source)
        .split("\n")
        .forEach((line, index) => {
          if (JAPANESE.test(line)) {
            violations.push(`${file}:${index + 1}: ${line.trim()}`);
          }
        });
    }
    expect(violations).toEqual([]);
  });
});
