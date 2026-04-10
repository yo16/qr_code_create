"use client";

import { useCallback } from "react";
import { FileUpload } from "@/components/ui/FileUpload/FileUpload";
import { trackLogoUploaded } from "@/lib/analytics/events";
import styles from "./LogoUploader.module.css";

export interface LogoConfig {
  dataUrl: string;
  fileName: string;
  fileType: string;
  fileSizeKb: number;
  sizePercent: number; // 10-30
}

interface LogoUploaderProps {
  logo: LogoConfig | null;
  onChange: (logo: LogoConfig | null) => void;
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
      onChange({ ...logo, sizePercent: Number(e.target.value) });
    },
    [logo, onChange]
  );

  const handleRemove = useCallback(() => {
    onChange(null);
  }, [onChange]);

  if (logo) {
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
              ロゴサイズ: {logo.sizePercent}%
            </label>
            <input
              id="logo-size-slider"
              type="range"
              min={10}
              max={30}
              step={1}
              value={logo.sizePercent}
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
