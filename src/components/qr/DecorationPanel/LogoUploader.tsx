"use client";

import { useCallback, useRef, useState } from "react";
import { MAX_LOGO_DATA_URL_LENGTH } from "@/lib/handoff/posterHandoff";
import { svgDataUrlToPngDataUrl } from "@/lib/qr/svgToPng";
import { FileUpload } from "@/components/ui/FileUpload/FileUpload";
import { trackLogoUploaded } from "@/lib/analytics/events";
import { formatMessage } from "@/i18n/format";
import { useDict } from "@/i18n/useDict";
import type { LogoConfig } from "@/types/qr";
import styles from "./LogoUploader.module.css";

export type { LogoConfig };

interface LogoUploaderProps {
  logo: LogoConfig | null;
  onChange: (logo: LogoConfig | null) => void;
}

const MIN_SIZE_PERCENT = 10;
const MAX_SIZE_PERCENT = 25;

function clampSizePercent(value: number): number {
  if (value < MIN_SIZE_PERCENT) return MIN_SIZE_PERCENT;
  if (value > MAX_SIZE_PERCENT) return MAX_SIZE_PERCENT;
  return value;
}

export function LogoUploader({ logo, onChange }: LogoUploaderProps) {
  const dict = useDict();
  const t = dict.decoration.logo;
  const tFile = dict.ui.fileUpload;
  const [convertError, setConvertError] = useState<string | null>(null);
  const seqRef = useRef(0);
  const handleFileSelect = useCallback(
    (file: File | null) => {
      // 選択・削除のたびに連番を進め、古い選択の結果は捨てる
      const seq = ++seqRef.current;
      const isStale = () => seq !== seqRef.current;
      const fail = () => {
        if (isStale()) return;
        setConvertError(tFile.convertFailed);
        onChange(null); // 古いロゴを残さない（形式で拒否したときと同じ）
      };

      if (!file) {
        setConvertError(null);
        onChange(null);
        return;
      }

      setConvertError(null);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result;
        if (typeof result !== "string") {
          fail();
          return;
        }
        let dataUrl = result;
        // SVG は <img> に描いて PNG に変換して保持する（失敗したら受け付けない）
        if (file.type === "image/svg+xml") {
          try {
            dataUrl = await svgDataUrlToPngDataUrl(result);
          } catch {
            fail();
            return;
          }
          // 受け渡しの型ガードで捨てられないよう、同じ上限で弾く
          if (dataUrl.length > MAX_LOGO_DATA_URL_LENGTH) {
            fail();
            return;
          }
        }
        if (isStale()) return;
        const fileSizeKb = Math.round(file.size / 1024);
        const logoConfig: LogoConfig = {
          dataUrl,
          fileName: file.name,
          // SVG は dataUrl が PNG に変換済みでも、元のファイル形式のまま保持する
          // （解析イベント trackLogoUploaded の file.type を変えないため）
          fileType: file.type,
          fileSizeKb,
          sizePercent: 20,
        };
        onChange(logoConfig);
        trackLogoUploaded(file.type, fileSizeKb);
      };
      reader.onerror = fail;
      reader.readAsDataURL(file);
    },
    [onChange, tFile.convertFailed]
  );

  const handleSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!logo) return;
      onChange({ ...logo, sizePercent: clampSizePercent(Number(e.target.value)) });
    },
    [logo, onChange]
  );

  const handleRemove = useCallback(() => {
    seqRef.current += 1; // 変換中の古い結果を捨てる
    onChange(null);
  }, [onChange]);

  if (logo) {
    const displaySizePercent = clampSizePercent(logo.sizePercent);
    return (
      <div className={styles.wrapper}>
        <div className={styles.previewArea}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.dataUrl}
            alt={formatMessage(t.alt, { fileName: logo.fileName })}
            className={styles.thumbnail}
          />
          <div className={styles.controls}>
            <label htmlFor="logo-size-slider" className={styles.sizeLabel}>
              {formatMessage(t.sizeLabel, { percent: displaySizePercent })}
            </label>
            <input
              id="logo-size-slider"
              type="range"
              min={MIN_SIZE_PERCENT}
              max={MAX_SIZE_PERCENT}
              step={1}
              value={displaySizePercent}
              onChange={handleSizeChange}
              className={styles.slider}
              aria-label={t.sizeAria}
            />
            <button
              type="button"
              onClick={handleRemove}
              className={styles.removeButton}
              aria-label={t.removeAria}
            >
              {t.remove}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <FileUpload
        label={t.upload}
        accept="image/png,image/jpeg,image/svg+xml"
        maxSizeKB={500}
        onFileSelect={handleFileSelect}
        error={convertError ?? undefined}
      />
    </div>
  );
}
