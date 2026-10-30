import { ja } from "@/i18n/ja";
import { en } from "@/i18n/en";
import { es } from "@/i18n/es";
import { ptBr } from "@/i18n/ptBr";
import { de } from "@/i18n/de";
import { buildMetadata, PAGE_METADATA, getLocalePageMetadata } from "@/lib/metadata/buildMetadata";
import { buildRootMetadata, rootMetadataJa } from "@/lib/metadata/rootMetadata";
import { NON_JA_LOCALES } from "@/i18n/locales";

// 意図（qr_code_create-av5）: 日本語のトップと /create の title / description を検索語に合わせて見直した結果を固定する。
const SITE_NAME = "QR Code Create";
const TEMPLATE = "%s | QR Code Create";
const MAX_TITLE_BODY = 20;
const MAX_DESCRIPTION = 120;

const count = (text: string, needle: string): number => text.split(needle).length - 1;

/** ルート layout の title.template を適用した後の <title>（トップは template が効かないのでページ側の title がそのまま使われる） */
const finalTitle = (pageTitle: string, isTop: boolean): string =>
  isTop ? pageTitle : TEMPLATE.replace("%s", pageTitle);

/** サイト名の付け方（" | QR Code Create"）を除いた本文 */
const titleBody = (title: string): string => title.replace(` | ${SITE_NAME}`, "");

const PAGES = [
  { name: "トップ", key: "home" as const, isTop: true },
  { name: "/create", key: "create" as const, isTop: false },
];

describe("ja のトップと /create のメタデータ", () => {
  describe.each(PAGES)("$name", ({ key, isTop }) => {
    const page = ja.meta.pages[key];
    const meta = buildMetadata(PAGE_METADATA[key]);

    it("最終的な <title> にサイト名が 1 回だけ含まれること", () => {
      expect(count(finalTitle(String(meta.title), isTop), SITE_NAME)).toBe(1);
    });

    it("og:title と twitter:title にサイト名が 1 回だけ含まれること", () => {
      expect(count(String(meta.openGraph?.title), SITE_NAME)).toBe(1);
      expect(count(String(meta.twitter?.title), SITE_NAME)).toBe(1);
    });

    it(`サイト名を除いた title の本文が 1〜${MAX_TITLE_BODY} 字以内であること`, () => {
      const body = titleBody(page.title);
      expect(body.length).toBeGreaterThan(0);
      expect(body.length).toBeLessThanOrEqual(MAX_TITLE_BODY);
      expect(body).not.toContain(SITE_NAME);
    });

    it(`description が空でなく ${MAX_DESCRIPTION} 字以内であること`, () => {
      expect(page.description.trim()).not.toBe("");
      expect(page.description.length).toBeLessThanOrEqual(MAX_DESCRIPTION);
    });

    it("title と description にダッシュ（— と ―）が無いこと", () => {
      expect(page.title).not.toMatch(/[—―]/);
      expect(page.description).not.toMatch(/[—―]/);
    });

    it("title が前後に空白を持たず、サイト名の区切りが 1 つ以下であること", () => {
      expect(page.title).toBe(page.title.trim());
      expect(count(page.title, " | ")).toBeLessThanOrEqual(1);
    });
  });

  describe("検索語", () => {
    it.each(["無料", "QRコード", "作成"])("トップの title に「%s」が含まれること", (word) => {
      expect(ja.meta.pages.home.title).toContain(word);
    });

    it.each(["QRコード", "無料", "作成"])("/create の title に「%s」が含まれること", (word) => {
      expect(ja.meta.pages.create.title).toContain(word);
    });

    it("トップの description に「UTM」と「登録」が含まれること", () => {
      expect(ja.meta.pages.home.description).toContain("UTM");
      expect(ja.meta.pages.home.description).toContain("登録");
    });

    it("/create の description に「UTM」と「PNG・SVG・PDF」が含まれること", () => {
      expect(ja.meta.pages.create.description).toContain("UTM");
      expect(ja.meta.pages.create.description).toContain("PNG・SVG・PDF");
    });
  });

  describe("トップと /create の書き分け", () => {
    const home = ja.meta.pages.home;
    const create = ja.meta.pages.create;

    it("description が同じでないこと（title も別であること）", () => {
      expect(home.description).not.toBe(create.description);
      expect(home.title).not.toBe(create.title);
    });

    it("保存形式（PNG・SVG・PDF）は /create だけに出て、トップには出ないこと", () => {
      expect(create.description).toContain("PNG・SVG・PDF");
      expect(home.description).not.toContain("PNG");
      expect(home.description).not.toContain("SVG");
      expect(home.description).not.toContain("PDF");
    });

    it("「会員登録」はトップだけに出て、/create には出ないこと", () => {
      expect(home.description).toContain("会員登録");
      expect(create.description).not.toContain("会員登録");
      expect(create.title).not.toContain("会員登録");
    });
  });

  describe("rootMetadata", () => {
    it("既定の title と description がトップと一致すること", () => {
      const title = rootMetadataJa.title as { default: string; template: string };
      expect(title.default).toBe(ja.meta.pages.home.title);
      expect(rootMetadataJa.description).toBe(ja.meta.pages.home.description);
      expect(ja.meta.root).toEqual({
        title: ja.meta.pages.home.title,
        description: ja.meta.pages.home.description,
      });
    });

    it("template はサイト名を 1 回付ける形で、既定の title にはサイト名が 1 回だけ含まれること", () => {
      const title = rootMetadataJa.title as { default: string; template: string };
      expect(title.template).toBe(TEMPLATE);
      expect(count(title.default, SITE_NAME)).toBe(1);
    });
  });

  describe("異常系: サイト名の付け方の検査が誤りを検出できること", () => {
    it("サイト名を含む title に template を二重適用すると 2 回になること", () => {
      expect(count(finalTitle(ja.meta.pages.home.title, false), SITE_NAME)).toBe(2);
    });

    it("サイト名の無い title に template を適用しないと 0 回になること", () => {
      expect(count(finalTitle(ja.meta.pages.create.title, true), SITE_NAME)).toBe(0);
    });
  });
});

