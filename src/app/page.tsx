import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>QR Code Create</h1>
      <p className={styles.description}>
        UTMパラメータ付きQRコードを無料で生成
      </p>
    </main>
  );
}
