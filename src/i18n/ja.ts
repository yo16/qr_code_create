/**
 * 日本語辞書。既存の UI 文言を一字一句そのまま移したもの。
 * Client スライスは jaClient.ts、Server スライス（header / footer / home / guide / meta / schema）はここ。
 */
import { jaClient } from "./jaClient";

export const ja = {
  ...jaClient,
  // Server スライス（Client には渡さない）
  header: {
    nav: {
      home: "ホーム",
      guide: "使い方",
      useCases: "用途別",
      blog: "ブログ",
      faq: "FAQ",
    },
    // common.mobileMenu.cta（jaClient.ts）と同じ文言にする。MobileNav は Client なので別スライスに置いている
    cta: "QRコード生成",
  },
  footer: {
    privacy: "プライバシーポリシー",
    terms: "利用規約",
    faq: "よくある質問",
    contact: "お問い合わせ",
    poster: "印刷用ポスター",
    // 英語版のフッターだけが表示する注記。ja では使わない（Dict のキーを揃えるため）
    japaneseOnlyNote: "プライバシーポリシーと利用規約は日本語のみです。",
  },
  home: {
    hero: {
      headingLine1: "UTMパラメータ付きQRコードを",
      headingLine2: "無料で作成",
      description:
        "URLを入れるだけで、Google Analyticsで読み取りを計測できるQRコードができます。チラシ、ポスター、名刺と、置き場所ごとに分けて数えられます。",
      primaryCta: "無料でQRコードを作成",
      secondaryCta: "使い方を見る",
      note: "完全無料・登録不要。PNG、SVG、PDFでダウンロードできます。",
      qrAlt: "qr-create.jp のトップページを指すQRコード",
      captionLead: "このQRコードは、次のURLを指しています。",
    },
    features: {
      heading: "できること",
      items: [
        {
          title: "UTMパラメータガイダンス",
          description:
            "utm_source や utm_medium に何を書けばよいか、入力欄ごとに例が出ます。用途別の設定例を見ながら、Google Analyticsで集計できる形のURLを組み立てられます。",
        },
        {
          title: "装飾フレーム",
          description:
            "シンプル、ビジネス、エレガント、ポップなどのフレームに、色、ロゴ、キャプションを組み合わせられます。チラシやポスターにそのまま置ける形で書き出せます。",
        },
        {
          title: "完全無料・登録不要",
          description:
            "アカウントもメールアドレスも要りません。QRコードはお使いのブラウザの中で作られ、画像やURLがこのサイトに保存されることはありません。",
        },
        {
          title: "PNG/SVG/PDF対応",
          description:
            "WebやスライドにはPNG、拡大しても粗くならない印刷用にはSVGかPDF。PNGは用途に合わせて解像度を選べます。",
        },
      ],
    },
    cta: {
      heading: "URLを入れて、4つの手順でダウンロードまで",
      description:
        "URLの入力、UTMパラメータ、見た目の調整、ダウンロードの順に進みます。途中で登録を求められることはありません。",
      button: "無料でQRコードを作成する",
    },
  },
  guide: {
    breadcrumb: {
      ariaLabel: "パンくずリスト",
      home: "ホーム",
      guide: "使い方ガイド",
    },
  },
  meta: {
    root: {
      // root.title はテンプレートが効かない既定値なので、サイト名を自分で 1 回含める
      title: "無料のQRコード作成ツール（UTM対応） | QR Code Create",
      description:
        "UTMパラメータ付きのQRコードを無料で作れるツールです。印刷物ごとに、どこで読み取られたかを測れます。会員登録は不要です。",
    },
    pages: {
      // home だけは template が効かないセグメントなので、サイト名を自分で 1 回含める。他の pages.* は含めない
      home: {
        title: "無料のQRコード作成ツール（UTM対応） | QR Code Create",
        description:
          "UTMパラメータ付きのQRコードを無料で作れるツールです。印刷物ごとに、どこで読み取られたかを測れます。会員登録は不要です。",
      },
      create: {
        title: "QRコードを無料で作成（UTM対応）",
        description:
          "URLを入れるだけで、QRコードを無料で作成できます。UTMパラメータの設定や、色・ロゴ・フレームの装飾にも対応。PNG・SVG・PDFで保存できます。",
      },
      faq: {
        title: "よくある質問",
        description:
          "QR Code Createの使い方やUTMパラメータの設定方法など、よくある質問にお答えします。",
      },
      privacy: {
        title: "プライバシーポリシー",
        description: "QR Code Createのプライバシーポリシーです。",
      },
      terms: {
        title: "利用規約",
        description: "QR Code Createの利用規約です。",
      },
      guide: {
        title: "使い方ガイド",
        description:
          "QR Code Createの使い方やQRコードの活用方法を初心者にもわかりやすく解説するガイド集です。",
      },
      useCases: {
        title: "用途別QRコード",
        description:
          "名刺・チラシ・ポスター・イベントなど、用途別にQRコードの作り方と推奨UTM設定を解説します。",
      },
      blog: {
        title: "ブログ",
        description:
          "QRコードマーケティングやUTMパラメータの活用方法について、実践的な情報をお届けします。",
      },
    },
  },
  schema: {
    inLanguage: "ja",
    webApplication: {
      description:
        "UTMパラメータガイダンス付きの無料QRコード生成ツール。装飾フレームでQRコードをカスタマイズできます。登録不要。",
      featureList: [
        "QRコード生成",
        "UTMパラメータガイダンス",
        "装飾フレーム（エレガント・ポップ・ビジネス）",
        "ロゴ埋め込み",
        "色カスタマイズ",
        "PNG/SVG/PDF出力",
      ],
    },
    organization: {
      description: "UTMパラメータガイダンス付きの無料QRコード生成ツール",
    },
    // ツールページ用の固定 HowTo は gx4 で廃止。tests/unit/app/staticOutput.test.ts の needle としてだけ使っている。
    // 消すときは needle と件数も直す。
    howTo: {
      name: "UTMパラメータ付きQRコードの作り方",
      description:
        "UTMパラメータを設定したQRコードを無料で作成する手順を解説します。",
      steps: [
        {
          name: "URLを入力する",
          text: "QRコードにしたいWebページのURLを入力します。",
        },
        {
          name: "UTMパラメータを設定する",
          text: "utm_source、utm_medium、utm_campaignを設定します。ガイダンスに従って入力すれば、Google Analyticsでの効果測定が可能になります。",
        },
        {
          name: "装飾をカスタマイズする",
          text: "装飾フレームの選択、色の変更、ロゴの追加、キャプションの設定など、デザインをカスタマイズします。",
        },
        {
          name: "QRコードを生成・ダウンロードする",
          text: "プレビューを確認し、PNG・SVG・PDFのいずれかの形式でQRコードをダウンロードします。",
        },
      ],
    },
  },
};
