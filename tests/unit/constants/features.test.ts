// 機能フラグ定義（src/lib/constants/features.ts）のテスト
// posterPage は NEXT_PUBLIC_FEATURE_POSTER_PAGE === "1" のときだけ true になる。
// 実行環境にこの変数が入っていても結果が変わらないよう、テスト内で変数を設定・削除してから読み込み直す。
const ENV_KEY = "NEXT_PUBLIC_FEATURE_POSTER_PAGE";

type Flags = typeof import("@/lib/constants/features").FEATURE_FLAGS;

/** 環境変数を指定した状態で features.ts を読み込み直し、FEATURE_FLAGS を返す（undefined は変数を削除） */
function loadFlags(value: string | undefined): Flags {
  if (value === undefined) {
    delete process.env[ENV_KEY];
  } else {
    process.env[ENV_KEY] = value;
  }
  let flags!: Flags;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- isolateModules 内で毎回読み直すため require を使う
    flags = require("@/lib/constants/features").FEATURE_FLAGS;
  });
  return flags;
}

describe("FEATURE_FLAGS", () => {
  const original = process.env[ENV_KEY];

  afterEach(() => {
    if (original === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = original;
    }
  });

  it("FEATURE_FLAGS がオブジェクトとして export されていること", () => {
    const flags = loadFlags(undefined);
    expect(flags).toBeDefined();
    expect(typeof flags).toBe("object");
    expect(flags).not.toBeNull();
  });

  it("posterPage が boolean であること（文字列などの truthy な値が入らない）", () => {
    for (const value of [undefined, "1", "0", "true", ""]) {
      expect(typeof loadFlags(value).posterPage).toBe("boolean");
    }
  });

  it("環境変数が未設定なら posterPage は false であること（本番に露出させない）", () => {
    expect(loadFlags(undefined).posterPage).toBe(false);
  });

  it('環境変数が "1" のときだけ posterPage が true になること', () => {
    expect(loadFlags("1").posterPage).toBe(true);
  });

  it.each([["0"], ["true"], ["TRUE"], ["on"], ["yes"], [""], [" 1"], ["1 "], ["01"]])(
    "環境変数が %j のときは posterPage が false であること",
    (value) => {
      expect(loadFlags(value).posterPage).toBe(false);
    }
  );
});
