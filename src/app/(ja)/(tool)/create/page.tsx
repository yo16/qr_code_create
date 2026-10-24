import { CreatePageView } from "@/components/pages/CreatePageView/CreatePageView";
import { buildMetadata, PAGE_METADATA } from "@/lib/metadata/buildMetadata";

export const metadata = buildMetadata(PAGE_METADATA.create);

export default function CreatePage() {
  return <CreatePageView locale="ja" />;
}
