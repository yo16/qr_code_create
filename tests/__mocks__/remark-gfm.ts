// remark-gfm の Jest 用モック。
// remark-gfm は ESM 専用パッケージ（index.js が `export {default} from ...` 形式）で、
// Jest（CommonJS 変換）が構文解析できず "Unexpected token 'export'" で失敗する。
// テストでは MDXRemote 自体をモックするため remark プラグインの実体は不要であり、
// jest.config.ts の moduleNameMapper でこのファイルに差し替えている。
// テストファイル個別の jest.mock ではなく設定で解決しているのは、
// guide/[slug]/page.tsx や use-cases/[slug]/page.tsx など remark-gfm を import する
// ページを描画するすべてのテストで共通に必要になるため。
export default function remarkGfm(): void {}
