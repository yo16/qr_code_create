import Link from "next/link";
import { Container } from "../Container/Container";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.inner}>
          <div className={styles.links}>
            <Link href="/privacy">プライバシーポリシー</Link>
            <Link href="/terms">利用規約</Link>
            <Link href="/faq">よくある質問</Link>
          </div>
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} QR Code Create
          </p>
        </div>
      </Container>
    </footer>
  );
}
