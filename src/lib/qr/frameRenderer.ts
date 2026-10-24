import { jaClient as ja } from "@/i18n/jaClient";
import type { Dict } from "@/i18n/types";

export type FrameType =
  | "none"
  | "simple"
  | "rounded"
  | "ornate"
  | "elegant"
  | "pop"
  | "business"
  | "festive"
  | "img-simple-black"
  | "img-simple-blue"
  | "img-simple-gray"
  | "img-simple-red"
  | "img-elaborated-japanese"
  | "img-elaborated-gothic"
  | "img-elaborated-baroque";

export interface FrameConfig {
  type: FrameType;
  color: string; // フレームの色（デフォルト: #000000）
}

export interface FrameOption {
  type: FrameType;
  label: string;
  category: string;
  /** 画像フレームの場合、画像パス */
  imageSrc?: string;
}

/** フレームのカテゴリ id（表示名は辞書の decoration.frame.categories[key]）。表示順 */
export const FRAME_CATEGORY_KEYS = [
  "basic",
  "ornate",
  "target",
  "imageSimple",
  "imageOrnate",
] as const;

export type FrameCategoryKey = (typeof FRAME_CATEGORY_KEYS)[number];

export interface FrameDefinition {
  type: FrameType;
  categoryKey: FrameCategoryKey;
  /** 画像フレームの場合、画像パス */
  imageSrc?: string;
}

/** 言語によらない定義（表示名は辞書の decoration.frame.labels[type]） */
export const FRAME_DEFINITIONS: FrameDefinition[] = [
  { type: "none", categoryKey: "basic" },
  { type: "simple", categoryKey: "basic" },
  { type: "rounded", categoryKey: "basic" },
  { type: "ornate", categoryKey: "ornate" },
  { type: "elegant", categoryKey: "target" },
  { type: "pop", categoryKey: "target" },
  { type: "business", categoryKey: "target" },
  { type: "festive", categoryKey: "target" },
  { type: "img-simple-black", categoryKey: "imageSimple", imageSrc: "/images/frames/simple/black-frame.png" },
  { type: "img-simple-blue", categoryKey: "imageSimple", imageSrc: "/images/frames/simple/blue-frame.png" },
  { type: "img-simple-gray", categoryKey: "imageSimple", imageSrc: "/images/frames/simple/gray-frame.png" },
  { type: "img-simple-red", categoryKey: "imageSimple", imageSrc: "/images/frames/simple/red-frame.png" },
  { type: "img-elaborated-japanese", categoryKey: "imageOrnate", imageSrc: "/images/frames/elaborated/japanese.png" },
  { type: "img-elaborated-gothic", categoryKey: "imageOrnate", imageSrc: "/images/frames/elaborated/gothic.png" },
  { type: "img-elaborated-baroque", categoryKey: "imageOrnate", imageSrc: "/images/frames/elaborated/luxurious-baroque-style-gold.png" },
];

export function buildFrameOptions(decoration: Dict["decoration"]): FrameOption[] {
  return FRAME_DEFINITIONS.map((def) => {
    const option: FrameOption = {
      type: def.type,
      label: decoration.frame.labels[def.type],
      category: decoration.frame.categories[def.categoryKey],
    };
    if (def.imageSrc !== undefined) option.imageSrc = def.imageSrc;
    return option;
  });
}

// 既存 export（名前と形は変えない）。ja 辞書から組み立てる。
// category は GA イベント（frame_selected）の値にも使うため、言語によらず ja の値を保つ
export const FRAME_OPTIONS: FrameOption[] = buildFrameOptions(ja.decoration);

/** 画像フレームかどうかを判定する */
export function isImageFrame(type: FrameType): boolean {
  return type.startsWith("img-");
}

/** FrameTypeから画像パスを取得する */
export function getFrameImageSrc(type: FrameType): string | undefined {
  return FRAME_OPTIONS.find((o) => o.type === type)?.imageSrc;
}

