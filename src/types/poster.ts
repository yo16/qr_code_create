import type { UtmParams, DecorationConfig } from "./qr";

/**
 * ポスター作成ページの全体状態
 * PosterEditor コンポーネントで useState で管理する
 */
export interface PosterState {
  /** 入力URL（buildUtmUrl 適用前のベースURL） */
  url: string;
  /** URLバリデーション結果 */
  isUrlValid: boolean;
  /** 説明文（Markdown文字列） */
  description: string;
  /** UTMパラメータ */
  utm: UtmParams;
  /** UTMパラメータ全体の有効/無効フラグ（QrState の utmEnabled と同じ意味） */
  utmEnabled: boolean;
  /** 装飾設定（QrState の decoration と同じ） */
  decoration: DecorationConfig;
}

/**
 * /create → /poster への引き継ぎ用ペイロード
 * sessionStorage に JSON.stringify して保存する
 * キー名: "qr-poster-handoff"
 */
export interface PosterHandoffPayload {
  /** 入力URL */
  url: string;
  /** URLバリデーション結果 */
  isUrlValid: boolean;
  /** UTMパラメータ */
  utm: UtmParams;
  /** UTM全体の有効/無効フラグ */
  utmEnabled: boolean;
  /** 装飾設定 */
  decoration: DecorationConfig;
  /** 保存時刻（ISO8601文字列）。1時間以上前の payload は受信側で破棄する */
  savedAt: string;
}

/**
 * PosterState の初期値
 * 引き継ぎなしで /poster を開いた場合に使用する。
 * 引き継ぎありの場合は posterHandoff.load() の結果で上書きする。
 */
export const INITIAL_POSTER_STATE: PosterState = {
  url: "",
  isUrlValid: false,
  description: "",
  utm: { source: "", medium: "qr", campaign: "", term: "", content: "" },
  utmEnabled: true,
  decoration: {
    fgColor: "#000000",
    bgColor: "#ffffff",
    logo: null,
    frameType: null,
    caption: { text: "", fontSize: 14 },
    preset: null,
  },
};
