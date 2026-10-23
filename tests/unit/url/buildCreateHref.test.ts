import { buildCreateHref } from "@/lib/url/buildCreateHref";

/**
 * buildCreateHref のテスト
 *
 * 用途別ページ末尾の「QRコードを作成する」CTA から /create へ遷移する際、
 * frontmatter の preset / utmSource をクエリパラメータとして引き継ぐための関数。
 * 設計（doc/design/page-routing.md 2.5・4.2）に従い、
 *   - クエリの順序は utm_source → utm_medium → preset
 *   - utmSource がある場合は utm_medium=qr を自動付与
 * とする。ガイドページでは引数なしで呼ばれ、プレーンな "/create" を返す必要がある。
 */
describe("buildCreateHref", () => {
  describe("パラメータの組み合わせ", () => {
    it("preset と utmSource の両方があれば utm_source → utm_medium → preset の順で付与されること", () => {
      // 意図: 用途別ページ（poster）からの遷移で、流入元・媒体・プリセットの 3 つを引き継ぐ。
      //       順序が固定されていないと E2E や GA のレポートで URL が揺れるため、順序も検証する。
      expect(buildCreateHref({ preset: "elegant", utmSource: "poster" })).toBe(
        "/create?utm_source=poster&utm_medium=qr&preset=elegant"
      );
    });

    it("utmSource のみなら utm_source と utm_medium=qr が付与されること", () => {
      // 意図: preset を持たない用途別ページでも流入元と媒体を引き継げる。
      //       utm_medium は utmSource に連動して自動付与される。
      expect(buildCreateHref({ utmSource: "poster" })).toBe(
        "/create?utm_source=poster&utm_medium=qr"
      );
    });

    it("preset のみなら preset だけが付与され utm_medium は付かないこと", () => {
      // 意図: utmSource がないときに utm_medium=qr だけが単独で付与されないこと。
      expect(buildCreateHref({ preset: "elegant" })).toBe("/create?preset=elegant");
    });

    it("引数なしなら \"/create\" を返すこと", () => {
      // 意図: ガイドページの CTA は引数なしで呼ばれる。末尾に "?" が付かないこと。
      expect(buildCreateHref()).toBe("/create");
    });

    it("空オブジェクトなら \"/create\" を返すこと", () => {
      // 意図: 両方 undefined のケース。末尾に "?" が付かないこと。
      expect(buildCreateHref({})).toBe("/create");
    });
  });

  describe("空文字の扱い", () => {
    it("preset が空文字なら無視されること", () => {
      // 意図: frontmatter に preset: "" と書かれた場合に "preset=" という無意味なクエリを付けない。
      expect(buildCreateHref({ preset: "", utmSource: "poster" })).toBe(
        "/create?utm_source=poster&utm_medium=qr"
      );
    });

    it("utmSource が空文字なら utm_source も utm_medium も付かないこと", () => {
      // 意図: 同上。"utm_source=" を付けず、連動する utm_medium=qr も付けない。
      expect(buildCreateHref({ preset: "elegant", utmSource: "" })).toBe(
        "/create?preset=elegant"
      );
    });

    it("両方とも空文字なら \"/create\" を返すこと", () => {
      // 意図: 両方空文字でも "?" が残らないこと。
      expect(buildCreateHref({ preset: "", utmSource: "" })).toBe("/create");
    });
  });

  describe("値のエンコード", () => {
    it("utmSource に空白を含む場合、URLSearchParams 形式でエンコードされること", () => {
      // 意図: 値が URL として壊れないこと。URLSearchParams は空白を "+" にするが、
      //       実装が encodeURIComponent 相当（"%20"）でも URL としては等価なので両方を許容する。
      const result = buildCreateHref({ utmSource: "a b" });
      expect([
        "/create?utm_source=a+b&utm_medium=qr",
        "/create?utm_source=a%20b&utm_medium=qr",
      ]).toContain(result);
    });

    it("preset に記号（&, =）を含む場合、クエリ構造を壊さずエンコードされること", () => {
      // 意図: 不正な値でもパラメータの区切りが壊れず、デコードすると元の値に戻ること。
      const result = buildCreateHref({ preset: "a&b=c", utmSource: "poster" });
      const query = result.replace(/^\/create\?/, "");
      const params = new URLSearchParams(query);
      expect(params.get("utm_source")).toBe("poster");
      expect(params.get("utm_medium")).toBe("qr");
      expect(params.get("preset")).toBe("a&b=c");
    });
  });
});
