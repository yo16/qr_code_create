import { QrGeneratorLoader } from "./QrGeneratorLoader";
import styles from "./page.module.css";
import { buildMetadata, PAGE_METADATA } from "@/lib/metadata/buildMetadata";

export const metadata = buildMetadata(PAGE_METADATA.create);

export default function CreatePage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>QRコード生成</h1>
      <QrGeneratorLoader />
    </main>
  );
}
