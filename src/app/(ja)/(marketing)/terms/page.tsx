import type { Metadata } from "next";
import { buildMetadata, PAGE_METADATA } from "@/lib/metadata/buildMetadata";
import styles from "./page.module.css";

export const metadata: Metadata = buildMetadata(PAGE_METADATA.terms);

export default function TermsPage() {
  return (
    <main className={styles.container}>
      <h1>利用規約</h1>
      <p className={styles.lastUpdated}>最終更新日: 2026年4月10日</p>

      <section>
        <h2>第1条（適用）</h2>
        <p>本利用規約（以下「本規約」）は、QR Code Create（以下「当サービス」）の利用条件を定めるものです。ユーザーは、本規約に同意の上、当サービスを利用するものとします。</p>
      </section>

      <section>
        <h2>第2条（利用料金）</h2>
        <p>当サービスは無料でご利用いただけます。会員登録も不要です。</p>
      </section>

      <section>
        <h2>第3条（禁止事項）</h2>
        <p>ユーザーは、当サービスの利用にあたり、以下の行為をしてはなりません。</p>
        <ul>
          <li>法令または公序良俗に違反する行為</li>
          <li>犯罪行為に関連する行為</li>
          <li>当サービスのサーバーやネットワークを過度に負荷させる行為</li>
          <li>当サービスを通じて違法・有害なコンテンツを生成・配布する行為</li>
          <li>その他、当サービスの運営者が不適切と判断する行為</li>
        </ul>
      </section>

      <section>
        <h2>第4条（生成されたQRコードの取り扱い）</h2>
        <p>当サービスを利用して生成されたQRコードは、ユーザーが自由に利用できます。商用利用も可能です。ただし、QRコードに埋め込まれるURLやコンテンツについての責任はユーザーが負うものとします。</p>
      </section>

      <section>
        <h2>第5条（免責事項）</h2>
        <p>当サービスは、ユーザーが当サービスを利用したことにより生じた損害について、一切の責任を負わないものとします。</p>
      </section>

      <section>
        <h2>第6条（サービスの変更・停止）</h2>
        <p>当サービスは、ユーザーへの事前の通知なく、サービスの内容を変更または停止することができるものとします。</p>
      </section>

      <section>
        <h2>第7条（利用規約の変更）</h2>
        <p>本規約は、必要に応じて変更されることがあります。変更後の規約は、本ページに掲載した時点で効力を生じるものとします。</p>
      </section>
    </main>
  );
}
