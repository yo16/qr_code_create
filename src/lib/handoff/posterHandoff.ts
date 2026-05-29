import type { PosterHandoffPayload } from "@/types/poster";

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
    const full: PosterHandoffPayload = {
      ...payload,
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
    const parsed = JSON.parse(raw) as PosterHandoffPayload;
    const age = Date.now() - new Date(parsed.savedAt).getTime();
    if (Number.isNaN(age) || age > POSTER_HANDOFF_MAX_AGE_MS) {
      sessionStorage.removeItem(POSTER_HANDOFF_KEY);
      return null;
    }
    // 読み込み後はクリア（再利用防止）
    sessionStorage.removeItem(POSTER_HANDOFF_KEY);
    return parsed;
  } catch {
    return null;
  }
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
