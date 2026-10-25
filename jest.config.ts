import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  testEnvironment: "jest-environment-jsdom",
  roots: ["<rootDir>/tests", "<rootDir>/src"],
  testMatch: [
    "<rootDir>/tests/**/*.test.{ts,tsx}",
    "<rootDir>/src/**/*.test.{ts,tsx}",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // remark-gfm は ESM 専用パッケージで Jest が構文解析できないためモックに差し替える
    "^remark-gfm$": "<rootDir>/tests/__mocks__/remark-gfm.ts",
    // react-markdown も ESM 専用のため同様にモックへ差し替える
    "^react-markdown$": "<rootDir>/tests/__mocks__/react-markdown.tsx",
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  // 実物の react-markdown を使うテスト（*.realmd.test.tsx）は下の別プロジェクトで実行する
  testPathIgnorePatterns: ["/node_modules/", "\\.realmd\\.test\\.tsx?$"],
};

// 実物の react-markdown / remark-gfm を使うテスト専用のプロジェクト設定。
// 通常のプロジェクトは ESM 専用パッケージをモックへ差し替えているため、
// 変換結果（allowedElements の効果）を検証するテストだけをこちらで実行する。
// （別ファイルに分けると Jest の TS 設定ローダーが拡張子なしの import を解決できないため、同じファイルに置く）
const ESM_PACKAGES = [
  "react-markdown",
  "remark-gfm",
  "remark-parse",
  "remark-rehype",
  "unified",
  "bail",
  "devlop",
  "is-plain-obj",
  "trough",
  "vfile",
  "vfile-message",
  "unist-.+",
  "mdast-.+",
  "micromark.*",
  "decode-named-character-reference",
  "character-entities",
  "property-information",
  "hast-.+",
  "space-separated-tokens",
  "comma-separated-tokens",
  "html-url-attributes",
  "estree-util-.+",
  "ccount",
  "markdown-table",
  "zwitch",
  "longest-streak",
  "trim-lines",
  "stringify-entities",
  "character-entities-html4",
  "character-entities-legacy",
  "character-reference-invalid",
  "is-decimal",
  "is-hexadecimal",
  "is-alphabetical",
  "is-alphanumerical",
  "parse-entities",
  "escape-string-regexp",
];

const markdownConfig: Config = {
  displayName: "markdown-real",
  testEnvironment: "jest-environment-jsdom",
  roots: ["<rootDir>/tests"],
  testMatch: ["<rootDir>/tests/**/*.realmd.test.{ts,tsx}"],
  // tests/__mocks__ 直下の react-markdown.tsx は、roots 内の node モジュールモックとして自動適用されてしまう。
  // 実物を使うためモックのディレクトリを除外する。
  modulePathIgnorePatterns: ["<rootDir>/tests/__mocks__"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
};

// 通常のプロジェクトと、実物の react-markdown を使うプロジェクトの 2 つを 1 回の `npx jest` で実行する
const buildConfig = async () => {
  const main = await createJestConfig(config)();
  const markdown = await createJestConfig(markdownConfig)();
  markdown.transformIgnorePatterns = [
    `/node_modules/(?!(?:\\.pnpm/)?(?:${ESM_PACKAGES.join("|")})/)`,
    "^.+\\.module\\.(css|sass|scss)$",
  ];
  return { projects: [{ ...main, displayName: "default" }, markdown] };
};

export default buildConfig;
