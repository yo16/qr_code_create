import type { Metadata } from "next";
import { buildMetadata, PAGE_METADATA } from "@/lib/metadata/buildMetadata";
import styles from "./page.module.css";

export const metadata: Metadata = buildMetadata(PAGE_METADATA.privacy);

export default function PrivacyPage() {
  return (
    <main className={styles.container}>
      <h1>プライバシーポリシー</h1>
      <p className={styles.lastUpdated}>最終更新日: 2026年10月24日</p>

      <section>
        <h2>1. はじめに</h2>
        <p>QR Code Create（以下「当サービス」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めています。本プライバシーポリシーでは、当サービスにおける情報の取り扱いについて説明します。</p>
      </section>

      <section>
        <h2>2. 収集する情報</h2>
        <p>QRコードの生成はブラウザ内で完結します。入力したURL、QRコード画像、ロゴ画像、キャプションの本文は、当サービスのサーバーに送信も保存もされません。</p>
        <p>ただし、利用状況を計測するため、次の節に書く値をGoogle Analyticsに送ります。</p>
      </section>

      <section>
        <h2>3. アクセス解析ツール</h2>
        <p>当サービスはサービス改善のためGoogle Analytics 4を使います。Google Analyticsはトラフィックデータを集めるためにCookieを使います。</p>
        <p>Google Analyticsに送る値は次のとおりです。</p>
        <ul>
          <li>入力したURLのドメイン部分</li>
          <li>UTMパラメータの値と、その入力方法、設定数</li>
          <li>前景色、背景色、フレームの種類、プリセット名などの装飾の設定値</li>
          <li>キャプションの文字数と、テンプレートを使ったかどうか</li>
          <li>ロゴ画像の種類（MIMEタイプ）とファイルサイズ</li>
          <li>QRコードを生成・ダウンロードした事実と、ダウンロード形式、ロゴ・フレーム・キャプションを使ったかどうか</li>
          <li>よくある質問の開閉、ボタンのクリック、ツールチップの表示</li>
          <li>エラーの発生とその種類（入力した内容は含みません）</li>
        </ul>
        <p>このほか、閲覧したページのURL、参照元、端末やブラウザの情報など、Google Analyticsが自動で集める情報があります。</p>
        <p>入力したURLの全体、QRコード画像、ロゴ画像そのもの、キャプションの本文は送りません。</p>
        <p>計測した値はサービスの改善に使います。個人を特定する目的では使いません。</p>
        <p>
          Googleによるデータの扱いは、
          <a
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noopener noreferrer"
          >
            Googleのポリシー
          </a>
          で確認できます。
        </p>
      </section>

      <section>
        <h2>4. ロゴ画像のアップロード</h2>
        <p>QRコードに埋め込むロゴ画像は、ブラウザ内でのみ処理されます。サーバーにアップロードされることはありません。</p>
        <p>計測のために送るのは、ロゴ画像の種類とファイルサイズだけです。</p>
      </section>

      <section>
        <h2>5. 第三者への情報提供</h2>
        <p>当サービスは、ユーザーの個人情報を第三者に提供することはありません。</p>
        <p>ただし、「3. アクセス解析ツール」に書いた計測の値は、Google Analyticsの提供元であるGoogleに送られます。</p>
      </section>

      <section>
        <h2>6. お問い合わせ</h2>
        <p>本プライバシーポリシーに関するお問い合わせは、サイトのお問い合わせフォームよりご連絡ください。</p>
      </section>

      <section>
        <h2>7. 本ポリシーの変更</h2>
        <p>本プライバシーポリシーは、必要に応じて変更されることがあります。変更があった場合は、本ページにて告知いたします。</p>
      </section>
    </main>
  );
}
