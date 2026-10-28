/**
 * スペイン語辞書（en を元にした翻訳。呼びかけは tú、地域を限らない中立的なスペイン語）。Client スライスは esClient.ts。
 * 文言の方針は doc/design/i18n-en.md 9 節: 短く具体的、sentence case、感嘆符なし、定型の売り文句なし。
 * 訳語は src/i18n/glossary/es.ts に合わせる。
 */
import { esClient } from "./esClient";
import type { Dict } from "./types";

export const es: Dict = {
  ...esClient,
  header: {
    nav: {
      home: "Inicio",
      guide: "Primeros pasos",
      // スペイン語版が無いので es のヘッダーには出ない（Dict のキーを満たすための文言）
      useCases: "Casos de uso",
      blog: "Blog",
      faq: "Preguntas frecuentes",
    },
    // common.mobileMenu.cta（esClient.ts）と同じ文言にする
    cta: "Crear un código QR",
  },
  footer: {
    privacy: "Política de privacidad (en japonés)",
    terms: "Términos de servicio (en japonés)",
    faq: "Preguntas frecuentes",
    contact: "Contacto (en japonés)",
    // /poster のスペイン語版が無いので es のフッターには出ない（Dict のキーを満たすための文言）
    poster: "Creador de pósteres (en japonés)",
    japaneseOnlyNote:
      "Nuestra política de privacidad y los términos de servicio solo están disponibles en japonés.",
  },
  home: {
    hero: {
      // 結合すると「Crea códigos QR con parámetros UTM, gratis」。<br /> で折り返す
      headingLine1: "Crea códigos QR con ",
      headingLine2: "parámetros UTM, gratis",
      description:
        "Escribe una URL, agrega parámetros UTM con diseños predefinidos guiados y descarga el código QR en PNG, SVG o PDF. Sin registro.",
      primaryCta: "Crear un código QR",
      secondaryCta: "Leer la guía",
      note: "Descarga en PNG, SVG o PDF. Gratis.",
      qrAlt: "Código QR que lleva a la página de inicio de qr-create.jp",
      captionLead: "Este código QR lleva a la siguiente URL.",
    },
    features: {
      heading: "Qué puedes hacer",
      items: [
        {
          title: "Guía de parámetros UTM",
          description:
            "Cada campo muestra ejemplos de qué escribir en utm_source y utm_medium. Usa las opciones por caso de uso para armar una URL que Google Analytics pueda medir.",
        },
        {
          title: "Marcos decorativos",
          description:
            "Combina un marco simple, de negocios, elegante o pop con colores, un logotipo y una leyenda. Expórtalo listo para colocarlo en un folleto o un póster.",
        },
        {
          title: "Gratis, sin registro",
          description:
            "Sin cuenta y sin correo electrónico. El código QR se crea en tu navegador y tus imágenes y URL nunca se guardan en este sitio.",
        },
        {
          title: "PNG, SVG y PDF",
          description:
            "Usa PNG para la web y las presentaciones, y SVG o PDF para imprimir, donde se mantiene nítido a cualquier tamaño. En PNG puedes elegir la resolución.",
        },
      ],
    },
    cta: {
      heading: "De la URL a la descarga en cuatro pasos",
      description:
        "Escribe la URL, configura los parámetros UTM, ajusta el diseño y descarga. En ningún momento se te pide registrarte.",
      button: "Crear un código QR",
    },
  },
  guide: {
    breadcrumb: {
      ariaLabel: "Ruta de navegación",
      home: "Inicio",
      guide: "Guía",
    },
  },
  meta: {
    root: {
      title: "QR Code Create - Generador gratuito de códigos QR con parámetros UTM",
      description:
        "Crea códigos QR gratis con una guía de parámetros UTM integrada. Agrega marcos decorativos e incrusta tu logotipo. Sin necesidad de registro.",
    },
    pages: {
      home: {
        title: "QR Code Create - Generador gratuito de códigos QR con parámetros UTM",
        description:
          "Escribe una URL, agrega parámetros UTM con diseños predefinidos guiados y descarga el código QR en PNG, SVG o PDF. Sin registro.",
      },
      create: {
        title: "Crear un código QR",
        description:
          "Escribe una URL, agrega parámetros UTM, elige un marco y colores, y descarga el código QR gratis. Mide los escaneos en Google Analytics.",
      },
      faq: {
        title: "Preguntas frecuentes",
        description:
          "Respuestas a las preguntas habituales sobre QR Code Create y la configuración de los parámetros UTM.",
      },
      privacy: {
        title: "Política de privacidad",
        description: "La política de privacidad de QR Code Create.",
      },
      terms: {
        title: "Términos de servicio",
        description: "Los términos de servicio de QR Code Create.",
      },
      guide: {
        title: "Guía",
        description:
          "Guías para usar QR Code Create y sacar más partido a los códigos QR.",
      },
      useCases: {
        title: "Códigos QR según el uso",
        description:
          "Cómo crear códigos QR para tarjetas de visita, folletos, pósteres y eventos, con la configuración UTM que recomendamos para cada caso.",
      },
      blog: {
        title: "Blog",
        description:
          "Notas prácticas sobre marketing con códigos QR y el uso de parámetros UTM.",
      },
    },
  },
  schema: {
    inLanguage: "es",
    webApplication: {
      description:
        "Un generador gratuito de códigos QR con guía de parámetros UTM. Personaliza tu código QR con marcos decorativos. Sin necesidad de registro.",
      featureList: [
        "Generación de códigos QR",
        "Guía de parámetros UTM",
        "Marcos decorativos (elegante, pop, negocios)",
        "Incrustación de logotipo",
        "Personalización de colores",
        "Exportación en PNG, SVG y PDF",
      ],
    },
    organization: {
      description: "Un generador gratuito de códigos QR con guía de parámetros UTM",
    },
    howTo: {
      name: "Cómo crear un código QR con parámetros UTM",
      description:
        "Pasos para crear gratis un código QR con parámetros UTM.",
      steps: [
        {
          name: "Escribe tu URL",
          text: "Escribe la URL de la página web que quieres convertir en un código QR.",
        },
        {
          name: "Agrega parámetros UTM",
          text: "Configura utm_source, utm_medium y utm_campaign. Si sigues la guía, podrás medir los resultados en Google Analytics.",
        },
        {
          name: "Personaliza el diseño",
          text: "Elige un marco decorativo, cambia los colores, agrega un logotipo y escribe una leyenda.",
        },
        {
          name: "Genera y descarga el código QR",
          text: "Revisa la vista previa y descarga el código QR en PNG, SVG o PDF.",
        },
      ],
    },
  },
};
