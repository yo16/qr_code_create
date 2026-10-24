import Link from "next/link";

interface NotFoundContentProps {
  locale: "ja" | "en";
}

const COPY = {
  ja: {
    title: "ページが見つかりません",
    body: "お探しのページは存在しないか、移動した可能性があります。",
    link: "トップページへ戻る",
    href: "/",
  },
  en: {
    title: "Page not found",
    body: "The page you are looking for does not exist or may have been moved.",
    link: "Back to the home page",
    href: "/en",
  },
} as const;

export function NotFoundContent({ locale }: NotFoundContentProps) {
  const copy = COPY[locale];
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
