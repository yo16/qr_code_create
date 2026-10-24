import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HeroSection } from "@/components/top/HeroSection";
import { FeaturesSection } from "@/components/top/FeaturesSection";
import { CtaSection } from "@/components/top/CtaSection";
import { Footer } from "@/components/layout/Footer/Footer";
import { buildWebApplicationSchema } from "@/lib/schema/buildJsonLd";
import { ja } from "@/i18n/ja";

const cases = [
  ["HeroSection", HeroSection, ja.home.hero.primaryCta],
  ["FeaturesSection", FeaturesSection, ja.home.features.heading],
  ["CtaSection", CtaSection, ja.home.cta.heading],
  ["Footer", Footer, ja.footer.privacy],
] as const;

describe("Server Component の locale prop", () => {
  // 意図: locale 省略時の既定値が "ja" で、明示したときと同じ出力になる（既存ページの見た目を変えない）
  it.each(cases)(
    '%s は locale="ja" 明示と省略で同じ HTML になる',
    (_name, Component, expectedText) => {
      const explicitHtml = renderToStaticMarkup(<Component locale="ja" />);
      const defaultHtml = renderToStaticMarkup(<Component />);
      expect(defaultHtml).toBe(explicitHtml);
      // 空振り防止: 辞書の文言が実際に出ている
      expect(explicitHtml).toContain(expectedText);
    }
  );
});

describe("buildWebApplicationSchema の locale 引数", () => {
  // 意図: 引数省略時は ja と同じ JSON-LD になる
  it('buildWebApplicationSchema() と buildWebApplicationSchema("ja") が等しい', () => {
    expect(buildWebApplicationSchema()).toEqual(buildWebApplicationSchema("ja"));
  });

  // 意図: 辞書の値が JSON-LD に入っている
  it("description と featureList が ja.schema から来ている", () => {
    const schema = buildWebApplicationSchema("ja") as Record<string, unknown>;
    expect(schema.description).toBe(ja.schema.webApplication.description);
    expect(schema.featureList).toEqual(ja.schema.webApplication.featureList);
  });
});
