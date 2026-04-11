import type { Metadata } from "next";
import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { FAQ_ITEMS } from "@/components/faq/faqData";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildFaqSchema } from "@/lib/schema/buildJsonLd";
import { buildMetadata, PAGE_METADATA } from "@/lib/metadata/buildMetadata";

export const metadata: Metadata = buildMetadata(PAGE_METADATA.faq);

export default function FaqPage() {
  const schema = buildFaqSchema(
    FAQ_ITEMS.map((item) => ({ question: item.question, answer: item.answer }))
  );

  return (
    <main>
      <JsonLd data={schema} />
      <h1>よくある質問</h1>
      <FaqAccordion items={FAQ_ITEMS} />
    </main>
  );
}
