import { RootShell } from "@/components/layout/RootShell/RootShell";
import { rootMetadataJa } from "@/lib/metadata/rootMetadata";

export const metadata = rootMetadataJa;

export default function JaRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RootShell locale="ja">{children}</RootShell>;
}
