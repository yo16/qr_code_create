import type { Metadata } from "next";
import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { FAQ_ITEMS } from "@/components/faq/faqData";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildFaqSchema } from "@/lib/schema/buildJsonLd";
import { buildMetadata, PAGE_METADATA } from "@/lib/metadata/buildMetadata";
import styles from "./faq.module.css";

export const metadata: Metadata = buildMetadata(PAGE_METADATA.faq);

export default function FaqPage() {
  const schema = buildFaqSchema(
    FAQ_ITEMS.map((item) => ({ question: item.question, answer: item.answer }))
  );

  return (
    <main className={styles.main}>
      <JsonLd data={schema} />
      <h1 className={styles.title}>よくある質問</h1>
      <FaqAccordion items={FAQ_ITEMS} />
    </main>
  );
}
