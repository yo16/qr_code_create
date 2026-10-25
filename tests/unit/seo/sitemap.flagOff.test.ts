import sitemap from "@/app/sitemap";
import { getGuideSlugList } from "@/lib/content/getGuide";
import { getUseCaseSlugList } from "@/lib/content/getUseCase";
import { getBlogSlugList } from "@/lib/content/getBlog";

// フラグ OFF（posterPage=false）に戻したときの sitemap を守る。
// jest.mock はファイル単位で固定されるため、フラグ ON（既定）の検証は sitemap.test.ts に分けている。
jest.mock("@/lib/constants/features", () => ({
  FEATURE_FLAGS: { posterPage: false },
}));

// 静的ページ: /, /create, /guide, /use-cases, /blog, /faq, /contact, /privacy, /terms の 9 件（/poster なし）
const STATIC_PAGE_COUNT_FLAG_OFF = 9;

describe("sitemap（フラグ OFF）", () => {
  it("/poster のエントリが含まれないこと", () => {
    const result = sitemap();
    const poster = result.filter((entry) => new URL(entry.url).pathname === "/poster");
    expect(poster).toHaveLength(0);
  });

  it("エントリ数が、フラグ ON のとき（静的ページ 10 件）より 1 件少ない 9 件の静的ページ前提であること", () => {
    const enCount = 2 + getGuideSlugList("en").length;
    const others =
      getGuideSlugList().length + getUseCaseSlugList().length + getBlogSlugList().length + enCount;
    const flagOnTotal = 10 + others;

    const result = sitemap();

    expect(result).toHaveLength(STATIC_PAGE_COUNT_FLAG_OFF + others);
    expect(result).toHaveLength(flagOnTotal - 1);
  });
});
