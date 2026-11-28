import React from "react";
import fs from "fs";
import path from "path";
import { render } from "@testing-library/react";
import { Footer } from "@/components/layout/Footer/Footer";
import { LOCALES } from "@/i18n/locales";
import type { Locale } from "@/i18n/types";

/**
 * Footer の登録商標の表記（qr_code_create-7mk）。
 * 文面はデンソーウェーブの公式 FAQ の例文で、期待値は辞書から読まず直接書く。
 */

const TRADEMARK: Record<Locale, string> = {
  ja: "QRコードは株式会社デンソーウェーブの登録商標です。",
  en: "QR Code is a registered trademark of DENSO WAVE INCORPORATED in Japan and in other countries.",
  es: "QR Code es una marca registrada de DENSO WAVE INCORPORATED en Japón y en otros países.",
  "pt-br": "QR Code é uma marca registrada da DENSO WAVE INCORPORATED no Japão e em outros países.",
  de: "QR Code ist eine eingetragene Marke von DENSO WAVE INCORPORATED in Japan und in anderen Ländern.",
};

const countIn = (text: string, s: string) => text.split(s).length - 1;

describe("Footer の商標表記", () => {
  // locale なし（既定の ja）
  it("locale 無しでは日本語の文が 1 回だけ出る", () => {
    const { container } = render(<Footer />);
    expect(countIn(container.textContent ?? "", TRADEMARK.ja)).toBe(1);
  });

  it.each(LOCALES)("%s: その言語の文が <footer> の中の <p> に 1 回だけあり、他言語の文は無い", (locale) => {
    const { container } = render(<Footer locale={locale} />);
    const footer = container.querySelector("footer");
    expect(footer).not.toBeNull();
    const matches = Array.from(footer!.querySelectorAll("p")).filter((p) => p.textContent === TRADEMARK[locale]);
    expect(matches).toHaveLength(1);
    expect(countIn(container.textContent ?? "", TRADEMARK[locale])).toBe(1);
    for (const other of LOCALES.filter((l) => l !== locale)) {
      expect(container.textContent).not.toContain(TRADEMARK[other]);
    }
  });

  it.each(LOCALES)("%s: 商標の <p> は著作権表示（©）の <p> のすぐ次にある", (locale) => {
    const { container } = render(<Footer locale={locale} />);
    const ps = Array.from(container.querySelectorAll("footer p"));
    const credit = ps.findIndex((p) => p.textContent?.includes("©"));
    const trademark = ps.findIndex((p) => p.textContent === TRADEMARK[locale]);
    expect(credit).toBeGreaterThanOrEqual(0);
    expect(trademark).toBe(credit + 1);
  });

  it.each(LOCALES)("%s: 商標の文に © や Small Piece のリンクは混ざらない", (locale) => {
    const { container } = render(<Footer locale={locale} />);
    const p = Array.from(container.querySelectorAll("footer p")).find((x) => x.textContent === TRADEMARK[locale]);
    expect(p?.querySelector("a")).toBeNull();
    expect(p?.textContent).not.toContain("©");
  });

  // 既存の要素が残っている
  it.each(LOCALES)("%s: Small Piece へのリンクが UTM つきのまま残っている", (locale) => {
    const { container } = render(<Footer locale={locale} />);
    const a = container.querySelector('a[href^="https://smallpiece.jp/"]');
    expect(a).toHaveAttribute(
      "href",
      "https://smallpiece.jp/?utm_source=qr-code-create&utm_medium=referral&utm_content=footer"
    );
  });

  it("ja: 既存のリンクが残り、ja 以外の注記は出ない", () => {
    const { container } = render(<Footer locale="ja" />);
    for (const href of ["/privacy", "/terms", "/faq", "/contact"]) {
      expect(container.querySelector(`a[href="${href}"]`)).not.toBeNull();
    }
    expect(container.querySelectorAll("footer p")).toHaveLength(2);
  });

  it.each(["en", "es", "pt-br", "de"] as const)("%s: 日本語ページへのリンク 3 本と注記が残る（p は注記・著作権・商標の 3 つ）", (locale) => {
    const { container } = render(<Footer locale={locale} />);
    for (const href of ["/privacy", "/terms", "/contact"]) {
      expect(container.querySelector(`a[href="${href}"][hreflang="ja"]`)).not.toBeNull();
    }
    expect(container.querySelectorAll("footer p")).toHaveLength(3);
  });
});

describe("Footer.module.css の .trademark", () => {
  const css = fs.readFileSync(
    path.join(process.cwd(), "src", "components", "layout", "Footer", "Footer.module.css"),
    "utf8"
  );
  const block = css.match(/\.trademark\s*\{([^}]*)\}/)?.[1] ?? "";

  it(".trademark があり、文字サイズと色をトークンで指定している", () => {
    expect(block).not.toBe("");
    expect(block).toMatch(/font-size:\s*var\(--font-size-xs\)/);
    expect(block).toMatch(/color:\s*var\(--color-muted\)/);
  });

  it("Tailwind の @apply を使っていない", () => {
    expect(css).not.toContain("@apply");
  });
});
