/**
 * @jest-environment node
 */
// qr_code_create-8hf: /guide/utm-parameters への案内のリンク文字と、utm-setup.mdx の書き直しで内容が失われていないこと
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { NON_JA_LOCALES } from "@/i18n/locales";

const ROOT = process.cwd();
const NL = String.fromCharCode(10);
const TARGET = "/guide/utm-parameters";
const OLD = "初心者向け" + "完全ガイド";
const rowWith = (text: string, a: string, b: string) =>
  text.split(NL).some((l) => l.trim().startsWith("|") && l.includes(a) && l.includes(b));

function walk(dir: string, exts: string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}
const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join("/");
const readMdx = (p: string) => fs.readFileSync(p, "utf-8");
const body = (slug: string) =>
  matter(readMdx(path.join(ROOT, "src/content/guide", `${slug}.mdx`))).content;
const section = (text: string, heading: string): string => {
  const start = text.indexOf(heading);
  if (start === -1) return "";
  const rest = text.slice(start + heading.length);
  const next = rest.indexOf(NL + "## ");
  return next === -1 ? rest : rest.slice(0, next);
};

// ---- 検査の関数 ----
const EMPTY_WORDS = ["こちら", "ここ", "この記事", "この記事はこちら", "詳しくはこちら", "リンク", "クリック"];
const PREFIX = "UTMパラメータとは";
const KEYWORD = "UTMパラメータ";

export function utmLinkTexts(text: string): string[] {
  const re = new RegExp("\\[([^\\]]*)\\]\\(" + TARGET + "(?:[#?][^)\\s]*)?\\)", "g");
  return Array.from(text.matchAll(re), (m) => m[1]);
}

/** リンク文字の問題を返す。空配列なら問題なし */
export function checkLinkText(linkText: string, title: string): string[] {
  const t = linkText.trim();
  const problems: string[] = [];
  if (t === "") return ["リンク文字が空"];
  if (EMPTY_WORDS.includes(t)) problems.push(`中身のない文字: ${t}`);
  if (!t.includes(KEYWORD)) problems.push(`「${KEYWORD}」を含まない: ${t}`);
  const prefixLike = t.startsWith(PREFIX);
  // 「UTMパラメータとは？」より長い場合は、いまの title の全文か先頭部分でなければならない
  if (prefixLike && t.length > PREFIX.length + 1 && t !== title && !title.startsWith(t)) {
    problems.push(`古い title の引用の疑い（いまの title と一致しない）: ${t}`);
  }
  return problems;
}

