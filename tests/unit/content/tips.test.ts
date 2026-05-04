import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getGuide, getGuideSlugList } from "@/lib/content/getGuide";

const MDX_FILE_PATH = path.join(
  process.cwd(),
  "src/content/guide/tips.mdx"
);

describe("tips.mdx ファイル存在確認", () => {
  it("src/content/guide/tips.mdx が存在すること", () => {
    expect(fs.existsSync(MDX_FILE_PATH)).toBe(true);
  });
});

describe("tips.mdx frontmatterバリデーション", () => {
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

  it("order が数値で 14 であること", () => {
    expect(typeof frontmatter.order).toBe("number");
    expect(frontmatter.order).toBe(14);
  });

  it("コンテンツにQRコードが読み取れない場合の説明が含まれること", () => {
    expect(content).toMatch(/読み取れない/);
  });

  it("コンテンツに印刷サイズの目安が含まれること", () => {
    expect(content).toMatch(/印刷サイズの目安/);
  });

  it("コンテンツにURLが長すぎる場合の対処が含まれること", () => {
    expect(content).toMatch(/URLが長すぎる/);
  });

  it("コンテンツに有効期限についての説明が含まれること", () => {
    expect(content).toMatch(/有効期限/);
  });

  it("コンテンツに文字化けが含まれないこと", () => {
    expect(content).not.toMatch(/\ufffd/);
  });
});

describe("getGuide 関数との統合: tips", () => {
  it("getGuide('tips') が null でない値を返すこと", () => {
    const result = getGuide("tips");
    expect(result).not.toBeNull();
  });

  it("返り値の slug が 'tips' であること", () => {
    const result = getGuide("tips");
    expect(result?.slug).toBe("tips");
  });

  it("返り値の order が 14 であること", () => {
    const result = getGuide("tips");
    expect(result?.order).toBe(14);
  });

  it("返り値の title が非空の文字列であること", () => {
    const result = getGuide("tips");
    expect(typeof result?.title).toBe("string");
    expect(result!.title.length).toBeGreaterThan(0);
  });

  it("返り値の content が非空であること", () => {
    const result = getGuide("tips");
    expect(typeof result?.content).toBe("string");
    expect(result!.content.length).toBeGreaterThan(0);
  });
});

describe("getGuideSlugList 関数: tips の存在確認", () => {
  it("slugリストに 'tips' が含まれること", () => {
    const result = getGuideSlugList();
    expect(result).toContain("tips");
  });
});

describe("order の一意性確認", () => {
  it("order: 14 が他のガイド記事と重複しないこと", () => {
    const slugs = getGuideSlugList();
    const orders = slugs
      .map((slug) => getGuide(slug))
      .filter((g) => g !== null)
      .map((g) => ({ slug: g.slug, order: g.order }));
    const order14Items = orders.filter((o) => o.order === 14);
    expect(order14Items.length).toBe(1);
    expect(order14Items[0].slug).toBe("tips");
  });
});
