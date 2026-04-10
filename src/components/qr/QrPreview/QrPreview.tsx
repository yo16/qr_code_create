"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { isContrastSufficient } from "@/lib/color/contrastChecker";
import styles from "./QrPreview.module.css";

interface QrPreviewProps {
  /** QRコードに埋め込むURL（UTMパラメータ付き完成URL） */
  url: string;
  /** 前景色（デフォルト: #000000） */
  fgColor?: string;
  /** 背景色（デフォルト: #ffffff） */
  bgColor?: string;
  /** サイズ（デフォルト: 256） */
  size?: number;
  /** ロゴ画像の data URL（Epic 4 で実装予定） */
  logoSrc?: string | null;
  /** URL有効性（false のときプレースホルダー表示） */
  isUrlValid?: boolean;
}

const DEBOUNCE_MS = 500;

export function QrPreview({
  url,
  fgColor = "#000000",
  bgColor = "#ffffff",
  size = 256,
  logoSrc,
  isUrlValid = false,
}: QrPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const shouldRender = !!(url && isUrlValid);
  const contrastOk = isContrastSufficient(fgColor, bgColor);

  const generateQr = useCallback(async () => {
    if (!shouldRender || !canvasRef.current) return;

    setIsLoading(true);
    setHasError(false);

    try {
      // SSR では動作しないため useEffect 内で動的インポートする
      const QRCode = (await import("qrcode")).default;

      await QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: "M",
      });

      // TODO(Epic 4 / b69.1): logoSrc が指定されている場合、Canvas にロゴを重ねて描画する
      void logoSrc;
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [url, fgColor, bgColor, size, shouldRender, logoSrc]);

  // URL・色・サイズが変わったら 500ms デバウンスして再生成
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
