import Image from "next/image";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { Button } from "@/components/ui/Button/Button";
import { Container } from "@/components/layout/Container/Container";
import styles from "./HeroSection.module.css";

export function HeroSection() {
  return (
    <section className={styles.hero}>
      <Container>
        <div className={styles.inner}>
          <div className={styles.text}>
            <h1 className={styles.heading}>
              UTMパラメータ付きQRコードを
              <br />
              無料で作成
            </h1>
            <p className={styles.description}>
              URLを入れるだけで、Google Analyticsで読み取りを計測できるQRコードができます。チラシ、ポスター、名刺と、置き場所ごとに分けて数えられます。
            </p>
            <div className={styles.actions}>
              <TrackedLink
                href="/create"
                location="hero"
                buttonText="無料でQRコードを作成"
              >
                <Button variant="primary" size="lg">
                  無料でQRコードを作成
                </Button>
              </TrackedLink>
              <TrackedLink
                href="/guide"
                location="hero"
                buttonText="使い方を見る"
              >
                <Button variant="secondary" size="lg">
                  使い方を見る
                </Button>
              </TrackedLink>
            </div>
            <p className={styles.note}>
              完全無料・登録不要。PNG、SVG、PDFでダウンロードできます。
            </p>
          </div>

          <figure className={styles.specimen}>
            <Image
              className={styles.qr}
              src="/hero-qr.svg"
              alt="qr-create.jp のトップページを指すQRコード"
              width={200}
              height={200}
              unoptimized
              priority
            />
            <figcaption className={styles.caption}>
              <span className={styles.captionLead}>
                このQRコードは、次のURLを指しています。
              </span>
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
