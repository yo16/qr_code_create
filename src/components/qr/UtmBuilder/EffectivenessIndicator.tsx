"use client";

import { formatMessage } from "@/i18n/format";
import { useDict } from "@/i18n/useDict";
import styles from "./UtmBuilder.module.css";

interface EffectivenessIndicatorProps {
  utmCount: number; // 0-5
}

// UTM数 → 星の数（設計仕様: 0→1, 1→2, 2→3, 3→4, 4-5→5）
const STAR_MAP = [1, 2, 3, 4, 5, 5] as const;
// UTM数 → 辞書のキー（表示文言は辞書の utm.effectiveness）
const LEVEL_KEYS = ["low", "low", "normal", "high", "highest", "highest"] as const;
const MESSAGE_KEYS = [
  "none",
  "basic",
  "better",
  "detailed",
  "perfect",
  "perfect",
] as const;

export function EffectivenessIndicator({
  utmCount,
}: EffectivenessIndicatorProps) {
  const t = useDict().utm.effectiveness;
  const clamped = Math.max(0, Math.min(5, utmCount));
  const starCount = STAR_MAP[clamped];
  const label = t.levels[LEVEL_KEYS[clamped]];
  const message = t.messages[MESSAGE_KEYS[clamped]];
  const levelText = formatMessage(t.label, { level: label });

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
      aria-label={levelText}
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
      <span className={styles.effectivenessLabel}>{levelText}</span>
      <span className={styles.effectivenessMessage}>{message}</span>
    </div>
  );
}
