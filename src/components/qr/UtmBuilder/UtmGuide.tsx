import { UTM_USAGE_EXAMPLES } from "@/lib/constants/utmPresets";
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
  return (
    <div className={styles.usageExamples}>
      <p className={styles.usageExamplesLabel}>用途別設定例:</p>
      <div className={styles.usageExampleButtons}>
        {UTM_USAGE_EXAMPLES.map((example) => (
          <button
            key={example.label}
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
