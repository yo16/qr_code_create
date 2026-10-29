import sitemap from "@/app/sitemap";
import { getGuideSlugList } from "@/lib/content/getGuide";
import { getUseCaseSlugList } from "@/lib/content/getUseCase";
import { getBlogSlugList } from "@/lib/content/getBlog";
import { NON_JA_LOCALES } from "@/i18n/locales";
import { PAGE_METADATA } from "@/lib/metadata/buildMetadata";

// フラグ OFF（posterPage=false）に戻したときの sitemap を守る。
// jest.mock はファイル単位で固定されるため、フラグ ON（既定）の検証は sitemap.test.ts に分けている。
jest.mock("@/lib/constants/features", () => ({
  FEATURE_FLAGS: { posterPage: false },
}));

// 静的ページ 9 件（/poster なし）から noIndex のページ（privacy・terms）を除いた数
const NOINDEX_COUNT = Object.values(PAGE_METADATA).filter((page) => "noIndex" in page && page.noIndex === true).length;
const STATIC_PAGE_COUNT_FLAG_OFF = 9 - NOINDEX_COUNT;

describe("sitemap（フラグ OFF）", () => {
  it("/poster のエントリが含まれないこと", () => {
    const result = sitemap();
    const poster = result.filter((entry) => new URL(entry.url).pathname === "/poster");
    expect(poster).toHaveLength(0);
  });

  it("エントリ数が、フラグ ON のとき（静的ページ 10 件）より 1 件少ない 7 件の静的ページ前提であること（noIndex 除外後）", () => {
    // M4: 非 ja の言語数 x 3 件（設計書 11.1）
    const enCount = NON_JA_LOCALES.length * (2 + getGuideSlugList("en").length);
    const others =
      getGuideSlugList().length + getUseCaseSlugList().length + getBlogSlugList().length + enCount;
    const flagOnTotal = 10 - NOINDEX_COUNT + others;

    const result = sitemap();

    expect(NOINDEX_COUNT).toBe(2);
    expect(STATIC_PAGE_COUNT_FLAG_OFF).toBe(7);
    expect(result).toHaveLength(STATIC_PAGE_COUNT_FLAG_OFF + others);
    expect(result).toHaveLength(flagOnTotal - 1);
  });
});
