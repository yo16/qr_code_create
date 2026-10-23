import { DECORATION_PRESETS } from "@/lib/constants/decorationPresets";
import { UTM_MEDIUM_OPTIONS, UTM_SOURCE_OPTIONS } from "@/lib/constants/utmPresets";

export interface CreateInitialParams {
  preset?: string;
  utmSource?: string;
  utmMedium?: string;
}

/**
 * /create のクエリから初期状態用のパラメータを取り出す。
 * 既知の値（完全一致・大文字小文字区別）のみ採用し、それ以外のキーは含めない。
 */
export function parseCreateSearchParams(
  params: URLSearchParams | null | undefined
): CreateInitialParams {
  const result: CreateInitialParams = {};
  if (!params) return result;

  const preset = params.get("preset");
  if (preset !== null && DECORATION_PRESETS.some((p) => p.id === preset)) {
    result.preset = preset;
  }

  const utmSource = params.get("utm_source");
  if (utmSource !== null && UTM_SOURCE_OPTIONS.some((o) => o.value === utmSource)) {
    result.utmSource = utmSource;
  }

  const utmMedium = params.get("utm_medium");
  if (utmMedium !== null && UTM_MEDIUM_OPTIONS.some((o) => o.value === utmMedium)) {
    result.utmMedium = utmMedium;
  }

  return result;
}
