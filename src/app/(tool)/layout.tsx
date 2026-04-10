import { Container } from "@/components/layout/Container/Container";

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Container size="wide">{children}</Container>;
}
