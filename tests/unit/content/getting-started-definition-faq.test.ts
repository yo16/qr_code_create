/**
 * @jest-environment node
 */
// qr_code_create-2gt（集客実験 E5a）: ja の getting-started の定義文と FAQ、ダッシュ除去、allow.txt を守る。
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = process.cwd();
const FILE = path.join(ROOT, "src/content/guide/getting-started.mdx");
const source = fs.readFileSync(FILE, "utf-8");
const parsed = matter(source);
const body = parsed.content;
const lines = body.split("\n");

const DASH = /[—―–]/;

describe("冒頭の定義文", () => {
  const firstH2 = lines.findIndex((l) => l.startsWith("## "));
  const intro = lines.slice(0, firstH2).join("\n").trim();

  it("最初の h2 より前に段落が 1 つあること", () => {
    expect(firstH2).toBeGreaterThan(0);
    expect(intro.length).toBeGreaterThan(0);
    expect(intro).not.toContain("\n\n");
  });

  it.each(["無料", "登録", "ブラウザ", "サーバーに送", "PNG", "SVG", "PDF", "有効期限", "UTM"])(
    "定義文に「%s」が含まれること",
    (word) => {
      expect(intro).toContain(word);
    },
  );

  it("有効期限がないこと(否定)を述べていること", () => {
    expect(intro).toMatch(/有効期限(は|が)?(なく|ない|ありません|無く|無い)/);
  });

  it("URLがサーバーに送られないこと(否定)を述べていること", () => {
    expect(intro).toMatch(/サーバーに送(られる|信される)?(こと)?(は|も)?(ありません|ない|されません|しません)/);
  });

  it("FAQ「入力したURLはサーバーに送られますか」の答えが「いいえ」で始まること", () => {
    const i = lines.findIndex((l) => /^### .*URL.*サーバーに送られますか/.test(l));
    expect(i).toBeGreaterThanOrEqual(0);
    const answer = lines.slice(i + 1).find((l) => l.trim() !== "") ?? "";
    expect(answer).toMatch(/^いいえ/);
  });

  it("FAQ「有効期限はありますか」の答えが「ありません」で始まること", () => {
    const i = lines.findIndex((l) => /^### .*有効期限はありますか/.test(l));
    expect(i).toBeGreaterThanOrEqual(0);
    const answer = lines.slice(i + 1).find((l) => l.trim() !== "") ?? "";
    expect(answer).toMatch(/^(ありません|いいえ)/);
  });

  it("「追跡なし」のような主張をしていないこと", () => {
    expect(intro).not.toMatch(/追跡(なし|しない|されない|されません|しません|不要|ゼロ)/);
    expect(body).not.toMatch(/追跡(なし|しない|されない|されません|しません|不要|ゼロ)/);
  });
});

describe("よくある質問", () => {
  const start = lines.findIndex((l) => l.trim() === "## よくある質問");
  const rest = lines.slice(start + 1);
  const nextH2 = rest.findIndex((l) => l.startsWith("## "));
  const faq = nextH2 === -1 ? rest : rest.slice(0, nextH2);
  const h3Idx = faq.map((l, i) => (l.startsWith("### ") ? i : -1)).filter((i) => i >= 0);

  it("「## よくある質問」があること", () => {
    expect(start).toBeGreaterThanOrEqual(0);
  });

  it("h3 が 3〜5 個あること", () => {
    expect(h3Idx.length).toBeGreaterThanOrEqual(3);
    expect(h3Idx.length).toBeLessThanOrEqual(5);
  });

  it("各 h3 が疑問文（「か」または「？」で終わる）であること", () => {
    for (const i of h3Idx) {
      expect(faq[i].slice(4).trim()).toMatch(/(か|[？?])$/);
    }
  });

  it("各 h3 の直後に答えの段落があること", () => {
    h3Idx.forEach((i, n) => {
      const end = n + 1 < h3Idx.length ? h3Idx[n + 1] : faq.length;
      const answer = faq.slice(i + 1, end).join("\n").trim();
      expect(faq[i + 1].trim()).toBe("");
      expect(answer.length).toBeGreaterThan(10);
      expect(answer.startsWith("#")).toBe(false);
    });
  });

  it("FAQ のリンク先 /blog/qr-code-expiration と /guide/design-tips が実在する記事であること", () => {
    const text = faq.join("\n");
    expect(text).toContain("](/blog/qr-code-expiration)");
    expect(text).toContain("](/guide/design-tips)");
    expect(fs.existsSync(path.join(ROOT, "src/content/blog/qr-code-expiration.mdx"))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, "src/content/guide/design-tips.mdx"))).toBe(true);
  });
});

describe("ダッシュ", () => {
  it("ファイル全体に「—」「―」「–」がないこと（「〜」は対象外）", () => {
    expect(source).not.toMatch(DASH);
  });
});

describe("howto と本文のステップ見出し", () => {
  it("howto の 3 手順の name が、本文の「ステップ1〜3」の見出しの末尾と対応すること", () => {
    const howto = parsed.data.howto as { name: string }[];
    const steps = lines.filter((l) => /^## ステップ[1-3]/.test(l));
    expect(howto).toHaveLength(3);
    expect(steps).toHaveLength(3);
    howto.forEach((h, i) => {
      expect(steps[i]).toMatch(new RegExp(`^## ステップ${i + 1}[:：] ?`));
      expect(steps[i].endsWith(h.name)).toBe(true);
    });
  });
});

describe(".yomiyasu-words/allow.txt", () => {
  it("コメント行を除くと「解像度」のみであること", () => {
    const words = fs
      .readFileSync(path.join(ROOT, ".yomiyasu-words/allow.txt"), "utf-8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== "" && !l.startsWith("#"));
    expect(words).toEqual(["解像度"]);
  });
});
