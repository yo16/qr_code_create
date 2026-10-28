import Link from "next/link";
import { getDict } from "@/i18n/getDict";
import type { Locale } from "@/i18n/types";
import { FEATURE_FLAGS } from "@/lib/constants/features";
import { Container } from "../Container/Container";
import styles from "./Footer.module.css";

interface FooterProps {
  locale?: Locale;
}

export function Footer({ locale = "ja" }: FooterProps = {}) {
  const { footer } = getDict(locale);
  const isNonJa = locale !== "ja";
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.inner}>
          {isNonJa ? (
            // 翻訳版の無い規約系は日本語ページへリンクし、リンク名と注記で日本語だと伝える
            <>
              <div className={styles.links}>
                <Link href="/privacy" hrefLang="ja">
                  {footer.privacy}
                </Link>
                <Link href="/terms" hrefLang="ja">
                  {footer.terms}
                </Link>
                <Link href="/contact" hrefLang="ja">
                  {footer.contact}
                </Link>
              </div>
              <p className={styles.note}>{footer.japaneseOnlyNote}</p>
            </>
          ) : (
            <div className={styles.links}>
              <Link href="/privacy">{footer.privacy}</Link>
              <Link href="/terms">{footer.terms}</Link>
              <Link href="/faq">{footer.faq}</Link>
              {FEATURE_FLAGS.posterPage && <Link href="/poster">{footer.poster}</Link>}
              <Link href="/contact">{footer.contact}</Link>
            </div>
          )}
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} QR Code Create
          </p>
          <p className={styles.credit}>
            Built by{" "}
            <a href="https://smallpiece.jp/?utm_source=qr-create&utm_medium=referral&utm_campaign=footer_credit" target="_blank" rel="noopener noreferrer">
              Small Piece
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
