"use client";

import { buildDecorationPresets, type DecorationPreset } from "@/lib/constants/decorationPresets";
import { trackPresetSelected } from "@/lib/analytics/events";
import { formatMessage } from "@/i18n/format";
import { useDict } from "@/i18n/useDict";
import styles from "./PresetSelector.module.css";

interface PresetSelectorProps {
  currentPresetId: string | null;
  onApplyPreset: (preset: DecorationPreset) => void;
}

export function PresetSelector({ currentPresetId, onApplyPreset }: PresetSelectorProps) {
  const { decoration } = useDict();
  const presets = buildDecorationPresets(decoration);

  const handleClick = (preset: DecorationPreset) => {
    onApplyPreset(preset);
    trackPresetSelected(preset.id);
  };

  return (
    <div className={styles.container}>
      <div className={styles.grid} role="group" aria-label={decoration.presetGroupLabel}>
        {presets.map((preset) => {
          const isSelected = currentPresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              className={`${styles.card} ${isSelected ? styles["card--selected"] : ""}`}
              onClick={() => handleClick(preset)}
              aria-pressed={isSelected}
              aria-label={formatMessage(decoration.presetItemLabel, {
                name: preset.name,
                description: preset.description,
              })}
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
