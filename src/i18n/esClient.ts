/**
 * スペイン語辞書の Client スライス（common / ui / tool / utm / decoration）。
 * jaClient.ts と同じキー構成。型は `satisfies ClientDict` で全キーを要求する。
 * import してよいのは es.ts と getDict.ts だけ（es の文字列を Client バンドルに入れないため）。
 * 訳語は src/i18n/glossary/es.ts に合わせる。呼びかけは tú。
 */
import type { ClientDict } from "./types";

export const esClient = {
  common: {
    loading: "Cargando",
    // 設計 10.2 の例外: 切り替えラベルだけは自言語名（日本語）で出す
    languageSwitch: {
      label: "日本語",
      hint: " (japonés)",
      buttonLabel: "Idioma",
      listLabel: "Elige un idioma",
    },
    mobileMenu: {
      open: "Abrir el menú",
      close: "Cerrar el menú",
      // header.cta（es.ts）と同じ文言にする。MobileNav は Client なので別スライスに置いている
      cta: "Crear un código QR",
    },
    notFound: {
      title: "Página no encontrada",
      body: "La página que buscas no existe o puede haberse movido.",
      link: "Volver a la página de inicio",
    },
    comingSoon: {
      badge: "Próximamente",
      noteLine1: "Esta página aún no está lista. Iremos agregando contenido poco a poco.",
      noteLine2: "Si quieres crear un código QR ahora, usa el botón de abajo.",
      create: "Crear un código QR",
      backToTop: "Volver al inicio",
    },
    articleCta: {
      ariaLabel: "Crear un código QR",
      heading: "Pruébalo con la URL de esta página",
      defaultText: "Crear un código QR",
      note: "Gratis, sin registro",
    },
  },
  ui: {
    select: {
      placeholder: "Selecciona una opción",
      customOption: "Otro (escribe el tuyo)",
      customPlaceholder: "Escribe tu propio valor",
      customAria: "{label} (valor personalizado)",
    },
    fileUpload: {
      sizeExceeded: "El archivo supera el límite de {max} KB.",
      dropZoneAria: "{label}. Haz clic o arrastra y suelta para elegir un archivo",
      previewAlt: "Vista previa",
      dropText: "Haz clic o arrastra y suelta",
      accept: "Formatos admitidos: {accept}",
      maxSize: "Tamaño máximo: {max} KB",
      removeAria: "Quitar el archivo seleccionado",
    },
    colorPicker: {
      pickerAria: "Selector de color de {label}",
      textLabel: "Código de color de {label}",
      textAria: "Código de color de {label}",
    },
    progressBar: {
      defaultLabel: "Paso {current} de {total}",
    },
    tabs: {
      listAria: "Pestañas",
    },
  },
  tool: {
    pageHeading: "Crear un código QR",
    steps: {
      url: { label: "Paso 1: Escribe tu URL", title: "Escribe tu URL" },
      utm: { label: "Paso 2: Agrega parámetros UTM", title: "Agrega parámetros UTM" },
      decoration: {
        label: "Paso 3: Personaliza el diseño",
        title: "Personaliza el diseño",
      },
      download: { label: "Paso 4: Descargar", title: "Descargar" },
    },
    progress: {
      label: "Progreso",
      start: "Escribe una URL para empezar tu código QR",
      utm: "Agrega parámetros UTM para medir los escaneos en Google Analytics",
      decoration: "Personaliza el diseño según el lugar donde lo vas a colocar",
      done: "Tu código QR está listo",
    },
    urlInput: {
      label: "URL",
      placeholder: "https://example.com",
    },
    validation: {
      invalidUrl: "Escribe una URL válida",
    },
    urlPreview: {
      label: "URL generada",
      copyAria: "Copiar la URL al portapapeles",
      copy: "Copiar",
      copied: "Copiada",
      placeholder: "La URL aparecerá aquí cuando escribas una",
      copiedStatus: "URL copiada",
    },
    qrPreview: {
      label: "Vista previa del código QR",
      ariaGenerated: "Código QR generado",
      ariaPlaceholder: "Marcador de posición del código QR",
      placeholder: "Escribe una URL para generar un código QR",
      error: "No se pudo generar el código QR",
      contrastWarning:
        "El contraste entre el color de primer plano y el de fondo es demasiado bajo (WCAG AA exige 4,5:1 o más). Puede que el código QR sea difícil de escanear.",
    },
    download: {
      disabledMessage: "Escribe una URL para descargar el código QR",
      resolutionLabel: "Resolución de salida",
      resolutionNormal: "Estándar",
      hint2x: "Para imprimir (recomendado)",
      warning4x: "Alta calidad. El archivo es más grande",
      fileSize: "Unos {n} KB",
      pngButton: "Descargar PNG",
      svgButton: "Descargar SVG",
      pdfButton: "Descargar PDF",
      pdfGenerating: "Generando el PDF...",
      // en には /poster が無いので画面には出ない。ja と同じキーを満たすための文言
      posterCta: "Crear un póster para imprimir",
      posterCtaAria: "Crear un póster para imprimir (abre la página del póster)",
    },
  },
  utm: {
    title: "Parámetros UTM",
    toggleLabel: "Agregar parámetros UTM",
    toggleAria: "Agregar parámetros UTM",
    noUtmWarning:
      "Sin parámetros UTM, no podrás medir en Google Analytics las visitas que llegan desde este código QR",
    advancedShow: "Mostrar opciones avanzadas",
    advancedHide: "Ocultar opciones avanzadas",
    helpButtonAria: "Ayuda sobre {label}",
    fieldLabels: {
      source: "utm_source (dónde aparece)",
      medium: "utm_medium (canal)",
      campaign: "utm_campaign (nombre de la campaña)",
      term: "utm_term (palabra clave de búsqueda)",
      content: "utm_content (identificador del contenido)",
    },
    fieldPlaceholders: {
      campaign: "p. ej. oferta_primavera_2026",
      term: "p. ej. generador de códigos qr",
      content: "p. ej. banner_superior",
    },
    campaignHint: "Incluye una fecha o un tema para encontrar las campañas con facilidad",
    fieldHelp: {
      source:
        "Dónde aparece el código QR, por ejemplo en un folleto, una tarjeta de visita o un póster",
      medium:
        "Cómo llega el código a las personas. Para los códigos QR, \"qr\" es una buena opción",
      campaign:
        "El nombre de la campaña. Incluye una fecha o un tema para encontrarla con facilidad (p. ej. oferta_primavera_2026)",
      term: "La palabra clave de búsqueda. Se usa sobre todo en anuncios de búsqueda, así que puedes dejarlo vacío en los códigos QR",
      content:
        "Úsalo para distinguir varios códigos QR de una misma campaña, por ejemplo en una prueba A/B",
    },
    sourceLabels: {
      flyer: "Folleto",
      poster: "Póster",
      business_card: "Tarjeta de visita",
      brochure: "Tríptico",
      banner: "Cartel de la tienda",
      receipt: "Recibo",
      product_package: "Embalaje del producto",
      menu: "Menú",
      signage: "Letrero en la tienda",
    },
    mediumLabels: {
      qr: "Código QR",
      print: "Impreso",
    },
    usageExamplesLabel: "Ejemplos según el uso:",
    usageExampleLabels: {
      business_card: "Impreso en una tarjeta de visita",
      flyer: "Impreso en un folleto",
      poster: "Colgado en una pared",
      signage: "Letrero en la tienda",
    },
    effectiveness: {
      label: "Nivel de seguimiento: {level}",
      levels: {
        low: "Bajo",
        normal: "Medio",
        high: "Alto",
        highest: "Máximo",
      },
      messages: {
        none: "Todavía no puedes medir resultados",
        basic: "Es posible un seguimiento básico",
        better: "Tus resultados serán más precisos",
        detailed: "Puedes analizar los escaneos en detalle en Google Analytics",
        perfect: "Tu configuración de seguimiento está completa",
      },
    },
  },
  decoration: {
    presetGroupLabel: "Diseños predefinidos",
    presetItemLabel: "Diseño predefinido: {name} - {description}",
    presets: {
      simple: {
        name: "Simple",
        description: "Blanco y negro, limpio",
        caption: "",
      },
      business: {
        name: "Negocios",
        description: "Sereno y de confianza",
        caption: "Más información",
      },
      casual: {
        name: "Informal",
        description: "Cercano, con colores naturales",
        caption: "Escanea para visitarnos",
      },
      elegant: {
        name: "Elegante",
        description: "Refinado y discreto",
        caption: "Escanea el código",
      },
      pop: {
        name: "Pop",
        description: "Brillante y colorido",
        caption: "Visítanos ahora",
      },
    },
    color: {
      fg: "Color de primer plano",
      bg: "Color de fondo",
      contrastRatio: "Relación de contraste: {ratio}:1",
      ok: "Fácil de escanear",
      caution: "Puede ser más difícil de escanear",
      warning: "Puede que el código QR no se pueda leer",
      reset: "Restablecer valores",
    },
    logo: {
      upload: "Subir una imagen de logotipo",
      alt: "Logotipo: {fileName}",
      sizeLabel: "Tamaño del logotipo: {percent}%",
      sizeAria: "Ajustar el tamaño del logotipo",
      remove: "Quitar logotipo",
      removeAria: "Quitar logotipo",
    },
    frame: {
      groupLabel: "Marcos: {category}",
      itemLabel: "Marco: {label}",
      colorLabel: "Color del marco",
      categories: {
        basic: "Básicos",
        ornate: "Ornamentados",
        target: "Según el público",
        imageSimple: "Imagen: simple",
        imageOrnate: "Imagen: ornamentado",
      },
      labels: {
        none: "Ninguno",
        simple: "Simple",
        rounded: "Redondeado",
        ornate: "Ornamentado",
        elegant: "Elegante",
        pop: "Pop",
        business: "Negocios",
        festive: "Festivo",
        "img-simple-black": "Negro",
        "img-simple-blue": "Azul",
        "img-simple-gray": "Gris",
        "img-simple-red": "Rojo",
        "img-elaborated-japanese": "Japonés",
        "img-elaborated-gothic": "Gótico",
        "img-elaborated-baroque": "Barroco",
      },
    },
    caption: {
      templateLabel: "Elige una plantilla",
      templatePlaceholder: "-- Selecciona una plantilla --",
      templates: {
        scan: "Escanea para ver más",
        access: "Entra aquí",
        read: "Escanea para abrir",
        web: "Más información en la web",
        check: "Échale un vistazo",
      },
      textLabel: "Texto de la leyenda",
      textPlaceholder: "Escribe una leyenda",
      count: "{length}/{max} caracteres",
      tooLong: "Una leyenda larga es difícil de leer al imprimirla",
      fontSizeLabel: "Tamaño de fuente: {size}px",
      fontSizeAria: "Tamaño de fuente {size}px",
    },
  },
} satisfies ClientDict;
