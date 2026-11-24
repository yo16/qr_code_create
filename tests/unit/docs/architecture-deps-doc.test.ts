/**
 * @jest-environment node
 */
// qr_code_create-p05: doc/design/architecture.md の依存の版が package.json と食い違わないこと
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const NL = String.fromCharCode(10);
const DOC = fs.readFileSync(path.join(ROOT, "doc/design/architecture.md"), "utf-8");
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8")) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

// 1.2 の表の「技術」列の表示名 -> package.json の名前
const NAME_MAP: Record<string, string> = {
  "Next.js (App Router)": "next",
  TypeScript: "typescript",
  "qrcode (npm)": "qrcode",
  jsPDF: "jspdf",
  html2canvas: "html2canvas",
  "gray-matter": "gray-matter",
  "next-mdx-remote": "next-mdx-remote",
  "remark-gfm": "remark-gfm",
};

// ---- 検査の関数（純粋） ----
export function sectionBetween(text: string, startHeading: string, headingPrefix: string): string {
  const start = text.indexOf(startHeading);
  if (start === -1) return "";
  const rest = text.slice(start + startHeading.length);
  const m = new RegExp("^" + headingPrefix, "m").exec(rest);
  return m ? rest.slice(0, m.index) : rest;
}

const SEMVER_RE = /\^?~?\d+\.\d+\.\d+/;

