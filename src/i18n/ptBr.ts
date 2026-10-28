/**
 * ブラジルポルトガル語辞書（M4 の下書き: 中身は英語の写し。M7 で翻訳する）。Client スライスは ptBrClient.ts。
 * 文言の方針は doc/design/i18n-en.md 9 節: 短く具体的、sentence case、感嘆符なし、定型の売り文句なし。
 */
import { ptBrClient } from "./ptBrClient";
import type { Dict } from "./types";

export const ptBr: Dict = {
  ...ptBrClient,
  header: {
    nav: {
      home: "Home",
      guide: "Getting started",
      // 英語版が無いので en のヘッダーには出ない（Dict のキーを満たすための文言）
      useCases: "Use cases",
      blog: "Blog",
      faq: "FAQ",
    },
    // common.mobileMenu.cta（ptBrClient.ts）と同じ文言にする
    cta: "Create a QR code",
  },
  footer: {
    privacy: "Privacy policy (Japanese)",
    terms: "Terms of service (Japanese)",
    faq: "FAQ",
    contact: "Contact (Japanese)",
    // /poster の英語版が無いので en のフッターには出ない（Dict のキーを満たすための文言）
    poster: "Poster maker (Japanese)",
    japaneseOnlyNote:
      "Our privacy policy and terms of service are available in Japanese only.",
  },
  home: {
    hero: {
      // 結合すると「Create QR codes with UTM parameters, free」。<br /> で折り返す
      headingLine1: "Create QR codes with ",
      headingLine2: "UTM parameters, free",
      description:
        "Enter a URL, add UTM parameters with guided presets, and download the QR code as PNG, SVG, or PDF. No sign-up.",
      primaryCta: "Create a QR code",
      secondaryCta: "Read the guide",
      note: "Download as PNG, SVG, or PDF. Free.",
      qrAlt: "QR code that points to the qr-create.jp home page",
      captionLead: "This QR code points to the following URL.",
    },
    features: {
      heading: "What you can do",
      items: [
        {
          title: "UTM parameter guidance",
          description:
            "Each field shows examples of what to enter in utm_source and utm_medium. Use the presets by use case to build a URL that Google Analytics can report on.",
        },
        {
          title: "Decorative frames",
          description:
            "Combine a frame such as simple, business, elegant, or pop with colors, a logo, and a caption. Export it ready to place on a flyer or poster.",
        },
        {
          title: "Free, no sign-up",
          description:
            "No account and no email address. The QR code is made in your browser, and your images and URLs are never stored on this site.",
        },
        {
          title: "PNG, SVG, and PDF",
          description:
            "Use PNG for the web and slides, and SVG or PDF for print, where it stays sharp at any size. For PNG you can choose the resolution.",
        },
      ],
    },
    cta: {
      heading: "From URL to download in four steps",
      description:
        "Enter the URL, set the UTM parameters, adjust the design, and download. You are never asked to sign up along the way.",
      button: "Create a QR code",
    },
  },
  guide: {
    breadcrumb: {
      ariaLabel: "Breadcrumb",
      home: "Home",
      guide: "Guide",
    },
  },
  meta: {
    root: {
      title: "QR Code Create - Free QR code generator with UTM parameters",
      description:
        "Create QR codes for free with built-in UTM parameter guidance. Add decorative frames and embed your logo. No sign-up required.",
    },
    pages: {
      home: {
        title: "QR Code Create - Free QR code generator with UTM parameters",
        description:
          "Enter a URL, add UTM parameters with guided presets, and download the QR code as PNG, SVG, or PDF. No sign-up.",
      },
      create: {
        title: "Create a QR code",
        description:
          "Enter a URL, add UTM parameters, pick a frame and colors, and download the QR code for free. Track scans in Google Analytics.",
      },
      faq: {
        title: "FAQ",
        description:
          "Answers to common questions about QR Code Create and setting up UTM parameters.",
      },
      privacy: {
        title: "Privacy policy",
        description: "The privacy policy of QR Code Create.",
      },
      terms: {
        title: "Terms of service",
        description: "The terms of service of QR Code Create.",
      },
      guide: {
        title: "Guide",
        description:
          "Guides on using QR Code Create and getting more out of QR codes.",
      },
      useCases: {
        title: "QR codes by use case",
        description:
          "How to make QR codes for business cards, flyers, posters, and events, with the UTM settings we recommend for each.",
      },
      blog: {
        title: "Blog",
        description:
          "Practical notes on QR code marketing and using UTM parameters.",
      },
    },
  },
  schema: {
    inLanguage: "en",
    webApplication: {
      description:
        "A free QR code generator with UTM parameter guidance. Customize your QR code with decorative frames. No sign-up required.",
      featureList: [
        "QR code generation",
        "UTM parameter guidance",
        "Decorative frames (elegant, pop, business)",
        "Logo embedding",
        "Color customization",
        "PNG, SVG, and PDF export",
      ],
    },
    organization: {
      description: "A free QR code generator with UTM parameter guidance",
    },
    howTo: {
      name: "How to create a QR code with UTM parameters",
      description:
        "Steps to create a QR code with UTM parameters for free.",
      steps: [
        {
          name: "Enter your URL",
          text: "Enter the URL of the web page you want to turn into a QR code.",
        },
        {
          name: "Add UTM parameters",
          text: "Set utm_source, utm_medium, and utm_campaign. Follow the guidance and you can measure results in Google Analytics.",
        },
        {
          name: "Customize the design",
          text: "Choose a decorative frame, change the colors, add a logo, and set a caption.",
        },
        {
          name: "Generate and download the QR code",
          text: "Check the preview, then download the QR code as PNG, SVG, or PDF.",
        },
      ],
    },
  },
};
