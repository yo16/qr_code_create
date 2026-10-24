/**
 * @jest-environment node
 */
// EN_AVAILABLE_PATHS と英語ガイドの slug 一覧の整合（doc/design/i18n-en.md 10.2 節、qr_code_create-01z.5）。
// ガイドを足したのに EN_AVAILABLE_PATHS を更新し忘れる（導線が出ない）、
// または EN_AVAILABLE_PATHS にだけ足して MDX が無い（導線が 404 を指す）ことを検知する。
import { EN_AVAILABLE_PATHS } from "@/lib/i18n/routes";
import { getGuideSlugList } from "@/lib/content/getGuide";

describe("EN_AVAILABLE_PATHS と getGuideSlugList(\"en\") の整合", () => {
  const enSlugs = getGuideSlugList("en");
  const guidePaths = EN_AVAILABLE_PATHS.filter((p) => p.startsWith("/guide/"));

  // 意図: 比較対象が空でない（空同士で素通りしない）
  it("en のガイドが 1 本以上あり、EN_AVAILABLE_PATHS にガイドのパスが 1 件以上ある", () => {
    expect(enSlugs.length).toBeGreaterThan(0);
    expect(guidePaths.length).toBeGreaterThan(0);
  });

  // 意図: en の各ガイドに導線が出る
  it("en の各 slug について /guide/<slug> が EN_AVAILABLE_PATHS に含まれる", () => {
    const missing = enSlugs.filter((slug) => !EN_AVAILABLE_PATHS.includes(`/guide/${slug}`));
    expect(missing).toEqual([]);
  });

  // 意図: EN_AVAILABLE_PATHS のガイドはすべて英語の MDX がある（導線が 404 を指さない）
  it("EN_AVAILABLE_PATHS の /guide/... はすべて en の slug に存在する", () => {
    const orphan = guidePaths.filter((p) => !enSlugs.includes(p.replace(/^\/guide\//, "")));
    expect(orphan).toEqual([]);
  });

  // 意図: en にガイド一覧 /guide は無い（パンくずも Home › 記事の 2 段）
  it("EN_AVAILABLE_PATHS に /guide（一覧）は含まれない", () => {
    expect(EN_AVAILABLE_PATHS).not.toContain("/guide");
  });
});
