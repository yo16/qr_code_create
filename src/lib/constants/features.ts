// 機能の公開を切り替えるフラグ。
// posterPage: 印刷用ポスター（/poster）。Markdown 入力（qr_code_create-4me）と
// A4 2x2 PDF 出力（qr_code_create-ro1）は実装済みだが、公開は別判断のため既定は false。
// E2E などビルド時に NEXT_PUBLIC_FEATURE_POSTER_PAGE=1 を渡したときだけ true になる。
// 本番の Vercel にはこの変数を設定しない（設定すると公開される）。
export const FEATURE_FLAGS = {
  posterPage: process.env.NEXT_PUBLIC_FEATURE_POSTER_PAGE === "1",
} as const;
