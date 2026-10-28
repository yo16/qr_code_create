import { Container } from "@/components/layout/Container/Container";

export default function EnMarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Container>{children}</Container>;
}
