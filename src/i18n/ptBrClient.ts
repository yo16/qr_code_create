/**
 * ブラジルポルトガル語辞書の Client スライス（common / ui / tool / utm / decoration）。
 * jaClient.ts と同じキー構成。型は `satisfies ClientDict` で全キーを要求する。
 * import してよいのは ptBr.ts と getDict.ts だけ（pt-br の文字列を Client バンドルに入れないため）。
 */
import type { ClientDict } from "./types";

export const ptBrClient = {
  common: {
    loading: "Carregando",
    languageSwitch: {
      buttonLabel: "Idioma",
      listLabel: "Escolha um idioma",
    },
    mobileMenu: {
      open: "Abrir menu",
      close: "Fechar menu",
      // header.cta（ptBr.ts）と同じ文言にする。MobileNav は Client なので別スライスに置いている
      cta: "Criar um QR Code",
    },
    notFound: {
      title: "Página não encontrada",
      body: "A página que você procura não existe ou pode ter sido movida.",
      link: "Voltar para a página inicial",
    },
    comingSoon: {
      badge: "Em breve",
      noteLine1: "Esta página ainda não está pronta. O conteúdo será adicionado aos poucos.",
      noteLine2: "Se quiser criar um QR Code agora, use o botão abaixo.",
      create: "Criar um QR Code",
      backToTop: "Voltar ao topo",
    },
    articleCta: {
      ariaLabel: "Criar um QR Code",
      heading: "Teste com a URL desta página",
      defaultText: "Criar um QR Code",
      note: "Grátis, sem cadastro",
    },
  },
  ui: {
    select: {
      placeholder: "Selecione uma opção",
      customOption: "Outro (digite o seu)",
      customPlaceholder: "Digite o seu valor",
      customAria: "{label} (valor personalizado)",
    },
    fileUpload: {
      sizeExceeded: "O arquivo é maior que o limite de {max} KB.",
      dropZoneAria: "{label}. Clique ou arraste e solte para escolher um arquivo",
      previewAlt: "Pré-visualização",
      dropText: "Clique ou arraste e solte",
      accept: "Formatos aceitos: {accept}",
      maxSize: "Tamanho máximo: {max} KB",
      removeAria: "Remover o arquivo selecionado",
    },
    colorPicker: {
      pickerAria: "Seletor de cor de {label}",
      textLabel: "Código de cor de {label}",
      textAria: "Código de cor de {label}",
    },
    progressBar: {
      defaultLabel: "Etapa {current} de {total}",
    },
    tabs: {
      listAria: "Abas",
    },
  },
  tool: {
    pageHeading: "Criar um QR Code",
    steps: {
      url: { label: "Etapa 1: Digite a URL", title: "Digite a URL" },
      utm: { label: "Etapa 2: Adicione parâmetros UTM", title: "Adicione parâmetros UTM" },
      decoration: {
        label: "Etapa 3: Personalize o design",
        title: "Personalize o design",
      },
      download: { label: "Etapa 4: Baixar", title: "Baixar" },
    },
    progress: {
      label: "Progresso",
      start: "Digite uma URL para começar o seu QR Code",
      utm: "Adicione parâmetros UTM para acompanhar os acessos no Google Analytics",
      decoration: "Personalize o design de acordo com o lugar onde ele será usado",
      done: "Seu QR Code está pronto",
    },
    urlInput: {
      label: "URL",
      placeholder: "https://example.com",
    },
    validation: {
      invalidUrl: "Digite uma URL válida",
    },
    urlPreview: {
      label: "URL gerada",
      copyAria: "Copiar a URL para a área de transferência",
      copy: "Copiar",
      copied: "Copiado",
      placeholder: "A URL aparece aqui depois que você digitar uma",
      copiedStatus: "URL copiada",
    },
    qrPreview: {
      label: "Pré-visualização do QR Code",
      ariaGenerated: "QR Code gerado",
      ariaPlaceholder: "Espaço reservado do QR Code",
      placeholder: "Digite uma URL para gerar um QR Code",
      error: "Não foi possível gerar o QR Code",
      contrastWarning:
        "O contraste entre a cor do primeiro plano e a do fundo está baixo demais (o WCAG AA exige 4,5:1 ou mais). O QR Code pode ser difícil de ler.",
    },
    download: {
      disabledMessage: "Digite uma URL para baixar o QR Code",
      resolutionLabel: "Resolução de saída",
      resolutionNormal: "Padrão",
      hint2x: "Para impressão (recomendado)",
      warning4x: "Alta qualidade. O arquivo é maior",
      fileSize: "Cerca de {n} KB",
      pngButton: "Baixar PNG",
      svgButton: "Baixar SVG",
      pdfButton: "Baixar PDF",
      pdfGenerating: "Gerando PDF...",
      // en には /poster が無いので画面には出ない。ja と同じキーを満たすための文言
      posterCta: "Criar um pôster para imprimir",
      posterCtaAria: "Criar um pôster para imprimir (abre a página de pôsteres)",
    },
  },
  utm: {
    title: "Parâmetros UTM",
    toggleLabel: "Adicionar parâmetros UTM",
    toggleAria: "Adicionar parâmetros UTM",
    noUtmWarning:
      "Sem parâmetros UTM, você não consegue acompanhar no Google Analytics as visitas vindas deste QR Code",
    advancedShow: "Mostrar opções avançadas",
    advancedHide: "Ocultar opções avançadas",
    helpButtonAria: "Ajuda sobre {label}",
    fieldLabels: {
      source: "utm_source (onde aparece)",
      medium: "utm_medium (canal)",
      campaign: "utm_campaign (nome da campanha)",
      term: "utm_term (palavra-chave de busca)",
      content: "utm_content (identificador do conteúdo)",
    },
    fieldPlaceholders: {
      campaign: "ex.: promocao_primavera_2026",
      term: "ex.: gerador de qr code",
      content: "ex.: banner_topo",
    },
    campaignHint: "Inclua uma data ou um tema para facilitar a busca das campanhas",
    fieldHelp: {
      source:
        "Onde o QR Code aparece, como um folheto, um cartão de visita ou um pôster",
      medium:
        "Como o código chega às pessoas. Para QR Codes, \"qr\" é uma boa escolha",
      campaign:
        "O nome da campanha. Inclua uma data ou um tema para facilitar a busca (ex.: promocao_primavera_2026)",
      term: "A palavra-chave de busca. É usada principalmente em anúncios de busca, então você pode deixar vazio para QR Codes",
      content:
        "Use para diferenciar vários QR Codes de uma mesma campanha, por exemplo em um teste A/B",
    },
    sourceLabels: {
      flyer: "Folheto",
      poster: "Pôster",
      business_card: "Cartão de visita",
      brochure: "Brochura",
      banner: "Placa da fachada",
      receipt: "Recibo",
      product_package: "Embalagem do produto",
      menu: "Cardápio",
      signage: "Placa na loja",
    },
    mediumLabels: {
      qr: "QR Code",
      print: "Impresso",
    },
    usageExamplesLabel: "Exemplos por uso:",
    usageExampleLabels: {
      business_card: "Impresso em um cartão de visita",
      flyer: "Impresso em um folheto",
      poster: "Afixado na parede",
      signage: "Placa na loja",
    },
    effectiveness: {
      label: "Nível de acompanhamento: {level}",
      levels: {
        low: "Baixo",
        normal: "Médio",
        high: "Alto",
        highest: "Máximo",
      },
      messages: {
        none: "Você ainda não consegue medir os resultados",
        basic: "Já é possível um acompanhamento básico",
        better: "Seus resultados ficarão mais precisos",
        detailed: "Você pode analisar os acessos em detalhes no Google Analytics",
        perfect: "A configuração de acompanhamento está completa",
      },
    },
  },
  decoration: {
    presetGroupLabel: "Predefinição de design",
    presetItemLabel: "Predefinição: {name} - {description}",
    presets: {
      simple: {
        name: "Simples",
        description: "Preto e branco limpo",
        caption: "",
      },
      business: {
        name: "Empresarial",
        description: "Sóbrio e confiável",
        caption: "Saiba mais",
      },
      casual: {
        name: "Casual",
        description: "Amigável, com cores naturais",
        caption: "Escaneie para visitar",
      },
      elegant: {
        name: "Elegante",
        description: "Refinado e discreto",
        caption: "Escaneie o código",
      },
      pop: {
        name: "Pop",
        description: "Brilhante e colorido",
        caption: "Visite agora",
      },
    },
    color: {
      fg: "Cor do primeiro plano",
      bg: "Cor do fundo",
      contrastRatio: "Taxa de contraste: {ratio}:1",
      ok: "Fácil de escanear",
      caution: "Pode ser mais difícil de escanear",
      warning: "O QR Code pode não ser legível",
      reset: "Restaurar o padrão",
    },
    logo: {
      upload: "Enviar uma imagem de logo",
      alt: "Logo: {fileName}",
      sizeLabel: "Tamanho do logo: {percent}%",
      sizeAria: "Ajustar o tamanho do logo",
      remove: "Remover logo",
      removeAria: "Remover logo",
    },
    frame: {
      groupLabel: "Molduras: {category}",
      itemLabel: "Moldura: {label}",
      colorLabel: "Cor da moldura",
      categories: {
        basic: "Básicas",
        ornate: "Ornamentadas",
        target: "Por público",
        imageSimple: "Imagem: simples",
        imageOrnate: "Imagem: ornamentada",
      },
      labels: {
        none: "Nenhuma",
        simple: "Simples",
        rounded: "Arredondada",
        ornate: "Ornamentada",
        elegant: "Elegante",
        pop: "Pop",
        business: "Empresarial",
        festive: "Festiva",
        "img-simple-black": "Preta",
        "img-simple-blue": "Azul",
        "img-simple-gray": "Cinza",
        "img-simple-red": "Vermelha",
        "img-elaborated-japanese": "Japonesa",
        "img-elaborated-gothic": "Gótica",
        "img-elaborated-baroque": "Barroca",
      },
    },
    caption: {
      templateLabel: "Escolha um modelo",
      templatePlaceholder: "-- Selecione um modelo --",
      templates: {
        scan: "Escaneie para ver mais",
        access: "Acesse aqui",
        read: "Escaneie para abrir",
        web: "Mais informações na web",
        check: "Confira",
      },
      textLabel: "Texto da legenda",
      textPlaceholder: "Digite uma legenda",
      count: "{length}/{max} caracteres",
      tooLong: "Uma legenda longa fica difícil de ler quando impressa",
      fontSizeLabel: "Tamanho da fonte: {size}px",
      fontSizeAria: "Tamanho da fonte {size}px",
    },
  },
} satisfies ClientDict;
