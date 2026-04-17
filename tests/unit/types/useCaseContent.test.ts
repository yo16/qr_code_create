import type { UseCaseFrontmatter, UseCaseMeta, UseCaseContent } from "@/types/content";

describe("UseCase 型定義の整合性", () => {
  it("UseCaseFrontmatter 型のオブジェクトを構築できること", () => {
    const frontmatter: UseCaseFrontmatter = {
      title: "名刺用QRコード",
      description: "名刺にQRコードを印刷する方法",
      date: "2026-04-17",
      order: 1,
      utmSource: "business_card",
      preset: "business",
    };
    expect(frontmatter.title).toBe("名刺用QRコード");
    expect(frontmatter.utmSource).toBe("business_card");
    expect(frontmatter.preset).toBe("business");
  });

  it("UseCaseFrontmatter の order, utmSource, preset がオプショナルであること", () => {
    const frontmatter: UseCaseFrontmatter = {
      title: "テスト",
      description: "テスト説明",
      date: "2026-04-17",
    };
    expect(frontmatter.order).toBeUndefined();
    expect(frontmatter.utmSource).toBeUndefined();
    expect(frontmatter.preset).toBeUndefined();
  });

  it("UseCaseMeta 型がslugフィールドを持つこと", () => {
    const meta: UseCaseMeta = {
      title: "テスト",
      description: "テスト説明",
      date: "2026-04-17",
      slug: "test-slug",
    };
    expect(meta.slug).toBe("test-slug");
  });

  it("UseCaseContent 型がcontentフィールドを持つこと", () => {
    const content: UseCaseContent = {
      title: "テスト",
      description: "テスト説明",
      date: "2026-04-17",
      slug: "test-slug",
      content: "## テスト本文",
    };
    expect(content.content).toBe("## テスト本文");
  });
});
