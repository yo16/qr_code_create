"use client";

import { DECORATION_PRESETS, type DecorationPreset } from "@/lib/constants/decorationPresets";
import { trackPresetSelected } from "@/lib/analytics/events";
import styles from "./PresetSelector.module.css";

interface PresetSelectorProps {
  currentPresetId: string | null;
  onApplyPreset: (preset: DecorationPreset) => void;
}

export function PresetSelector({ currentPresetId, onApplyPreset }: PresetSelectorProps) {
  const handleClick = (preset: DecorationPreset) => {
    onApplyPreset(preset);
    trackPresetSelected(preset.id);
  };

  return (
    <div className={styles.container}>
      <div className={styles.grid} role="group" aria-label="装飾プリセット">
        {DECORATION_PRESETS.map((preset) => {
          const isSelected = currentPresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              className={`${styles.card} ${isSelected ? styles["card--selected"] : ""}`}
              onClick={() => handleClick(preset)}
              aria-pressed={isSelected}
              aria-label={`プリセット: ${preset.name} - ${preset.description}`}
            >
              <div className={styles.colorPreview} aria-hidden="true">
                <span
                  className={styles.colorDot}
                  style={{ backgroundColor: preset.fgColor }}
                />
                <span
                  className={styles.colorDot}
                  style={{ backgroundColor: preset.bgColor }}
                />
              </div>
              <p className={styles.cardName}>{preset.name}</p>
              <p className={styles.cardDescription}>{preset.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
