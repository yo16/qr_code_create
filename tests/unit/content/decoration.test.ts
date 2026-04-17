import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getGuide, getGuideSlugList } from "@/lib/content/getGuide";

const MDX_FILE_PATH = path.join(
  process.cwd(),
  "src/content/guide/decoration.mdx"
);

describe("decoration.mdx ファイル存在確認", () => {
  it("src/content/guide/decoration.mdx が存在すること", () => {
    expect(fs.existsSync(MDX_FILE_PATH)).toBe(true);
  });
});

describe("decoration.mdx frontmatterバリデーション", () => {
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

  it("order が数値で 12 であること", () => {
    expect(typeof frontmatter.order).toBe("number");
    expect(frontmatter.order).toBe(12);
  });

  it("コンテンツにプリセットの説明が含まれること", () => {
    expect(content).toMatch(/プリセット/);
  });

  it("コンテンツにロゴの説明が含まれること", () => {
    expect(content).toMatch(/ロゴ/);
  });

  it("コンテンツに色の説明が含まれること", () => {
    expect(content).toMatch(/前景色/);
    expect(content).toMatch(/背景色/);
  });

  it("コンテンツにフレームの説明が含まれること", () => {
    expect(content).toMatch(/フレーム/);
  });

  it("コンテンツにキャプションの説明が含まれること", () => {
    expect(content).toMatch(/キャプション/);
  });

  it("コンテンツにロゴサイズ制限の記載があること", () => {
    expect(content).toMatch(/10%/);
    expect(content).toMatch(/25%/);
  });

  it("コンテンツにコントラスト比の注意事項があること", () => {
    expect(content).toMatch(/コントラスト/);
  });

  it("コンテンツに文字化けが含まれないこと", () => {
    expect(content).not.toMatch(/\ufffd/);
  });
});

describe("getGuide 関数との統合: decoration", () => {
  it("getGuide('decoration') が null でない値を返すこと", () => {
    const result = getGuide("decoration");
    expect(result).not.toBeNull();
  });

  it("返り値の slug が 'decoration' であること", () => {
    const result = getGuide("decoration");
    expect(result?.slug).toBe("decoration");
  });

  it("返り値の order が 12 であること", () => {
    const result = getGuide("decoration");
    expect(result?.order).toBe(12);
  });
});

describe("getGuideSlugList 関数: decoration の存在確認", () => {
  it("slugリストに 'decoration' が含まれること", () => {
    const result = getGuideSlugList();
    expect(result).toContain("decoration");
  });
});
