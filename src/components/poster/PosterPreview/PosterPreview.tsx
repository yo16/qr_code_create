"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  /** フレームの色（引き継ぎに無ければ黒） */
  frameColor?: string;
  /** PDF生成時に html2canvas が捕捉する DOM 要素（A4 の枠）に当てる ref */
  innerRef?: React.RefObject<HTMLDivElement | null>;
  /**
   * 4 枚すべての QR の描画が終わったか（true）、描き直し中か（false）を伝える。
   * URL が無効で QR を描かないときは true。
   */
  onReadyChange?: (ready: boolean) => void;
}

/** 1ページに並べるカードの数（2x2） */
const CARD_COUNT = 4;
/** QR の canvas の実ピクセル数。表示サイズは CSS 側で枠に合わせて縮める */
const QR_CANVAS_SIZE = 512;

/** A4縦の枠に、同じカードを 2x2 で並べたプレビュー。画面表示と PDF 化に同じ DOM を使う */
export function PosterPreview({
  url,
  isUrlValid,
  description,
  decoration,
  frameColor = "#000000",
  innerRef,
  onReadyChange,
}: PosterPreviewProps) {
  const frameConfig = useMemo<FrameConfig>(
    () => ({ type: (decoration.frameType ?? "none") as FrameType, color: frameColor }),
    [decoration.frameType, frameColor]
  );

  // QR の描き直しが必要になる値。これが変わるたびに完了数を数え直す。
  // キャプションは QrPreview の外（このコンポーネントの DOM）で描くため含めない
  // （含めると、描き直しが起きないのに完了が来ず、ready が戻らなくなる）
  const shouldRender = !!(url && isUrlValid);
  const renderKey = useMemo(
    () =>
      JSON.stringify([
        shouldRender,
        url,
        decoration.fgColor,
        decoration.bgColor,
        decoration.logo,
        frameConfig.type,
        frameConfig.color,
      ]),
    [shouldRender, url, decoration.fgColor, decoration.bgColor, decoration.logo, frameConfig]
  );
  const renderKeyRef = useRef(renderKey);
  useEffect(() => {
    renderKeyRef.current = renderKey;
  }, [renderKey]);
  // 完了したカードの添字の集合（どのキーのものか付けて持つ）。
  // 同じカードが 2 回完了しても 1 枚と数えるため、件数ではなく集合にする
  const [settled, setSettled] = useState<{ key: string; indices: number[] }>({
    key: renderKey,
    indices: [],
  });

  // キーが変わったら記録を空にし直す（元のキーに戻った場合に古い記録が残らないようにする）。
  // render 中に前の値と比べて setState する、React 公式の「props 変化での state 調整」の書き方
  if (settled.key !== renderKey) {
    setSettled({ key: renderKey, indices: [] });
  }

  // 描画中に古い設定の完了通知が来ても数えない（key が今と違えば捨てる）
  const handleSettled = useCallback((key: string, index: number) => {
    if (key !== renderKeyRef.current) return;
    setSettled((prev) => {
      const base = prev.key === key ? prev.indices : [];
      return base.includes(index) ? prev : { key, indices: [...base, index] };
    });
  }, []);

  const ready =
    !shouldRender || (settled.key === renderKey && settled.indices.length >= CARD_COUNT);
  useEffect(() => {
    onReadyChange?.(ready);
  }, [ready, onReadyChange]);

  const hasDescription = description.trim() !== "";
  const hasCaption = isUrlValid && decoration.caption.text.trim() !== "";

  return (
    <div
      ref={innerRef}
      className={styles.sheet}
      role="group"
      aria-label="ポスターのプレビュー（A4縦、同じカード4枚）"
    >
      {Array.from({ length: CARD_COUNT }, (_, index) => (
        <div
          key={index}
          className={styles.card}
          // 同じ内容の繰り返しなので、支援技術には 1 枚目だけ読ませる
          aria-hidden={index === 0 ? undefined : true}
          data-testid="poster-card"
        >
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
              size={QR_CANVAS_SIZE}
              fgColor={decoration.fgColor}
              bgColor={decoration.bgColor}
              logo={decoration.logo}
              frameConfig={frameConfig}
              bare
              onRenderSettled={() => handleSettled(renderKey, index)}
            />
            {hasCaption && (
              <p
                className={styles.caption}
                style={{ "--caption-size": decoration.caption.fontSize } as React.CSSProperties}
              >
                {decoration.caption.text}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
