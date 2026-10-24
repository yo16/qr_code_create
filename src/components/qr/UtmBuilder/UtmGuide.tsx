"use client";

import { buildUtmUsageExamples } from "@/lib/constants/utmPresets";
import { useDict } from "@/i18n/useDict";
import styles from "./UtmBuilder.module.css";

interface UtmGuideProps {
  currentSource: string;
  onApplyExample: (example: {
    source: string;
    medium: string;
    campaign: string;
  }) => void;
}

export function UtmGuide({ currentSource, onApplyExample }: UtmGuideProps) {
  const { utm } = useDict();
  const examples = buildUtmUsageExamples(utm);
  return (
    <div className={styles.usageExamples}>
      <p className={styles.usageExamplesLabel}>{utm.usageExamplesLabel}</p>
      <div className={styles.usageExampleButtons}>
        {examples.map((example) => (
          <button
            key={example.source}
            type="button"
            className={[
              styles.exampleButton,
              currentSource === example.source ? styles.exampleButtonActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onApplyExample(example)}
          >
            {example.label}
          </button>
        ))}
      </div>
    </div>
  );
}
