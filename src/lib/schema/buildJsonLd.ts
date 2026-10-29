import { getDict } from "@/i18n/getDict";
import type { Locale } from "@/i18n/types";
import { LOCALE_CONFIG } from "@/lib/i18n/localeConfig";
import { localePath } from "@/lib/i18n/routes";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export function buildWebApplicationSchema(locale: Locale = "ja") {
  const schema = getDict(locale).schema;
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "QR Code Create",
    description: schema.webApplication.description,
    url: `${SITE_URL}${localePath(locale, "/create")}`,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: LOCALE_CONFIG[locale].currency,
    },
    featureList: schema.webApplication.featureList,
    inLanguage: schema.inLanguage,
  };
}

export function buildFaqSchema(
  faqs: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildHowToSchema(options: {
  name: string;
  description: string;
  steps: { name: string; text: string; url?: string }[];
  totalTime?: string;
}, locale: Locale = "ja") {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: options.name,
    description: options.description,
    totalTime: options.totalTime ?? "PT3M",
    ...(locale !== "ja" ? { inLanguage: getDict(locale).schema.inLanguage } : {}),
    tool: {
      "@type": "HowToTool",
      name: "QR Code Create",
    },
    step: options.steps.map((step) => ({
      "@type": "HowToStep",
      name: step.name,
      text: step.text,
      ...(step.url ? { url: step.url } : {}),
    })),
  };
}

export function buildBreadcrumbSchema(
  items: { name: string; url: string }[],
  locale: Locale = "ja"
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    ...(locale !== "ja" ? { inLanguage: getDict(locale).schema.inLanguage } : {}),
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildOrganizationSchema(locale: Locale = "ja") {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "QR Code Create",
    url: SITE_URL,
    logo: `${SITE_URL}/brand/mark.svg`,
    description: getDict(locale).schema.organization.description,
  };
}

export function buildWebSiteSchema(locale: Locale = "ja") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}${localePath(locale, "/")}#website`,
    name: "QR Code Create",
    url: `${SITE_URL}${localePath(locale, "/")}`,
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: getDict(locale).schema.inLanguage,
  };
}

export function buildBlogPostingSchema(post: {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  dateModified?: string;
  basePath?: string;
}, locale: Locale = "ja") {
  const path = post.basePath ?? "/guide";
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    author: {
      "@type": "Organization",
      name: "QR Code Create",
    },
    publisher: {
      "@type": "Organization",
      name: "QR Code Create",
    },
    datePublished: post.datePublished,
    dateModified: post.dateModified ?? post.datePublished,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}${path}/${post.slug}`,
    },
    inLanguage: getDict(locale).schema.inLanguage,
  };
}
