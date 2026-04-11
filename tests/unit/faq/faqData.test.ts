import { FAQ_ITEMS } from "@/components/faq/faqData";

describe("faqData", () => {
  it("FAQ_ITEMSが配列であること", () => {
    expect(Array.isArray(FAQ_ITEMS)).toBe(true);
  });

  it("FAQ_ITEMSが空でないこと", () => {
    expect(FAQ_ITEMS.length).toBeGreaterThan(0);
  });

  it("各項目にidがあること", () => {
    FAQ_ITEMS.forEach((item) => {
      expect(item).toHaveProperty("id");
      expect(typeof item.id).toBe("string");
      expect(item.id.length).toBeGreaterThan(0);
    });
  });

  it("各項目にquestionがあること", () => {
    FAQ_ITEMS.forEach((item) => {
      expect(item).toHaveProperty("question");
      expect(typeof item.question).toBe("string");
      expect(item.question.length).toBeGreaterThan(0);
    });
  });

  it("各項目にanswerがあること", () => {
    FAQ_ITEMS.forEach((item) => {
      expect(item).toHaveProperty("answer");
      expect(typeof item.answer).toBe("string");
      expect(item.answer.length).toBeGreaterThan(0);
    });
  });

  it("idが重複しないこと", () => {
    const ids = FAQ_ITEMS.map((item) => item.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
