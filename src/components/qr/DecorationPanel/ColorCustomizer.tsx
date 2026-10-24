"use client";

import { ColorPicker } from "@/components/ui/ColorPicker/ColorPicker";
import { getContrastRatio } from "@/lib/color/contrastChecker";
import { trackColorCustomized } from "@/lib/analytics/events";
import { formatMessage } from "@/i18n/format";
import { useDict } from "@/i18n/useDict";
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
  const t = useDict().decoration.color;
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
    ok: t.ok,
    caution: t.caution,
    warning: t.warning,
  }[level];

  return (
    <div className={styles.container}>
      <div className={styles.pickers}>
        <ColorPicker
          label={t.fg}
          value={fgColor}
          onChange={handleFgColorChange}
        />
        <ColorPicker
          label={t.bg}
          value={bgColor}
          onChange={handleBgColorChange}
        />
      </div>

      <div className={`${styles.contrastInfo} ${styles[`contrastInfo--${level}`]}`}>
        <span className={styles.contrastRatio}>
          {formatMessage(t.contrastRatio, { ratio: contrastRatio.toFixed(2) })}
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
        {t.reset}
      </button>
    </div>
  );
}
