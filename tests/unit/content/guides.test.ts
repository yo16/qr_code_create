import { getGuide } from "@/lib/content/getGuide";

describe("ガイドコンテンツ4記事", () => {
  const slugs = [
    "utm-parameters",
    "effective-qr-usage",
    "design-tips",
    "analytics-measurement",
  ];

  it.each(slugs)(
    "'%s' のMDXファイルが存在し、フロントマターが揃っていること",
    (slug) => {
      const guide = getGuide(slug);
      expect(guide).not.toBeNull();
      expect(guide?.title).toBeTruthy();
      expect(guide?.description).toBeTruthy();
      expect(guide?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(guide?.content.length).toBeGreaterThan(500);
    }
  );

  it("4記事のorder値が1-4の連番であること", () => {
    const guides = slugs.map((s) => getGuide(s));
    const orders = guides
      .map((g) => g?.order)
      .filter((o): o is number => typeof o === "number");
    expect(orders.sort()).toEqual([1, 2, 3, 4]);
  });
});
