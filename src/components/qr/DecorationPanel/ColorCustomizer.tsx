"use client";

import { ColorPicker } from "@/components/ui/ColorPicker/ColorPicker";
import { getContrastRatio } from "@/lib/color/contrastChecker";
import { trackColorCustomized } from "@/lib/analytics/events";
import styles from "./ColorCustomizer.module.css";

interface ColorCustomizerProps {
  fgColor: string;
  bgColor: string;
  onFgColorChange: (color: string) => void;
  onBgColorChange: (color: string) => void;
}

const DEFAULT_FG_COLOR = "#000000";
const DEFAULT_BG_COLOR = "#ffffff";

type ContrastLevel = "ok" | "caution" | "warning";

function getContrastLevel(ratio: number): ContrastLevel {
  if (ratio >= 4.5) return "ok";
  if (ratio >= 3) return "caution";
  return "warning";
}

export function ColorCustomizer({
  fgColor,
  bgColor,
  onFgColorChange,
  onBgColorChange,
}: ColorCustomizerProps) {
  const contrastRatio = getContrastRatio(fgColor, bgColor);
  const level = getContrastLevel(contrastRatio);

  const handleFgColorChange = (color: string) => {
    onFgColorChange(color);
    trackColorCustomized(color, bgColor);
  };

  const handleBgColorChange = (color: string) => {
    onBgColorChange(color);
    trackColorCustomized(fgColor, color);
  };

  const handleReset = () => {
    onFgColorChange(DEFAULT_FG_COLOR);
    onBgColorChange(DEFAULT_BG_COLOR);
    trackColorCustomized(DEFAULT_FG_COLOR, DEFAULT_BG_COLOR);
  };

  const contrastMessage = {
    ok: "読み取りやすいコントラストです",
    caution: "読み取りにくくなる可能性があります",
    warning: "QRコードが読み取れない可能性があります",
  }[level];

  return (
    <div className={styles.container}>
      <div className={styles.pickers}>
        <ColorPicker
          label="前景色"
          value={fgColor}
          onChange={handleFgColorChange}
        />
        <ColorPicker
          label="背景色"
          value={bgColor}
          onChange={handleBgColorChange}
        />
      </div>

      <div className={`${styles.contrastInfo} ${styles[`contrastInfo--${level}`]}`}>
        <span className={styles.contrastRatio}>
          コントラスト比: {contrastRatio.toFixed(2)}:1
        </span>
        {level === "warning" ? (
          <span className={styles.contrastMessage} role="alert">
            {contrastMessage}
          </span>
        ) : (
          <span className={styles.contrastMessage}>{contrastMessage}</span>
        )}
      </div>

      <button
        type="button"
        className={styles.resetButton}
        onClick={handleReset}
      >
        デフォルトに戻す
      </button>
    </div>
  );
}
