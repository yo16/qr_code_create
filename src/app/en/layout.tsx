import { RootShell } from "@/components/layout/RootShell/RootShell";
import { rootMetadataEn } from "@/lib/metadata/rootMetadata";

export const metadata = rootMetadataEn;

export default function EnRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RootShell locale="en">{children}</RootShell>;
}