function drawSimple(
  ctx: CanvasRenderingContext2D,
  color: string,
  width: number,
  height: number
): void {
  const margin = 4;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
}

function drawRounded(
  ctx: CanvasRenderingContext2D,
  color: string,
  width: number,
  height: number
): void {
  const margin = 4;
  const radius = 16;
  const x = margin;
  const y = margin;
  const w = width - margin * 2;
  const h = height - margin * 2;

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
  ctx.stroke();
}

function drawOrnate(
  ctx: CanvasRenderingContext2D,
  color: string,
  width: number,
  height: number
): void {
  // 二重枠
  const margin1 = 3;
  const margin2 = 7;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(margin1, margin1, width - margin1 * 2, height - margin1 * 2);
  ctx.lineWidth = 1;
  ctx.strokeRect(margin2, margin2, width - margin2 * 2, height - margin2 * 2);
}

function drawElegant(
  ctx: CanvasRenderingContext2D,
  color: string,
  width: number,
  height: number
): void {
  // 細い上品な枠 + 角の飾り
  const margin = 5;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

  // 角の飾り（L字）
  const cornerLen = 14;
  const cw = 2;
  ctx.lineWidth = cw;
  const corners = [
    [margin, margin],
    [width - margin, margin],
    [margin, height - margin],
    [width - margin, height - margin],
  ] as const;
  for (const [cx, cy] of corners) {
    const dx = cx === margin ? 1 : -1;
    const dy = cy === margin ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * cornerLen);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * cornerLen, cy);
    ctx.stroke();
  }
}

function drawPop(
  ctx: CanvasRenderingContext2D,
  color: string,
  width: number,
  height: number
): void {
  // 太い枠 + 破線パターン
  const margin = 4;
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.setLineDash([10, 6]);
  ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
  ctx.setLineDash([]);
}

function drawBusiness(
  ctx: CanvasRenderingContext2D,
  color: string,
  width: number,
  height: number
): void {
  // 細い実線枠
  const margin = 5;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
}

function drawFestive(
  ctx: CanvasRenderingContext2D,
  color: string,
  width: number,
  height: number
): void {
  // 二重枠 + 角の装飾（小さな四角）
  const margin1 = 3;
  const margin2 = 8;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(margin1, margin1, width - margin1 * 2, height - margin1 * 2);
  ctx.lineWidth = 1;
  ctx.strokeRect(margin2, margin2, width - margin2 * 2, height - margin2 * 2);

  // 各角に小さな四角
  const boxSize = 6;
  const corners = [
    [margin1 - boxSize / 2, margin1 - boxSize / 2],
    [width - margin1 - boxSize / 2, margin1 - boxSize / 2],
    [margin1 - boxSize / 2, height - margin1 - boxSize / 2],
    [width - margin1 - boxSize / 2, height - margin1 - boxSize / 2],
  ] as const;
  ctx.fillStyle = color;
  for (const [bx, by] of corners) {
    ctx.fillRect(bx, by, boxSize, boxSize);
  }
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  config: FrameConfig,
  width: number,
  height: number
): void {
  if (config.type === "none") return;

  ctx.save();
  switch (config.type) {
    case "simple":
      drawSimple(ctx, config.color, width, height);
      break;
    case "rounded":
      drawRounded(ctx, config.color, width, height);
      break;
    case "ornate":
      drawOrnate(ctx, config.color, width, height);
      break;
    case "elegant":
      drawElegant(ctx, config.color, width, height);
      break;
    case "pop":
      drawPop(ctx, config.color, width, height);
      break;
    case "business":
      drawBusiness(ctx, config.color, width, height);
      break;
    case "festive":
      drawFestive(ctx, config.color, width, height);
      break;
  }
  ctx.restore();
}

export const DEFAULT_FRAME_CONFIG: FrameConfig = {
  type: "none",
  color: "#000000",
};
