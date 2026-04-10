const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-code-create.vercel.app";

export function buildWebApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "QR Code Create",
    description:
      "UTMパラメータガイダンス付きの無料QRコード生成ツール。装飾フレームでQRコードをカスタマイズできます。登録不要。",
    url: `${SITE_URL}/create`,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "JPY",
    },
    featureList: [
      "QRコード生成",
      "UTMパラメータガイダンス",
      "装飾フレーム（エレガント・ポップ・ビジネス）",
      "ロゴ埋め込み",
      "色カスタマイズ",
      "PNG/SVG/PDF出力",
    ],
    inLanguage: "ja",
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

export function buildHowToSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "UTMパラメータ付きQRコードの作り方",
    description:
      "UTMパラメータを設定したQRコードを無料で作成する手順を解説します。",
    totalTime: "PT3M",
    tool: {
      "@type": "HowToTool",
      name: "QR Code Create",
    },
    step: [
      {
        "@type": "HowToStep",
        name: "URLを入力する",
        text: "QRコードにしたいWebページのURLを入力します。",
        url: `${SITE_URL}/create#step1`,
      },
      {
        "@type": "HowToStep",
        name: "UTMパラメータを設定する",
        text: "utm_source、utm_medium、utm_campaignを設定します。ガイダンスに従って入力すれば、Google Analyticsでの効果測定が可能になります。",
        url: `${SITE_URL}/create#step2`,
      },
      {
        "@type": "HowToStep",
        name: "装飾をカスタマイズする",
        text: "装飾フレームの選択、色の変更、ロゴの追加、キャプションの設定など、デザインをカスタマイズします。",
        url: `${SITE_URL}/create#step3`,
      },
      {
        "@type": "HowToStep",
        name: "QRコードを生成・ダウンロードする",
        text: "プレビューを確認し、PNG・SVG・PDFのいずれかの形式でQRコードをダウンロードします。",
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

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "QR Code Create",
    url: SITE_URL,
    description: "UTMパラメータガイダンス付きの無料QRコード生成ツール",
  };
}

export function buildBlogPostingSchema(post: {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  dateModified?: string;
}) {
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
      "@id": `${SITE_URL}/guide/${post.slug}`,
    },
    inLanguage: "ja",
  };
}