// 1.3 の節の問題を返す（空配列なら問題なし）
export function checkDepsSection(section: string, deps: Record<string, string>): string[] {
  const problems: string[] = [];
  if (section.trim() === "") problems.push("節が空、または見つからない");
  if (/```\s*json/i.test(section)) problems.push("json のコードブロックがある");
  if (SEMVER_RE.test(section)) problems.push("版の番号らしい文字列がある");
  if (!section.includes("package.json")) problems.push("package.json への言及が無い");
  const line = section.split(NL).find((l) => l.startsWith("主な依存は"));
  if (!line) {
    problems.push("「主な依存は」の行が無い");
  } else {
    const names = line
      .replace("主な依存は", "")
      .split("。")[0]
      .split("、")
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length === 0) problems.push("依存の名前が並んでいない");
    for (const n of names) {
      if (!(n in deps)) problems.push("package.json の dependencies に無い: " + n);
    }
  }
  return problems;
}

function versionSegments(v: string): string[] {
  return v.replace(/^[\^~]/, "").split(".");
}

// 文書の版（N.x / N.M.x）が package.json の版の前方一致か
export function versionMatches(docVersion: string, pkgVersion: string): boolean {
  const doc = docVersion.split(".");
  if (doc[doc.length - 1] !== "x" || doc.length < 2) return false;
  const want = doc.slice(0, -1);
  if (!want.every((s) => /^\d+$/.test(s))) return false;
  const have = versionSegments(pkgVersion);
  return want.every((s, i) => have[i] === s);
}

// 1.2 の表の問題を返す
export function checkStackTable(
  section: string,
  all: Record<string, string>,
  nameMap: Record<string, string>,
): string[] {
  const problems: string[] = [];
  const rows = section
    .split(NL)
    .filter((l) => l.trim().startsWith("|"))
    .map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()))
    .filter((c) => c.length >= 3 && c[0] !== "カテゴリ" && !/^-+$/.test(c[0]));
  for (const cells of rows) {
    const [, tech, version] = cells;
    if (version === "-") continue;
    const pkgName = nameMap[tech];
    if (!pkgName) {
      problems.push("対応表に無い行に版がある: " + tech);
      continue;
    }
    const pkgVersion = all[pkgName];
    if (!pkgVersion) {
      problems.push("package.json に無い: " + pkgName);
    } else if (!versionMatches(version, pkgVersion)) {
      problems.push(`版が食い違う: ${tech} 文書=${version} package.json=${pkgVersion}`);
    }
  }
  return problems;
}

const ALL_DEPS = { ...PKG.devDependencies, ...PKG.dependencies };
const SEC_13 = sectionBetween(DOC, "### 1.3 依存ライブラリ詳細", "(?:#{1,3} |---[ \\t\\r]*$)");
const SEC_12 = sectionBetween(DOC, "### 1.2 技術スタック", "#{1,3} ");

describe("doc/design/architecture.md の依存", () => {
  describe("1.3 依存ライブラリ詳細", () => {
    it("節が見つかること", () => {
      expect(SEC_13.trim()).not.toBe("");
    });

    it("json のコードブロックと、版の番号らしい文字列が無いこと", () => {
      expect(SEC_13).not.toMatch(/```\s*json/i);
      expect(SEC_13).not.toMatch(SEMVER_RE);
    });

    it("package.json を正とする旨が書かれていること", () => {
      expect(SEC_13).toContain("package.json");
    });

    it("並べた依存の名前がすべて package.json の dependencies にあること", () => {
      expect(checkDepsSection(SEC_13, PKG.dependencies)).toEqual([]);
    });
  });

  describe("1.2 技術スタックの表", () => {
    it("版を書いた行が、package.json の版の前方一致になっていること", () => {
      expect(checkStackTable(SEC_12, ALL_DEPS, NAME_MAP)).toEqual([]);
    });

    it("版を書いた行を 1 行以上検査していること", () => {
      const checked = Object.keys(NAME_MAP).filter((k) => SEC_12.includes("| " + k + " |"));
      expect(checked.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("負のテスト", () => {
    it("古い「jsPDF | 2.5.x」の行を食い違いとして検出すること", () => {
      const table = "| カテゴリ | 技術 | バージョン | 用途 |" + NL + "|---|---|---|---|" + NL + "| PDF出力 | jsPDF | 2.5.x | PDF |";
      expect(checkStackTable(table, ALL_DEPS, NAME_MAP)).toHaveLength(1);
      expect(versionMatches("2.5.x", "^4.2.1")).toBe(false);
      expect(versionMatches("4.x", "^4.2.1")).toBe(true);
      expect(versionMatches("1.4.x", "^1.4.1")).toBe(true);
      expect(versionMatches("1.5.x", "^1.4.1")).toBe(false);
      expect(versionMatches("5.x", "^5")).toBe(true);
      expect(versionMatches("1.x", "^16.4.6")).toBe(false);
      expect(versionMatches("16.x", "^16.4.6")).toBe(true);
      expect(versionMatches("4.x", "^14.0.0")).toBe(false);
    });

    it("表（|---|）を含む節でも、水平線か次の見出しまで切り出すこと", () => {
      const text = ["### A", "|a|b|", "|---|---|", "|1|2|", "後ろの文", "---", "水平線の後", "### B"].join(NL);
      const sec = sectionBetween(text, "### A", "(?:#{1,3} |---[ \\t\\r]*$)");
      expect(sec).toContain("|1|2|");
      expect(sec).toContain("後ろの文");
      expect(sec).not.toContain("水平線の後");
      const sec2 = sectionBetween(["### A", "|---|", "x", "### B", "y"].join(NL), "### A", "(?:#{1,3} |---[ \\t\\r]*$)");
      expect(sec2).toContain("x");
      expect(sec2).not.toContain("y");
    });

    it("対応表に無い行に版が書かれていると検出し、版が「-」の行は無視すること", () => {
      const row = (v: string) => "| 新規 | NewLib | " + v + " | 用途 |";
      expect(checkStackTable(row("1.x"), ALL_DEPS, NAME_MAP)).toHaveLength(1);
      expect(checkStackTable(row("-"), ALL_DEPS, NAME_MAP)).toEqual([]);
    });

    it("json ブロックと semver が入った 1.3 を検出すること", () => {
      const bad = "package.json を正とする。" + NL + "```json" + NL + '{ "next": "^16.4.6" }' + NL + "```" + NL + "主な依存は next。";
      const problems = checkDepsSection(bad, PKG.dependencies);
      expect(problems).toContain("json のコードブロックがある");
      expect(problems).toContain("版の番号らしい文字列がある");
    });

    it("package.json への言及が無い 1.3 を検出すること", () => {
      expect(checkDepsSection("主な依存は next。", PKG.dependencies)).toContain("package.json への言及が無い");
    });

    it("package.json に無い依存名を検出すること", () => {
      const bad = "package.json を正とする。" + NL + "主な依存は next、no-such-lib。";
      expect(checkDepsSection(bad, PKG.dependencies)).toEqual(["package.json の dependencies に無い: no-such-lib"]);
    });

    it("正しい 1.3 は問題なしになること", () => {
      const ok = "package.json を正とする。" + NL + "主な依存は next、react。";
      expect(checkDepsSection(ok, PKG.dependencies)).toEqual([]);
    });
  });
});
