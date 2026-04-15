"use client";

import { useCallback } from "react";
import { FileUpload } from "@/components/ui/FileUpload/FileUpload";
import { trackLogoUploaded } from "@/lib/analytics/events";
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
  const handleFileSelect = useCallback(
    (file: File | null) => {
      if (!file) {
        onChange(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const fileSizeKb = Math.round(file.size / 1024);
        const logoConfig: LogoConfig = {
          dataUrl,
          fileName: file.name,
          fileType: file.type,
          fileSizeKb,
          sizePercent: 20,
        };
        onChange(logoConfig);
        trackLogoUploaded(file.type, fileSizeKb);
      };
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  const handleSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!logo) return;
      onChange({ ...logo, sizePercent: clampSizePercent(Number(e.target.value)) });
    },
    [logo, onChange]
  );

  const handleRemove = useCallback(() => {
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
            alt={`ロゴ: ${logo.fileName}`}
            className={styles.thumbnail}
          />
          <div className={styles.controls}>
            <label htmlFor="logo-size-slider" className={styles.sizeLabel}>
              ロゴサイズ: {displaySizePercent}%
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
              aria-label="ロゴサイズを調整"
            />
            <button
              type="button"
              onClick={handleRemove}
              className={styles.removeButton}
              aria-label="ロゴを削除"
            >
              ロゴを削除
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <FileUpload
        label="ロゴ画像をアップロード"
        accept="image/png,image/jpeg,image/svg+xml"
        maxSizeKB={500}
        onFileSelect={handleFileSelect}
      />
    </div>
  );
}
