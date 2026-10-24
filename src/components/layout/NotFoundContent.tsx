import Link from "next/link";
import { getDict } from "@/i18n/getDict";

interface NotFoundContentProps {
  locale: "ja" | "en";
}

// en は T3 で en.ts の common.notFound に移すまで、ここに残す
const EN_COPY = {
  title: "Page not found",
  body: "The page you are looking for does not exist or may have been moved.",
  link: "Back to the home page",
  href: "/en",
} as const;

export function NotFoundContent({ locale }: NotFoundContentProps) {
  const copy =
    locale === "en"
      ? EN_COPY
      : { ...getDict("ja").common.notFound, href: "/" };
  return (
    <main>
      <h1>{copy.title}</h1>
      <p>{copy.body}</p>
      <p>
        <Link href={copy.href}>{copy.link}</Link>
      </p>
    </main>
  );
}
