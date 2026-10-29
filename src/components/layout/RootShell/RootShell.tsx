import { Noto_Sans_JP } from "next/font/google";
import Script from "next/script";
import { Header } from "@/components/layout/Header/Header";
import { Footer } from "@/components/layout/Footer/Footer";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getClientMessages } from "@/i18n/getDict";
import type { Locale } from "@/i18n/types";
import { LOCALE_CONFIG } from "@/lib/i18n/localeConfig";
import "@/app/globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

interface RootShellProps {
  locale: Locale;
  children: React.ReactNode;
}

export function RootShell({ locale, children }: RootShellProps) {
  return (
    <html lang={LOCALE_CONFIG[locale].htmlLang} className={notoSansJP.variable}>
      <body>
        {/* ja は Provider なしの既定（ja）に任せ、同じ文字列を RSC ペイロードに二重に載せない */}
        {locale !== "ja" ? (
          <I18nProvider locale={locale} messages={getClientMessages(locale)}>
            <Header locale={locale} />
            {children}
            <Footer locale={locale} />
          </I18nProvider>
        ) : (
          <>
            <Header />
            {children}
            <Footer />
          </>
        )}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
