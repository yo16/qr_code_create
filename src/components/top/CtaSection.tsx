import { TrackedLink } from "@/components/analytics/TrackedLink";
import { Button } from "@/components/ui/Button/Button";
import { Container } from "@/components/layout/Container/Container";
import styles from "./CtaSection.module.css";

export function CtaSection() {
  return (
    <section className={styles.cta} aria-labelledby="cta-heading">
      <Container>
        <div className={styles.inner}>
          <div className={styles.text}>
            <h2 id="cta-heading" className={styles.heading}>
              URLを入れて、4つの手順でダウンロードまで
            </h2>
            <p className={styles.description}>
              URLの入力、UTMパラメータ、見た目の調整、ダウンロードの順に進みます。途中で登録を求められることはありません。
            </p>
          </div>
          <TrackedLink
            href="/create"
            className={styles.action}
            location="top_bottom"
            buttonText="無料でQRコードを作成する"
          >
            <Button variant="primary" size="lg">
              無料でQRコードを作成する
            </Button>
          </TrackedLink>
        </div>
      </Container>
    </section>
  );
}
