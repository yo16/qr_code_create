import Link from "next/link";
import styles from "./ComingSoonPage.module.css";

interface ComingSoonPageProps {
  title: string;
  description: string;
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <div className={styles.icon} aria-hidden="true">🚧</div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.badge}>準備中</p>
        <p className={styles.description}>{description}</p>
        <p className={styles.note}>
          現在このページは準備中です。コンテンツは順次追加予定です。
          <br />
          先にQRコードを作成したい方は、以下のボタンからツールをご利用いただけます。
        </p>
        <div className={styles.actions}>
          <Link href="/create" className={styles.primaryButton}>
            QRコードを作成する
          </Link>
          <Link href="/" className={styles.secondaryButton}>
            トップに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
