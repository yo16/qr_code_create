"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import { trackErrorOccurred, trackPosterGenerated } from "@/lib/analytics/events";
import styles from "./PdfDownloadButton.module.css";

interface PdfDownloadButtonProps {
  /** PosterPreview の A4 の枠への参照（html2canvas で画像化する対象） */
  previewRef: React.RefObject<HTMLDivElement | null>;
  /** 無効化フラグ（URL 未入力など） */
  disabled?: boolean;
  /** QRコードの描画が終わっているか。false の間は押せず「QRコードを準備中...」と表示する */
  ready?: boolean;
  /** 入力の識別子。変わると前回の成功/失敗メッセージを消す（省略時は消えない） */
  resetKey?: string;
  /** GA4 イベント用のメタデータ */
  hasUtm: boolean;
  hasLogo: boolean;
  descriptionLength: number;
}

const REVOKE_DELAY_MS = 1000;
/** 成功メッセージを出しておく時間 */
const SUCCESS_MESSAGE_MS = 4000;

/** 2桁にそろえる */
function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** qr-poster-YYYYMMDD-HHmmss.pdf */
export function buildPosterFileName(date: Date = new Date()): string {
  const ymd = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const hms = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `qr-poster-${ymd}-${hms}.pdf`;
}

/** Blob を a 要素の download 属性で保存する */
function saveBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // すぐに解放すると、ブラウザによっては保存が始まる前に URL が無効になるため遅らせる
  setTimeout(() => URL.revokeObjectURL(objectUrl), REVOKE_DELAY_MS);
}

export function PdfDownloadButton({
  previewRef,
  disabled = false,
  ready = true,
  resetKey = "",
  hasUtm,
  hasLogo,
  descriptionLength,
}: PdfDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  // 結果を出した時点の入力の識別子。入力が変わったら（resetKey が変わったら）結果は古いので出さない
  const [resultKey, setResultKey] = useState("");

  // 成功メッセージは数秒で消す
  useEffect(() => {
    if (status !== "success") return;
    const timer = setTimeout(() => setStatus("idle"), SUCCESS_MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [status]);

  const isResultCurrent = resultKey === resetKey;

  const handleClick = async () => {
    const element = previewRef.current;
    // ready が false の間はボタンが無効なので、ここに来ない。念のための保険
    if (!element || isGenerating || !ready) return;

    setIsGenerating(true);
    setStatus("idle");
    setResultKey(resetKey);
    try {
      // 重いライブラリを使うので、押されたときに読み込む
      const { generatePosterPdf } = await import("@/lib/pdf/generatePosterPdf");
      const blob = await generatePosterPdf({ previewElement: element });
      saveBlob(blob, buildPosterFileName());
      trackPosterGenerated({ hasUtm, hasLogo, descriptionLength });
      setStatus("success");
    } catch (error) {
      trackErrorOccurred("pdf_generate", "poster");
      console.error("Poster PDF generation failed", error);
      setStatus("error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <Button
        variant="primary"
        size="lg"
        disabled={disabled || isGenerating || !ready}
        onClick={handleClick}
        aria-busy={isGenerating}
      >
        {isGenerating
          ? "生成中..."
          : !ready && !disabled
            ? "QRコードを準備中..."
            : "PDFをダウンロード（A4印刷用）"}
      </Button>
      <p className={styles.note}>A4縦1ページに同じカードを4枚配置します。切り取って配布できます。</p>
      <div aria-live="polite">
        {status === "success" && isResultCurrent && (
          <p className={styles.success}>PDFをダウンロードしました</p>
        )}
      </div>
      {status === "error" && isResultCurrent && (
        <p className={styles.error} role="alert">
          PDFの生成に失敗しました。もう一度お試しください。
        </p>
      )}
    </div>
  );
}
