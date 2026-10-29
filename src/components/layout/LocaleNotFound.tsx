"use client";

import Link from "next/link";
import { useDict, useLocale } from "@/i18n/useDict";
import { localePath } from "@/lib/i18n/routes";

/** [locale]/not-found.tsx 用。params を受け取れないので、I18nProvider から言語と文言を引く */
export function LocaleNotFound() {
  const locale = useLocale();
  const copy = useDict().common.notFound;
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
