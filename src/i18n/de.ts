/**
 * ドイツ語辞書。Client スライスは deClient.ts、Server スライス（header / footer / home / guide / meta / schema）はここ。
 * 文言の方針は doc/design/i18n-en.md 9 節: 短く具体的、感嘆符なし、定型の売り文句なし。呼びかけは Sie。
 * 訳語は glossary/de.ts に従う。元は en.ts（日本語からは訳さない）。
 */
import { deClient } from "./deClient";
import type { Dict } from "./types";

export const de: Dict = {
  ...deClient,
  header: {
    nav: {
      home: "Start",
      guide: "Erste Schritte",
      // ドイツ語版が無いので de のヘッダーには出ない（Dict のキーを満たすための文言）
      useCases: "Anwendungsfälle",
      blog: "Blog",
      faq: "FAQ",
    },
    // common.mobileMenu.cta（deClient.ts）と同じ文言にする
    cta: "QR-Code erstellen",
  },
  footer: {
    privacy: "Datenschutzerklärung (Japanisch)",
    terms: "Nutzungsbedingungen (Japanisch)",
    faq: "FAQ",
    contact: "Kontakt (Japanisch)",
    // /poster のドイツ語版が無いので de のフッターには出ない（Dict のキーを満たすための文言）
    poster: "Poster-Generator (Japanisch)",
    japaneseOnlyNote:
      "Unsere Datenschutzerklärung und Nutzungsbedingungen gibt es nur auf Japanisch.",
  },
  home: {
    hero: {
      // 結合すると「QR-Codes mit UTM-Parametern erstellen, kostenlos」。<br /> で折り返す
      headingLine1: "QR-Codes mit ",
      headingLine2: "UTM-Parametern erstellen, kostenlos",
      description:
        "Geben Sie eine URL ein, ergänzen Sie UTM-Parameter mit geführten Vorlagen und laden Sie den QR-Code als PNG, SVG oder PDF herunter. Ohne Anmeldung.",
      primaryCta: "QR-Code erstellen",
      secondaryCta: "Anleitung lesen",
      note: "Als PNG, SVG oder PDF herunterladen. Kostenlos.",
      qrAlt: "QR-Code, der auf die Startseite von qr-create.jp verweist",
      captionLead: "Dieser QR-Code verweist auf die folgende URL.",
    },
    features: {
      heading: "Was Sie tun können",
      items: [
        {
          title: "Hilfe für UTM-Parameter",
          description:
            "Jedes Feld zeigt Beispiele, was Sie in utm_source und utm_medium eintragen. Mit den Vorlagen nach Einsatzzweck bauen Sie eine URL, die Google Analytics auswerten kann.",
        },
        {
          title: "Dekorative Rahmen",
          description:
            "Kombinieren Sie einen Rahmen wie schlicht, business, elegant oder pop mit Farben, einem Logo und einer Beschriftung. Exportieren Sie ihn fertig für Flyer oder Poster.",
        },
        {
          title: "Kostenlos, ohne Anmeldung",
          description:
            "Kein Konto und keine E-Mail-Adresse. Der QR-Code entsteht in Ihrem Browser, und Ihre Bilder und URLs werden nie auf dieser Website gespeichert.",
        },
        {
          title: "PNG, SVG und PDF",
          description:
            "PNG eignet sich für Web und Folien, SVG oder PDF für den Druck, denn sie bleiben in jeder Größe scharf. Bei PNG können Sie die Auflösung wählen.",
        },
      ],
    },
    cta: {
      heading: "Von der URL zum Download in vier Schritten",
      description:
        "Geben Sie die URL ein, legen Sie die UTM-Parameter fest, passen Sie das Design an und laden Sie die Datei herunter. Eine Anmeldung wird nie verlangt.",
      button: "QR-Code erstellen",
    },
  },
  guide: {
    breadcrumb: {
      ariaLabel: "Brotkrümelnavigation",
      home: "Start",
      guide: "Anleitung",
    },
  },
  meta: {
    root: {
      title: "QR Code Create - Kostenloser QR-Code-Generator mit UTM-Parametern",
      description:
        "Erstellen Sie QR-Codes kostenlos, mit integrierter Hilfe für UTM-Parameter. Ergänzen Sie dekorative Rahmen und binden Sie Ihr Logo ein. Ohne Anmeldung.",
    },
    pages: {
      home: {
        title: "QR Code Create - Kostenloser QR-Code-Generator mit UTM-Parametern",
        description:
          "Geben Sie eine URL ein, ergänzen Sie UTM-Parameter mit geführten Vorlagen und laden Sie den QR-Code als PNG, SVG oder PDF herunter. Ohne Anmeldung.",
      },
      create: {
        title: "QR-Code erstellen",
        description:
          "Geben Sie eine URL ein, fügen Sie UTM-Parameter hinzu, wählen Sie Rahmen und Farben und laden Sie den QR-Code kostenlos herunter. Verfolgen Sie Scans in Google Analytics.",
      },
      faq: {
        title: "FAQ",
        description:
          "Antworten auf häufige Fragen zu QR Code Create und zur Einrichtung von UTM-Parametern.",
      },
      privacy: {
        title: "Datenschutzerklärung",
        description: "Die Datenschutzerklärung von QR Code Create.",
      },
      terms: {
        title: "Nutzungsbedingungen",
        description: "Die Nutzungsbedingungen von QR Code Create.",
      },
      guide: {
        title: "Anleitung",
        description:
          "Anleitungen zur Nutzung von QR Code Create und dazu, mehr aus QR-Codes herauszuholen.",
      },
      useCases: {
        title: "QR-Codes nach Einsatzzweck",
        description:
          "So erstellen Sie QR-Codes für Visitenkarten, Flyer, Poster und Veranstaltungen, mit den UTM-Einstellungen, die wir jeweils empfehlen.",
      },
      blog: {
        title: "Blog",
        description:
          "Praxisnahe Hinweise zu QR-Code-Marketing und zum Einsatz von UTM-Parametern.",
      },
    },
  },
  schema: {
    inLanguage: "de",
    webApplication: {
      description:
        "Ein kostenloser QR-Code-Generator mit Hilfe für UTM-Parameter. Gestalten Sie Ihren QR-Code mit dekorativen Rahmen. Ohne Anmeldung.",
      featureList: [
        "QR-Code-Erstellung",
        "Hilfe für UTM-Parameter",
        "Dekorative Rahmen (elegant, pop, business)",
        "Logo einbinden",
        "Farbanpassung",
        "Export als PNG, SVG und PDF",
      ],
    },
    organization: {
      description: "Ein kostenloser QR-Code-Generator mit Hilfe für UTM-Parameter",
    },
    howTo: {
      name: "So erstellen Sie einen QR-Code mit UTM-Parametern",
      description:
        "Schritte, um kostenlos einen QR-Code mit UTM-Parametern zu erstellen.",
      steps: [
        {
          name: "URL eingeben",
          text: "Geben Sie die URL der Webseite ein, aus der ein QR-Code werden soll.",
        },
        {
          name: "UTM-Parameter hinzufügen",
          text: "Legen Sie utm_source, utm_medium und utm_campaign fest. Mit der Hilfe können Sie die Ergebnisse in Google Analytics messen.",
        },
        {
          name: "Design anpassen",
          text: "Wählen Sie einen dekorativen Rahmen, ändern Sie die Farben, fügen Sie ein Logo hinzu und legen Sie eine Beschriftung fest.",
        },
        {
          name: "QR-Code erzeugen und herunterladen",
          text: "Prüfen Sie die Vorschau und laden Sie den QR-Code dann als PNG, SVG oder PDF herunter.",
        },
      ],
    },
  },
};
