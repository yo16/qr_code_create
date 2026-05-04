import type { Metadata } from "next";
import Link from "next/link";
import { getAllGuides } from "@/lib/content/getAllGuides";
import { Breadcrumb } from "@/components/layout/Breadcrumb/Breadcrumb";
import { buildMetadata, PAGE_METADATA } from "@/lib/metadata/buildMetadata";
import styles from "./guide-index.module.css";

export const metadata: Metadata = buildMetadata(PAGE_METADATA.guide);

export default function GuideIndexPage() {
  const guides = getAllGuides();

  return (
    <div className={styles.container}>
      <Breadcrumb items={[{ label: "使い方ガイド" }]} />
      <header className={styles.header}>
        <h1 className={styles.title}>使い方ガイド</h1>
        <p className={styles.description}>
          QR Code Createの使い方やQRコードの活用方法を、初心者にもわかりやすく解説するガイド集です。
        </p>
      </header>
      <div className={styles.grid}>
        {guides.map((guide) => (
          <Link key={guide.slug} href={`/guide/${guide.slug}`} className={styles.card}>
            <p className={styles.cardTitle}>{guide.title}</p>
            <p className={styles.cardDescription}>{guide.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
