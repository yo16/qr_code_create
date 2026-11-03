import fs from "fs";
import path from "path";

/** qr_code_create-1rq: Small Piece へのリンクは UTM（source/medium）付き。ルールファイルと導入記録も検査する */

const ROOT = process.cwd();
const SMALLPIECE_URL = /(?:https?:)?\/\/(?:www\.)?smallpiece\.jp[^\s"'`)<>\]\\]*/gi;

function listFiles(dir: string): string[] {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(rel);
    return entry.isFile() && /\.(tsx?|jsx?|mjs|mdx?|json|html|css|svg|txt|xml|ya?ml)$/.test(entry.name) ? [rel] : [];
  });
}

/** テキスト中の smallpiece.jp への URL のうち、UTM（source と medium）が足りないものを返す */
function findBadLinks(text: string): string[] {
  const urls = text.match(SMALLPIECE_URL) ?? [];
  return urls.filter((raw) => {
    // 元の文字列が https://smallpiece.jp で始まらないもの（http、www、スキーム省略、大文字）は違反
    if (!raw.startsWith("https://smallpiece.jp")) return true;
    let url: URL;
    try {
      url = new URL(raw.replace(/&amp;/g, "&"));
    } catch {
      return true;
    }
    const content = url.searchParams.get("utm_content");
    const ok =
      url.protocol === "https:" &&
      url.host === "smallpiece.jp" &&
      url.searchParams.get("utm_source") === "qr-code-create" &&
      url.searchParams.get("utm_medium") === "referral" &&
      (content === null || /^[a-z0-9-]+$/.test(content));
    return !ok;
  });
}

describe("src の smallpiece.jp リンクはすべて UTM 付き", () => {
  const files = listFiles("src");

  it("走査対象が空でなく Footer.tsx を含み、そこに Small Piece リンクがある", () => {
    expect(files.length).toBeGreaterThan(50);
    expect(files).toContain("src/components/layout/Footer/Footer.tsx");
    const footer = fs.readFileSync(path.join(ROOT, "src/components/layout/Footer/Footer.tsx"), "utf8");
    expect(footer.match(SMALLPIECE_URL)?.length ?? 0).toBeGreaterThan(0);
  });

  it("UTM の無い smallpiece.jp リンクが無い", () => {
    const offenders = files.flatMap((f) =>
      findBadLinks(fs.readFileSync(path.join(ROOT, f), "utf8")).map((u) => `${f}: ${u}`)
    );
    expect(offenders).toEqual([]);
  });

  describe("判定関数が違反を検出できる", () => {
    it("UTM 無し、source だけ、source の値違い、medium 違いを検出する", () => {
      expect(findBadLinks('<a href="https://smallpiece.jp/">x</a>')).toHaveLength(1);
      expect(findBadLinks("https://smallpiece.jp/?utm_source=qr-code-create")).toHaveLength(1);
      expect(
        findBadLinks("https://smallpiece.jp/?utm_source=other&utm_medium=referral")
      ).toHaveLength(1);
      expect(
        findBadLinks("https://smallpiece.jp/?utm_source=qr-code-create&utm_medium=social")
      ).toHaveLength(1);
      expect(findBadLinks("https://smallpiece.jp/case-studies")).toHaveLength(1);
    });

    it.each([
      "https://smallpiece.jp/?utm_medium=referral&utm_source=qr-code-create-foo",
      "https://smallpiece.jp/?utm_medium=referral&utm_source=qr-code-created",
      "https://smallpiece.jp/?utm_source=qr-code-create&utm_medium=referral2",
      "https://smallpiece.jp/?x_utm_source=qr-code-create&utm_medium=referral",
      "http://smallpiece.jp/?utm_source=qr-code-create&utm_medium=referral",
      "https://www.smallpiece.jp/?utm_source=qr-code-create&utm_medium=referral",
      "HTTPS://SmallPiece.jp/?utm_source=qr-code-create&utm_medium=referral",
      "//smallpiece.jp/?utm_source=qr-code-create&utm_medium=referral",
      "https://smallpiece.jp/?utm_source=qr-code-create&utm_medium=referral&utm_content=Footer_1",
    ])("紛らわしい違反 %s を検出する", (bad) => {
      expect(findBadLinks(bad)).toHaveLength(1);
    });

    it("パラメータの順序が逆でも同じ意味なので通す", () => {
      expect(
        findBadLinks("https://smallpiece.jp/?utm_medium=referral&utm_source=qr-code-create")
      ).toEqual([]);
    });

    it("正しい形（&amp; 表記、utm_content 付き、下層パス）は通す", () => {
      expect(
        findBadLinks("https://smallpiece.jp/?utm_source=qr-code-create&utm_medium=referral")
      ).toEqual([]);
      expect(
        findBadLinks('href="https://smallpiece.jp/?utm_source=qr-code-create&amp;utm_medium=referral"')
      ).toEqual([]);
      expect(
        findBadLinks(
          "https://smallpiece.jp/?utm_source=qr-code-create&utm_medium=referral&utm_content=footer"
        )
      ).toEqual([]);
      expect(
        findBadLinks("https://smallpiece.jp/case-studies?utm_source=qr-code-create&utm_medium=referral")
      ).toEqual([]);
    });
  });
});

describe("Small Piece リンクのルールファイルと導入記録", () => {
  const rulePath = path.join(ROOT, ".claude/rules/smallpiece-link.md");

  it("ルールファイルが存在する", () => {
    expect(fs.existsSync(rulePath)).toBe(true);
  });

  it("<サービス名> が残らず、qr-code-create を含む", () => {
    const rule = fs.readFileSync(rulePath, "utf8");
    expect(rule).not.toContain("<サービス名>");
    expect(rule).toContain("qr-code-create");
  });

  it("導入記録に smallpiece-link@v1 の行がある", () => {
    const history = fs.readFileSync(
      path.join(ROOT, ".claude/claudecode-initial-settings-history.txt"),
      "utf8"
    );
    expect(history).toMatch(/^smallpiece-link@v1\b/m);
  });
});
