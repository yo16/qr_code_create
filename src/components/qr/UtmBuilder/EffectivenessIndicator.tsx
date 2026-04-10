import styles from "./UtmBuilder.module.css";

interface EffectivenessIndicatorProps {
  utmCount: number; // 0-5
}

// UTM数 → 星の数（設計仕様: 0→1, 1→2, 2→3, 3→4, 4-5→5）
const STAR_MAP = [1, 2, 3, 4, 5, 5] as const;
const LEVEL_LABELS = ["低", "低", "普通", "高", "最高", "最高"] as const;
const LEVEL_MESSAGES = [
  "マーケティング効果の測定ができません",
  "基本的なトラッキングが可能です",
  "効果測定の精度が上がります",
  "Google Analyticsで詳細な分析が可能です",
  "完璧なトラッキング設定です！",
  "完璧なトラッキング設定です！",
] as const;

export function EffectivenessIndicator({
  utmCount,
}: EffectivenessIndicatorProps) {
  const clamped = Math.max(0, Math.min(5, utmCount));
  const starCount = STAR_MAP[clamped];
  const label = LEVEL_LABELS[clamped];
  const message = LEVEL_MESSAGES[clamped];

  const colorClass =
    clamped <= 1
      ? styles.effectivenessError
      : clamped === 2
        ? styles.effectivenessWarning
        : styles.effectivenessSuccess;

  return (
    <div
      className={[styles.effectiveness, colorClass].join(" ")}
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={5}
      aria-label={`マーケティング効果度: ${label}`}
    >
      <span className={styles.effectivenessStars} aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={i < starCount ? styles.starFilled : styles.starEmpty}
          >
            ★
          </span>
        ))}
      </span>
      <span className={styles.effectivenessLabel}>
        マーケティング効果度: {label}
      </span>
      <span className={styles.effectivenessMessage}>{message}</span>
    </div>
  );
}
