import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb/Breadcrumb";
import { buildMetadata } from "@/lib/metadata/buildMetadata";
import styles from "./contact.module.css";

export const metadata: Metadata = buildMetadata({
  title: "お問い合わせ",
  description: "QR Code Createに関するご質問・ご要望・フィードバックはこちらからお問い合わせください。",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className={styles.container}>
      <Breadcrumb items={[{ label: "お問い合わせ" }]} />
      <header className={styles.header}>
        <h1 className={styles.title}>お問い合わせ</h1>
        <p className={styles.description}>
          QR Code Createに関するご質問・ご要望・フィードバックがございましたら、以下のフォームからお気軽にお問い合わせください。
        </p>
      </header>

      <p className={styles.note}>
        <span className={styles.required}>*</span> は必須項目です
      </p>

      <form
        className={styles.form}
        action="https://ssl.form-mailer.jp/fm/service/Forms/confirm"
        method="post"
        acceptCharset="UTF-8"
      >
        <input type="hidden" name="key" value="bd905569880937" />
        <input type="hidden" name="code" value="utf8" />

        {/* お名前 */}
        <div className={styles.fieldGroup}>
          <span className={styles.label}>
            お名前<span className={styles.required}>*</span>
          </span>
          <div className={styles.nameRow}>
            <div className={styles.nameField}>
              <label htmlFor="contact-sei" className={styles.label}>姓</label>
              <input
                id="contact-sei"
                name="field_7707589_sei"
                type="text"
                className={styles.input}
                placeholder="姓"
                required
              />
            </div>
            <div className={styles.nameField}>
              <label htmlFor="contact-mei" className={styles.label}>名</label>
              <input
                id="contact-mei"
                name="field_7707589_mei"
                type="text"
                className={styles.input}
                placeholder="名"
                required
              />
            </div>
          </div>
        </div>

        {/* メールアドレス */}
        <div className={styles.fieldGroup}>
          <label htmlFor="contact-email" className={styles.label}>
            メールアドレス<span className={styles.required}>*</span>
          </label>
          <input
            id="contact-email"
            name="field_7707595"
            type="email"
            className={styles.input}
            placeholder="info@example.com"
            required
          />
        </div>

        {/* 件名 */}
        <div className={styles.fieldGroup}>
          <label htmlFor="contact-subject" className={styles.label}>
            件名
          </label>
          <input
            id="contact-subject"
            name="field_7707596"
            type="text"
            className={styles.input}
          />
        </div>

        {/* お問合せ内容 */}
        <div className={styles.fieldGroup}>
          <label htmlFor="contact-message" className={styles.label}>
            お問合せ内容<span className={styles.required}>*</span>
          </label>
          <textarea
            id="contact-message"
            name="field_7707597"
            className={styles.textarea}
            rows={5}
            required
          />
        </div>

        <button type="submit" className={styles.submitButton}>
          確認画面へ
        </button>
      </form>
    </div>
  );
}
