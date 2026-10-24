import { TrackedLink } from "@/components/analytics/TrackedLink";
import { Button } from "@/components/ui/Button/Button";
import { Container } from "@/components/layout/Container/Container";
import { getDict } from "@/i18n/getDict";
import type { Locale } from "@/i18n/types";
import { localePath } from "@/lib/i18n/routes";
import styles from "./CtaSection.module.css";

interface CtaSectionProps {
  locale?: Locale;
}

export function CtaSection({ locale = "ja" }: CtaSectionProps = {}) {
  const { cta } = getDict(locale).home;
  return (
    <section className={styles.cta} aria-labelledby="cta-heading">
      <Container>
        <div className={styles.inner}>
          <div className={styles.text}>
            <h2 id="cta-heading" className={styles.heading}>
              {cta.heading}
            </h2>
            <p className={styles.description}>{cta.description}</p>
          </div>
          <TrackedLink
            href={localePath(locale, "/create")}
            className={styles.action}
            location="top_bottom"
            buttonText={cta.button}
          >
            <Button variant="primary" size="lg">
              {cta.button}
            </Button>
          </TrackedLink>
        </div>
      </Container>
    </section>
  );
}
