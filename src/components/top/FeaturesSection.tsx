import { Container } from "@/components/layout/Container/Container";
import { getDict } from "@/i18n/getDict";
import type { Locale } from "@/i18n/types";
import styles from "./FeaturesSection.module.css";

interface FeaturesSectionProps {
  locale?: Locale;
}

export function FeaturesSection({ locale = "ja" }: FeaturesSectionProps = {}) {
  const { features } = getDict(locale).home;
  return (
    <section className={styles.features} aria-labelledby="features-heading">
      <Container>
        <div className={styles.inner}>
          <h2 id="features-heading" className={styles.heading}>
            {features.heading}
          </h2>
          <ul className={styles.list} role="list">
            {features.items.map((feature) => (
              <li key={feature.title} className={styles.item}>
                <h3 className={styles.itemTitle}>{feature.title}</h3>
                <p className={styles.itemDescription}>{feature.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
