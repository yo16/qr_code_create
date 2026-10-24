import { ja } from "@/i18n/ja";
import type { Dict } from "@/i18n/types";
import type { FrameType } from "@/lib/qr/frameRenderer";
import type { CaptionConfig } from "@/types/qr";

export interface DecorationPreset {
  id: string;
  name: string;
  description: string;
  fgColor: string;
  bgColor: string;
  frameType: FrameType;
  frameColor: string;
  caption: CaptionConfig;
}

type DecorationDict = Dict["decoration"];

/** 値は言語によらず同じ。name / description / caption.text は辞書の decoration.presets[id] */
export const DECORATION_PRESET_VALUES = [
  {
    id: "simple",
    fgColor: "#000000",
    bgColor: "#ffffff",
    frameType: "none",
    frameColor: "#000000",
    captionFontSize: 14,
  },
  {
    id: "business",
    fgColor: "#1a365d",
    bgColor: "#ffffff",
    frameType: "business",
    frameColor: "#1a365d",
    captionFontSize: 12,
  },
  {
    id: "casual",
    fgColor: "#2d7d46",
    bgColor: "#f0fff4",
    frameType: "rounded",
    frameColor: "#2d7d46",
    captionFontSize: 14,
  },
  {
    id: "elegant",
    fgColor: "#44337a",
    bgColor: "#faf5ff",
    frameType: "elegant",
    frameColor: "#44337a",
    captionFontSize: 12,
  },
  {
    id: "pop",
    fgColor: "#c53030",
    bgColor: "#fff5f5",
    frameType: "pop",
    frameColor: "#c53030",
    captionFontSize: 16,
  },
] as const satisfies ReadonlyArray<{
  id: keyof DecorationDict["presets"];
  fgColor: string;
  bgColor: string;
  frameType: FrameType;
  frameColor: string;
  captionFontSize: number;
}>;

export function buildDecorationPresets(
  decoration: DecorationDict
): DecorationPreset[] {
  return DECORATION_PRESET_VALUES.map((value) => {
    const text = decoration.presets[value.id];
    return {
      id: value.id,
      name: text.name,
      description: text.description,
      fgColor: value.fgColor,
      bgColor: value.bgColor,
      frameType: value.frameType,
      frameColor: value.frameColor,
      caption: { text: text.caption, fontSize: value.captionFontSize },
    };
  });
}

// 既存 export（名前と形は変えない）。ja 辞書から組み立てる
export const DECORATION_PRESETS: DecorationPreset[] = buildDecorationPresets(
  ja.decoration
);
