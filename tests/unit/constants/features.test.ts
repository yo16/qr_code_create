import { FEATURE_FLAGS } from "@/lib/constants/features";

// 機能フラグ定義（src/lib/constants/features.ts）のテスト
// 未完成の /poster を本番から隠すため、FEATURE_FLAGS.posterPage の既定値は false でなければならない
describe("FEATURE_FLAGS", () => {
  it("FEATURE_FLAGS がオブジェクトとして export されていること", () => {
    // 意図: 機能フラグの置き場所と export 名を固定し、sitemap / DownloadPanel / PosterPage が同じ定義を参照できるようにする
    expect(FEATURE_FLAGS).toBeDefined();
    expect(typeof FEATURE_FLAGS).toBe("object");
    expect(FEATURE_FLAGS).not.toBeNull();
  });

  it("posterPage が boolean であること", () => {
    // 意図: 文字列 "false" のような truthy な誤設定でフラグが意図せず ON になるのを防ぐ
    expect(typeof FEATURE_FLAGS.posterPage).toBe("boolean");
  });

  it("posterPage の既定値が false であること", () => {
    // 意図: 未完成の /poster を本番に露出させない（sitemap・CTA・ページ本体のガードはこの値を前提とする）
    expect(FEATURE_FLAGS.posterPage).toBe(false);
  });
});
