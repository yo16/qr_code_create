import type { FaqItem } from "./FaqAccordion";

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "free",
    question: "QRコードの作成に料金はかかりますか？",
    answer:
      "いいえ、QR Code Createは完全無料でご利用いただけます。会員登録も不要です。UTMパラメータの設定、装飾フレームの追加、ロゴの埋め込みなど、すべての機能を無料でお使いいただけます。",
  },
  {
    id: "utm",
    question: "UTMパラメータとは何ですか？",
    answer:
      "UTMパラメータは、URLに追加するトラッキング用のパラメータです。Google Analyticsなどのアクセス解析ツールで、どの媒体（チラシ、名刺、ポスターなど）からのアクセスかを識別できるようになります。utm_source、utm_medium、utm_campaign、utm_term、utm_contentの5種類があります。",
  },
  {
    id: "logo",
    question: "QRコードにロゴを埋め込めますか？",
    answer:
      "はい、QR Code Createではロゴ画像をQRコードの中央に埋め込むことができます。QRコードにはエラー訂正機能があるため、ロゴを埋め込んでも読み取りに支障はありません。",
  },
  {
    id: "format",
    question: "作成したQRコードはどのような形式でダウンロードできますか？",
    answer:
      "PNG、SVG、PDFの3つの形式でダウンロードできます。Web掲載にはPNG、印刷物にはSVGまたはPDFがおすすめです。",
  },
  {
    id: "frame",
    question: "装飾フレームにはどのようなスタイルがありますか？",
    answer:
      "シンプル、ビジネス、カジュアル、エレガント、ポップの5つのプリセットをご用意しています。それぞれキャプション（「詳しくはこちら」等）も追加できます。",
  },
  {
    id: "scan",
    question: "QRコードが読み取れない場合はどうすればいいですか？",
    answer:
      "コントラスト比が低い（前景色と背景色が似ている）場合や、ロゴが大きすぎる場合に読み取りにくくなることがあります。コントラスト比警告が表示される設定は避け、推奨サイズ以下のロゴを使用してください。",
  },
];
