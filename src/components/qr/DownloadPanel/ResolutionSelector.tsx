"use client";

import { formatMessage } from "@/i18n/format";
import { useDict } from "@/i18n/useDict";
import styles from "./ResolutionSelector.module.css";

export type Resolution = 1 | 2 | 4;

interface ResolutionOption {
  value: Resolution;
  /** 固定ラベル。null のときは辞書の resolutionNormal を使う */
  label: string | null;
  sizeKb: number;
}

const RESOLUTION_OPTIONS: ResolutionOption[] = [
  { value: 1, label: null, sizeKb: 20 },
  { value: 2, label: "2x", sizeKb: 80 },
  { value: 4, label: "4x", sizeKb: 300 },
];

interface ResolutionSelectorProps {
  value: Resolution;
  onChange: (resolution: Resolution) => void;
}

export function ResolutionSelector({ value, onChange }: ResolutionSelectorProps) {
  const t = useDict().tool.download;
  const selectedOption = RESOLUTION_OPTIONS.find((opt) => opt.value === value);

  return (
    <div className={styles.container}>
      <div
        role="radiogroup"
        aria-label={t.resolutionLabel}
        className={styles.radioGroup}
      >
        {RESOLUTION_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              role="radio"
              aria-checked={isSelected}
              className={`${styles.radioButton} ${isSelected ? styles.radioButtonSelected : ""}`}
              onClick={() => onChange(option.value)}
              type="button"
            >
              {option.label ?? t.resolutionNormal}
            </button>
          );
        })}
      </div>
      <div className={styles.meta}>
        {value === 2 && <p className={styles.hint}>{t.hint2x}</p>}
        {value === 4 && <p className={styles.warning}>{t.warning4x}</p>}
        {selectedOption && (
          <p className={styles.fileSize}>
            {formatMessage(t.fileSize, { n: selectedOption.sizeKb })}
          </p>
        )}
      </div>
    </div>
  );
}
