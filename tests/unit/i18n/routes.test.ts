import { localePath } from "@/lib/i18n/routes";

describe("localePath", () => {
  // 意図: ja は日本語版のパスをそのまま返す（既存 URL を変えない）
  it('("ja", "/create") は /create', () => {
    expect(localePath("ja", "/create")).toBe("/create");
  });

  // 意図: en は /en を前置する
  it('("en", "/create") は /en/create', () => {
    expect(localePath("en", "/create")).toBe("/en/create");
  });

  // 意図: en のトップは末尾スラッシュ無しの /en
  it('("en", "/") は /en', () => {
    expect(localePath("en", "/")).toBe("/en");
  });

  // 意図: ja のトップは /
  it('("ja", "/") は /', () => {
    expect(localePath("ja", "/")).toBe("/");
  });

  // 意図: 先頭スラッシュが無くても /en/ の後に 1 本だけ入る
  it('("en", "create") は /en/create', () => {
    expect(localePath("en", "create")).toBe("/en/create");
  });

  // 意図: 空文字は en のトップとみなす
  it('("en", "") は /en', () => {
    expect(localePath("en", "")).toBe("/en");
  });

  // 意図: ja は入力をそのまま返す（先頭スラッシュ無し・空文字も変換しない）
  it('ja は先頭スラッシュ無し・空文字もそのまま返す', () => {
    expect(localePath("ja", "create")).toBe("create");
    expect(localePath("ja", "")).toBe("");
  });

  // 意図: 入れ子のパスも /en を前置するだけ
  it('("en", "/guide/utm-setup") は /en/guide/utm-setup', () => {
    expect(localePath("en", "/guide/utm-setup")).toBe("/en/guide/utm-setup");
  });
});
