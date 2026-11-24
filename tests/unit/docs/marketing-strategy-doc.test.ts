/**
 * @jest-environment node
 */
// qr_code_create-qdq: doc/marketing-strategy.md の旧 URL・絵文字・出典のない統計と、日本語記事のダッシュ
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { NON_JA_LOCALES } from "@/i18n/locales";

const ROOT = process.cwd();
const NL = String.fromCharCode(10);
const DOC = fs.readFileSync(path.join(ROOT, "doc/marketing-strategy.md"), "utf-8");

// 旧 URL は tests/unit/seo/llms.test.ts が "vercel.app" を検査するので、このファイルでは分割して組み立てる
const OLD_HOST = ["qr-code-create", "vercel", "app"].join(".");
const OLD_URL = "https://" + OLD_HOST;
const VERCEL = ["vercel", "app"].join(".");

// ダッシュ: U+2014, U+2015, U+2500, U+2013
const DASH_RE = /[—―─–]/;
const DASH_JA_RE = /[—―]/;

// 意図して残す記号（評価の星表示 ★ ☆）。これ以外の絵文字は許さない
const EMOJI_ALLOW = new Set(["★", "☆"]);
const EMOJI_RE = /\p{Extended_Pictographic}/gu;

// ---- 検査の関数 ----
export function findEmoji(text: string): string[] {
  return (text.match(EMOJI_RE) ?? []).filter((c) => !EMOJI_ALLOW.has(c));
}

export function badSiteUrls(text: string): string[] {
  // qr-create.jp を指す URL のうち、https://qr-create.jp で始まらない、または二重スラッシュのもの
  const found = text.match(/\S*qr-create\.jp\S*/g) ?? [];
  return found.filter((u) => {
    if (/https?:\/\/https?:\/\//.test(u)) return true;
    const m = u.match(/https?:\/\/qr-create\.jp\S*/);
    if (!m) return !/^qr-create\.jp$/.test(u) && /\/\//.test(u);
    return !m[0].startsWith("https://qr-create.jp") || /^https:\/\/qr-create\.jp\/\//.test(m[0]);
  });
}

export function findDash(text: string, re: RegExp = DASH_RE): string[] {
  return text.split("").filter((c) => re.test(c));
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (NON_JA_LOCALES.includes(e.name as never)) continue;
      out.push(...walk(p));
    } else if (e.name.endsWith(".mdx")) out.push(p);
  }
  return out;
}

function section(text: string, heading: string): string {
  const start = text.indexOf(heading);
  if (start === -1) return "";
  const rest = text.slice(start + heading.length);
  const next = rest.indexOf(NL + "#### ");
  return next === -1 ? rest : rest.slice(0, next);
}

describe("doc/marketing-strategy.md", () => {
  describe("旧 URL", () => {
    it("スキーム付きの旧 URL が無いこと", () => {
      expect(DOC).not.toContain(OLD_URL);
    });

    it("旧ドメインの語を含む行が 1 行以上あり、すべての行が「記載しない」を含むこと", () => {
      const lines = DOC.split(NL).filter((l) => l.includes(VERCEL));
      expect(lines.length).toBeGreaterThanOrEqual(1);
      for (const l of lines) expect(l).toContain("記載しない");
    });

    it("スキームが二重になった URL（置換の事故）が無いこと", () => {
      expect(DOC).not.toContain("https://" + "https://");
    });
  });

  describe("このサイトの URL", () => {
    it("qr-create.jp を指す URL がすべて https://qr-create.jp で始まり、二重スラッシュが無いこと", () => {
      expect(badSiteUrls(DOC)).toEqual([]);
    });

    it("構造化データの例の URL（https://qr-create.jp/create）が残っていること", () => {
      expect(DOC.split("https://qr-create.jp/create").length - 1).toBeGreaterThanOrEqual(1);
    });

    it("負のテスト: 二重スラッシュ・http・スキーム違いの URL を検出すること", () => {
      expect(badSiteUrls("https://qr-create.jp//create")).toHaveLength(1);
      expect(badSiteUrls("http://qr-create.jp/create")).toHaveLength(1);
      expect(badSiteUrls("https://https://qr-create.jp/create")).toHaveLength(1);
      expect(badSiteUrls("https://qr-create.jp/create")).toEqual([]);
    });
  });

  describe("絵文字", () => {
    it("絵文字と「▶」が無いこと（★ ☆ のみ許可）", () => {
      expect(findEmoji(DOC)).toEqual([]);
      expect(DOC).not.toContain("▶");
    });

    it("負のテスト: 絵文字と ▶ を検出し、★ は許可すること", () => {
      expect(findEmoji("a 👇 b")).toHaveLength(1);
      expect(findEmoji("▶ x")).toHaveLength(1);
      expect(findEmoji("★☆")).toEqual([]);
    });
  });

  describe("出典のない統計", () => {
    // 消した 2 つの統計が出典を確かめないまま戻ることを防ぐ検査。
    // 出典を一次資料で確かめて載せ直すときは、この検査を更新する。
    it.each(["総務省", "情報通信白書", "中小企業白書", "中小企業庁"])("「%s」が無いこと", (w) => {
      expect(DOC).not.toContain(w);
    });

    it("「#### 3. 統計情報の引用」の節に、一次資料と出典を述べる方針の文があること", () => {
      const s = section(DOC, "#### 3. 統計情報の引用");
      expect(s).toContain("一次資料");
      expect(s).toContain("出典");
    });
  });
});

