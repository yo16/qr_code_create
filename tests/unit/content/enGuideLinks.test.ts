/**
 * @jest-environment node
 */
// 英語ガイド MDX 内リンクの規則（doc/design/i18n-en.md 6 節、qr_code_create-01z.5）。
// en の MDX から内部ページへのリンクは /en/... で書き、行き先（/en を外したパス）は EN_AVAILABLE_PATHS に含まれること。
import fs from "fs";
import path from "path";
import { EN_AVAILABLE_PATHS } from "@/lib/i18n/routes";

const EN_GUIDE_DIR = path.join(process.cwd(), "src/content/en/guide");
const JAPANESE = /[぀-ゟ゠-ヿ一-鿿]/;

const listMdx = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listMdx(full);
    return entry.name.endsWith(".mdx") ? [full] : [];
  });

const files = listMdx(EN_GUIDE_DIR);

/** `](/...)` 形式の内部リンクの行き先を抽出する（`](/x "title")` の title は除く） */
const extractInternalLinks = (text: string): string[] =>
  Array.from(text.matchAll(/\]\((\/[^)\s]*)/g), (m) => m[1]);

/** /en を外し、クエリとハッシュを落とした ja 側のパス */
const toJaPath = (href: string): string => {
  const withoutQuery = href.split(/[?#]/)[0];
  const stripped = withoutQuery.replace(/^\/en(?=\/|$)/, "");
  return stripped === "" ? "/" : stripped;
};

describe("抽出関数の自己検査", () => {
  // 意図: 正規表現が想定どおり拾い、外部リンクやアンカーを拾わない
  it("内部リンクだけを抽出し、外部 URL とページ内アンカーは拾わない", () => {
    const sample = "[a](/en/create) **[b](/en)** [c](https://example.com) [d](#step-1) [e](/en/create?x=1 \"t\")";
    expect(extractInternalLinks(sample)).toEqual(["/en/create", "/en", "/en/create?x=1"]);
  });

  it("toJaPath は /en を外し、クエリを落とす", () => {
    expect(toJaPath("/en")).toBe("/");
    expect(toJaPath("/en/create?x=1")).toBe("/create");
    expect(toJaPath("/en/guide/getting-started#step-1")).toBe("/guide/getting-started");
    expect(toJaPath("/english")).toBe("/english");
  });
});

describe("en ガイド MDX の内部リンク", () => {
  // 意図: 検査対象が空でない（ディレクトリ違いなどで空振りしない）
  it("src/content/en/guide に MDX が 1 件以上ある", () => {
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

  // 意図: すべて /en 始まり（ja ページへ飛ばない）
  it("すべての内部リンクが /en で始まる", () => {
    const bad = allLinks.filter(({ href }) => !/^\/en(\/|$|\?|#)/.test(href));
    expect(bad).toEqual([]);
  });

  // 意図: 行き先に英語版が実在する（/en/guide/utm-setup のような 404 リンクを書かない）
  it("/en を外したパスがすべて EN_AVAILABLE_PATHS に含まれる", () => {
    const bad = allLinks.filter(({ href }) => !EN_AVAILABLE_PATHS.includes(toJaPath(href)));
    expect(bad).toEqual([]);
  });
});

describe("en ガイド MDX の言語", () => {
  // 意図: 英語の MDX に仮名・漢字が混ざらない（frontmatter を含むファイル全体）
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
