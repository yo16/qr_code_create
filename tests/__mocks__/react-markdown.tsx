// react-markdown の Jest 用モック。
// react-markdown は ESM 専用パッケージで Jest が構文解析できないため、
// jest.config.ts の moduleNameMapper でこのファイルに差し替えている（remark-gfm と同じ理由）。
// 実際の Markdown 変換は行わず、原文をそのまま表示する。
// 変換結果を検証するテストが必要な場合は、そのテスト側で別の方法（E2E など）を使うこと。
import type { ReactNode } from "react";

export default function ReactMarkdown({ children }: { children?: ReactNode }) {
  return <div data-testid="markdown-mock">{children}</div>;
}
