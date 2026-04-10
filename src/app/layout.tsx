import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Header } from "@/components/layout/Header/Header";
import { Footer } from "@/components/layout/Footer/Footer";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "QR Code Create - UTMパラメータ付きQRコード生成ツール",
    template: "%s | QR Code Create",
  },
  description:
    "UTMパラメータのガイダンス付きでQRコードを無料生成。装飾フレームやロゴ埋め込みでマーケティング効果を最大化。登録不要。",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-code-create.vercel.app"
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
