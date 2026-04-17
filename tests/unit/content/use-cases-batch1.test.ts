import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getUseCase, getUseCaseSlugList } from "@/lib/content/getUseCase";

const CONTENT_DIR = path.join(process.cwd(), "src/content/use-cases");
const SLUGS = ["business-card", "flyer", "poster"];

describe("use-cases MDX batch1: 名刺・チラシ・ポスター", () => {
  describe.each(SLUGS)("%s.mdx", (slug) => {
    const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);

    it("ファイルが存在すること", () => {
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("frontmatterにtitle, description, date, order, utmSource, presetが含まれること", () => {
      const fileContents = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(fileContents);
      expect(typeof data.title).toBe("string");
      expect(data.title.length).toBeGreaterThan(0);
      expect(typeof data.description).toBe("string");
      expect(data.description.length).toBeGreaterThan(0);
      expect(typeof data.date).toBe("string");
      expect(data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof data.order).toBe("number");
      expect(typeof data.utmSource).toBe("string");
      expect(typeof data.preset).toBe("string");
    });

    it("コンテンツに推奨UTM設定セクションが含まれること", () => {
      const fileContents = fs.readFileSync(filePath, "utf-8");
      const { content } = matter(fileContents);
      expect(content).toMatch(/UTM設定/);
    });

    it("コンテンツに印刷サイズセクションが含まれること", () => {
      const fileContents = fs.readFileSync(filePath, "utf-8");
      const { content } = matter(fileContents);
      expect(content).toMatch(/印刷サイズ/);
    });

    it("コンテンツに活用例セクションが含まれること", () => {
      const fileContents = fs.readFileSync(filePath, "utf-8");
      const { content } = matter(fileContents);
      expect(content).toMatch(/活用例/);
    });

    it("文字化けが含まれないこと", () => {
      const fileContents = fs.readFileSync(filePath, "utf-8");
      const { content } = matter(fileContents);
      expect(content).not.toMatch(/\ufffd/);
    });

    it("getUseCase関数でnull以外が返ること", () => {
      const result = getUseCase(slug);
      expect(result).not.toBeNull();
      expect(result?.slug).toBe(slug);
    });
  });

  it("getUseCaseSlugListに3つのslugが含まれること", () => {
    const slugList = getUseCaseSlugList();
    for (const slug of SLUGS) {
      expect(slugList).toContain(slug);
    }
  });

  it("各記事のorderが重複しないこと", () => {
    const orders = SLUGS.map((slug) => getUseCase(slug)?.order).filter((o) => o !== undefined);
    const uniqueOrders = new Set(orders);
    expect(uniqueOrders.size).toBe(orders.length);
  });
});
