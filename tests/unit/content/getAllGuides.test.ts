import { getAllGuides } from "@/lib/content/getAllGuides";
import type { GuideMeta } from "@/types/content";

describe("getAllGuides", () => {
  describe("正常系", () => {
    it("配列を返すこと", () => {
      const result = getAllGuides();
      expect(Array.isArray(result)).toBe(true);
    });

    it("返り値の各要素にcontentフィールドが含まれないこと（メタデータのみ）", () => {
      const result = getAllGuides();
      result.forEach((guide) => {
        expect(guide).not.toHaveProperty("content");
      });
    });

    it("返り値の各要素にtitle, description, date, slugが含まれること", () => {
      const result = getAllGuides();
      result.forEach((guide) => {
        expect(guide).toHaveProperty("title");
        expect(guide).toHaveProperty("description");
        expect(guide).toHaveProperty("date");
        expect(guide).toHaveProperty("slug");
      });
    });
  });

  describe("ソート順", () => {
    it("order指定でソートされること（orderが小さい順）", () => {
      const result = getAllGuides();
      // orderが定義されている要素を抽出
      const withOrder = result.filter(
        (g): g is GuideMeta & { order: number } => g.order !== undefined
      );
      for (let i = 0; i < withOrder.length - 1; i++) {
        expect(withOrder[i].order).toBeLessThanOrEqual(withOrder[i + 1].order);
      }
    });

    it("order未指定の項目が最後にくること", () => {
      const result = getAllGuides();
      // orderなしの要素が出現した後はすべてorderなしであること
      let seenNoOrder = false;
      result.forEach((guide) => {
        if (guide.order === undefined) {
          seenNoOrder = true;
        }
        if (seenNoOrder) {
          // order未指定の項目が出てきた後はorder指定があってはならない
          expect(guide.order).toBeUndefined();
        }
      });
    });
  });
});
