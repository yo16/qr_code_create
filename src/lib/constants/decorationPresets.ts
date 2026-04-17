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

export const DECORATION_PRESETS: DecorationPreset[] = [
  {
    id: "simple",
    name: "シンプル",
    description: "白黒でクリーンなデザイン",
    fgColor: "#000000",
    bgColor: "#ffffff",
    frameType: "none",
    frameColor: "#000000",
    caption: { text: "", fontSize: 14 },
  },
  {
    id: "business",
    name: "ビジネス",
    description: "信頼感のある落ち着いたデザイン",
    fgColor: "#1a365d",
    bgColor: "#ffffff",
    frameType: "business",
    frameColor: "#1a365d",
    caption: { text: "詳しくはこちら", fontSize: 12 },
  },
  {
    id: "casual",
    name: "カジュアル",
    description: "親しみやすいナチュラルデザイン",
    fgColor: "#2d7d46",
    bgColor: "#f0fff4",
    frameType: "rounded",
    frameColor: "#2d7d46",
    caption: { text: "スキャンしてチェック", fontSize: 14 },
  },
  {
    id: "elegant",
    name: "エレガント",
    description: "上品で洗練されたデザイン",
    fgColor: "#44337a",
    bgColor: "#faf5ff",
    frameType: "elegant",
    frameColor: "#44337a",
    caption: { text: "QRコードを読み取る", fontSize: 12 },
  },
  {
    id: "pop",
    name: "ポップ",
    description: "目を引くカラフルなデザイン",
    fgColor: "#c53030",
    bgColor: "#fff5f5",
    frameType: "pop",
    frameColor: "#c53030",
    caption: { text: "今すぐアクセス!", fontSize: 16 },
  },
];
