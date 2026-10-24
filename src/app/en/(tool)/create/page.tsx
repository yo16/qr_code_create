import { CreatePageView } from "@/components/pages/CreatePageView/CreatePageView";
import { buildMetadata, PAGE_METADATA_EN } from "@/lib/metadata/buildMetadata";

export const metadata = buildMetadata(PAGE_METADATA_EN.create, "en");

export default function EnCreatePage() {
  return <CreatePageView locale="en" />;
}
