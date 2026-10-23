import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getGuide, getGuideSlugList } from "@/lib/content/getGuide";

const MDX_FILE_PATH = path.join(
  process.cwd(),
  "src/content/guide/getting-started.mdx"
);

describe("getting-started.mdx ファイル存在確認", () => {
  it("src/content/guide/getting-started.mdx が存在すること", () => {
    expect(fs.existsSync(MDX_FILE_PATH)).toBe(true);
  });
});

describe("getting-started.mdx frontmatterバリデーション", () => {
  let frontmatter: Record<string, unknown>;
  let content: string;

  beforeAll(() => {
    const fileContents = fs.readFileSync(MDX_FILE_PATH, "utf-8");
    const parsed = matter(fileContents);
    frontmatter = parsed.data as Record<string, unknown>;
    content = parsed.content;
  });

  it("title が文字列で存在すること", () => {
    expect(typeof frontmatter.title).toBe("string");
    expect((frontmatter.title as string).length).toBeGreaterThan(0);
  });

  it("description が文字列で存在すること", () => {
    expect(typeof frontmatter.description).toBe("string");
    expect((frontmatter.description as string).length).toBeGreaterThan(0);
  });

  it("date が YYYY-MM-DD 形式であること", () => {
    expect(typeof frontmatter.date).toBe("string");
    expect(frontmatter.date as string).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("order が数値で 10 であること", () => {
    expect(typeof frontmatter.order).toBe("number");
    expect(frontmatter.order).toBe(10);
  });

  it("コンテンツにステップ1の見出しが含まれること", () => {
    expect(content).toMatch(/ステップ1/);
  });

  it("コンテンツにステップ2の見出しが含まれること", () => {
    expect(content).toMatch(/ステップ2/);
  });

  it("コンテンツにステップ3の見出しが含まれること", () => {
    expect(content).toMatch(/ステップ3/);
  });

  // 意図: このガイドは ChatGPT に引用される主要な流入元だが、構造化データが BlogPosting と
  //       BreadcrumbList のみで HowTo が無い。HowTo スキーマの元データとして frontmatter に
  //       howto（3 ステップ）が定義されていることを保証する。
  it("howto が 3 件の配列であること", () => {
    expect(Array.isArray(frontmatter.howto)).toBe(true);
    expect(frontmatter.howto as unknown[]).toHaveLength(3);
  });

  // 意図: 各ステップが HowToStep に必要な name / text を非空の文字列で持つこと。
  it("howto の各要素が文字列の name と text を持つこと", () => {
    const howto = frontmatter.howto as { name: unknown; text: unknown }[];
    howto.forEach((step) => {
      expect(typeof step.name).toBe("string");
      expect((step.name as string).length).toBeGreaterThan(0);
      expect(typeof step.text).toBe("string");
      expect((step.text as string).length).toBeGreaterThan(0);
    });
  });

  // 意図: 本文の「ステップ1: URLを入力する」「ステップ3: ダウンロードする」と HowTo の
  //       ステップ名が対応していること（検索結果の手順表示と本文の整合）。
  it("howto の 1 件目の name が「URLを入力する」、3 件目が「ダウンロードする」であること", () => {
    const howto = frontmatter.howto as { name: string; text: string }[];
    expect(howto[0].name).toBe("URLを入力する");
    expect(howto[2].name).toBe("ダウンロードする");
  });
});

describe("getting-started.mdx の導線", () => {
  let content: string;

  beforeAll(() => {
    const fileContents = fs.readFileSync(MDX_FILE_PATH, "utf-8");
    content = matter(fileContents).content;
  });

  // 意図: このページは ChatGPT 引用経由の流入が最も多いが、本文に /create へのリンクが無く
  //       ツール到達率が約半分にとどまっている。ナビ以外に本文中の導線が複数あることを保証する。
  it("本文に /create への Markdown リンクが 2 回以上あること", () => {
    const matches = content.match(/\]\(\/create\)/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  // 意図: 読者が最初に手を動かす「ステップ1: URLを入力する」の節で、
  //       そのまま作成ページへ遷移できる導線があることを保証する。
  it("ステップ1 の節に /create へのリンクがあること", () => {
    const start = content.indexOf("## ステップ1");
    const end = content.indexOf("## ステップ2");
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const step1Section = content.slice(start, end);
    expect(step1Section).toContain("](/create)");
  });

  // 意図: 読了直後の「まとめ」節で、「さっそく作成してみましょう」から
  //       実際に /create へ移動できる CTA があることを保証する。
  it("まとめの節に /create へのリンクがあること", () => {
    const start = content.indexOf("## まとめ");
    expect(start).toBeGreaterThanOrEqual(0);
    const summarySection = content.slice(start);
    expect(summarySection).toContain("](/create)");
  });

  // 意図: 「UTMパラメータの設定方法」ガイドへの言及がテキストのみでリンクになっていないため、
  //       /guide/utm-setup への Markdown リンクがあることを保証する（回遊導線の確保）。
  it("UTM パラメータの設定ガイド /guide/utm-setup へのリンクがあること", () => {
    expect(content).toContain("](/guide/utm-setup)");
  });
});

describe("getGuide 関数との統合: getting-started", () => {
  it("getGuide('getting-started') が null でない値を返すこと", () => {
    const result = getGuide("getting-started");
    expect(result).not.toBeNull();
  });

  it("返り値に title, description, date, content, slug が含まれること", () => {
    const result = getGuide("getting-started");
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("description");
    expect(result).toHaveProperty("date");
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("slug");
  });

  it("返り値の slug が 'getting-started' であること", () => {
    const result = getGuide("getting-started");
    expect(result?.slug).toBe("getting-started");
  });

  it("返り値の title が文字列であること", () => {
    const result = getGuide("getting-started");
    expect(typeof result?.title).toBe("string");
    expect(result?.title.length).toBeGreaterThan(0);
  });

  it("返り値の date が YYYY-MM-DD 形式であること", () => {
    const result = getGuide("getting-started");
    expect(result?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("返り値の order が 10 であること", () => {
    const result = getGuide("getting-started");
    expect(result?.order).toBe(10);
  });

  // 意図: ページ側は getGuide の戻り値から HowTo スキーマを組み立てるため、
  //       frontmatter の howto が GuideContent.howto にそのまま渡ってくることを保証する。
  it("返り値の howto が frontmatter の howto と一致すること（3 件）", () => {
    const fileContents = fs.readFileSync(MDX_FILE_PATH, "utf-8");
    const frontmatter = matter(fileContents).data as { howto?: unknown };
    const result = getGuide("getting-started");
    expect(Array.isArray(result?.howto)).toBe(true);
    expect(result?.howto).toHaveLength(3);
    expect(result?.howto).toEqual(frontmatter.howto);
  });
});

describe("getGuideSlugList 関数: getting-started の存在確認", () => {
  it("slugリストに 'getting-started' が含まれること", () => {
    const result = getGuideSlugList();
    expect(result).toContain("getting-started");
  });
});
