"use client";

import { DownloadButton } from "./DownloadButton";
import styles from "./DownloadPanel.module.css";

interface DownloadPanelProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  disabled?: boolean;
  hasUtm: boolean;
  decorationCount: number;
}

export function DownloadPanel({
  canvasRef,
  disabled = false,
  hasUtm,
  decorationCount,
}: DownloadPanelProps) {
  return (
    <div className={styles.panel}>
      {disabled ? (
        <p className={styles.disabledMessage}>
          QRコードを生成するとダウンロードできます
        </p>
      ) : (
        <div className={styles.buttonGroup}>
          <DownloadButton
            canvasRef={canvasRef}
            format="png"
            disabled={disabled}
            hasUtm={hasUtm}
            decorationCount={decorationCount}
          />
          <DownloadButton
            canvasRef={canvasRef}
            format="svg"
            disabled={disabled}
            hasUtm={hasUtm}
            decorationCount={decorationCount}
          />
          {/* PDFボタンは bd-8lf.2 で実装予定 */}
        </div>
      )}
    </div>
  );
}
