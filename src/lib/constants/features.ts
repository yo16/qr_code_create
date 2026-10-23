// 機能の公開を切り替えるフラグ。
// posterPage: 印刷用ポスター（/poster）。Markdown 入力（qr_code_create-4me）と
// A4 2x2 PDF 出力（qr_code_create-ro1）が完成するまで false にしておく。
export const FEATURE_FLAGS = {
  posterPage: false,
} as const;
