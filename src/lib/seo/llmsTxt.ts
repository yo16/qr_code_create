import { getGuide, getGuideSlugList } from "@/lib/content/getGuide";
import { getUseCase, getUseCaseSlugList } from "@/lib/content/getUseCase";
import { getBlog, getBlogSlugList } from "@/lib/content/getBlog";
import { isIndexedPath } from "@/lib/seo/indexable";
import { NON_JA_LOCALES } from "@/i18n/locales";
import { LOCALE_CONFIG } from "@/lib/i18n/localeConfig";
import { localePath } from "@/lib/i18n/routes";
import { FEATURE_FLAGS } from "@/lib/constants/features";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";

// ja 側のパス → ページ名。Pages 節と Other languages 節で共通に使う（ここだけに持つ）
const PAGE_NAMES: Record<string, string> = {
  "/": "Top page",
  "/create": "QR code generator",
  "/guide/getting-started": "Getting started",
};

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function entry(title: string, path: string, description?: string): string {
  const desc = description ? oneLine(description) : "";
  // ja トップは canonical・sitemap と同じく末尾スラッシュなし（SITE_URL そのもの）
  const url = path === "/" ? SITE_URL : `${SITE_URL}${path}`;
  return `- [${oneLine(title)}](${url})${desc ? `: ${desc}` : ""}`;
}

export function buildLlmsTxt(): string {
  const lines: string[] = [];
  const push = (...items: string[]) => lines.push(...items);

  push(
    "# QR Code Create",
    "",
    "> QR Code Create is a free QR code generator made for Japanese users. No registration is required and there are no ads. It supports UTM parameters so you can measure access separately for each printed material.",
    "",
    `The site URL is ${SITE_URL}`,
    "",
    "## Features",
    "- QR code generation (instant from URL input)",
    "- UTM parameter setup guidance (step-by-step)",
    "- UTM presets for flyer, poster, business card, brochure, banner, receipt, product package, menu, signage",
    "- Decorative frame presets (5 types: Simple, Business, Casual, Elegant, Pop)",
    "- Logo embedding",
    "- Color customization (foreground/background)",
    "- Caption text",
    "- PNG/SVG/PDF export",
  );
  if (FEATURE_FLAGS.posterPage) {
    push("- Poster maker (A4 PDF, 4 QR code cards per sheet, for printing)");
  }
  push(
    "",
    "## Target Users",
    "Japanese small business owners, event organizers, marketers",
    "",
    "## Key Differentiator",
    "- Free, no registration required",
    "- UTM parameter guidance to prevent forgetting tracking parameters",
    "- Decorative frames to customize QR code appearance",
    "- Marketing education content included",
    "",
    "## Language",
    `Japanese (ja) is the main language and has every page. ${NON_JA_LOCALES.join(", ")} have only three pages: the top page, /create (the generator), and /guide/getting-started. Guides, use cases, the blog, and the FAQ are in Japanese only.`,
    "",
  );

  const mainPages: Array<[string, string, string]> = [
    [PAGE_NAMES["/"], "/", "Overview of the service"],
    [PAGE_NAMES["/create"], "/create", "The tool itself"],
  ];
  if (FEATURE_FLAGS.posterPage) {
    mainPages.push(["Poster maker", "/poster", "A4 PDF, 4 cards per sheet"]);
  }
  mainPages.push(
    ["Guide index", "/guide", "How to use the tool and UTM parameters"],
    ["Use cases", "/use-cases", "QR codes by use case (flyer, poster, business card, menu, signage, receipt, product package, store, event)"],
    ["Blog", "/blog", "Articles on QR code marketing"],
    ["FAQ", "/faq", "Frequently asked questions"],
    ["Contact", "/contact", "How to contact the operator"],
  );
  push("## Pages");
  for (const [title, path, description] of mainPages) {
    if (isIndexedPath(path)) push(entry(title, path, description));
  }
  push("");

  // 各言語のページは sitemap と同じく、トップ・/create・getGuideSlugList(locale) から作る
  push("## Other languages");
  for (const locale of NON_JA_LOCALES) {
    const { nativeName } = LOCALE_CONFIG[locale];
    const localePages: Array<{ jaPath: string; name: string }> = [
      { jaPath: "/", name: PAGE_NAMES["/"] },
      { jaPath: "/create", name: PAGE_NAMES["/create"] },
      ...getGuideSlugList(locale).map((slug) => ({
        jaPath: `/guide/${slug}`,
        name: PAGE_NAMES[`/guide/${slug}`] ?? getGuide(slug, locale)?.title ?? slug,
      })),
    ];
    for (const { jaPath, name } of localePages) {
      if (!isIndexedPath(jaPath)) continue;
      push(entry(`${nativeName}: ${name}`, localePath(locale, jaPath)));
    }
  }
  push("");

  push("## Guides (Japanese)");
  for (const slug of getGuideSlugList()) {
    const guide = getGuide(slug);
    if (guide) push(entry(guide.title, `/guide/${slug}`, guide.description));
  }
  push("");

  push("## Use cases (Japanese)");
  for (const slug of getUseCaseSlugList()) {
    const useCase = getUseCase(slug);
    if (useCase) push(entry(useCase.title, `/use-cases/${slug}`, useCase.description));
  }
  push("");

  push("## Blog (Japanese)");
  for (const slug of getBlogSlugList()) {
    const blog = getBlog(slug);
    if (blog) push(entry(blog.title, `/blog/${slug}`, blog.description));
  }
  push("");

  return lines.join("\n");
}

