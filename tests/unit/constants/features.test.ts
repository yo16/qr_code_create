// 機能フラグ定義（src/lib/constants/features.ts）のテスト
// qr_code_create-l1a で /poster を公開したため、posterPage は true が既定で、環境変数では切り替わらない。
// （フラグを false にしたときの挙動は、モックを使う posterPage.test.tsx / DownloadPanel.flagOff.test.tsx が守る）
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

  it("posterPage が boolean の true であること（公開済み）", () => {
    const flags = loadFlags(undefined);
    expect(typeof flags.posterPage).toBe("boolean");
    expect(flags.posterPage).toBe(true);
  });

  it.each([[undefined], ["1"], ["0"], ["true"], ["false"], [""], ["off"]])(
    "環境変数が %j でも posterPage は true のままであること（環境変数で上書きされない）",
    (value) => {
      expect(loadFlags(value).posterPage).toBe(true);
    }
  );
});
