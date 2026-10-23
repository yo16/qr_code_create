import { Container } from "@/components/layout/Container/Container";
import styles from "./FeaturesSection.module.css";

const FEATURES = [
  {
    title: "UTMパラメータガイダンス",
    description:
      "utm_source や utm_medium に何を書けばよいか、入力欄ごとに例が出ます。用途別の設定例を見ながら、Google Analyticsで集計できる形のURLを組み立てられます。",
  },
  {
    title: "装飾フレーム",
    description:
      "シンプル、ビジネス、エレガント、ポップなどのフレームに、色、ロゴ、キャプションを組み合わせられます。チラシやポスターにそのまま置ける形で書き出せます。",
  },
  {
    title: "完全無料・登録不要",
    description:
      "アカウントもメールアドレスも要りません。QRコードはお使いのブラウザの中で作られ、画像やURLがこのサイトに保存されることはありません。",
  },
  {
    title: "PNG/SVG/PDF対応",
    description:
      "WebやスライドにはPNG、拡大しても粗くならない印刷用にはSVGかPDF。PNGは用途に合わせて解像度を選べます。",
  },
] as const;

export function FeaturesSection() {
  return (
    <section className={styles.features} aria-labelledby="features-heading">
      <Container>
        <div className={styles.inner}>
          <h2 id="features-heading" className={styles.heading}>
            できること
          </h2>
          <ul className={styles.list} role="list">
            {FEATURES.map((feature) => (
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
