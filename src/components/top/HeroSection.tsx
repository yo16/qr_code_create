import Image from "next/image";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { Button } from "@/components/ui/Button/Button";
import { Container } from "@/components/layout/Container/Container";
import { getDict } from "@/i18n/getDict";
import type { Locale } from "@/i18n/types";
import styles from "./HeroSection.module.css";

interface HeroSectionProps {
  locale?: Locale;
}

export function HeroSection({ locale = "ja" }: HeroSectionProps = {}) {
  const { hero } = getDict(locale).home;
  return (
    <section className={styles.hero}>
      <Container>
        <div className={styles.inner}>
          <div className={styles.text}>
            <h1 className={styles.heading}>
              {hero.headingLine1}
              <br />
              {hero.headingLine2}
            </h1>
            <p className={styles.description}>{hero.description}</p>
            <div className={styles.actions}>
              <TrackedLink
                href="/create"
                location="hero"
                buttonText={hero.primaryCta}
              >
                <Button variant="primary" size="lg">
                  {hero.primaryCta}
                </Button>
              </TrackedLink>
              <TrackedLink
                href="/guide"
                location="hero"
                buttonText={hero.secondaryCta}
              >
                <Button variant="secondary" size="lg">
                  {hero.secondaryCta}
                </Button>
              </TrackedLink>
            </div>
            <p className={styles.note}>{hero.note}</p>
          </div>

          <figure className={styles.specimen}>
            <Image
              className={styles.qr}
              src="/hero-qr.svg"
              alt={hero.qrAlt}
              width={200}
              height={200}
              unoptimized
              priority
            />
            <figcaption className={styles.caption}>
              <span className={styles.captionLead}>{hero.captionLead}</span>
              <span className={styles.url}>
                <span className={styles.urlLine}>https://qr-create.jp/</span>
                <span className={styles.urlLine}>?utm_source=qr-create</span>
                <span className={styles.urlLine}>&amp;utm_medium=qr</span>
                <span className={styles.urlLine}>&amp;utm_campaign=hero</span>
              </span>
            </figcaption>
          </figure>
        </div>
      </Container>
    </section>
  );
}
