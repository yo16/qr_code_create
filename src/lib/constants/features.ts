// 機能の公開を切り替えるフラグ。今後の機能でも使う。
// posterPage: 印刷用ポスター（/poster）。qr_code_create-l1a で公開済み（true）。
// false にすると、/create のポスター導線ボタン、sitemap への /poster、/poster ページ（404）が無効になる。
export const FEATURE_FLAGS = {
  posterPage: true,
} as const;
