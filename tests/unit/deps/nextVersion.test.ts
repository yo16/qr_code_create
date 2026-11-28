import fs from "fs";
import path from "path";

/**
 * Next.js 16.4.5 以上への更新を担保するテスト。
 *
 * 下限の履歴: 4j0 で 16.4.2、g33 で 16.4.5 に引き上げた。
 * npm audit が next 16.0.0〜16.4.4 に moderate の勧告 7 件を出し、修正版は 16.4.5 以上のため。
 * g33 では実際の指定を 16.4.6 に上げている。
 *
 * 外部パッケージ（semver 等）に依存せず、fs と path だけで
 * package.json / package-lock.json を読み取り、バージョン文字列を数値比較する。
 */

const ROOT_DIR = path.resolve(__dirname, "../../..");
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, "package.json");
const PACKAGE_LOCK_PATH = path.join(ROOT_DIR, "package-lock.json");

/** 本タスクで要求する Next.js の最低バージョン */
const REQUIRED_NEXT_VERSION = "16.4.5";

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

type PackageLock = {
  packages?: Record<string, { version?: string }>;
};

/**
 * バージョン文字列から先頭の範囲指定子（^, ~, >=, = 等）を取り除く。
 * 例: "^16.2.3" -> "16.2.3"
 */
function stripRangePrefix(version: string): string {
  return version.replace(/^[\^~>=<\s]+/, "");
}

/**
 * 2 つのバージョン文字列を "." で分割し、各要素を数値として比較する。
 * 返り値: a < b なら負、a === b なら 0、a > b なら正。
 * プレリリース識別子（例: "16.4.2-canary.1"）は、同じ数字部分の正式版より小さいものとして扱う。
 * 数字部分が同じでプレリリース同士の場合は、識別子の文字列で比べる。
 */
