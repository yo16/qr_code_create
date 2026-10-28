/**
 * @jest-environment node
 */
// ja 以外の言語のガイド MDX 内リンクの規則（doc/design/i18n-multi.md 9.1 節。i18n-en.md 6 節の全言語版）。
// MDX から内部ページへのリンクは /{locale}/... で書き、行き先（接頭辞を外したパス）はその言語の paths に含まれること。
import fs from "fs";
import path from "path";
import { NON_JA_LOCALES } from "@/i18n/locales";
import { hasVersion } from "@/lib/i18n/routes";
import { LOCALE_CONFIG } from "@/lib/i18n/localeConfig";

const JAPANESE = /[぀-ゟ゠-ヿ一-鿿]/;

const listMdx = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listMdx(full);
    return entry.name.endsWith(".mdx") ? [full] : [];
  });

/** `](/...)` 形式の内部リンクの行き先を抽出する（`](/x "title")` の title は除く） */
const extractInternalLinks = (text: string): string[] =>
  Array.from(text.matchAll(/\]\((\/[^)\s]*)/g), (m) => m[1]);

/** 接頭辞を外し、クエリとハッシュを落とした ja 側のパス */
const toJaPath = (href: string, prefix: string): string => {
  const withoutQuery = href.split(/[?#]/)[0];
  if (withoutQuery === prefix) return "/";
  return withoutQuery.startsWith(`${prefix}/`) ? withoutQuery.slice(prefix.length) : withoutQuery;
};

describe("抽出関数の自己検査", () => {
  // 意図: 正規表現が想定どおり拾い、外部リンクやアンカーを拾わない
  it("内部リンクだけを抽出し、外部 URL とページ内アンカーは拾わない", () => {
    const sample = "[a](/en/create) **[b](/en)** [c](https://example.com) [d](#step-1) [e](/en/create?x=1 \"t\")";
    expect(extractInternalLinks(sample)).toEqual(["/en/create", "/en", "/en/create?x=1"]);
  });

  it("toJaPath は接頭辞を外し、クエリを落とす", () => {
    expect(toJaPath("/pt-br", "/pt-br")).toBe("/");
    expect(toJaPath("/pt-br/create?x=1", "/pt-br")).toBe("/create");
    expect(toJaPath("/de/guide/getting-started#step-1", "/de")).toBe("/guide/getting-started");
    expect(toJaPath("/english", "/en")).toBe("/english");
  });
});

describe.each(NON_JA_LOCALES)("%s ガイド MDX", (locale) => {
  const prefix = LOCALE_CONFIG[locale].prefix;
  const dir = path.join(process.cwd(), "src/content", locale, "guide");
  const files = fs.existsSync(dir) ? listMdx(dir) : [];

  // 意図: 検査対象が空でない（ディレクトリ違いなどで空振りしない）
  it(`src/content/${locale}/guide に MDX が 1 件以上ある`, () => {
    expect(files.length).toBeGreaterThan(0);
  });

  const allLinks = files.flatMap((file) =>
    extractInternalLinks(fs.readFileSync(file, "utf8")).map((href) => ({
      file: path.relative(process.cwd(), file),
      href,
    }))
  );

  // 意図: リンクを 1 件以上拾っている（抽出が 0 件でテストが素通りしない）
  it("内部リンクを 1 件以上抽出できる", () => {
    expect(allLinks.length).toBeGreaterThan(0);
  });

  // 意図: すべて /{locale} 始まり（ja ページへ飛ばない）
  it(`すべての内部リンクが ${prefix} で始まる`, () => {
    const bad = allLinks.filter(({ href }) => !new RegExp(`^${prefix}(/|$|\\?|#)`).test(href));
    expect(bad).toEqual([]);
  });

  // 意図: 行き先にその言語の版が実在する（/{locale}/guide/utm-setup のような 404 リンクを書かない）
  it("接頭辞を外したパスがすべてその言語の paths に含まれる", () => {
    const bad = allLinks.filter(({ href }) => !hasVersion(locale, toJaPath(href, prefix)));
    expect(bad).toEqual([]);
  });

  // 意図: ja 以外の MDX に仮名・漢字が混ざらない（frontmatter を含むファイル全体）
  it.each(files.map((f) => [path.relative(process.cwd(), f), f]))(
    "%s に仮名・漢字が無い",
    (_label, file) => {
      const lines = fs
        .readFileSync(file, "utf8")
        .split(/\r?\n/)
        .filter((line) => JAPANESE.test(line));
      expect(lines).toEqual([]);
    }
  );
});
