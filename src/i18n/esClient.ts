/**
 * スペイン語辞書の Client スライス（M4 の下書き: 英語の写し）（common / ui / tool / utm / decoration）。
 * jaClient.ts と同じキー構成。型は `satisfies ClientDict` で全キーを要求する。
 * import してよいのは es.ts と getDict.ts だけ（es の文字列を Client バンドルに入れないため）。
 */
import type { ClientDict } from "./types";

export const esClient = {
  common: {
    loading: "Loading",
    // 設計 10.2 の例外: 切り替えラベルだけは自言語名（日本語）で出す
    languageSwitch: {
      label: "日本語",
      hint: " (Japanese)",
      buttonLabel: "Language",
      listLabel: "Choose a language",
    },
    mobileMenu: {
      open: "Open menu",
      close: "Close menu",
      // header.cta（en.ts）と同じ文言にする。MobileNav は Client なので別スライスに置いている
      cta: "Create a QR code",
    },
    notFound: {
      title: "Page not found",
      body: "The page you are looking for does not exist or may have been moved.",
      link: "Back to the home page",
    },
    comingSoon: {
      badge: "Coming soon",
      noteLine1: "This page is not ready yet. Content will be added over time.",
      noteLine2: "If you want to make a QR code first, use the button below.",
      create: "Create a QR code",
      backToTop: "Back to the top",
    },
    articleCta: {
      ariaLabel: "Create a QR code",
      heading: "Try it with the URL from this page",
      defaultText: "Create a QR code",
      note: "Free, no sign-up",
    },
  },
  ui: {
    select: {
      placeholder: "Select an option",
      customOption: "Other (type your own)",
      customPlaceholder: "Type your own value",
      customAria: "{label} (custom value)",
    },
    fileUpload: {
      sizeExceeded: "The file is larger than the {max} KB limit.",
      dropZoneAria: "{label}. Click or drag and drop to choose a file",
      previewAlt: "Preview",
      dropText: "Click or drag and drop",
      accept: "Accepted formats: {accept}",
      maxSize: "Maximum size: {max} KB",
      removeAria: "Remove the selected file",
    },
    colorPicker: {
      pickerAria: "{label} color picker",
      textLabel: "{label} color code",
      textAria: "{label} color code",
    },
    progressBar: {
      defaultLabel: "Step {current} of {total}",
    },
    tabs: {
      listAria: "Tabs",
    },
  },
  tool: {
    pageHeading: "Create a QR code",
    steps: {
      url: { label: "Step 1: Enter your URL", title: "Enter your URL" },
      utm: { label: "Step 2: Add UTM parameters", title: "Add UTM parameters" },
      decoration: {
        label: "Step 3: Customize the design",
        title: "Customize the design",
      },
      download: { label: "Step 4: Download", title: "Download" },
    },
    progress: {
      label: "Progress",
      start: "Enter a URL to start your QR code",
      utm: "Add UTM parameters to track scans in Google Analytics",
      decoration: "Customize the design to fit where you will place it",
      done: "Your QR code is ready",
    },
    urlInput: {
      label: "URL",
      placeholder: "https://example.com",
    },
    validation: {
      invalidUrl: "Enter a valid URL",
    },
    urlPreview: {
      label: "Generated URL",
      copyAria: "Copy the URL to the clipboard",
      copy: "Copy",
      copied: "Copied",
      placeholder: "The URL appears here once you enter one",
      copiedStatus: "URL copied",
    },
    qrPreview: {
      label: "QR code preview",
      ariaGenerated: "Generated QR code",
      ariaPlaceholder: "QR code placeholder",
      placeholder: "Enter a URL to generate a QR code",
      error: "Could not generate the QR code",
      contrastWarning:
        "The contrast between the foreground and background colors is too low (WCAG AA needs 4.5:1 or higher). The QR code may be hard to scan.",
    },
    download: {
      disabledMessage: "Enter a URL to download the QR code",
      resolutionLabel: "Output resolution",
      resolutionNormal: "Standard",
      hint2x: "For print (recommended)",
      warning4x: "High quality. The file is larger",
      fileSize: "About {n} KB",
      pngButton: "Download PNG",
      svgButton: "Download SVG",
      pdfButton: "Download PDF",
      pdfGenerating: "Generating PDF...",
      // en には /poster が無いので画面には出ない。ja と同じキーを満たすための文言
      posterCta: "Make a printable poster",
      posterCtaAria: "Make a printable poster (opens the poster page)",
    },
  },
  utm: {
    title: "UTM parameters",
    toggleLabel: "Add UTM parameters",
    toggleAria: "Add UTM parameters",
    noUtmWarning:
      "Without UTM parameters, you cannot track visits from this QR code in Google Analytics",
    advancedShow: "Show advanced options",
    advancedHide: "Hide advanced options",
    helpButtonAria: "Help for {label}",
    fieldLabels: {
      source: "utm_source (where it appears)",
      medium: "utm_medium (channel)",
      campaign: "utm_campaign (campaign name)",
      term: "utm_term (search keyword)",
      content: "utm_content (content identifier)",
    },
    fieldPlaceholders: {
      campaign: "e.g. spring_sale_2026",
      term: "e.g. qr code generator",
      content: "e.g. banner_top",
    },
    campaignHint: "Include a date or a topic to keep campaigns easy to find",
    fieldHelp: {
      source:
        "Where the QR code appears, such as a flyer, business card, or poster",
      medium:
        "How the code reaches people. For QR codes, \"qr\" is a good choice",
      campaign:
        "The campaign name. Include a date or a topic to keep it easy to find (e.g. spring_sale_2026)",
      term: "The search keyword. Mostly used for search ads, so you can leave it empty for QR codes",
      content:
        "Use it to tell apart several QR codes in one campaign, for example in an A/B test",
    },
    sourceLabels: {
      flyer: "Flyer",
      poster: "Poster",
      business_card: "Business card",
      brochure: "Brochure",
      banner: "Storefront sign",
      receipt: "Receipt",
      product_package: "Product packaging",
      menu: "Menu",
      signage: "In-store sign",
    },
    mediumLabels: {
      qr: "QR code",
      print: "Print",
    },
    usageExamplesLabel: "Examples by use case:",
    usageExampleLabels: {
      business_card: "Printed on a business card",
      flyer: "Printed on a flyer",
      poster: "Posted on a wall",
      signage: "In-store sign",
    },
    effectiveness: {
      label: "Tracking level: {level}",
      levels: {
        low: "Low",
        normal: "Medium",
        high: "High",
        highest: "Highest",
      },
      messages: {
        none: "You cannot measure results yet",
        basic: "Basic tracking is possible",
        better: "Your results will be more accurate",
        detailed: "You can analyze scans in detail in Google Analytics",
        perfect: "Your tracking setup is complete",
      },
    },
  },
  decoration: {
    presetGroupLabel: "Design presets",
    presetItemLabel: "Preset: {name} - {description}",
    presets: {
      simple: {
        name: "Simple",
        description: "Clean black and white",
        caption: "",
      },
      business: {
        name: "Business",
        description: "Calm and trustworthy",
        caption: "Learn more",
      },
      casual: {
        name: "Casual",
        description: "Friendly, natural colors",
        caption: "Scan to visit",
      },
      elegant: {
        name: "Elegant",
        description: "Refined and understated",
        caption: "Scan the code",
      },
      pop: {
        name: "Pop",
        description: "Bright and colorful",
        caption: "Visit now",
      },
    },
    color: {
      fg: "Foreground color",
      bg: "Background color",
      contrastRatio: "Contrast ratio: {ratio}:1",
      ok: "Easy to scan",
      caution: "May be harder to scan",
      warning: "The QR code may not be readable",
      reset: "Reset to default",
    },
    logo: {
      upload: "Upload a logo image",
      alt: "Logo: {fileName}",
      sizeLabel: "Logo size: {percent}%",
      sizeAria: "Adjust logo size",
      remove: "Remove logo",
      removeAria: "Remove logo",
    },
    frame: {
      groupLabel: "Frames: {category}",
      itemLabel: "Frame: {label}",
      colorLabel: "Frame color",
      categories: {
        basic: "Basic",
        ornate: "Ornate",
        target: "By audience",
        imageSimple: "Image: simple",
        imageOrnate: "Image: ornate",
      },
      labels: {
        none: "None",
        simple: "Simple",
        rounded: "Rounded",
        ornate: "Ornate",
        elegant: "Elegant",
        pop: "Pop",
        business: "Business",
        festive: "Festive",
        "img-simple-black": "Black",
        "img-simple-blue": "Blue",
        "img-simple-gray": "Gray",
        "img-simple-red": "Red",
        "img-elaborated-japanese": "Japanese",
        "img-elaborated-gothic": "Gothic",
        "img-elaborated-baroque": "Baroque",
      },
    },
    caption: {
      templateLabel: "Choose a template",
      templatePlaceholder: "-- Select a template --",
      templates: {
        scan: "Scan for info",
        access: "Visit here",
        read: "Scan to open",
        web: "More on the web",
        check: "Check it out",
      },
      textLabel: "Caption text",
      textPlaceholder: "Enter a caption",
      count: "{length}/{max} characters",
      tooLong: "A long caption is hard to read when printed",
      fontSizeLabel: "Font size: {size}px",
      fontSizeAria: "Font size {size}px",
    },
  },
} satisfies ClientDict;
