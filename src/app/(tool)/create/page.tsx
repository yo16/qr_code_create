import { QrGeneratorLoader } from "./QrGeneratorLoader";
import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "QRコード生成",
  description:
    "UTMパラメータ付きQRコードを無料で生成。装飾フレームやロゴ埋め込みでマーケティング効果を最大化。",
};

export default function CreatePage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>QRコード生成</h1>
      <QrGeneratorLoader />
    </main>
  );
}
