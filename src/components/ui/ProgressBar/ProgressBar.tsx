import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const completionPercent =
    total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;

  const defaultLabel = `ステップ ${current}/${total}`;
  const displayLabel = label ?? defaultLabel;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.stepLabel}>{displayLabel}</span>
        <span className={styles.percent}>{Math.round(completionPercent)}%</span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={Math.round(completionPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={displayLabel}
      >
        <div
          className={styles.bar}
          style={{ width: `${completionPercent}%` }}
        />
      </div>
    </div>
  );
}
