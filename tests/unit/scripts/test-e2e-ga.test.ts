/**
 * @jest-environment node
 */
// qr_code_create-dot: scripts/test-e2e-ga.cjs（GA 入りのビルド → Playwright → GA なしの再ビルド）のふるまいを守る。
// 実際のビルドと Playwright は起動しない。child_process.spawnSync と fs.existsSync を差し替えて検査する。
import fs from "fs";

jest.mock("child_process", () => ({ spawnSync: jest.fn() }));

/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS スクリプトを読み込む */
const { spawnSync } = require("child_process") as { spawnSync: jest.Mock };
const script = require("../../../scripts/test-e2e-ga.cjs") as {
  main: (args: string[]) => number;
  PUBLIC_GA_ID: string;
  buildEnv: (base: Env, overrides: Record<string, string | undefined>) => Env;
  gaEnv: (base: Env) => Env;
  rebuildEnv: (base: Env) => Env;
  shouldSkipRebuild: (base: Env) => boolean;
  decideExitCode: (testStatus: number, rebuildStatus: number | null) => number;
};
/* eslint-enable @typescript-eslint/no-require-imports */
const { main, PUBLIC_GA_ID, buildEnv, gaEnv, rebuildEnv, shouldSkipRebuild, decideExitCode } = script;

type Env = Record<string, string | undefined>;

const KEY = "NEXT_PUBLIC_GA_MEASUREMENT_ID";

describe("decideExitCode", () => {
  it.each([
    [1, 0, 1],
    [2, 3, 2],
    [5, null, 5],
  ])("Playwright（または最初のビルド）が %i のとき、再ビルドが %p でも %i を返す", (test, rebuild, expected) => {
    expect(decideExitCode(test, rebuild)).toBe(expected);
  });

  it.each([
    [null, 0],
    [0, 0],
    [4, 4],
  ])("Playwright が 0 のとき、再ビルドが %p なら %i を返す", (rebuild, expected) => {
    expect(decideExitCode(0, rebuild)).toBe(expected);
  });
});

describe("buildEnv", () => {
  it("値が undefined のキーを、キーごと落とす", () => {
    const result = buildEnv({ A: "1", B: "2" }, { B: undefined, C: undefined });
    expect(result).toEqual({ A: "1" });
    expect(Object.keys(result)).not.toContain("B");
    expect(Object.keys(result)).not.toContain("C");
  });

  it("上書きの値を優先し、空文字は落とさない", () => {
    expect(buildEnv({ A: "1" }, { A: "2", E: "" })).toEqual({ A: "2", E: "" });
  });
});

describe("gaEnv", () => {
  it("環境に測定 ID があればそれを使う", () => {
    expect(gaEnv({ [KEY]: "G-TEST", PATH: "/bin" })[KEY]).toBe("G-TEST");
  });

  it("測定 ID が無ければ公開値を使う", () => {
    expect(gaEnv({ PATH: "/bin" })[KEY]).toBe(PUBLIC_GA_ID);
  });

  it("測定 ID が空文字のときも公開値を使う（|| で判定している）", () => {
    expect(gaEnv({ [KEY]: "" })[KEY]).toBe(PUBLIC_GA_ID);
  });

  it("ほかのキーを残し、引数を書き換えない", () => {
    const base = { PATH: "/bin" };
    const result = gaEnv(base);
    expect(result.PATH).toBe("/bin");
    expect(base).toEqual({ PATH: "/bin" });
  });
});

describe("rebuildEnv", () => {
  it("親の環境に測定 ID があっても、キーごと無い", () => {
    const result = rebuildEnv({ [KEY]: "G-PARENT", PATH: "/bin" });
    expect(Object.keys(result)).not.toContain(KEY);
    expect(KEY in result).toBe(false);
  });

  it("ほかのキーは残る", () => {
    expect(rebuildEnv({ [KEY]: "G-PARENT", PATH: "/bin", FOO: "bar" })).toEqual({ PATH: "/bin", FOO: "bar" });
  });

  it("引数の環境と process.env を書き換えない", () => {
    const base = { [KEY]: "G-PARENT", PATH: "/bin" };
    const processEnvBefore = { ...process.env };
    rebuildEnv(base);
    expect(base).toEqual({ [KEY]: "G-PARENT", PATH: "/bin" });
    expect(process.env).toEqual(processEnvBefore);
  });
});

describe("shouldSkipRebuild", () => {
  it('"1" だけ true', () => {
    expect(shouldSkipRebuild({ SKIP_REBUILD: "1" })).toBe(true);
  });

  it.each([[undefined], [""], ["0"], ["true"], [" 1"]])("SKIP_REBUILD=%p は false", (value) => {
    expect(shouldSkipRebuild({ SKIP_REBUILD: value })).toBe(false);
  });

  it("キー自体が無ければ false", () => {
    expect(shouldSkipRebuild({})).toBe(false);
  });
});

