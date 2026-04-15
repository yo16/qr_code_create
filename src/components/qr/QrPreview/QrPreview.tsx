"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { isContrastSufficient } from "@/lib/color/contrastChecker";
import {
  drawFrame,
  isImageFrame,
  getFrameImageSrc,
  type FrameConfig,
  DEFAULT_FRAME_CONFIG,
} from "@/lib/qr/frameRenderer";
import { drawLogoOnCanvas } from "@/lib/qr/drawLogo";
import type { LogoConfig } from "@/types/qr";
import styles from "./QrPreview.module.css";

/** フレーム画像仕様の定数 */
const FRAME_SPEC = {
  IMAGE_SIZE: 944,
  QR_OFFSET: 132,
  QR_SIZE: 680,
} as const;

interface QrPreviewProps {
  /** QRコードに埋め込むURL（UTMパラメータ付き完成URL） */
  url: string;
  /** 前景色（デフォルト: #000000） */
  fgColor?: string;
  /** 背景色（デフォルト: #ffffff） */
  bgColor?: string;
  /** サイズ（デフォルト: 256） */
  size?: number;
  /** ロゴ設定 */
  logo?: LogoConfig | null;
  /** フレーム設定 */
  frameConfig?: FrameConfig;
  /** URL有効性（false のときプレースホルダー表示） */
  isUrlValid?: boolean;
  /** 外部から canvasRef を注入する場合に指定（省略時は内部生成） */
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

const DEBOUNCE_MS = 500;

/** 画像を読み込んでHTMLImageElementを返す */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function QrPreview({
  url,
  fgColor = "#000000",
  bgColor = "#ffffff",
  size = 256,
  logo,
  frameConfig = DEFAULT_FRAME_CONFIG,
  isUrlValid = false,
  canvasRef: externalCanvasRef,
}: QrPreviewProps) {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalCanvasRef ?? internalCanvasRef;
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const shouldRender = !!(url && isUrlValid);
  const contrastOk = isContrastSufficient(fgColor, bgColor);

  const hasFrame = frameConfig.type !== "none";
  const hasImageFrame = isImageFrame(frameConfig.type);

  const generateQr = useCallback(async () => {
    if (!shouldRender || !canvasRef.current) return;

    setIsLoading(true);
    setHasError(false);

    try {
      const QRCode = (await import("qrcode")).default;
      const canvas = canvasRef.current;

      if (hasImageFrame) {
        // 画像フレーム: フレーム画像の上にQRコードを合成
        const frameSrc = getFrameImageSrc(frameConfig.type);
        if (!frameSrc) throw new Error("Frame image not found");

        const frameImg = await loadImage(frameSrc);

        // Canvasサイズをフレーム画像に合わせてスケーリング
        // フレーム画像は944x944、表示はsize x sizeにスケール
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Cannot get canvas context");

        // フレーム画像を描画
        ctx.drawImage(frameImg, 0, 0, size, size);

        // QRコードを一時Canvasに生成
        const tempCanvas = document.createElement("canvas");
        const qrDisplaySize = Math.round(
          (FRAME_SPEC.QR_SIZE / FRAME_SPEC.IMAGE_SIZE) * size
        );
        await QRCode.toCanvas(tempCanvas, url, {
          width: qrDisplaySize,
          margin: 4,
          color: { dark: fgColor, light: bgColor },
          errorCorrectionLevel: "H",
        });

        // QRコードをフレーム内の所定位置に描画
        const qrOffset = Math.round(
          (FRAME_SPEC.QR_OFFSET / FRAME_SPEC.IMAGE_SIZE) * size
        );
        ctx.drawImage(tempCanvas, qrOffset, qrOffset, qrDisplaySize, qrDisplaySize);
      } else {
        // Canvas描画フレームまたはフレームなし
        canvas.width = size;
        canvas.height = size;

        await QRCode.toCanvas(canvas, url, {
          width: size,
          margin: 4,
          color: { dark: fgColor, light: bgColor },
          errorCorrectionLevel: "H",
        });

        // Canvas描画フレームを重ねる
        if (hasFrame) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            drawFrame(ctx, frameConfig, size, size);
          }
        }
      }

      // ロゴが指定されている場合、Canvas にロゴを重ねて描画する
      if (logo != null) {
        await drawLogoOnCanvas(canvas, logo);
      }
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [url, fgColor, bgColor, size, shouldRender, logo, frameConfig, hasFrame, hasImageFrame]);

  // URL・色・サイズ・フレームが変わったら 500ms デバウンスして再生成
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!shouldRender) {
      // canvas をクリア
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      generateQr();
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [generateQr, shouldRender]);

  return (
    <div className={styles.container}>
      <div className={styles.label}>QRコードプレビュー</div>

      <div
        className={styles.previewArea}
        style={{ width: size, height: size }}
        role="img"
        aria-label={shouldRender ? "生成されたQRコード" : "QRコードプレースホルダー"}
      >
        {/* QRコード canvas（常にDOMに存在させてrefを維持） */}
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className={
            shouldRender && !isLoading && !hasError
              ? styles.canvas
              : styles.canvasHidden
          }
          aria-hidden="true"
        />

        {/* ローディング */}
        {isLoading && (
          <div className={styles.overlay} aria-hidden="true">
            <div className={styles.spinner} />
          </div>
        )}

        {/* プレースホルダー（URL未入力 / 無効） */}
        {!shouldRender && !isLoading && (
          <div className={styles.placeholder}>
            <span className={styles.placeholderIcon} aria-hidden="true">
              □
            </span>
            <p className={styles.placeholderText}>
              URLを入力してQRコードを生成
            </p>
          </div>
        )}

        {/* エラー */}
        {hasError && !isLoading && (
          <div className={styles.errorOverlay}>
            <p className={styles.errorText}>QRコードの生成に失敗しました</p>
          </div>
        )}
      </div>

      {/* コントラスト不足警告 */}
      {shouldRender && !contrastOk && (
        <div className={styles.warning} role="alert">
          <span className={styles.warningIcon} aria-hidden="true">
            ⚠
          </span>
          <span className={styles.warningText}>
            前景色と背景色のコントラスト比が不足しています（WCAG AA 基準: 4.5:1
            以上）。QRコードが読み取りにくい場合があります。
          </span>
        </div>
      )}
    </div>
  );
}
