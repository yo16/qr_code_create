---
name: ga-conversion-report
description: GA4 からダウンロードのコンバージョン率（QR生成後）と形式別（PNG/SVG/PDF）の利用頻度を取得し、表にまとめて報告する。
argument-hint: "[日数（既定 30）]"
user-invocable: true
---

# ダウンロードのコンバージョン率と形式別利用頻度

対象期間の日数: $ARGUMENTS（空なら 30）。期間は `{N}daysAgo` 〜 `yesterday`。
GA4 プロパティ: `properties/533111812`（qr-code-create）。
定義と基準値は `doc/marketing-strategy.md` の「コンバージョン率と形式別利用頻度の見方」にある。

## 手順

1. ToolSearch で `mcp__analytics-mcp__run_report` と `mcp__analytics-mcp__run_funnel_report` を読み込む
2. 次の 3 つのレポートを**同じメッセージ内で**並列に実行する
   - A. 生成後コンバージョン率: `run_funnel_report`、funnel_steps は `session_start` → `qr_generated` → `qr_downloaded`（各 `funnel_event_filter`、`is_directly_followed_by: false`）、`funnel_breakdown: {"breakdown_dimension": "deviceCategory"}`
   - B. 形式別の利用頻度: `run_report`、dimensions `["customEvent:format"]`、metrics `["eventCount", "sessions", "totalUsers"]`、dimension_filter `{"filter": {"field_name": "eventName", "string_filter": {"match_type": 1, "value": "qr_downloaded"}}}`、order_bys は eventCount 降順
   - C. 全セッションに対する率: `run_report`、dimensions `["deviceCategory"]`、metrics `["sessions", "keyEvents:qr_downloaded", "sessionKeyEventRate:qr_downloaded"]`
3. B が「customEvent:format」のエラーで失敗したら、カスタムディメンション `format` が未登録ということ。形式別の表は「未計測」とし、Beads タスク qr_code_create-0em（GA 管理画面で `format` を登録する）を案内する
4. 結果を次の形で報告する。数値は表に入れ、本文には書かない
   - 表 1: ファネル（RESERVED_TOTAL の行）: session_start ユーザー数 / qr_generated ユーザー数 / qr_downloaded ユーザー数 / 生成後コンバージョン率（downloaded ÷ generated）/ 端末別の率
   - 表 2: 形式別: format / イベント数 / セッション数 / ユーザー数 / 構成比（イベント数ベース）
   - 表 3: 全セッションに対する率: 端末 / セッション数 / キーイベント数 / セッション率
   - `doc/marketing-strategy.md` の基準値（2026-09-23〜10-22）との比較を 1〜2 行
5. 注意書きを添える: `qr_generated` は再描画ごとに発火するので件数ではなくユーザー数・セッション数で見ること。カスタムディメンションは登録日以降のデータにしか効かないこと

## 禁止

- GA の設定（キーイベント、カスタムディメンション）を変更しようとしない。MCP は読み取り専用
- 数値を推測で埋めない。取得できなかった表は「取得できず」と書く
