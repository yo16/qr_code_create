import { getAllUseCases } from "@/lib/content/getAllUseCases";

describe("getAllUseCases", () => {
  it("配列を返すこと", () => {
    const result = getAllUseCases();
    expect(Array.isArray(result)).toBe(true);
  });

  it("content/use-casesディレクトリが空でも空配列を返すこと", () => {
    const result = getAllUseCases();
    expect(result).toBeDefined();
  });
});