describe("main（spawnSync と existsSync を差し替えて順序を見る）", () => {
  const savedEnv = { ...process.env };
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    spawnSync.mockReset();
    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    delete process.env.SKIP_REBUILD;
    delete process.env[KEY];
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // process.env を元に戻す（追加・変更・削除のすべて）
    for (const k of Object.keys(process.env)) {
      if (!(k in savedEnv)) delete process.env[k];
    }
    Object.assign(process.env, savedEnv);
    for (const k of ["SKIP_REBUILD", KEY]) {
      if (savedEnv[k] === undefined) delete process.env[k];
    }
  });

  const isBuild = (call: unknown[]): boolean => (call[1] as string[])[1] === "build";
  const isPlaywright = (call: unknown[]): boolean => (call[1] as string[])[1] === "test";
  const envOf = (call: unknown[]): Env => (call[2] as { env: Env }).env;

  it("すべて成功: ビルド、Playwright、GA なしの再ビルドの順に流し、0 を返す", () => {
    spawnSync.mockReturnValue({ status: 0 });
    expect(main(["--grep", "x"])).toBe(0);

    const calls = spawnSync.mock.calls;
    expect(calls).toHaveLength(3);
    expect(isBuild(calls[0])).toBe(true);
    expect(isPlaywright(calls[1])).toBe(true);
    expect(calls[1][1]).toEqual(expect.arrayContaining(["--config", "playwright.ga.config.ts", "--grep", "x"]));
    expect(isBuild(calls[2])).toBe(true);
    // 1 回目と Playwright には測定 ID が入り、再ビルドには無い
    expect(envOf(calls[0])[KEY]).toBe(PUBLIC_GA_ID);
    expect(envOf(calls[1])[KEY]).toBe(PUBLIC_GA_ID);
    expect(KEY in envOf(calls[2])).toBe(false);
  });

  it("親に測定 ID があっても、再ビルドの env には無い", () => {
    process.env[KEY] = "G-PARENT";
    spawnSync.mockReturnValue({ status: 0 });
    main([]);
    const calls = spawnSync.mock.calls;
    expect(envOf(calls[0])[KEY]).toBe("G-PARENT");
    expect(KEY in envOf(calls[2])).toBe(false);
  });

  it("最初のビルドが失敗しても、Playwright は流さず、再ビルドには進む。戻り値は最初のビルドの値", () => {
    spawnSync.mockReturnValueOnce({ status: 2 }).mockReturnValue({ status: 0 });
    expect(main([])).toBe(2);
    const calls = spawnSync.mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls.some(isPlaywright)).toBe(false);
    expect(isBuild(calls[1])).toBe(true);
    expect(KEY in envOf(calls[1])).toBe(false);
  });

  it("Playwright が失敗しても再ビルドを流し、Playwright の値を返す", () => {
    spawnSync.mockReturnValueOnce({ status: 0 }).mockReturnValueOnce({ status: 1 }).mockReturnValue({ status: 7 });
    expect(main([])).toBe(1);
    expect(spawnSync).toHaveBeenCalledTimes(3);
  });

  it("Playwright が成功し、再ビルドが失敗したら、再ビルドの値を返す", () => {
    spawnSync.mockReturnValueOnce({ status: 0 }).mockReturnValueOnce({ status: 0 }).mockReturnValue({ status: 9 });
    expect(main([])).toBe(9);
  });

  it("SKIP_REBUILD=1 では再ビルドを呼ばず、標準エラーに注意を出す", () => {
    process.env.SKIP_REBUILD = "1";
    spawnSync.mockReturnValue({ status: 0 });
    expect(main([])).toBe(0);
    expect(spawnSync).toHaveBeenCalledTimes(2);
    expect(isBuild(spawnSync.mock.calls[0])).toBe(true);
    expect(isPlaywright(spawnSync.mock.calls[1])).toBe(true);
    const message = errorSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(message).toContain("GA 入りのまま");
    expect(message).toContain("npm run build");
  });

  it("SKIP_REBUILD=1 でも Playwright の失敗は返す", () => {
    process.env.SKIP_REBUILD = "1";
    spawnSync.mockReturnValueOnce({ status: 0 }).mockReturnValue({ status: 3 });
    expect(main([])).toBe(3);
    expect(spawnSync).toHaveBeenCalledTimes(2);
  });

  it("status が null のときは 1 として扱う", () => {
    spawnSync.mockReturnValueOnce({ status: null }).mockReturnValue({ status: 0 });
    expect(main([])).toBe(1);
  });

  it("起動できなかった（error あり、status が null）ときは、エラーを標準エラーに出して 1 として扱う", () => {
    const err = new Error("x");
    spawnSync.mockReturnValueOnce({ error: err, status: null }).mockReturnValue({ status: 0 });
    expect(main([])).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(err);
  });

  it("追加引数は Playwright だけに渡り、再ビルドの引数は next の bin と build だけ", () => {
    spawnSync.mockReturnValue({ status: 0 });
    main(["--grep", "x"]);
    const calls = spawnSync.mock.calls;
    expect(calls[0][1]).toHaveLength(2);
    expect(calls[2][1]).toHaveLength(2);
    expect(calls[2][1][1]).toBe("build");
    expect(calls[0][1]).not.toContain("--grep");
    expect(calls[2][1]).not.toContain("--grep");
    expect(calls[1][1]).toEqual(expect.arrayContaining(["--grep", "x"]));
  });

  it("SKIP_REBUILD なしのときは、「GA 入りのまま」の注意を出さない", () => {
    spawnSync.mockReturnValue({ status: 0 });
    main([]);
    const message = errorSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(message).not.toContain("GA 入りのまま");
  });

  it("next か playwright が見つからないときは、何も起動せず 1 を返す", () => {
    jest.spyOn(fs, "existsSync").mockReturnValue(false);
    expect(main([])).toBe(1);
    expect(spawnSync).not.toHaveBeenCalled();
  });
});

describe("SKIP_REBUILD の名前", () => {
  it("スクリプトと設計書の両方に同じ名前がある", () => {
    const scriptSrc = fs.readFileSync(require.resolve("../../../scripts/test-e2e-ga.cjs"), "utf8");
    const doc = fs.readFileSync(require.resolve("../../../doc/design/architecture.md"), "utf8");
    expect(scriptSrc).toContain("SKIP_REBUILD");
    expect(doc).toContain("SKIP_REBUILD=1");
  });
});
