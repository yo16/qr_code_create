import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // エージェントの worktree 複製と一時出力・テスト成果物は lint 対象から外す
    ".claude/**",
    "tmp/**",
    "test-results/**",
    "playwright-report/**",
  ]),
  // Client に ja / en の辞書を直接 import させない（en を Client バンドルに入れないため）。
  // 辞書は useDict()（Client）か getDict()（Server）経由で受け取る。
  // useDict.ts と getDict.ts は src/i18n 配下なので、この制限の対象外。
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/i18n/ja",
                "@/i18n/ja.*",
                "@/i18n/jaClient",
                "@/i18n/en",
                "@/i18n/en.*",
                "@/i18n/enClient",
                "**/i18n/ja",
                "**/i18n/ja.*",
                "**/i18n/jaClient",
                "**/i18n/en",
                "**/i18n/en.*",
                "**/i18n/enClient",
              ],
              message:
                "コンポーネントから辞書を直接 import しない。useDict()（Client）または getDict()（Server）を使う。",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
