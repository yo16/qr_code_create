import Link from "next/link";
import { Button } from "@/components/ui/Button/Button";
import { Container } from "@/components/layout/Container/Container";
import styles from "./CtaSection.module.css";

export function CtaSection() {
  return (
    <section className={styles.cta} aria-labelledby="cta-heading">
      <Container>
        <div className={styles.inner}>
          <h2 id="cta-heading" className={styles.heading}>
            今すぐマーケティング効果UP
          </h2>
          <p className={styles.description}>
            UTMパラメータ付きQRコードで、オフライン広告の効果も追跡できます。
          </p>
          <Link href="/create">
            <Button variant="primary" size="lg">
              無料でQRコードを作成する
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}
