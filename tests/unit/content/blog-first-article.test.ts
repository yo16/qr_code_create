import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getBlog, getBlogSlugList } from "@/lib/content/getBlog";

const SLUG = "why-i-built-qr-code-create";
const MDX_PATH = path.join(process.cwd(), "src/content/blog", `${SLUG}.mdx`);

describe("ブログ初回記事: why-i-built-qr-code-create", () => {
  it("ファイルが存在すること", () => {
    expect(fs.existsSync(MDX_PATH)).toBe(true);
  });

  describe("frontmatter", () => {
    let data: Record<string, unknown>;

    beforeAll(() => {
      const fileContents = fs.readFileSync(MDX_PATH, "utf-8");
      data = matter(fileContents).data as Record<string, unknown>;
    });

    it("titleが非空の文字列であること", () => {
      expect(typeof data.title).toBe("string");
      expect((data.title as string).length).toBeGreaterThan(0);
    });

    it("descriptionが非空の文字列であること", () => {
      expect(typeof data.description).toBe("string");
      expect((data.description as string).length).toBeGreaterThan(0);
    });

    it("dateがYYYY-MM-DD形式であること", () => {
      expect(data.date as string).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("categoryがstoryであること", () => {
      expect(data.category).toBe("story");
    });
  });

  describe("SEOキーワード", () => {
    let content: string;

    beforeAll(() => {
      const fileContents = fs.readFileSync(MDX_PATH, "utf-8");
      content = matter(fileContents).content;
    });

    it("「無料」が本文に含まれること", () => {
      expect(content).toMatch(/無料/);
    });

    it("「安全」が本文に含まれること", () => {
      expect(content).toMatch(/安全/);
    });

    it("「UTMパラメータ」が本文に含まれること", () => {
      expect(content).toMatch(/UTMパラメータ/);
    });

    it("「QRコード作成」が本文またはfrontmatterに含まれること", () => {
      const fileContents = fs.readFileSync(MDX_PATH, "utf-8");
      expect(fileContents).toMatch(/QRコード作成/);
    });
  });

  describe("コンテンツ構成", () => {
    let content: string;

    beforeAll(() => {
      content = matter(fs.readFileSync(MDX_PATH, "utf-8")).content;
    });

    it("きっかけ（UTM設定の課題）セクションが含まれること", () => {
      expect(content).toMatch(/UTM/);
    });

    it("既存ツールの課題セクションが含まれること", () => {
      expect(content).toMatch(/課題/);
    });

    it("QR Code Createの説明セクションが含まれること", () => {
      expect(content).toMatch(/QR Code Create/);
    });

    it("無料の理由セクションが含まれること", () => {
      expect(content).toMatch(/無料.*ログイン不要|ログイン不要.*無料/);
    });

    it("文字化けが含まれないこと", () => {
      expect(content).not.toMatch(/\ufffd/);
    });
  });

  describe("getBlog統合", () => {
    it("getBlogで取得できること", () => {
      const result = getBlog(SLUG);
      expect(result).not.toBeNull();
      expect(result?.slug).toBe(SLUG);
    });

    it("getBlogSlugListに含まれること", () => {
      const slugs = getBlogSlugList();
      expect(slugs).toContain(SLUG);
    });
  });
});