// qr_code_create-p05: 施策 7 の例文が実績の数値に見えないこと
export function socialProofProblems(sec: string): string[] {
  const problems: string[] = [];
  if (/\d\s*[%％]/.test(sec)) problems.push("数字 + % がある");
  if (!sec.includes("XX%")) problems.push("プレースホルダー XX% が無い");
  if (!sec.includes("実績")) problems.push("注記に「実績」の語が無い");
  return problems;
}

describe("doc/marketing-strategy.md 施策 7（ソーシャルプルーフ）", () => {
  const s = section(DOC, "#### 施策7");

  it("節が見つかること", () => {
    expect(s).not.toBe("");
  });

  it("「数字 + %」が無いこと", () => {
    expect(s).not.toMatch(/\d\s*[%％]/);
  });

  it("プレースホルダー「XX%」があること", () => {
    expect(s).toContain("XX%");
  });

  it("注記に「実績」の語があること", () => {
    expect(s).toContain("実績");
  });

  it("注記の趣旨「画面に出さない」が書かれていること", () => {
    expect(s).toContain("画面に出さない");
  });

  it("負のテスト: 「78%」に戻した文字列と、注記の無い文字列を検出すること", () => {
    expect(socialProofProblems("「ユーザーの78%がUTMパラメータを設定しています」")).toContain("数字 + % がある");
    expect(socialProofProblems("「ユーザーのXX%が設定」")).toContain("注記に「実績」の語が無い");
    expect(socialProofProblems("「ユーザーのXX%が設定」（実績の数値を入れる）")).toEqual([]);
    expect(socialProofProblems(s)).toEqual([]);
  });
});

describe("why-i-built-qr-code-create.mdx のダッシュ", () => {
  const file = path.join(ROOT, "src/content/blog/why-i-built-qr-code-create.mdx");
  const raw = fs.readFileSync(file, "utf-8");
  const parsed = matter(raw);

  it("本文と frontmatter にダッシュの文字が無いこと", () => {
    expect(findDash(raw)).toEqual([]);
    expect(findDash(JSON.stringify(parsed.data))).toEqual([]);
  });

  it("負のテスト: 4 種類のダッシュを検出すること", () => {
    for (const c of ["—", "―", "─", "–"]) {
      expect(findDash("a" + c + "b")).toHaveLength(1);
    }
    expect(findDash("a-b")).toEqual([]);
  });

  it("言い換えた文の要点（「二度手間」「きっかけ」）が残っていること", () => {
    const sentences = parsed.content.split(/[。\n]/);
    expect(sentences.some((s) => s.includes("二度手間"))).toBe(true);
    expect(sentences.some((s) => s.includes("きっかけ"))).toBe(true);
  });
});

describe("日本語記事全体のダッシュ（U+2014, U+2015）", () => {
  const files = walk(path.join(ROOT, "src/content"));

  it("日本語記事を 1 本以上走査していること", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("本文（frontmatter を含む）にダッシュが無いこと", () => {
    const bad = files
      .filter((f) => findDash(fs.readFileSync(f, "utf-8"), DASH_JA_RE).length > 0)
      .map((f) => path.relative(ROOT, f).split(path.sep).join("/"));
    expect(bad).toEqual([]);
  });
});
