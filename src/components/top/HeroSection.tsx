import Link from "next/link";
import { Button } from "@/components/ui/Button/Button";
import { Container } from "@/components/layout/Container/Container";
import styles from "./HeroSection.module.css";

export function HeroSection() {
  return (
    <section className={styles.hero}>
      <Container>
        <div className={styles.inner}>
          <h1 className={styles.heading}>
            UTMパラメータ付きQRコードを
            <br />
            無料で作成
          </h1>
          <p className={styles.description}>
            マーケティング効果の測定を忘れずに。装飾フレームでブランディングも完璧。
          </p>
          <div className={styles.actions}>
            <Link href="/create">
              <Button variant="primary" size="lg">
                無料でQRコードを作成
              </Button>
            </Link>
            <Link href="/guide">
              <Button variant="secondary" size="lg">
                使い方を見る
              </Button>
            </Link>
          </div>
          <p className={styles.badge}>完全無料・登録不要・3分で完成</p>
        </div>
      </Container>
    </section>
  );
}
