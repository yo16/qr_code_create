import { PosterEditorLoader } from "./PosterEditorLoader";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata } from "@/lib/metadata/buildMetadata";
import { buildWebApplicationSchema } from "@/lib/schema/buildJsonLd";
import { buildBreadcrumbSchema } from "@/lib/schema/buildJsonLd";
import styles from "./page.module.css";

export const metadata = buildMetadata({
  title: "印刷用QRコードポスター作成 | A4で4枚同時印刷 - QR Code Create",
  description:
    "QRコードと説明文を組み合わせたA4ポスターを無料作成。1枚のA4用紙に4枚分のQRコードを配置し、PDFでダウンロードできます。チラシ・店舗POP・案内ポスターに最適。",
  path: "/poster",
});

const posterAppSchema = {
  ...buildWebApplicationSchema(),
  name: "QR Code Create - 印刷用ポスター作成",
  url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp"}/poster`,
  description:
    "QRコードと説明文を組み合わせたA4ポスターを無料作成。1枚のA4用紙に4枚分を配置してPDF出力。",
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: "ホーム", url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp" },
  {
    name: "印刷用ポスター作成",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp"}/poster`,
  },
]);

export default function PosterPage() {
  return (
    <main className={styles.main}>
      <JsonLd data={posterAppSchema} />
      <JsonLd data={breadcrumbSchema} />
      <h1 className={styles.heading}>印刷用QRコードポスター作成</h1>
      <p className={styles.description}>
        QRコードと説明文を組み合わせたA4ポスターを作成できます。
        1枚のA4用紙に4枚分のQRコードを配置してPDFでダウンロードできます。
      </p>
      <PosterEditorLoader />
    </main>
  );
}
