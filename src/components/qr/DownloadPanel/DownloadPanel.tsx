"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DownloadButton } from "./DownloadButton";
import { PdfDownloadButton } from "./PdfDownloadButton";
import { ResolutionSelector, type Resolution } from "./ResolutionSelector";
import type { CaptionConfig, UtmParams, DecorationConfig } from "@/types/qr";
import { savePosterHandoff } from "@/lib/handoff/posterHandoff";
import { FEATURE_FLAGS } from "@/lib/constants/features";
import { useDict, useLocale } from "@/i18n/useDict";
import styles from "./DownloadPanel.module.css";

interface DownloadPanelProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  disabled?: boolean;
  hasUtm: boolean;
  decorationCount: number;
  caption?: CaptionConfig;
  /** ポスター作成CTAに必要なQR状態 */
  url?: string;
  isUrlValid?: boolean;
  utm?: UtmParams;
  utmEnabled?: boolean;
  decoration?: DecorationConfig;
}

export function DownloadPanel({
  canvasRef,
  disabled = false,
  hasUtm,
  decorationCount,
  caption,
  url = "",
  isUrlValid = false,
  utm,
  utmEnabled = true,
  decoration,
}: DownloadPanelProps) {
  const t = useDict().tool.download;
  // /poster に英語版は無いので、en では導線を出さない
  const locale = useLocale();
  const [resolution, setResolution] = useState<Resolution>(1);
  const router = useRouter();

  const handlePosterCta = () => {
    if (!isUrlValid || disabled) return;
    savePosterHandoff({
      url,
      isUrlValid,
      utm: utm ?? { source: "", medium: "qr", campaign: "", term: "", content: "" },
      utmEnabled,
      decoration: decoration ?? {
        fgColor: "#000000",
        bgColor: "#ffffff",
        logo: null,
        frameType: null,
        caption: { text: "", fontSize: 14 },
        preset: null,
      },
    });
    router.push("/poster");
  };

  return (
    <div className={styles.panel}>
      {disabled ? (
        <p className={styles.disabledMessage}>{t.disabledMessage}</p>
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
              caption={caption}
            />
            <DownloadButton
              canvasRef={canvasRef}
              format="svg"
              disabled={disabled}
              hasUtm={hasUtm}
              decorationCount={decorationCount}
              caption={caption}
            />
            <PdfDownloadButton
              canvasRef={canvasRef}
              disabled={disabled}
              hasUtm={hasUtm}
              decorationCount={decorationCount}
              caption={caption}
            />
          </div>
          {FEATURE_FLAGS.posterPage && locale === "ja" && (
            <div className={styles.ctaSection}>
              <button
                type="button"
                className={styles.ctaButton}
                onClick={handlePosterCta}
                disabled={!isUrlValid}
                aria-label={t.posterCtaAria}
              >
                {t.posterCta}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