describe("ja 以外の言語の home / create の title・description が av5 の前後で変わっていないこと（直書きで固定）", () => {
  const dicts = { en, es, "pt-br": ptBr, de } as const;

  const FIXED = [
    [
      "en",
      en,
      {
        title: "QR Code Create - Free QR code generator with UTM parameters",
        description:
          "Enter a URL, add UTM parameters with guided presets, and download the QR code as PNG, SVG, or PDF. No sign-up.",
      },
      {
        title: "Create a QR code",
        description:
          "Enter a URL, add UTM parameters, pick a frame and colors, and download the QR code for free. Track scans in Google Analytics.",
      },
    ],
    [
      "es",
      es,
      {
        title: "QR Code Create - Generador gratuito de códigos QR con parámetros UTM",
        description:
          "Escribe una URL, agrega parámetros UTM con diseños predefinidos guiados y descarga el código QR en PNG, SVG o PDF. Sin registro.",
      },
      {
        title: "Crear un código QR",
        description:
          "Escribe una URL, agrega parámetros UTM, elige un marco y colores, y descarga el código QR gratis. Mide los escaneos en Google Analytics.",
      },
    ],
    [
      "pt-br",
      ptBr,
      {
        title: "QR Code Create - Gerador de QR Code grátis com parâmetros UTM",
        description:
          "Digite uma URL, adicione parâmetros UTM com predefinições guiadas e baixe o QR Code em PNG, SVG ou PDF. Sem cadastro.",
      },
      {
        title: "Criar um QR Code",
        description:
          "Digite uma URL, adicione parâmetros UTM, escolha uma moldura e as cores, e baixe o QR Code grátis. Acompanhe os acessos no Google Analytics.",
      },
    ],
    [
      "de",
      de,
      {
        title: "QR Code Create - Kostenloser QR-Code-Generator mit UTM-Parametern",
        description:
          "Geben Sie eine URL ein, ergänzen Sie UTM-Parameter mit geführten Vorlagen und laden Sie den QR-Code als PNG, SVG oder PDF herunter. Ohne Anmeldung.",
      },
      {
        title: "QR-Code erstellen",
        description:
          "Geben Sie eine URL ein, fügen Sie UTM-Parameter hinzu, wählen Sie Rahmen und Farben und laden Sie den QR-Code kostenlos herunter. Verfolgen Sie Scans in Google Analytics.",
      },
    ],
  ] as const;

  it.each(FIXED)("%s: home と create の title・description が直書きの値と一致すること", (_locale, dict, home, create) => {
    expect(dict.meta.pages.home).toEqual(home);
    expect(dict.meta.pages.create).toEqual(create);
  });

  it.each(NON_JA_LOCALES)("%s: home / create の title と description が空でなく、最終的な title にサイト名が 1 回だけ含まれること", (locale) => {
    const set = getLocalePageMetadata(locale);
    const root = buildRootMetadata(locale).title as { default: string; template: string };
    const dict = dicts[locale as keyof typeof dicts];
    expect(dict).toBeDefined();

    expect(set.home.title.trim()).not.toBe("");
    expect(set.home.description.trim()).not.toBe("");
    expect(set.create.title.trim()).not.toBe("");
    expect(set.create.description.trim()).not.toBe("");

    expect(count(set.home.title, SITE_NAME)).toBe(1);
    expect(count(root.template.replace("%s", set.create.title), SITE_NAME)).toBe(1);
  });

  it("ja の見直しが他言語の辞書に影響していないこと（title が ja と異なる）", () => {
    for (const d of [en, es, ptBr, de]) {
      expect(d.meta.pages.home.title).not.toBe(ja.meta.pages.home.title);
      expect(d.meta.pages.create.title).not.toBe(ja.meta.pages.create.title);
    }
  });
});
