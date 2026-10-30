import type { PosterHandoffPayload } from "@/types/poster";
import type { DecorationConfig, LogoConfig, UtmParams } from "@/types/qr";
import { validateUrl } from "@/lib/url/validateUrl";

/**
 * sessionStorage のキー名
 */
export const POSTER_HANDOFF_KEY = "qr-poster-handoff";

/**
 * payload の鮮度判定の境界（ミリ秒）
 * これ以上経過した payload は破棄する
 */
export const POSTER_HANDOFF_MAX_AGE_MS = 60 * 60 * 1000; // 1時間

/**
 * 引き継ぎ payload を sessionStorage に保存する。
 * SSR環境や保存失敗時は黙って何もしない（ベストエフォート）。
 */
export function savePosterHandoff(
  payload: Omit<PosterHandoffPayload, "savedAt">
): void {
  if (typeof window === "undefined") return;
  try {
    // 読み出し側の型ガードで丸ごと捨てられないよう、caption.text を上限に切り詰める
    const caption = payload.decoration.caption;
    const decoration =
      caption.text.length > MAX_CAPTION_LENGTH
        ? {
            ...payload.decoration,
            caption: {
              ...caption,
              text: caption.text.slice(0, MAX_CAPTION_LENGTH),
            },
          }
        : payload.decoration;
    const full: PosterHandoffPayload = {
      ...payload,
      decoration,
      savedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(POSTER_HANDOFF_KEY, JSON.stringify(full));
  } catch {
    // QuotaExceeded 等、無視
  }
}

/**
 * 引き継ぎ payload を sessionStorage から読み込む。
 * - SSR環境: null を返す
 * - キーが存在しない: null を返す
 * - JSON parse失敗: null を返す
 * - savedAt が POSTER_HANDOFF_MAX_AGE_MS より古い: null を返す
 * 読み込み後はキーを削除する（再利用防止）
 */
export function loadPosterHandoff(): PosterHandoffPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(POSTER_HANDOFF_KEY);
    if (!raw) return null;
    const parsed = sanitizePayload(JSON.parse(raw));
    if (!parsed) {
      sessionStorage.removeItem(POSTER_HANDOFF_KEY);
      return null;
    }
    const age = Date.now() - new Date(parsed.savedAt).getTime();
    if (Number.isNaN(age) || age > POSTER_HANDOFF_MAX_AGE_MS) {
      sessionStorage.removeItem(POSTER_HANDOFF_KEY);
      return null;
    }
    // 読み込み後はクリア（再利用防止）
    sessionStorage.removeItem(POSTER_HANDOFF_KEY);
    return parsed;
  } catch {
    try {
      sessionStorage.removeItem(POSTER_HANDOFF_KEY);
    } catch {
      // 無視
    }
    return null;
  }
}

/** URL の長さ上限（一般的なブラウザ・サーバーの実用上限） */
export const MAX_URL_LENGTH = 2048;
/** UTM 各値の長さ上限 */
export const MAX_UTM_LENGTH = 200;
/** キャプションの長さ上限（UI の目安は 15 文字で警告のみのため、余裕を持たせた防御用の上限） */
export const MAX_CAPTION_LENGTH = 50;
/** キャプションの文字サイズ範囲（CaptionEditor のスライダーと同じ） */
export const MIN_CAPTION_FONT_SIZE = 10;
export const MAX_CAPTION_FONT_SIZE = 24;
/** ロゴのサイズ割合の範囲（LogoUploader のスライダーと同じ） */
const MIN_LOGO_SIZE_PERCENT = 10;
const MAX_LOGO_SIZE_PERCENT = 25;
/** ロゴ dataURL の長さ上限（500KB のファイルの base64 は約 667K 文字） */
export const MAX_LOGO_DATA_URL_LENGTH = 700 * 1024;
const MAX_SHORT_STRING = 255;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const LOGO_DATA_URL = /^data:image\/(?:png|jpeg|svg\+xml);base64,[A-Za-z0-9+/=]*$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isStr(v: unknown, max: number): v is string {
  return typeof v === "string" && v.length <= max;
}

