/**
 * 辞書化前の値との照合（回帰防止）。
 * 期待値は commit d5d0332 時点（T2b 前）の src/lib/metadata/buildMetadata.ts と
 * src/lib/schema/buildJsonLd.ts から写した直書き。ja.ts から読むと同語反復になるため読まない。
 * 文言を意図して変えるときは、ここの期待値も合わせて更新する。
 */
import { PAGE_METADATA } from "@/lib/metadata/buildMetadata";
import {
  buildHowToSchema,
  buildOrganizationSchema,
  buildWebApplicationSchema,
} from "@/lib/schema/buildJsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";

describe("PAGE_METADATA は T2b 前と同じ", () => {
  // 意図: 8 ページの title / description / path / noIndex が辞書化前と一字一句同じ
  it("8 ページ分が旧値と一致する", () => {
    expect(PAGE_METADATA).toEqual({
      home: {
        title: "QR Code Create - UTMパラメータ付きQRコード生成ツール",
        description:
          "UTMパラメータのガイダンス付きでQRコードを無料生成。装飾フレームやロゴ埋め込みでマーケティング効果を最大化。登録不要。",
        path: "/",
      },
      create: {
        title: "QRコード生成 - QR Code Create",
        description:
          "URLを入力するだけ。UTMパラメータと装飾フレームでマーケティング効果を最大化するQRコードを無料で作成できます。",
        path: "/create",
      },
      faq: {
        title: "よくある質問",
        description:
          "QR Code Createの使い方やUTMパラメータの設定方法など、よくある質問にお答えします。",
        path: "/faq",
      },
      privacy: {
        title: "プライバシーポリシー",
        description: "QR Code Createのプライバシーポリシーです。",
        path: "/privacy",
        noIndex: true,
      },
      terms: {
        title: "利用規約",
        description: "QR Code Createの利用規約です。",
        path: "/terms",
        noIndex: true,
      },
      guide: {
        title: "使い方ガイド",
        description:
          "QR Code Createの使い方やQRコードの活用方法を初心者にもわかりやすく解説するガイド集です。",
        path: "/guide",
      },
      useCases: {
        title: "用途別QRコード",
        description:
          "名刺・チラシ・ポスター・イベントなど、用途別にQRコードの作り方と推奨UTM設定を解説します。",
        path: "/use-cases",
      },
      blog: {
        title: "ブログ",
        description:
          "QRコードマーケティングやUTMパラメータの活用方法について、実践的な情報をお届けします。",
        path: "/blog",
      },
    });
  });
});

describe("JSON-LD は T2b 前と同じ", () => {
  // 意図: 引数なしの WebApplication スキーマ全体が旧値と一致（inLanguage "ja" も含む）
  it("buildWebApplicationSchema() が旧値と一致する", () => {
    expect(buildWebApplicationSchema()).toEqual({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "QR Code Create",
      description:
        "UTMパラメータガイダンス付きの無料QRコード生成ツール。装飾フレームでQRコードをカスタマイズできます。登録不要。",
      url: `${SITE_URL}/create`,
      applicationCategory: "UtilityApplication",
      operatingSystem: "Any",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "JPY",
      },
      featureList: [
        "QRコード生成",
        "UTMパラメータガイダンス",
        "装飾フレーム（エレガント・ポップ・ビジネス）",
        "ロゴ埋め込み",
        "色カスタマイズ",
        "PNG/SVG/PDF出力",
      ],
      inLanguage: "ja",
    });
  });

  // 意図: inLanguage は ja 版では "ja" のまま
  it('buildWebApplicationSchema("ja").inLanguage は "ja"', () => {
    expect(buildWebApplicationSchema("ja").inLanguage).toBe("ja");
  });

  // 意図: Organization の description が旧値と一致
  it("buildOrganizationSchema() の description が旧値と一致する", () => {
    expect(buildOrganizationSchema()).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "QR Code Create",
      url: SITE_URL,
      description: "UTMパラメータガイダンス付きの無料QRコード生成ツール",
    });
  });

  // 意図: 引数なし HowTo の全フィールド（name / description / 4 ステップ）が旧値と一致
  it("buildHowToSchema() が旧値と一致する", () => {
    expect(buildHowToSchema()).toEqual({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "UTMパラメータ付きQRコードの作り方",
      description:
        "UTMパラメータを設定したQRコードを無料で作成する手順を解説します。",
      totalTime: "PT3M",
      tool: {
        "@type": "HowToTool",
        name: "QR Code Create",
      },
      step: [
        {
          "@type": "HowToStep",
          name: "URLを入力する",
          text: "QRコードにしたいWebページのURLを入力します。",
          url: `${SITE_URL}/create#step1`,
        },
        {
          "@type": "HowToStep",
          name: "UTMパラメータを設定する",
          text: "utm_source、utm_medium、utm_campaignを設定します。ガイダンスに従って入力すれば、Google Analyticsでの効果測定が可能になります。",
          url: `${SITE_URL}/create#step2`,
        },
        {
          "@type": "HowToStep",
          name: "装飾をカスタマイズする",
          text: "装飾フレームの選択、色の変更、ロゴの追加、キャプションの設定など、デザインをカスタマイズします。",
          url: `${SITE_URL}/create#step3`,
        },
        {
          "@type": "HowToStep",
          name: "QRコードを生成・ダウンロードする",
          text: "プレビューを確認し、PNG・SVG・PDFのいずれかの形式でQRコードをダウンロードします。",
          url: `${SITE_URL}/create#step4`,
        },
      ],
    });
  });

  // 意図: 引数を渡した HowTo は引数の値をそのまま使い、辞書の値で上書きされない
  it("buildHowToSchema(options) は引数の値を使う", () => {
    const options = {
      name: "Custom name",
      description: "Custom description",
      totalTime: "PT5M",
      steps: [
        { name: "Step A", text: "Text A", url: "https://example.com/a" },
        { name: "Step B", text: "Text B" },
      ],
    };
    const expected = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "Custom name",
      description: "Custom description",
      totalTime: "PT5M",
      tool: { "@type": "HowToTool", name: "QR Code Create" },
      step: [
        {
          "@type": "HowToStep",
          name: "Step A",
          text: "Text A",
          url: "https://example.com/a",
        },
        { "@type": "HowToStep", name: "Step B", text: "Text B" },
      ],
    };
    expect(buildHowToSchema(options)).toEqual(expected);
    expect(buildHowToSchema(options, "ja")).toEqual(expected);
  });
});
