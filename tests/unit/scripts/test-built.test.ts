/**
 * @jest-environment node
 */
// qr_code_create-kjd: scripts/test-built.cjs（ビルド → REQUIRE_BUILD_OUTPUT=1 で jest）のふるまいと、関連する設定を守る。
// 実際のビルドは流さず、child_process.spawnSync を差し替えて検査する。
import fs from "fs";
import path from "path";

jest.mock("child_process", () => ({ spawnSync: jest.fn() }));

// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS スクリプトを読み込む
const { spawnSync } = require("child_process") as { spawnSync: jest.Mock };
// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS スクリプトを読み込む
const { main, nextBin, jestBin } = require("../../../scripts/test-built.cjs") as {
  main: (args: string[]) => number;
  nextBin: string;
  jestBin: string;
};

const ROOT = process.cwd();
const ok = { status: 0 };

describe("scripts/test-built.cjs のふるまい", () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    spawnSync.mockReset();
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("ビルドが成功したら jest を起動し、終了コード 0 を返す", () => {
    spawnSync.mockReturnValue(ok);
    expect(main([])).toBe(0);
    expect(spawnSync).toHaveBeenCalledTimes(2);
    expect(spawnSync.mock.calls[0][1][0]).toBe(nextBin);
    expect(spawnSync.mock.calls[1][1][0]).toBe(jestBin);
  });

  it("jest の env に REQUIRE_BUILD_OUTPUT=1 が入り、既存の環境変数も引き継がれる", () => {
    spawnSync.mockReturnValue(ok);
    main([]);
    const jestEnv = spawnSync.mock.calls[1][2].env;
    expect(jestEnv.REQUIRE_BUILD_OUTPUT).toBe("1");
    expect(jestEnv.PATH ?? jestEnv.Path).toBe(process.env.PATH ?? process.env.Path);
  });

  it("ビルドの env には REQUIRE_BUILD_OUTPUT を足さない", () => {
    const saved = process.env.REQUIRE_BUILD_OUTPUT;
    delete process.env.REQUIRE_BUILD_OUTPUT;
    try {
      spawnSync.mockReturnValue(ok);
      main([]);
      expect(spawnSync.mock.calls[0][2].env.REQUIRE_BUILD_OUTPUT).toBeUndefined();
    } finally {
      if (saved !== undefined) process.env.REQUIRE_BUILD_OUTPUT = saved;
    }
  });

  it.each([1, 2])("ビルドが status %i で失敗したら jest を起動せず、同じ終了コードを返す", (code) => {
    spawnSync.mockReturnValueOnce({ status: code });
    expect(main([])).toBe(code);
    expect(spawnSync).toHaveBeenCalledTimes(1);
  });

  it("jest が status 1 で失敗したら、終了コード 1 を返す", () => {
    spawnSync.mockReturnValueOnce(ok).mockReturnValueOnce({ status: 1 });
    expect(main([])).toBe(1);
    expect(spawnSync).toHaveBeenCalledTimes(2);
  });

  it("jest の終了コードがそのまま返る（例: 3）", () => {
    spawnSync.mockReturnValueOnce(ok).mockReturnValueOnce({ status: 3 });
    expect(main([])).toBe(3);
  });

  it("ビルドの起動エラー（result.error）は終了コード 1 で、jest を起動しない", () => {
    spawnSync.mockReturnValueOnce({ status: null, error: new Error("spawn failed") });
    expect(main([])).toBe(1);
    expect(spawnSync).toHaveBeenCalledTimes(1);
  });

  it("ビルドがシグナルで終了（status が null）したら終了コード 1 で、jest を起動しない", () => {
    spawnSync.mockReturnValueOnce({ status: null, signal: "SIGKILL" });
    expect(main([])).toBe(1);
    expect(spawnSync).toHaveBeenCalledTimes(1);
  });

  it("jest の起動エラーは終了コード 1", () => {
    spawnSync.mockReturnValueOnce(ok).mockReturnValueOnce({ status: null, error: new Error("x") });
    expect(main([])).toBe(1);
  });

  it("jest がシグナルで終了（status が null）したら終了コード 1", () => {
    spawnSync.mockReturnValueOnce(ok).mockReturnValueOnce({ status: null, signal: "SIGTERM" });
    expect(main([])).toBe(1);
  });

  it("追加の引数（空白を含むものも）が割れずに jest にだけ渡り、ビルドには渡らない", () => {
    spawnSync.mockReturnValue(ok);
    const args = ["tests/unit/app", "-t", "a b"];
    main(args);
    expect(spawnSync.mock.calls[1][1]).toEqual([jestBin, ...args]);
    expect(spawnSync.mock.calls[0][1]).toEqual([nextBin, "build"]);
  });

  it.each([
    ["next", (p: string) => p !== nextBin],
    ["jest", (p: string) => p !== jestBin],
  ])("%s の起動ファイルが存在しなければ、終了コード 1 を返し spawnSync を呼ばない", (_name, exists) => {
    const existsSpy = jest.spyOn(fs, "existsSync").mockImplementation((p) => exists(String(p)));
    try {
      expect(main([])).toBe(1);
      expect(spawnSync).not.toHaveBeenCalled();
    } finally {
      existsSpy.mockRestore();
    }
  });

  it("環境に REQUIRE_BUILD_OUTPUT=0 があっても、jest の env では 1 に上書きされる", () => {
    const saved = process.env.REQUIRE_BUILD_OUTPUT;
    process.env.REQUIRE_BUILD_OUTPUT = "0";
    try {
      spawnSync.mockReturnValue(ok);
      main([]);
      expect(spawnSync.mock.calls[1][2].env.REQUIRE_BUILD_OUTPUT).toBe("1");
    } finally {
      if (saved === undefined) delete process.env.REQUIRE_BUILD_OUTPUT;
      else process.env.REQUIRE_BUILD_OUTPUT = saved;
    }
  });

  it("process.execPath で起動し、next と jest の実在するファイルを指し、shell を使わない", () => {
    spawnSync.mockReturnValue(ok);
    main([]);
    for (const call of spawnSync.mock.calls) {
      expect(call[0]).toBe(process.execPath);
      expect(call[2].shell).toBeFalsy();
      expect(call[2].cwd).toBe(ROOT);
    }
    expect(fs.existsSync(nextBin)).toBe(true);
    expect(fs.existsSync(jestBin)).toBe(true);
    expect(nextBin).toBe(path.join(ROOT, "node_modules", "next", "dist", "bin", "next"));
    expect(jestBin).toBe(path.join(ROOT, "node_modules", "jest", "bin", "jest.js"));
  });
});

