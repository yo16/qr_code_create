import fs from "fs";
import path from "path";

/**
 * Next.js 16.4.2 以上への更新を担保するテスト（qr_code_create-4j0）。
 *
 * 外部パッケージ（semver 等）に依存せず、fs と path だけで
 * package.json / package-lock.json を読み取り、バージョン文字列を数値比較する。
 */

const ROOT_DIR = path.resolve(__dirname, "../../..");
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, "package.json");
const PACKAGE_LOCK_PATH = path.join(ROOT_DIR, "package-lock.json");

/** 本タスクで要求する Next.js の最低バージョン */
const REQUIRED_NEXT_VERSION = "16.4.2";

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
 * プレリリース識別子（例: "16.4.2-canary.1"）はハイフン以降を無視して比較する。
 */
function compareVersions(a: string, b: string): number {
  const toParts = (v: string): number[] =>
    stripRangePrefix(v)
      .split("-")[0]
      .split(".")
      .map((part) => {
        const n = parseInt(part, 10);
        return Number.isNaN(n) ? 0 : n;
      });

  const partsA = toParts(a);
  const partsB = toParts(b);
  const length = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < length; i += 1) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

describe("Next.js 依存バージョン（qr_code_create-4j0）", () => {
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
  });

  describe("package.json", () => {
    it(`dependencies.next が ${REQUIRED_NEXT_VERSION} 以上であること`, () => {
      // 意図: 本タスクの主目的である Next.js 更新が package.json に反映されていることを確認する
      const nextVersion = packageJson.dependencies?.next;
      expect(nextVersion).toBeDefined();
      expect(
        compareVersions(nextVersion as string, REQUIRED_NEXT_VERSION),
      ).toBeGreaterThanOrEqual(0);
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
      expect(
        compareVersions(lockedNextVersion as string, REQUIRED_NEXT_VERSION),
      ).toBeGreaterThanOrEqual(0);
    });
  });
});
