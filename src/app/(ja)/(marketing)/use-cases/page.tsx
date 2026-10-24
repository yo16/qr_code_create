import type { Metadata } from "next";
import Link from "next/link";
import { getAllUseCases } from "@/lib/content/getAllUseCases";
import { Breadcrumb } from "@/components/layout/Breadcrumb/Breadcrumb";
import { buildMetadata, PAGE_METADATA } from "@/lib/metadata/buildMetadata";
import styles from "./use-cases-index.module.css";

export const metadata: Metadata = buildMetadata(PAGE_METADATA.useCases);

export default function UseCasesIndexPage() {
  const useCases = getAllUseCases();

  return (
    <div className={styles.container}>
      <Breadcrumb items={[{ label: "用途別QRコード" }]} />
      <header className={styles.header}>
        <h1 className={styles.title}>用途別QRコード</h1>
        <p className={styles.description}>
          名刺・チラシ・ポスターなど、用途に合わせたQRコードの作り方と活用方法を紹介します。推奨UTM設定やおすすめデザインも解説しています。
        </p>
      </header>
      <div className={styles.grid}>
        {useCases.map((useCase) => (
          <Link key={useCase.slug} href={`/use-cases/${useCase.slug}`} className={styles.card}>
            <p className={styles.cardTitle}>{useCase.title}</p>
            <p className={styles.cardDescription}>{useCase.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
