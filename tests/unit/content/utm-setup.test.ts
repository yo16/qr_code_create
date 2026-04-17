import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getGuide, getGuideSlugList } from "@/lib/content/getGuide";

const MDX_FILE_PATH = path.join(
  process.cwd(),
  "src/content/guide/utm-setup.mdx"
);

describe("utm-setup.mdx ファイル存在確認", () => {
  it("src/content/guide/utm-setup.mdx が存在すること", () => {
    expect(fs.existsSync(MDX_FILE_PATH)).toBe(true);
  });
});

describe("utm-setup.mdx frontmatterバリデーション", () => {
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

  it("order が数値で 11 であること", () => {
    expect(typeof frontmatter.order).toBe("number");
    expect(frontmatter.order).toBe(11);
  });

  it("コンテンツにutm_sourceセクションが含まれること", () => {
    expect(content).toMatch(/utm_source/);
  });

  it("コンテンツにutm_mediumセクションが含まれること", () => {
    expect(content).toMatch(/utm_medium/);
  });

  it("コンテンツにutm_campaignセクションが含まれること", () => {
    expect(content).toMatch(/utm_campaign/);
  });

  it("コンテンツに効果度インジケーターの説明が含まれること", () => {
    expect(content).toMatch(/効果度インジケーター/);
  });

  it("コンテンツに用途別の設定例が含まれること", () => {
    expect(content).toMatch(/用途別の設定例/);
  });

  it("コンテンツに文字化けが含まれないこと", () => {
    expect(content).not.toMatch(/\ufffd/);
  });
});

describe("getGuide 関数との統合: utm-setup", () => {
  it("getGuide('utm-setup') が null でない値を返すこと", () => {
    const result = getGuide("utm-setup");
    expect(result).not.toBeNull();
  });

  it("返り値の slug が 'utm-setup' であること", () => {
    const result = getGuide("utm-setup");
    expect(result?.slug).toBe("utm-setup");
  });

  it("返り値の order が 11 であること", () => {
    const result = getGuide("utm-setup");
    expect(result?.order).toBe(11);
  });
});

describe("getGuideSlugList 関数: utm-setup の存在確認", () => {
  it("slugリストに 'utm-setup' が含まれること", () => {
    const result = getGuideSlugList();
    expect(result).toContain("utm-setup");
  });
});
