import { Container } from "@/components/layout/Container/Container";
import styles from "./FeaturesSection.module.css";

const FEATURES = [
  {
    icon: "📊",
    title: "UTMパラメータガイダンス",
    description:
      "マーケティング効果測定の必須項目を初心者にもわかりやすくガイド。Google Analyticsでの効果測定がすぐに始められます。",
  },
  {
    icon: "🎨",
    title: "装飾フレーム",
    description:
      "シンプル/ビジネス/エレガント/ポップ等、用途に応じたデザインフレームを選択してブランドイメージを高められます。",
  },
  {
    icon: "🆓",
    title: "完全無料・登録不要",
    description:
      "アカウント登録なしで即座に利用可能。面倒なサインアップ手続きは一切不要で、今すぐQRコードを作成できます。",
  },
  {
    icon: "📥",
    title: "PNG/SVG/PDF対応",
    description:
      "印刷・Web・プレゼン資料、用途に合わせた形式で出力。高解像度設定で印刷物にも鮮明に使用できます。",
  },
] as const;

export function FeaturesSection() {
  return (
    <section className={styles.features} aria-labelledby="features-heading">
      <Container>
        <h2 id="features-heading" className={styles.heading}>
          選ばれる理由
        </h2>
        <ul className={styles.grid} role="list">
          {FEATURES.map((feature) => (
            <li key={feature.title} className={styles.card}>
              <span className={styles.icon} aria-hidden="true">
                {feature.icon}
              </span>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardDescription}>{feature.description}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
