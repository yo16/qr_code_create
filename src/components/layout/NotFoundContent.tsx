import Link from "next/link";
import { getDict } from "@/i18n/getDict";
import { localePath } from "@/lib/i18n/routes";
import type { Locale } from "@/i18n/types";

interface NotFoundContentProps {
  locale: Locale;
}

export function NotFoundContent({ locale }: NotFoundContentProps) {
  const copy = getDict(locale).common.notFound;
  return (
    <main>
      <h1>{copy.title}</h1>
      <p>{copy.body}</p>
      <p>
        <Link href={localePath(locale, "/")}>{copy.link}</Link>
      </p>
    </main>
  );
}
