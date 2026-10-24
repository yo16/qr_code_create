import {
  DECORATION_PRESETS,
  buildDecorationPresets,
} from "@/lib/constants/decorationPresets";
import type { ClientDict } from "@/i18n/types";
import { DEFAULT_FRAME_CONFIG, type FrameConfig } from "@/lib/qr/frameRenderer";
import type { CreateInitialParams } from "@/lib/url/parseCreateSearchParams";
import { INITIAL_QR_STATE, type QrState } from "@/types/qr";

/**
 * QrGenerator の useState 初期値を組み立てる純関数。
 * 既定値はコピーして返し、共有定数は変更しない。
 */
export function buildInitialQrState(
  initial?: CreateInitialParams,
  /** 省略時は ja。en の `?preset=` でキャプションを英語にするため、辞書の decoration スライスを渡す */
  decorationDict?: ClientDict["decoration"]
): { state: QrState; frameConfig: FrameConfig } {
  const state: QrState = {
    ...INITIAL_QR_STATE,
    utm: { ...INITIAL_QR_STATE.utm },
    decoration: {
      ...INITIAL_QR_STATE.decoration,
      caption: { ...INITIAL_QR_STATE.decoration.caption },
    },
  };
  let frameConfig: FrameConfig = { ...DEFAULT_FRAME_CONFIG };

  if (!initial) return { state, frameConfig };

  if (initial.preset) {
    const presets = decorationDict
      ? buildDecorationPresets(decorationDict)
      : DECORATION_PRESETS;
    const preset = presets.find((p) => p.id === initial.preset);
    if (preset) {
      state.decoration.fgColor = preset.fgColor;
      state.decoration.bgColor = preset.bgColor;
      state.decoration.frameType = preset.frameType;
      state.decoration.caption = { ...preset.caption };
      state.decoration.preset = preset.id;
      frameConfig = { type: preset.frameType, color: preset.frameColor };
    }
  }

  if (initial.utmSource) {
    state.utm.source = initial.utmSource;
    state.utmEnabled = true;
  }
  if (initial.utmMedium) {
    state.utm.medium = initial.utmMedium;
  }

  return { state, frameConfig };
}
