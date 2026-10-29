/**
 * ブラジルポルトガル語辞書。Client スライスは ptBrClient.ts。
 * 文言の方針は doc/design/i18n-en.md 9 節: 短く具体的、sentence case、感嘆符なし、定型の売り文句なし。
 */
import { ptBrClient } from "./ptBrClient";
import type { Dict } from "./types";

export const ptBr: Dict = {
  ...ptBrClient,
  header: {
    nav: {
      home: "Início",
      guide: "Primeiros passos",
      // pt-br にはまだ無いページのリンク（Dict のキーを満たすための文言）
      useCases: "Casos de uso",
      blog: "Blog",
      faq: "Perguntas frequentes",
    },
    // common.mobileMenu.cta（ptBrClient.ts）と同じ文言にする
    cta: "Criar um QR Code",
  },
  footer: {
    privacy: "Política de privacidade (em japonês)",
    terms: "Termos de uso (em japonês)",
    faq: "Perguntas frequentes",
    contact: "Contato (em japonês)",
    // /poster の pt-br 版が無いので画面には出ない（Dict のキーを満たすための文言）
    poster: "Criador de pôsteres (em japonês)",
    japaneseOnlyNote:
      "A política de privacidade e os termos de uso estão disponíveis apenas em japonês.",
  },
  home: {
    hero: {
      // 結合すると「Crie QR Codes com parâmetros UTM, grátis」。<br /> で折り返す
      headingLine1: "Crie QR Codes com ",
      headingLine2: "parâmetros UTM, grátis",
      description:
        "Digite uma URL, adicione parâmetros UTM com predefinições guiadas e baixe o QR Code em PNG, SVG ou PDF. Sem cadastro.",
      primaryCta: "Criar um QR Code",
      secondaryCta: "Ler o guia",
      note: "Baixe em PNG, SVG ou PDF. Grátis.",
      qrAlt: "QR Code que leva à página inicial do qr-create.jp",
      captionLead: "Este QR Code leva à seguinte URL.",
    },
    features: {
      heading: "O que você pode fazer",
      items: [
        {
          title: "Orientação sobre parâmetros UTM",
          description:
            "Cada campo mostra exemplos do que digitar em utm_source e utm_medium. Use as predefinições por uso para montar uma URL que o Google Analytics consiga relatar.",
        },
        {
          title: "Molduras decorativas",
          description:
            "Combine uma moldura (simples, empresarial, elegante ou pop) com cores, um logo e uma legenda. Exporte pronto para colocar em um folheto ou pôster.",
        },
        {
          title: "Grátis, sem cadastro",
          description:
            "Sem conta e sem e-mail. O QR Code é criado no seu navegador, e suas imagens e URLs nunca ficam guardadas neste site.",
        },
        {
          title: "PNG, SVG e PDF",
          description:
            "Use PNG para a web e apresentações, e SVG ou PDF para impressão, onde a imagem continua nítida em qualquer tamanho. No PNG, você escolhe a resolução.",
        },
      ],
    },
    cta: {
      heading: "Da URL ao download em quatro etapas",
      description:
        "Digite a URL, defina os parâmetros UTM, ajuste o design e baixe o arquivo. Em nenhum momento pedimos que você se cadastre.",
      button: "Criar um QR Code",
    },
  },
  guide: {
    breadcrumb: {
      ariaLabel: "Trilha de navegação",
      home: "Início",
      guide: "Guia",
    },
  },
  meta: {
    root: {
      title: "QR Code Create - Gerador de QR Code grátis com parâmetros UTM",
      description:
        "Crie QR Codes grátis com orientação sobre parâmetros UTM. Adicione molduras decorativas e inclua o seu logo. Sem cadastro.",
    },
    pages: {
      home: {
        title: "QR Code Create - Gerador de QR Code grátis com parâmetros UTM",
        description:
          "Digite uma URL, adicione parâmetros UTM com predefinições guiadas e baixe o QR Code em PNG, SVG ou PDF. Sem cadastro.",
      },
      create: {
        title: "Criar um QR Code",
        description:
          "Digite uma URL, adicione parâmetros UTM, escolha uma moldura e as cores, e baixe o QR Code grátis. Acompanhe os acessos no Google Analytics.",
      },
      faq: {
        title: "Perguntas frequentes",
        description:
          "Respostas para dúvidas comuns sobre o QR Code Create e a configuração de parâmetros UTM.",
      },
      privacy: {
        title: "Política de privacidade",
        description: "A política de privacidade do QR Code Create.",
      },
      terms: {
        title: "Termos de uso",
        description: "Os termos de uso do QR Code Create.",
      },
      guide: {
        title: "Guia",
        description:
          "Guias para usar o QR Code Create e aproveitar melhor os QR Codes.",
      },
      useCases: {
        title: "QR Codes por caso de uso",
        description:
          "Como criar QR Codes para cartões de visita, folhetos, pôsteres e eventos, com as configurações UTM que recomendamos para cada um.",
      },
      blog: {
        title: "Blog",
        description:
          "Notas práticas sobre marketing com QR Code e o uso de parâmetros UTM.",
      },
    },
  },
  schema: {
    inLanguage: "pt-BR",
    webApplication: {
      description:
        "Um gerador de QR Code grátis com orientação sobre parâmetros UTM. Personalize o seu QR Code com molduras decorativas. Sem cadastro.",
      featureList: [
        "Geração de QR Code",
        "Orientação sobre parâmetros UTM",
        "Molduras decorativas (elegante, pop, empresarial)",
        "Inclusão de logo",
        "Personalização de cores",
        "Exportação em PNG, SVG e PDF",
      ],
    },
    organization: {
      description: "Um gerador de QR Code grátis com orientação sobre parâmetros UTM",
    },
    howTo: {
      name: "Como criar um QR Code com parâmetros UTM",
      description:
        "Etapas para criar um QR Code com parâmetros UTM de graça.",
      steps: [
        {
          name: "Digite a URL",
          text: "Digite a URL da página que você quer transformar em QR Code.",
        },
        {
          name: "Adicione parâmetros UTM",
          text: "Defina utm_source, utm_medium e utm_campaign. Seguindo a orientação, você poderá medir os resultados no Google Analytics.",
        },
        {
          name: "Personalize o design",
          text: "Escolha uma moldura decorativa, mude as cores, adicione um logo e defina uma legenda.",
        },
        {
          name: "Gere e baixe o QR Code",
          text: "Confira a pré-visualização e depois baixe o QR Code em PNG, SVG ou PDF.",
        },
      ],
    },
  },
};
