import { getBlog, getBlogSlugList } from "@/lib/content/getBlog";
import { getAllBlogs } from "@/lib/content/getAllBlogs";

describe("getBlogSlugList", () => {
  it("配列を返すこと", () => {
    const result = getBlogSlugList();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("getBlog", () => {
  it("存在しないslugに対してnullを返すこと", () => {
    const result = getBlog("nonexistent-slug");
    expect(result).toBeNull();
  });
});

describe("getAllBlogs", () => {
  it("配列を返すこと", () => {
    const result = getAllBlogs();
    expect(Array.isArray(result)).toBe(true);
  });
});
