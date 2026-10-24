import { ja } from "@/i18n/ja";
import { PAGE_METADATA } from "@/lib/metadata/buildMetadata";
import { rootMetadataJa } from "@/lib/metadata/rootMetadata";

describe("Server スライスと他の箇所の整合", () => {
  // 意図: ヘッダー CTA（Server）とモバイルメニュー CTA（Client）は同じ文言を二重に持つ。
  // 片方だけ更新して食い違うのを防ぐ
  it("header.cta と common.mobileMenu.cta が同じ値", () => {
    expect(ja.header.cta).toBe(ja.common.mobileMenu.cta);
  });

  // 意図: PAGE_METADATA と ja.meta.pages が同じページ集合を持つ（片方への追加漏れ検出）
  it("PAGE_METADATA のキーが ja.meta.pages のキーと一致する", () => {
    expect(Object.keys(PAGE_METADATA).sort()).toEqual(
      Object.keys(ja.meta.pages).sort()
    );
  });

  // 意図: PAGE_METADATA の title / description は辞書の値そのもの
  it.each(Object.keys(ja.meta.pages) as Array<keyof typeof ja.meta.pages>)(
    "PAGE_METADATA.%s の title / description が ja.meta.pages と一致",
    (key) => {
      expect(PAGE_METADATA[key].title).toBe(ja.meta.pages[key].title);
      expect(PAGE_METADATA[key].description).toBe(
        ja.meta.pages[key].description
      );
    }
  );

  // 意図: パスと noIndex は辞書化で変わっていない
  it("PAGE_METADATA の path / noIndex は従来どおり", () => {
    expect(
      Object.fromEntries(
        Object.entries(PAGE_METADATA).map(([k, v]) => [
          k,
          { path: v.path, noIndex: "noIndex" in v ? v.noIndex : undefined },
        ])
      )
    ).toEqual({
      home: { path: "/", noIndex: undefined },
      create: { path: "/create", noIndex: undefined },
      faq: { path: "/faq", noIndex: undefined },
      privacy: { path: "/privacy", noIndex: true },
      terms: { path: "/terms", noIndex: true },
      guide: { path: "/guide", noIndex: undefined },
      useCases: { path: "/use-cases", noIndex: undefined },
      blog: { path: "/blog", noIndex: undefined },
    });
  });

  // 意図: ルートメタデータの既定タイトルと説明は ja.meta.root から引く
  it("rootMetadataJa が ja.meta.root と一致", () => {
    expect(rootMetadataJa.title).toEqual({
      default: ja.meta.root.title,
      template: "%s | QR Code Create",
    });
    expect(rootMetadataJa.description).toBe(ja.meta.root.description);
  });
});
