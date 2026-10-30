/**
 * @jest-environment node
 */
// 異常系: date の無い frontmatter を取得関数が読むと、requireIsoDate がファイルパス付きで投げる
import { getGuide } from "@/lib/content/getGuide";
import { getUseCase } from "@/lib/content/getUseCase";
import { getBlog } from "@/lib/content/getBlog";

jest.mock("gray-matter", () => ({
  __esModule: true,
  default: () => ({ data: { title: "t", description: "d" }, content: "body" }),
}));

describe("date の無い frontmatter", () => {
  it("getGuide が source（ファイルパス）を含むエラーを投げること", () => {
    expect(() => getGuide("getting-started", "ja")).toThrow(/getting-started\.mdx/);
  });

  it("getGuide（en）も投げること", () => {
    expect(() => getGuide("getting-started", "en")).toThrow(/date/);
  });

  it("getUseCase が投げること", () => {
    const slug = jest.requireActual<typeof import("@/lib/content/getUseCase")>("@/lib/content/getUseCase").getUseCaseSlugList()[0];
    expect(() => getUseCase(slug)).toThrow(new RegExp(`${slug}\\.mdx`));
  });

  it("getBlog が投げること", () => {
    const slug = jest.requireActual<typeof import("@/lib/content/getBlog")>("@/lib/content/getBlog").getBlogSlugList()[0];
    expect(() => getBlog(slug)).toThrow(new RegExp(`${slug}\\.mdx`));
  });

  it("存在しない slug はエラーではなく null のままであること", () => {
    expect(getGuide("no-such-slug", "ja")).toBeNull();
  });
});
