import { Container } from "@/components/layout/Container/Container";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Container>{children}</Container>;
}
