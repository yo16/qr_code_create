"use client";

import { useState } from "react";
import { DownloadButton } from "./DownloadButton";
import { PdfDownloadButton } from "./PdfDownloadButton";
import { ResolutionSelector, type Resolution } from "./ResolutionSelector";
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
  const [resolution, setResolution] = useState<Resolution>(1);

  return (
    <div className={styles.panel}>
      {disabled ? (
        <p className={styles.disabledMessage}>
          QRコードを生成するとダウンロードできます
        </p>
      ) : (
        <>
          <ResolutionSelector value={resolution} onChange={setResolution} />
          <div className={styles.buttonGroup}>
            <DownloadButton
              canvasRef={canvasRef}
              format="png"
              disabled={disabled}
              hasUtm={hasUtm}
              decorationCount={decorationCount}
              resolution={resolution}
            />
            <DownloadButton
              canvasRef={canvasRef}
              format="svg"
              disabled={disabled}
              hasUtm={hasUtm}
              decorationCount={decorationCount}
            />
            <PdfDownloadButton
              canvasRef={canvasRef}
              disabled={disabled}
              hasUtm={hasUtm}
              decorationCount={decorationCount}
            />
          </div>
        </>
      )}
    </div>
  );
}
