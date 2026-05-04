import { getUseCase, getUseCaseSlugList } from "@/lib/content/getUseCase";

describe("getUseCaseSlugList", () => {
  it("配列を返すこと", () => {
    const result = getUseCaseSlugList();
    expect(Array.isArray(result)).toBe(true);
  });

  it("content/use-casesディレクトリが空でも空配列を返すこと", () => {
    const result = getUseCaseSlugList();
    expect(result).toBeDefined();
  });
});

describe("getUseCase", () => {
  it("存在しないslugに対してnullを返すこと", () => {
    const result = getUseCase("nonexistent-slug");
    expect(result).toBeNull();
  });
});
