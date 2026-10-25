"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { isContrastSufficient } from "@/lib/color/contrastChecker";
import { trackQrGenerated, trackErrorOccurred } from "@/lib/analytics/events";
import {
  drawFrame,
  isImageFrame,
  getFrameImageSrc,
  type FrameConfig,
  DEFAULT_FRAME_CONFIG,
} from "@/lib/qr/frameRenderer";
import { drawLogoOnCanvas } from "@/lib/qr/drawLogo";
import { useDict } from "@/i18n/useDict";
import type { CaptionConfig, LogoConfig } from "@/types/qr";
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
  /** キャプション設定 */
  caption?: CaptionConfig;
  /** URL有効性（false のときプレースホルダー表示） */
  isUrlValid?: boolean;
  /** 外部から canvasRef を注入する場合に指定（省略時は内部生成） */
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  /**
   * 他の画面（ポスターなど）の部品として埋め込む表示。
   * ラベル・コントラスト警告・container の面/枠/余白を描かず、QR だけを出す。
   * 同じ QR を複数並べる使い方を想定しているため、qr_generated も送らない
   * （エラー計測 qr_render は残す）。
   */
  bare?: boolean;
  /**
   * 描画の試行が終わったときに、結果（ok: 成功したか）を渡して呼ばれる。
   * 設定が変わって新しい描画が予約された後は、古い描画の完了は通知されない
   * （常に「いま進行中の最新の描画」の完了だけが届く）
   */
  onRenderSettled?: (result: { ok: boolean }) => void;
  /** 描画が予約された（デバウンス待ちに入った）とき、またはやり直しになったときに呼ばれる */
  onRenderPending?: () => void;
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
  caption,
  isUrlValid = false,
  canvasRef: externalCanvasRef,
  bare = false,
  onRenderSettled,
  onRenderPending,
}: QrPreviewProps) {
  const t = useDict().tool.qrPreview;
  const onRenderSettledRef = useRef(onRenderSettled);
  const onRenderPendingRef = useRef(onRenderPending);
  useEffect(() => {
    onRenderSettledRef.current = onRenderSettled;
    onRenderPendingRef.current = onRenderPending;
  });
  // 描画の世代番号。描画を予約するたび（設定変更・URL 無効化を含む）に進め、
  // 完了時に自分の世代が最新のときだけ通知する。A→B→A のように同じ設定に戻っても、
  // 最初の A の完了は古い世代として捨てられる
  const latestGenerationRef = useRef(0);
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalCanvasRef ?? internalCanvasRef;
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const shouldRender = !!(url && isUrlValid);
  const contrastOk = isContrastSufficient(fgColor, bgColor);

  const hasCaption = !!(caption && caption.text.trim() !== "");

  const hasFrame = frameConfig.type !== "none";
  const hasImageFrame = isImageFrame(frameConfig.type);

  const generateQr = useCallback(async (generation: number) => {
    if (!shouldRender || !canvasRef.current) return;

    // 生成を始めた時点の通知先を控える。完了時の最新の ref を呼ぶと、
    // 生成中に設定が変わったとき古い生成の完了が新しい設定の完了として届いてしまう
    const settled = onRenderSettledRef.current;

    let ok = true;
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

        // qrcode は toCanvas で canvas.style.width/height に size(px) をインラインで書き込む。
        // インラインは CSS より優先され、表示の大きさを CSS で決める場合（/create のスマホ表示の
        // 768px 以下の .previewArea canvas { width: var(--preview-max) } と、ポスターの bare 表示の
        // width/height: 100%）に効かず、枠からはみ出して中央だけが見えるため、常に消す。
        // デスクトップでは canvas の width/height 属性（size）がそのまま表示の大きさになる
        canvas.style.removeProperty("width");
        canvas.style.removeProperty("height");

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

      // QRコード生成完了イベントを発火
      if (!bare) {
        trackQrGenerated({
          hasUtm: url.includes("utm_"),
          utmCount: (url.match(/utm_/g) || []).length,
          hasLogo: logo != null,
          hasFrame: hasFrame,
          hasCaption: !!(caption && caption.text.trim() !== ""),
        });
      }
    } catch (error) {
      trackErrorOccurred("qr_render", error instanceof Error ? error.name : "unknown");
      setHasError(true);
      ok = false;
    } finally {
      setIsLoading(false);
      if (generation === latestGenerationRef.current) settled?.({ ok });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- canvasRef は ref で安定、caption は計測にのみ使い再描画に不要（入れると文言入力のたびに再生成される）
  }, [url, fgColor, bgColor, size, shouldRender, logo, frameConfig, hasFrame, hasImageFrame]);

  // URL・色・サイズ・フレームが変わったら 500ms デバウンスして再生成
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 予約のたびに世代を進める。進行中の古い描画の完了はこれで無効になる
    const generation = ++latestGenerationRef.current;

    if (!shouldRender) {
      // canvas をクリア
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    onRenderPendingRef.current?.();
    debounceTimerRef.current = setTimeout(() => {
      generateQr(generation);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- canvasRef は ref で参照が安定しており再実行のトリガーに不要
  }, [generateQr, shouldRender]);

  return (
    <div className={bare ? styles.bare : styles.container}>
      {!bare && <div className={styles.label}>{t.label}</div>}

      <div
        className={styles.previewArea}
        style={{ width: size, height: size }}
        role="img"
        aria-label={shouldRender ? t.ariaGenerated : t.ariaPlaceholder}
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
            <p className={styles.placeholderText}>{t.placeholder}</p>
          </div>
        )}

        {/* エラー */}
        {hasError && !isLoading && (
          <div className={styles.errorOverlay}>
            <p className={styles.errorText}>{t.error}</p>
          </div>
        )}
      </div>

      {/* キャプションプレビュー */}
      {shouldRender && hasCaption && (
        <p
          className={styles.captionPreview}
          style={{ fontSize: caption!.fontSize }}
        >
          {caption!.text}
        </p>
      )}

      {/* コントラスト不足警告 */}
      {!bare && shouldRender && !contrastOk && (
        <div className={styles.warning} role="alert">
          <span className={styles.warningIcon} aria-hidden="true">
            ⚠
          </span>
          <span className={styles.warningText}>{t.contrastWarning}</span>
        </div>
      )}
    </div>
  );
}
