"use client";

import styles from "./ResolutionSelector.module.css";

export type Resolution = 1 | 2 | 4;

interface ResolutionOption {
  value: Resolution;
  label: string;
  sizeKb: number;
}

const RESOLUTION_OPTIONS: ResolutionOption[] = [
  { value: 1, label: "通常", sizeKb: 20 },
  { value: 2, label: "2x", sizeKb: 80 },
  { value: 4, label: "4x", sizeKb: 300 },
];

interface ResolutionSelectorProps {
  value: Resolution;
  onChange: (resolution: Resolution) => void;
}

export function ResolutionSelector({ value, onChange }: ResolutionSelectorProps) {
  const selectedOption = RESOLUTION_OPTIONS.find((opt) => opt.value === value);

  return (
    <div className={styles.container}>
      <div
        role="radiogroup"
        aria-label="出力解像度"
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
              {option.label}
            </button>
          );
        })}
      </div>
      <div className={styles.meta}>
        {value === 2 && (
          <p className={styles.hint}>印刷向け（推奨）</p>
        )}
        {value === 4 && (
          <p className={styles.warning}>高品質。ファイルサイズが大きくなります</p>
        )}
        {selectedOption && (
          <p className={styles.fileSize}>約{selectedOption.sizeKb}KB</p>
        )}
      </div>
    </div>
  );
}
