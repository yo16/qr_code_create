import { getDict } from "@/i18n/getDict";
import type { Locale } from "@/i18n/types";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildWebApplicationSchema } from "@/lib/schema/buildJsonLd";
import { QrGeneratorLoader } from "./QrGeneratorLoader";
import styles from "./page.module.css";

interface CreatePageViewProps {
  locale: Locale;
}

export function CreatePageView({ locale }: CreatePageViewProps) {
  return (
    <main className={styles.main}>
      <JsonLd data={buildWebApplicationSchema(locale)} />
      <h1 className={styles.heading}>{getDict(locale).tool.pageHeading}</h1>
      <QrGeneratorLoader />
    </main>
  );
}
