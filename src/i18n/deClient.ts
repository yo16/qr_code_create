/**
 * ドイツ語辞書の Client スライス（common / ui / tool / utm / decoration）。
 * jaClient.ts と同じキー構成。型は `satisfies ClientDict` で全キーを要求する。
 * import してよいのは de.ts と getDict.ts だけ（de の文字列を Client バンドルに入れないため）。
 * 呼びかけは Sie。訳語は glossary/de.ts に従う。
 */
import type { ClientDict } from "./types";

export const deClient = {
  common: {
    loading: "Wird geladen",
    languageSwitch: {
      buttonLabel: "Sprache",
      listLabel: "Sprache wählen",
    },
    mobileMenu: {
      open: "Menü öffnen",
      close: "Menü schließen",
      // header.cta（de.ts）と同じ文言にする。MobileNav は Client なので別スライスに置いている
      cta: "QR-Code erstellen",
    },
    notFound: {
      title: "Seite nicht gefunden",
      body: "Die gesuchte Seite existiert nicht oder wurde verschoben.",
      link: "Zurück zur Startseite",
    },
    comingSoon: {
      badge: "Demnächst",
      noteLine1: "Diese Seite ist noch nicht fertig. Die Inhalte kommen nach und nach hinzu.",
      noteLine2: "Wenn Sie zuerst einen QR-Code erstellen möchten, nutzen Sie die Schaltfläche unten.",
      create: "QR-Code erstellen",
      backToTop: "Zurück nach oben",
    },
    articleCta: {
      ariaLabel: "QR-Code erstellen",
      heading: "Probieren Sie es mit der URL dieser Seite aus",
      defaultText: "QR-Code erstellen",
      note: "Kostenlos, ohne Anmeldung",
    },
  },
  ui: {
    select: {
      placeholder: "Option wählen",
      customOption: "Andere (selbst eingeben)",
      customPlaceholder: "Eigenen Wert eingeben",
      customAria: "{label} (eigener Wert)",
    },
    fileUpload: {
      sizeExceeded: "Die Datei ist größer als das Limit von {max} KB.",
      unsupportedType: "Dieses Dateiformat wird nicht unterstützt.",
      convertFailed: "Das Bild konnte nicht gelesen werden. Bitte versuche eine andere Datei.",
      dropZoneAria: "{label}. Klicken oder per Drag-and-drop eine Datei auswählen",
      previewAlt: "Vorschau",
      dropText: "Klicken oder per Drag-and-drop",
      accept: "Erlaubte Formate: {accept}",
      maxSize: "Maximale Größe: {max} KB",
      removeAria: "Ausgewählte Datei entfernen",
    },
    colorPicker: {
      pickerAria: "Farbauswahl für {label}",
      textLabel: "Farbcode für {label}",
      textAria: "Farbcode für {label}",
    },
    progressBar: {
      defaultLabel: "Schritt {current} von {total}",
    },
    tabs: {
      listAria: "Tabs",
    },
  },
  tool: {
    pageHeading: "QR-Code erstellen",
    steps: {
      url: { label: "Schritt 1: URL eingeben", title: "URL eingeben" },
      utm: { label: "Schritt 2: UTM-Parameter hinzufügen", title: "UTM-Parameter hinzufügen" },
      decoration: {
        label: "Schritt 3: Design anpassen",
        title: "Design anpassen",
      },
      download: { label: "Schritt 4: Herunterladen", title: "Herunterladen" },
    },
    progress: {
      label: "Fortschritt",
      start: "Geben Sie eine URL ein, um Ihren QR-Code zu starten",
      utm: "Fügen Sie UTM-Parameter hinzu, um Scans in Google Analytics zu verfolgen",
      decoration: "Passen Sie das Design an den Ort an, an dem der Code stehen soll",
      done: "Ihr QR-Code ist fertig",
    },
    urlInput: {
      label: "URL",
      placeholder: "https://example.com",
    },
    validation: {
      invalidUrl: "Geben Sie eine gültige URL ein",
    },
    urlPreview: {
      label: "Erzeugte URL",
      copyAria: "URL in die Zwischenablage kopieren",
      copy: "Kopieren",
      copied: "Kopiert",
      placeholder: "Hier erscheint die URL, sobald Sie eine eingeben",
      copiedStatus: "URL kopiert",
    },
    qrPreview: {
      label: "Vorschau des QR-Codes",
      ariaGenerated: "Erzeugter QR-Code",
      ariaPlaceholder: "Platzhalter für den QR-Code",
      placeholder: "Geben Sie eine URL ein, um einen QR-Code zu erzeugen",
      error: "Der QR-Code konnte nicht erzeugt werden",
      contrastWarning:
        "Der Kontrast zwischen Vorder- und Hintergrundfarbe ist zu gering (WCAG AA verlangt mindestens 4,5:1). Der QR-Code lässt sich möglicherweise schlecht scannen.",
    },
    download: {
      disabledMessage: "Geben Sie eine URL ein, um den QR-Code herunterzuladen",
      resolutionLabel: "Ausgabeauflösung",
      resolutionNormal: "Standard",
      hint2x: "Für den Druck (empfohlen)",
      warning4x: "Hohe Qualität. Die Datei ist größer",
      fileSize: "Etwa {n} KB",
      pngButton: "PNG herunterladen",
      svgButton: "SVG herunterladen",
      pdfButton: "PDF herunterladen",
      pdfGenerating: "PDF wird erstellt...",
      // de には /poster が無いので画面には出ない。ja と同じキーを満たすための文言
      posterCta: "Druckfähiges Poster erstellen",
      posterCtaAria: "Druckfähiges Poster erstellen (öffnet die Poster-Seite)",
    },
  },
  utm: {
    title: "UTM-Parameter",
    toggleLabel: "UTM-Parameter hinzufügen",
    toggleAria: "UTM-Parameter hinzufügen",
    noUtmWarning:
      "Ohne UTM-Parameter können Sie Besuche über diesen QR-Code in Google Analytics nicht verfolgen",
    advancedShow: "Erweiterte Optionen anzeigen",
    advancedHide: "Erweiterte Optionen ausblenden",
    helpButtonAria: "Hilfe zu {label}",
    fieldLabels: {
      source: "utm_source (wo er erscheint)",
      medium: "utm_medium (Kanal)",
      campaign: "utm_campaign (Kampagnenname)",
      term: "utm_term (Suchbegriff)",
      content: "utm_content (Inhaltskennung)",
    },
    fieldPlaceholders: {
      campaign: "z. B. fruehjahrsaktion_2026",
      term: "z. B. qr code generator",
      content: "z. B. banner_oben",
    },
    campaignHint: "Nehmen Sie ein Datum oder ein Thema auf, damit sich Kampagnen leicht finden lassen",
    fieldHelp: {
      source:
        "Wo der QR-Code erscheint, etwa auf einem Flyer, einer Visitenkarte oder einem Poster",
      medium:
        "Auf welchem Weg der Code die Menschen erreicht. Für QR-Codes ist \"qr\" eine gute Wahl",
      campaign:
        "Der Kampagnenname. Nehmen Sie ein Datum oder ein Thema auf, damit er leicht zu finden ist (z. B. fruehjahrsaktion_2026)",
      term: "Das Suchwort. Es wird vor allem bei Suchanzeigen genutzt und kann bei QR-Codes leer bleiben",
      content:
        "Damit unterscheiden Sie mehrere QR-Codes in einer Kampagne, zum Beispiel bei einem A/B-Test",
    },
    sourceLabels: {
      flyer: "Flyer",
      poster: "Poster",
      business_card: "Visitenkarte",
      brochure: "Broschüre",
      banner: "Ladenschild",
      receipt: "Kassenbon",
      product_package: "Produktverpackung",
      menu: "Speisekarte",
      signage: "Beschilderung im Laden",
    },
    mediumLabels: {
      qr: "QR-Code",
      print: "Druck",
    },
    usageExamplesLabel: "Beispiele nach Einsatzzweck:",
    usageExampleLabels: {
      business_card: "Auf eine Visitenkarte gedruckt",
      flyer: "Auf einen Flyer gedruckt",
      poster: "An die Wand gehängt",
      signage: "Beschilderung im Laden",
    },
    effectiveness: {
      label: "Verfolgungsgrad: {level}",
      levels: {
        low: "Niedrig",
        normal: "Mittel",
        high: "Hoch",
        highest: "Am höchsten",
      },
      messages: {
        none: "Ergebnisse lassen sich noch nicht messen",
        basic: "Eine einfache Verfolgung ist möglich",
        better: "Ihre Ergebnisse werden genauer",
        detailed: "Sie können Scans in Google Analytics im Detail auswerten",
        perfect: "Ihre Verfolgung ist vollständig eingerichtet",
      },
    },
  },
  decoration: {
    presetGroupLabel: "Design-Vorlagen",
    presetItemLabel: "Vorlage: {name} - {description}",
    presets: {
      simple: {
        name: "Schlicht",
        description: "Klares Schwarz-Weiß",
        caption: "",
      },
      business: {
        name: "Business",
        description: "Ruhig und seriös",
        caption: "Mehr erfahren",
      },
      casual: {
        name: "Locker",
        description: "Freundliche, natürliche Farben",
        caption: "Scannen und besuchen",
      },
      elegant: {
        name: "Elegant",
        description: "Fein und zurückhaltend",
        caption: "Code scannen",
      },
      pop: {
        name: "Pop",
        description: "Hell und bunt",
        caption: "Jetzt besuchen",
      },
    },
    color: {
      fg: "Vordergrundfarbe",
      bg: "Hintergrundfarbe",
      contrastRatio: "Kontrastverhältnis: {ratio}:1",
      ok: "Gut scanbar",
      caution: "Möglicherweise schwerer zu scannen",
      warning: "Der QR-Code ist möglicherweise nicht lesbar",
      reset: "Auf Standard zurücksetzen",
    },
    logo: {
      upload: "Logo-Bild hochladen",
      alt: "Logo: {fileName}",
      sizeLabel: "Logogröße: {percent} %",
      sizeAria: "Logogröße anpassen",
      remove: "Logo entfernen",
      removeAria: "Logo entfernen",
    },
    frame: {
      groupLabel: "Rahmen: {category}",
      itemLabel: "Rahmen: {label}",
      colorLabel: "Rahmenfarbe",
      categories: {
        basic: "Einfach",
        ornate: "Verziert",
        target: "Nach Zielgruppe",
        imageSimple: "Bild: schlicht",
        imageOrnate: "Bild: verziert",
      },
      labels: {
        none: "Keiner",
        simple: "Schlicht",
        rounded: "Abgerundet",
        ornate: "Verziert",
        elegant: "Elegant",
        pop: "Pop",
        business: "Business",
        festive: "Festlich",
        "img-simple-black": "Schwarz",
        "img-simple-blue": "Blau",
        "img-simple-gray": "Grau",
        "img-simple-red": "Rot",
        "img-elaborated-japanese": "Japanisch",
        "img-elaborated-gothic": "Gotisch",
        "img-elaborated-baroque": "Barock",
      },
    },
    caption: {
      templateLabel: "Vorlage wählen",
      templatePlaceholder: "-- Vorlage auswählen --",
      templates: {
        scan: "Scannen für Infos",
        access: "Hier besuchen",
        read: "Scannen zum Öffnen",
        web: "Mehr im Web",
        check: "Jetzt ansehen",
      },
      textLabel: "Text der Beschriftung",
      textPlaceholder: "Beschriftung eingeben",
      count: "{length}/{max} Zeichen",
      tooLong: "Eine lange Beschriftung ist im Druck schwer zu lesen",
      fontSizeLabel: "Schriftgröße: {size} px",
      fontSizeAria: "Schriftgröße {size} px",
    },
  },
} satisfies ClientDict;
