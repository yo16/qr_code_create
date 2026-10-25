"use client";

import { useMemo } from "react";
import { QrPreview } from "@/components/qr/QrPreview/QrPreview";
import { MarkdownRenderer } from "@/components/poster/MarkdownRenderer";
import type { FrameConfig, FrameType } from "@/lib/qr/frameRenderer";
import type { DecorationConfig } from "@/types/qr";
import styles from "./PosterPreview.module.css";

interface PosterPreviewProps {
  /** UTMパラメータ付き完成URL（buildUtmUrl 適用後） */
  url: string;
  isUrlValid: boolean;
  /** 説明文（Markdown） */
  description: string;
  decoration: DecorationConfig;
}

/** カード1枚分のプレビュー（2x2 配置は別タスク） */
export function PosterPreview({ url, isUrlValid, description, decoration }: PosterPreviewProps) {
  // frameType は引き継ぎで色を持たないため、色は既定の黒を使う
  const frameConfig = useMemo<FrameConfig>(
    () => ({ type: (decoration.frameType ?? "none") as FrameType, color: "#000000" }),
    [decoration.frameType]
  );
  const hasDescription = description.trim() !== "";

  return (
    <div className={styles.card} aria-label="ポスターのプレビュー（1枚分）" role="group">
      <div className={styles.description}>
        {hasDescription ? (
          <MarkdownRenderer source={description} />
        ) : (
          <p className={styles.empty}>説明文を入力すると、ここに表示されます</p>
        )}
      </div>
      <div className={styles.qr}>
        <QrPreview
          url={url}
          isUrlValid={isUrlValid}
          size={192}
          fgColor={decoration.fgColor}
          bgColor={decoration.bgColor}
          logo={decoration.logo}
          frameConfig={frameConfig}
          caption={decoration.caption}
        />
      </div>
    </div>
  );
}