describe("test:built に関する設定", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"));

  it("package.json の test:built が node scripts/test-built.cjs である", () => {
    expect(pkg.scripts["test:built"]).toBe("node scripts/test-built.cjs");
  });

  it("package.json の build が next build である（スクリプトが next build を直接流すため）", () => {
    expect(pkg.scripts.build).toBe("next build");
  });

  it("mandatory-testing.md に npm run test:built と REQUIRE_BUILD_OUTPUT の記述がある", () => {
    const rule = fs.readFileSync(path.join(ROOT, ".claude/rules/mandatory-testing.md"), "utf-8");
    expect(rule).toContain("npm run test:built");
    expect(rule).toContain("REQUIRE_BUILD_OUTPUT");
  });

  it("staticOutput.test.ts がスクリプトの渡す値（REQUIRE_BUILD_OUTPUT === \"1\"）を読んでいる", () => {
    const src = fs.readFileSync(path.join(ROOT, "tests/unit/app/staticOutput.test.ts"), "utf-8");
    expect(src).toContain('process.env.REQUIRE_BUILD_OUTPUT === "1"');
    const script = fs.readFileSync(path.join(ROOT, "scripts/test-built.cjs"), "utf-8");
    expect(script).toContain('REQUIRE_BUILD_OUTPUT: "1"');
  });
});
