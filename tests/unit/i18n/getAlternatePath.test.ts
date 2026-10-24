import { EN_AVAILABLE_PATHS, getAlternatePath, localePath } from "@/lib/i18n/routes";

/**
 * getAlternatePath（言語切り替えの行き先）の単体テスト（qr_code_create-01z.6）。
 * 設計: doc/design/i18n-en.md 8.2 節
 */

describe("getAlternatePath: 設計 8.2 の表", () => {
  // 意図: 表の全行をそのまま固定する
  it.each([
    ["/", "en", "/en"],
    ["/create", "en", "/en/create"],
    ["/guide/getting-started", "en", "/en/guide/getting-started"],
    ["/faq", "en", "/en"],
    ["/guide/utm-setup", "en", "/en"],
    ["/en", "ja", "/"],
    ["/en/", "ja", "/"],
    ["/en/create", "ja", "/create"],
    ["/en/foo", "ja", "/"],
  ] as const)("%s → (to=%s) %s", (input, to, expected) => {
    expect(getAlternatePath(input, to)).toBe(expected);
  });
});

describe("getAlternatePath: 境界", () => {
  // 意図: 末尾スラッシュは除いて判定する
  it.each([
    ["/create/", "en", "/en/create"],
    ["/guide/getting-started/", "en", "/en/guide/getting-started"],
    ["/en/create/", "ja", "/create"],
    ["/en/guide/getting-started/", "ja", "/guide/getting-started"],
    ["/faq/", "en", "/en"],
  ] as const)("末尾スラッシュ付き %s → (to=%s) %s", (input, to, expected) => {
    expect(getAlternatePath(input, to)).toBe(expected);
  });

  // 意図: スラッシュが重なっていても末尾はすべて除く
  it("末尾スラッシュが複数でも除く（/create// → /en/create、/en// → /）", () => {
    expect(getAlternatePath("/create//", "en")).toBe("/en/create");
    expect(getAlternatePath("/en//", "ja")).toBe("/");
  });

  // 意図: /en で始まるだけの別パスを英語版と取り違えない
  it("/enterprise は to=en で英語版が無いので /en", () => {
    expect(getAlternatePath("/enterprise", "en")).toBe("/en");
  });

  it("/enterprise は to=ja で /en 配下ではないのでそのまま返す", () => {
    expect(getAlternatePath("/enterprise", "ja")).toBe("/enterprise");
  });

  // 意図: クエリと hash は引き継がない（パス部分だけで判定する）
  it.each([
    ["/create?utm_source=x", "en", "/en/create"],
    ["/create#top", "en", "/en/create"],
    ["/create?a=1#b", "en", "/en/create"],
    ["/en/create?utm_source=x", "ja", "/create"],
    ["/en?x=1", "ja", "/"],
    ["/faq?x=1", "en", "/en"],
  ] as const)("クエリ・hash を落とす %s → (to=%s) %s", (input, to, expected) => {
    const result = getAlternatePath(input, to);
    expect(result).toBe(expected);
    expect(result).not.toMatch(/[?#]/);
  });

  // 意図: 英語ガイドから日本語の同じガイドへ戻れる
  it("/en/guide/getting-started → (to=ja) /guide/getting-started", () => {
    expect(getAlternatePath("/en/guide/getting-started", "ja")).toBe("/guide/getting-started");
  });

  // 意図: en に無いページ（直打ちの 404 など）から ja へは推測せずトップへ
  it("/en/guide/utm-setup（en に無い）→ (to=ja) /", () => {
    expect(getAlternatePath("/en/guide/utm-setup", "ja")).toBe("/");
  });

  // 意図: to=en で /en 配下のパスが来たら（global-not-found が ja のシェルで /en 配下の未定義 URL を描く場合）、
  // 先頭の /en を外した ja 側のパスで判定する。英語版のあるページは二重前置せずその英語ページ、無いページは /en
  it.each([
    ["/en", "/en"],
    ["/en/", "/en"],
    ["/en/create", "/en/create"],
    ["/en/create/", "/en/create"],
    ["/en/guide/getting-started", "/en/guide/getting-started"],
    ["/en/create?x=1#a", "/en/create"],
  ] as const)("to=en で英語版のある /en 配下 %s は二重前置せず %s を返す", (input, expected) => {
    expect(getAlternatePath(input, "en")).toBe(expected);
  });

  it.each([
    ["/en/foo", "/en"],
    ["/en/foo/", "/en"],
    ["/en/guide/utm-setup", "/en"],
    ["/en/faq", "/en"],
    ["/en/en", "/en"],
    ["/en/en/create", "/en"],
  ] as const)("to=en で英語版の無い /en 配下 %s は自分自身ではなく英語トップ %s を返す", (input, expected) => {
    const result = getAlternatePath(input, "en");
    expect(result).toBe(expected);
    expect(result).not.toBe(input);
  });

  // 意図: /en で始まるだけのパス（/enterprise）は /en 配下として外さない
  it("to=en で /enterprise/create は /en 配下として扱わず /en（英語版なし）", () => {
    expect(getAlternatePath("/enterprise/create", "en")).toBe("/en");
  });

  // 意図: to=ja の振る舞いは不変（/en/foo → /）
  it("to=ja の /en/foo は従来どおり /", () => {
    expect(getAlternatePath("/en/foo", "ja")).toBe("/");
  });

  // 意図: to=ja で ja のパスを渡されたら変換せずそのまま返す
  it.each(["/", "/create", "/faq"])("to=ja で ja のパス %s はそのまま返す", (input) => {
    expect(getAlternatePath(input, "ja")).toBe(input);
  });

  // 意図: 空文字やパスの無い入力でも落ちずにトップ扱いになる
  it("空文字は / として扱う（to=en → /en、to=ja → /）", () => {
    expect(getAlternatePath("", "en")).toBe("/en");
    expect(getAlternatePath("", "ja")).toBe("/");
  });

  it("クエリだけ（?x=1）・hash だけ（#a）も / として扱う", () => {
    expect(getAlternatePath("?x=1", "en")).toBe("/en");
    expect(getAlternatePath("#a", "ja")).toBe("/");
  });

  // 意図: 大文字小文字は区別する（/EN は英語版の接頭辞ではない）
  it("/EN/create は /en 配下として扱わない（to=ja でそのまま）", () => {
    expect(getAlternatePath("/EN/create", "ja")).toBe("/EN/create");
  });
});

describe("getAlternatePath: 往復", () => {
  // 意図: 英語版のあるページは ja → en → ja で元のパスに戻る
  it.each([...EN_AVAILABLE_PATHS])("%s は ja → en → ja で元に戻る", (jaPath) => {
    const enPath = getAlternatePath(jaPath, "en");
    expect(enPath).toBe(localePath("en", jaPath));
    expect(getAlternatePath(enPath, "ja")).toBe(jaPath);
  });

  // 意図: en → ja → en でも元に戻る
  it.each([...EN_AVAILABLE_PATHS].map((p) => localePath("en", p)))(
    "%s は en → ja → en で元に戻る",
    (enPath) => {
      expect(getAlternatePath(getAlternatePath(enPath, "ja"), "en")).toBe(enPath);
    }
  );

  // 意図: 空振り防止（対象が 3 件以上ある）
  it("EN_AVAILABLE_PATHS は空でない", () => {
    expect(EN_AVAILABLE_PATHS.length).toBeGreaterThanOrEqual(3);
  });
});
