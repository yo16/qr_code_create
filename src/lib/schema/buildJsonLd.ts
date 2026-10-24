import { getDict } from "@/i18n/getDict";
import type { Locale } from "@/i18n/types";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";

export function buildWebApplicationSchema(locale: Locale = "ja") {
  const schema = getDict(locale).schema;
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "QR Code Create",
    description: schema.webApplication.description,
    url: `${SITE_URL}${locale === "en" ? "/en" : ""}/create`,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: locale === "en" ? "USD" : "JPY",
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

export function buildHowToSchema(options?: {
  name: string;
  description: string;
  steps: { name: string; text: string; url?: string }[];
  totalTime?: string;
}, locale: Locale = "ja") {
  const howTo = getDict(locale).schema.howTo;
  if (options) {
    return {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: options.name,
      description: options.description,
      totalTime: options.totalTime ?? "PT3M",
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
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: howTo.name,
    description: howTo.description,
    totalTime: "PT3M",
    tool: {
      "@type": "HowToTool",
      name: "QR Code Create",
    },
    step: [
      {
        "@type": "HowToStep",
        name: howTo.steps[0].name,
        text: howTo.steps[0].text,
        url: `${SITE_URL}/create#step1`,
      },
      {
        "@type": "HowToStep",
        name: howTo.steps[1].name,
        text: howTo.steps[1].text,
        url: `${SITE_URL}/create#step2`,
      },
      {
        "@type": "HowToStep",
        name: howTo.steps[2].name,
        text: howTo.steps[2].text,
        url: `${SITE_URL}/create#step3`,
      },
      {
        "@type": "HowToStep",
        name: howTo.steps[3].name,
        text: howTo.steps[3].text,
        url: `${SITE_URL}/create#step4`,
      },
    ],
  };
}

export function buildBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
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
    name: "QR Code Create",
    url: SITE_URL,
    description: getDict(locale).schema.organization.description,
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
