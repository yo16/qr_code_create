import type { Metadata } from "next";
import { buildMetadata, PAGE_METADATA } from "@/lib/metadata/buildMetadata";
import styles from "./page.module.css";

export const metadata: Metadata = buildMetadata(PAGE_METADATA.privacy);

export default function PrivacyPage() {
  return (
    <main className={styles.container}>
      <h1>プライバシーポリシー</h1>
      <p className={styles.lastUpdated}>最終更新日: 2026年4月10日</p>

      <section>
        <h2>1. はじめに</h2>
        <p>QR Code Create（以下「当サービス」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めています。本プライバシーポリシーでは、当サービスにおける情報の取り扱いについて説明します。</p>
      </section>

      <section>
        <h2>2. 収集する情報</h2>
        <p>当サービスは、QRコードの生成時にユーザーが入力したURL、UTMパラメータ、装飾設定の情報をブラウザ上でのみ処理します。これらの情報はサーバーには送信・保存されません。</p>
      </section>

      <section>
        <h2>3. アクセス解析ツール</h2>
        <p>当サービスでは、サービス改善のためGoogle Analytics 4を使用しています。Google Analyticsはトラフィックデータの収集のためにCookieを使用しています。このトラフィックデータは匿名で収集されており、個人を特定するものではありません。</p>
      </section>

      <section>
        <h2>4. ロゴ画像のアップロード</h2>
        <p>QRコードに埋め込むロゴ画像はブラウザ内でのみ処理され、サーバーにアップロードされることはありません。</p>
      </section>

      <section>
        <h2>5. 第三者への情報提供</h2>
        <p>当サービスは、ユーザーの個人情報を第三者に提供することはありません。</p>
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