type Row = string[];
function parseTable(sectionText: string): { header: Row; rows: Row[]; widths: number[] } | null {
  const lines = sectionText.split(NL).map((l) => l.trim()).filter((l) => l.startsWith("|"));
  if (lines.length < 3) return null;
  const cells = (l: string): Row => l.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  const all = lines.map(cells);
  return { header: all[0], rows: all.slice(2), widths: all.map((r) => r.length) };
}
const unquote = (s: string) => s.replace(/`/g, "");

/** 用途別の表が期待する行・列数になっているかの問題を返す */
export function checkUsageTable(sectionText: string, expected: Row[]): string[] {
  const t = parseTable(sectionText);
  if (!t) return ["表が無い"];
  const problems: string[] = [];
  if (t.widths.some((w) => w !== t.header.length)) problems.push(`列数がヘッダー(${t.header.length})と違う行がある: ${t.widths.join(",")}`);
  if (t.rows.length !== expected.length) problems.push(`行数が ${t.rows.length}（期待 ${expected.length}）`);
  for (const exp of expected) {
    const hit = t.rows.some((r) => exp.every((v, i) => unquote(r[i + 1] ?? "") === v));
    if (!hit) problems.push(`組が無い: ${exp.join(" / ")}`);
  }
  return problems;
}

// ---- 1. 旧タイトルが残っていない ----
describe("旧タイトルの文字列が残っていないこと", () => {
  const mdxFiles = walk(path.join(ROOT, "src/content"), [".mdx"]);
  const docFiles = [
    ...walk(path.join(ROOT, "doc/design"), [".md"]),
    path.join(ROOT, "doc/marketing-strategy.md"),
  ];
  const srcFiles = walk(path.join(ROOT, "src"), [".ts", ".tsx", ".mdx", ".json"]);
  const allDocs = walk(path.join(ROOT, "doc"), [".md"]);
  const testFiles = walk(path.join(ROOT, "tests"), [".ts", ".tsx", ".json"]);

  it("走査の対象が空でない（空振り防止。言語版の mdx も含む）", () => {
    expect(mdxFiles.length).toBeGreaterThan(10);
    const nonJa = mdxFiles.filter((f) => NON_JA_LOCALES.some((l) => rel(f).startsWith(`src/content/${l}/`)));
    expect(nonJa.length).toBeGreaterThan(0);
    expect(docFiles.length).toBeGreaterThan(2);
  });

  it("src/content 配下のすべての .mdx に無い", () => {
    const bad = mdxFiles.filter((f) => readMdx(f).includes(OLD)).map(rel);
    expect(bad).toEqual([]);
  });

  it("doc/design と doc/marketing-strategy.md に無い", () => {
    const bad = docFiles.filter((f) => fs.readFileSync(f, "utf-8").includes(OLD)).map(rel);
    expect(bad).toEqual([]);
  });

  it("src 全体（.ts/.tsx/.mdx/.json）と doc 全体（.md）に無い", () => {
    expect(srcFiles.length).toBeGreaterThan(mdxFiles.length);
    expect(allDocs.length).toBeGreaterThanOrEqual(docFiles.length);
    const bad = [...srcFiles, ...allDocs].filter((f) => fs.readFileSync(f, "utf-8").includes(OLD)).map(rel);
    expect(bad).toEqual([]);
  });

  it("tests 全体（.ts/.tsx/.json）に無い（このファイルは分割して書いている）", () => {
    expect(testFiles.length).toBeGreaterThan(5);
    const bad = testFiles.filter((f) => fs.readFileSync(f, "utf-8").includes(OLD)).map(rel);
    expect(bad).toEqual([]);
  });
});

// ---- 2. リンク文字 ----
describe("/guide/utm-parameters へのリンク文字（日本語記事）", () => {
  const title = String(matter(readMdx(path.join(ROOT, "src/content/guide/utm-parameters.mdx"))).data.title);
  const jaFiles = walk(path.join(ROOT, "src/content"), [".mdx"]).filter(
    (f) => !NON_JA_LOCALES.some((l) => rel(f).startsWith(`src/content/${l}/`))
  );
  const found = jaFiles.flatMap((f) => utmLinkTexts(readMdx(f)).map((t) => ({ file: rel(f), text: t })));

  it("title が読めて、「UTMパラメータとは」で始まっている", () => {
    expect(title.startsWith(PREFIX)).toBe(true);
  });

  it("リンクが 1 件以上見つかる（空振り防止）。utm-setup・両ブログ記事が含まれる", () => {
    expect(found.length).toBeGreaterThanOrEqual(5);
    const files = new Set(found.map((x) => x.file));
    expect(files).toContain("src/content/guide/utm-setup.mdx");
    expect(files).toContain("src/content/blog/utm-on-off-when-to-use.mdx");
    expect(files).toContain("src/content/blog/nenga-qr-utm-tracking.mdx");
  });

  it("すべてのリンク文字が、空でなく・中身のある文字で・title の引用として古くない", () => {
    const bad = found.flatMap(({ file, text }) => checkLinkText(text, title).map((p) => `${file}: ${p}`));
    expect(bad).toEqual([]);
  });

  it("リンクの取りこぼしが無い: 記事ごとに「](/guide/utm-parameters」の出現数と拾った件数が同じ", () => {
    const raw = "](" + TARGET;
    for (const f of jaFiles) {
      const src = readMdx(f);
      const rawCount = src.split(raw).length - 1;
      expect({ file: rel(f), n: utmLinkTexts(src).length }).toEqual({ file: rel(f), n: rawCount });
    }
  });

  it("utmLinkTexts は通常・# 付き・? 付き・改行をまたぐリンク文字を拾う", () => {
    expect(utmLinkTexts("[A](/guide/utm-parameters)")).toEqual(["A"]);
    expect(utmLinkTexts("[B](/guide/utm-parameters#x) と [C](/guide/utm-parameters?q=1)")).toEqual(["B", "C"]);
    expect(utmLinkTexts("[D" + NL + "E](/guide/utm-parameters)")).toEqual(["D" + NL + "E"]);
    expect(utmLinkTexts("[F](/guide/utm-setup)")).toEqual([]);
  });

  it("【負のテスト】壊したリンク文字は検出される", () => {
    expect(checkLinkText("", title)).not.toEqual([]);
    expect(checkLinkText("こちら", title)).not.toEqual([]);
    expect(checkLinkText("詳しいガイド", title)).not.toEqual([]);
    expect(checkLinkText("UTMパラメータとは？" + OLD, title)).not.toEqual([]);
    // 正常系
    expect(checkLinkText("UTMパラメータとは", title)).toEqual([]);
    expect(checkLinkText(title, title)).toEqual([]);
    expect(checkLinkText("UTMパラメータの基本", title)).toEqual([]);
  });
});

// ---- 3. utm-setup.mdx の内容 ----
describe("utm-setup.mdx の内容が失われていないこと", () => {
  const text = body("utm-setup");
  const { jaClient } = jest.requireActual("@/i18n/jaClient") as {
    jaClient: { utm: { sourceLabels: Record<string, string> } };
  };

  it("utm_source の節に、アプリのプリセット 9 個の名前がすべてある", () => {
    const labels = Object.values(jaClient.utm.sourceLabels);
    expect(labels).toHaveLength(9);
    const s = section(text, "## utm_source（参照元）の設定");
    expect(s.length).toBeGreaterThan(0);
    for (const l of labels) expect(s).toContain(l);
    // 決め打ちの 9 個とも一致する（定義側が変わったときに気づく）
    expect(labels.sort()).toEqual(
      ["チラシ・フライヤー", "ポスター", "名刺", "パンフレット", "看板", "レシート", "製品パッケージ", "メニュー", "店内POP"].sort()
    );
  });

  it("utm_campaign の節に例 3 個がある", () => {
    const s = section(text, "## utm_campaign（キャンペーン名）の設定");
    const pairs = [
      ["spring_sale_2026", "春のセール"],
      ["event_2026q2", "2026年第2四半期のイベント"],
      ["store_open_2026", "新店舗オープン"],
    ];
    for (const [v, meaning] of pairs) expect({ v, ok: rowWith(s, v, meaning) }).toEqual({ v, ok: true });
  });

  it("効果度の節に 3 段階の星がある", () => {
    const s = section(text, "## 効果度インジケーターの見方");
    const pairs = [
      ["★☆☆", "最小限"],
      ["★★☆", "基本的"],
      ["★★★", "推奨"],
    ];
    for (const [v, desc] of pairs) expect({ v, ok: rowWith(s, v, desc) }).toEqual({ v, ok: true });
  });

  const EXPECTED: Row[] = [
    ["business_card", "qr", "networking_2026"],
    ["flyer", "qr", "sale_2026"],
    ["poster", "qr", "event_2026"],
    ["signage", "qr", "store_promo_2026"],
  ];

  it("用途別の設定例の表が 4 行で、各行が期待する (source, medium, campaign) の組になっている", () => {
    expect(checkUsageTable(section(text, "## 用途別の設定例"), EXPECTED)).toEqual([]);
  });

  it("本文の表すべてで、各行の列数がヘッダーと同じ", () => {
    const tables = text.split(NL + NL).filter((b) => b.trim().startsWith("|"));
    expect(tables.length).toBeGreaterThanOrEqual(3);
    for (const b of tables) {
      const t = parseTable(b)!;
      expect(t.widths.every((w) => w === t.header.length)).toBe(true);
    }
  });

  it("「UTMを使わない場合」とまとめの両方に /guide/utm-parameters へのリンクがある", () => {
    expect(utmLinkTexts(section(text, "## UTMを使わない場合")).length).toBeGreaterThanOrEqual(1);
    expect(utmLinkTexts(section(text, "## まとめ")).length).toBeGreaterThanOrEqual(1);
  });

  it("【負のテスト】rowWith は、値と意味がずれた本文・片方だけの本文で false、正しい行で true を返す", () => {
    const good = ["| 値 | 意味 |", "|---|---|", "| spring_sale_2026 | 春のセール |", "| store_open_2026 | 新店舗オープン |"].join(NL);
    // 正しい行
    expect(rowWith(good, "spring_sale_2026", "春のセール")).toBe(true);
    expect(rowWith(good, "store_open_2026", "新店舗オープン")).toBe(true);
    // 値と意味をずらした本文（別の行の意味と組み合わせている）
    expect(rowWith(good, "spring_sale_2026", "新店舗オープン")).toBe(false);
    expect(rowWith(good, "store_open_2026", "春のセール")).toBe(false);
    // 片方だけがある本文
    expect(rowWith(["| spring_sale_2026 | 別の説明 |"].join(NL), "spring_sale_2026", "春のセール")).toBe(false);
    expect(rowWith(["| 別の値 | 春のセール |"].join(NL), "spring_sale_2026", "春のセール")).toBe(false);
    // 表の行でない（先頭が | でない）文
    expect(rowWith("spring_sale_2026 は 春のセール です", "spring_sale_2026", "春のセール")).toBe(false);
    // 空の本文
    expect(rowWith("", "spring_sale_2026", "春のセール")).toBe(false);
  });

  it("【負のテスト】壊した表は検出される", () => {
    const table = section(text, "## 用途別の設定例");
    // 値の入れ替え（flyer 行の medium を変える）
    expect(checkUsageTable(table.replace("`flyer` | `qr`", "`flyer` | `print`"), EXPECTED)).not.toEqual([]);
    // 行の欠落
    const lines = table.split(NL).filter((l) => !l.includes("`poster`"));
    expect(checkUsageTable(lines.join(NL), EXPECTED)).not.toEqual([]);
    // 列数の崩れ
    expect(checkUsageTable(table.replace("| `qr` | `sale_2026` |", "| `sale_2026` |"), EXPECTED)).not.toEqual([]);
    // 表が無い
    expect(checkUsageTable("表なし", EXPECTED)).not.toEqual([]);
  });
});