function sanitizeLogo(v: unknown): LogoConfig | null | undefined {
  if (v === null) return null;
  if (!isRecord(v)) return undefined;
  const { dataUrl, fileName, fileType, fileSizeKb, sizePercent } = v;
  if (
    typeof dataUrl !== "string" ||
    dataUrl.length > MAX_LOGO_DATA_URL_LENGTH ||
    !LOGO_DATA_URL.test(dataUrl)
  ) {
    return undefined;
  }
  if (!isStr(fileName, MAX_SHORT_STRING) || !isStr(fileType, MAX_SHORT_STRING)) {
    return undefined;
  }
  if (typeof fileSizeKb !== "number" || !Number.isFinite(fileSizeKb) || fileSizeKb < 0) {
    return undefined;
  }
  if (
    typeof sizePercent !== "number" ||
    !Number.isFinite(sizePercent) ||
    sizePercent < MIN_LOGO_SIZE_PERCENT ||
    sizePercent > MAX_LOGO_SIZE_PERCENT
  ) {
    return undefined;
  }
  return { dataUrl, fileName, fileType, fileSizeKb, sizePercent };
}

function sanitizeDecoration(v: unknown): DecorationConfig | undefined {
  if (!isRecord(v)) return undefined;
  const { fgColor, bgColor, logo, frameType, caption, preset } = v;
  if (typeof fgColor !== "string" || !HEX_COLOR.test(fgColor)) return undefined;
  if (typeof bgColor !== "string" || !HEX_COLOR.test(bgColor)) return undefined;
  const safeLogo = sanitizeLogo(logo);
  if (safeLogo === undefined) return undefined;
  if (frameType !== null && !isStr(frameType, MAX_SHORT_STRING)) return undefined;
  if (preset !== null && !isStr(preset, MAX_SHORT_STRING)) return undefined;
  if (!isRecord(caption)) return undefined;
  const { text, fontSize } = caption;
  if (!isStr(text, MAX_CAPTION_LENGTH)) return undefined;
  if (
    typeof fontSize !== "number" ||
    !Number.isFinite(fontSize) ||
    fontSize < MIN_CAPTION_FONT_SIZE ||
    fontSize > MAX_CAPTION_FONT_SIZE
  ) {
    return undefined;
  }
  return {
    fgColor,
    bgColor,
    logo: safeLogo,
    frameType: frameType as string | null,
    caption: { text, fontSize },
    preset: preset as string | null,
  };
}

function sanitizeUtm(v: unknown): UtmParams | undefined {
  if (!isRecord(v)) return undefined;
  const { source, medium, campaign, term, content } = v;
  if (
    !isStr(source, MAX_UTM_LENGTH) ||
    !isStr(medium, MAX_UTM_LENGTH) ||
    !isStr(campaign, MAX_UTM_LENGTH) ||
    !isStr(term, MAX_UTM_LENGTH) ||
    !isStr(content, MAX_UTM_LENGTH)
  ) {
    return undefined;
  }
  return { source, medium, campaign, term, content };
}

/** 実行時に型を検証し、通った値だけで payload を組み直す。通らなければ null */
function sanitizePayload(v: unknown): PosterHandoffPayload | null {
  if (!isRecord(v)) return null;
  const { url, utm, utmEnabled, decoration, frameColor, savedAt } = v;
  if (!isStr(url, MAX_URL_LENGTH)) return null;
  if (typeof utmEnabled !== "boolean") return null;
  if (typeof savedAt !== "string" || savedAt.length > MAX_SHORT_STRING) return null;
  if (frameColor !== undefined && (typeof frameColor !== "string" || !HEX_COLOR.test(frameColor))) {
    return null;
  }
  const safeUtm = sanitizeUtm(utm);
  const safeDecoration = sanitizeDecoration(decoration);
  if (!safeUtm || !safeDecoration) return null;
  return {
    url,
    // 保存値は信用せず再計算する
    isUrlValid: validateUrl(url).isValid,
    utm: safeUtm,
    utmEnabled,
    decoration: safeDecoration,
    ...(frameColor !== undefined ? { frameColor } : {}),
    savedAt,
  };
}

/**
 * 引き継ぎ payload を sessionStorage から削除する。
 * SSR環境では何もしない。
 */
export function clearPosterHandoff(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(POSTER_HANDOFF_KEY);
  } catch {
    // 無視
  }
}