function compareVersions(a: string, b: string): number {
  const split = (v: string): { parts: number[]; pre: string | null } => {
    const stripped = stripRangePrefix(v);
    const hyphen = stripped.indexOf("-");
    const core = hyphen === -1 ? stripped : stripped.slice(0, hyphen);
    return {
      parts: core.split(".").map((part) => {
        const n = parseInt(part, 10);
        return Number.isNaN(n) ? 0 : n;
      }),
      pre: hyphen === -1 ? null : stripped.slice(hyphen + 1),
    };
  };

  const va = split(a);
  const vb = split(b);
  const length = Math.max(va.parts.length, vb.parts.length);

  for (let i = 0; i < length; i += 1) {
    const diff = (va.parts[i] ?? 0) - (vb.parts[i] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }
  if (va.pre === null && vb.pre === null) return 0;
  if (va.pre === null) return 1;
  if (vb.pre === null) return -1;
  return va.pre < vb.pre ? -1 : va.pre > vb.pre ? 1 : 0;
}

/** プレリリース版（ハイフン付き）か */
function isPrerelease(version: string): boolean {
  return stripRangePrefix(version).includes("-");
}

/** 正式版で、かつ下限以上のときだけ true。プレリリース版は数字部分が上でも満たさない扱い。 */
function meetsMinimum(version: string, minimum: string): boolean {
  return !isPrerelease(version) && compareVersions(version, minimum) >= 0;
}

/**
 * 版のパッチを 1 減らした版を返す（下限の 1 つ前の版を作る）。
 * パッチが 0 の版には 1 つ前の版を決められないので、例外を投げる。
 */
function previousPatch(version: string): string {
  const [major, minor, patch] = stripRangePrefix(version).split("-")[0].split(".");
  const n = parseInt(patch, 10);
  if (Number.isNaN(n) || n <= 0) {
    throw new Error(`パッチを 1 減らせない版: ${version}`);
  }
  return `${major}.${minor}.${n - 1}`;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

describe("Next.js 依存バージョン", () => {
  const packageJson = readJson<PackageJson>(PACKAGE_JSON_PATH);
  const packageLock = readJson<PackageLock>(PACKAGE_LOCK_PATH);

  describe("compareVersions ヘルパー", () => {
    // ヘルパー自体が誤判定すると本体テストが無意味になるため、最低限の自己検証を行う
    it("同一バージョンは 0 を返すこと", () => {
      expect(compareVersions("16.4.2", "16.4.2")).toBe(0);
    });

    it("範囲指定子（^, ~）を無視して比較できること", () => {
      expect(compareVersions("^16.4.2", "16.4.2")).toBe(0);
      expect(compareVersions("~16.4.2", "16.4.2")).toBe(0);
    });

    it("パッチ・マイナー・メジャーの大小を正しく判定すること", () => {
      expect(compareVersions("16.2.3", "16.4.2")).toBeLessThan(0);
      expect(compareVersions("16.4.10", "16.4.2")).toBeGreaterThan(0);
      expect(compareVersions("17.0.0", "16.4.2")).toBeGreaterThan(0);
    });

    it(`下限 ${REQUIRED_NEXT_VERSION} の境界で、1 つ前の版は下回り下限以上は通ること`, () => {
      const justBelow = previousPatch(REQUIRED_NEXT_VERSION);
      const [major, minor, patch] = REQUIRED_NEXT_VERSION.split(".").map(Number);
      expect(compareVersions(justBelow, REQUIRED_NEXT_VERSION)).toBeLessThan(0);
      expect(compareVersions(`^${justBelow}`, REQUIRED_NEXT_VERSION)).toBeLessThan(0);
      expect(compareVersions(REQUIRED_NEXT_VERSION, REQUIRED_NEXT_VERSION)).toBe(0);
      expect(
        compareVersions(`${major}.${minor}.${patch + 1}`, REQUIRED_NEXT_VERSION),
      ).toBeGreaterThan(0);
      expect(
        compareVersions(`^${major}.${minor}.${patch + 1}`, REQUIRED_NEXT_VERSION),
      ).toBeGreaterThan(0);
      expect(
        compareVersions(`${major}.${minor + 1}.0`, REQUIRED_NEXT_VERSION),
      ).toBeGreaterThan(0);
      expect(
        compareVersions(`${major + 1}.0.0`, REQUIRED_NEXT_VERSION),
      ).toBeGreaterThan(0);
    });

    it("previousPatch はパッチを 1 減らし、パッチが 0 の版では例外を投げること", () => {
      expect(previousPatch("16.4.5")).toBe("16.4.4");
      expect(previousPatch("^16.4.10")).toBe("16.4.9");
      expect(previousPatch("16.4.1")).toBe("16.4.0");
      expect(() => previousPatch("16.4.0")).toThrow();
    });

    it("プレリリース版は同じ数字部分の正式版より小さいと比較されること", () => {
      expect(compareVersions("16.4.6-canary.1", "16.4.6")).toBeLessThan(0);
      expect(compareVersions("16.4.6", "16.4.6-canary.1")).toBeGreaterThan(0);
      expect(compareVersions("16.4.6-canary.1", "16.4.6-canary.1")).toBe(0);
    });

    it("【負のテスト】プレリリース版は下限を満たさず、正式版は満たすこと", () => {
      const min = "16.4.6";
      expect(meetsMinimum("16.4.6-canary.1", min)).toBe(false);
      expect(meetsMinimum("16.4.7-canary.0", min)).toBe(false);
      expect(meetsMinimum("^16.4.7-canary.0", min)).toBe(false);
      expect(meetsMinimum("16.4.6", min)).toBe(true);
      expect(meetsMinimum("16.4.7", min)).toBe(true);
      expect(meetsMinimum("17.0.0", min)).toBe(true);
      expect(meetsMinimum("16.4.5", min)).toBe(false);
    });

    it("桁数が違う版を文字列比較でなく数値で比べること", () => {
      expect(compareVersions("16.4.10", "16.4.9")).toBeGreaterThan(0);
      expect(compareVersions("16.4.9", "16.4.10")).toBeLessThan(0);
    });
  });

  describe("package.json", () => {
    it(`dependencies.next が ${REQUIRED_NEXT_VERSION} 以上であること`, () => {
      // 意図: 本タスクの主目的である Next.js 更新が package.json に反映されていることを確認する
      const nextVersion = packageJson.dependencies?.next;
      expect(nextVersion).toBeDefined();
      expect(meetsMinimum(nextVersion as string, REQUIRED_NEXT_VERSION)).toBe(true);
    });

    it("devDependencies.eslint-config-next が next と同じバージョンであること", () => {
      // 意図: Next.js と eslint-config-next は同一バージョンで揃える運用のため、片方だけ更新されていないことを確認する
      const nextVersion = packageJson.dependencies?.next;
      const eslintConfigNextVersion =
        packageJson.devDependencies?.["eslint-config-next"];
      expect(nextVersion).toBeDefined();
      expect(eslintConfigNextVersion).toBeDefined();
      expect(stripRangePrefix(eslintConfigNextVersion as string)).toBe(
        stripRangePrefix(nextVersion as string),
      );
    });

    it("react と react-dom のバージョンが一致していること", () => {
      // 意図: Next.js 更新に伴う React の巻き添え更新で react / react-dom が食い違わないことを確認する（回帰防止）
      const reactVersion = packageJson.dependencies?.react;
      const reactDomVersion = packageJson.dependencies?.["react-dom"];
      expect(reactVersion).toBeDefined();
      expect(reactDomVersion).toBeDefined();
      expect(stripRangePrefix(reactDomVersion as string)).toBe(
        stripRangePrefix(reactVersion as string),
      );
    });
  });

  describe("package-lock.json", () => {
    it(`packages["node_modules/next"].version が ${REQUIRED_NEXT_VERSION} 以上であること`, () => {
      // 意図: package.json だけ書き換えて npm install を忘れた状態を検出する（インストール済みロックファイルへの反映確認）
      const lockedNextVersion =
        packageLock.packages?.["node_modules/next"]?.version;
      expect(lockedNextVersion).toBeDefined();
      expect(meetsMinimum(lockedNextVersion as string, REQUIRED_NEXT_VERSION)).toBe(true);
    });

    it("eslint-config-next の解決版が next の解決版と同じであること", () => {
      const lockedNext = packageLock.packages?.["node_modules/next"]?.version;
      const lockedEslintConfig =
        packageLock.packages?.["node_modules/eslint-config-next"]?.version;
      expect(lockedNext).toBeDefined();
      expect(lockedEslintConfig).toBe(lockedNext);
    });
  });

  describe("インストール済みの node_modules", () => {
    it(`node_modules/next の版が ${REQUIRED_NEXT_VERSION} 以上であること`, () => {
      const installed = readJson<{ version: string }>(
        path.join(ROOT_DIR, "node_modules", "next", "package.json"),
      );
      expect(meetsMinimum(installed.version, REQUIRED_NEXT_VERSION)).toBe(true);
    });
  });
});
