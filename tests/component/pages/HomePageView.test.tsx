import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HomePageView } from "@/components/pages/HomePageView/HomePageView";
import { ja } from "@/i18n/ja";

/**
 * HomePageView（Server Component）の locale 別描画（qr_code_create-01z.4）。
 * /en と / が同じビューを locale だけ変えて使うので、文言とリンク先の出し分けを確認する。
 */

const JAPANESE = /[぀-ゟ゠-ヿ一-鿿]/;

const h1Of = (html: string) => {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  return m ? m[1].replace(/<[^>]+>/g, "") : "";
};
const hrefsOf = (html: string) =>
  Array.from(html.matchAll(/href="([^"]*)"/g), (m) => m[1]);

describe("HomePageView locale=en", () => {
  const html = renderToStaticMarkup(<HomePageView locale="en" />);

  // 意図: 見出しが英語で、日本語が混ざらない
  it("h1 が英語の見出しを含み日本語を含まない", () => {
    const h1 = h1Of(html);
    expect(h1).toContain("Create QR codes with");
    expect(h1).toContain("UTM parameters, free");
    expect(h1).not.toMatch(JAPANESE);
  });

  // 意図: ツールへの導線が英語版 /en/create を指し、ja の /create を指さない
  it("/create へのリンクは /en/create になる", () => {
    const hrefs = hrefsOf(html);
    expect(hrefs).toContain("/en/create");
    expect(hrefs).not.toContain("/create");
  });

  // 意図: ガイドへの導線は英語版のある /en/guide/getting-started だけ（T4 で追加）。
  //       ja のガイド一覧 /guide や英語版の無い ja ページへの導線は出さない
  it("ガイドへの導線は /en/guide/getting-started だけで、ja のみのページへのリンクが無い", () => {
    const hrefs = hrefsOf(html);
    expect(hrefs).toContain("/en/guide/getting-started");
    expect(hrefs.filter((h) => /^(\/en)?\/guide/.test(h))).toEqual(
      hrefs.filter((h) => h === "/en/guide/getting-started")
    );
    for (const jaOnly of ["/guide", "/guide/getting-started", "/use-cases", "/blog", "/faq", "/poster"]) {
      expect(hrefs).not.toContain(jaOnly);
    }
  });

  // 意図: ページ本文（JSON-LD 以外）に日本語が無い
  it("本文に日本語が含まれない", () => {
    const body = html.replace(/<script[\s\S]*?<\/script>/g, "");
    expect(body).not.toMatch(JAPANESE);
  });
});

describe("HomePageView locale=ja", () => {
  const html = renderToStaticMarkup(<HomePageView locale="ja" />);

  // 意図: ja は従来どおりの日本語見出し
  it("h1 が ja 辞書の見出し", () => {
    const h1 = h1Of(html);
    expect(h1).toContain(ja.home.hero.headingLine1.trim());
    expect(h1).toContain(ja.home.hero.headingLine2.trim());
  });

  // 意図: ja は /create と /guide を指す（/en を前置しない）
  it("/create と /guide へのリンクがあり /en 始まりのリンクは無い", () => {
    const hrefs = hrefsOf(html);
    expect(hrefs).toContain("/create");
    expect(hrefs).toContain("/guide");
    expect(hrefs.filter((h) => h.startsWith("/en"))).toEqual([]);
  });
});
