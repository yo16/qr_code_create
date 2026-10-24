import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CreatePageView } from "@/components/pages/CreatePageView/CreatePageView";

/**
 * CreatePageView（Server Component）の locale 別見出し（qr_code_create-01z.4）。
 * 生成ツール本体（QrGeneratorLoader）は dynamic import と useSearchParams を使うのでモックする。
 */
jest.mock("@/components/pages/CreatePageView/QrGeneratorLoader", () => ({
  QrGeneratorLoader: () => <div data-testid="qr-generator-loader" />,
}));

const h1Of = (html: string) => {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  return m ? m[1] : "";
};

describe("CreatePageView", () => {
  // 意図: en の見出しが英語
  it('locale="en" の h1 は「Create a QR code」', () => {
    const html = renderToStaticMarkup(<CreatePageView locale="en" />);
    expect(h1Of(html)).toBe("Create a QR code");
    expect(html).toContain('data-testid="qr-generator-loader"');
  });

  // 意図: ja の見出しは従来どおり
  it('locale="ja" の h1 は「QRコード生成」', () => {
    const html = renderToStaticMarkup(<CreatePageView locale="ja" />);
    expect(h1Of(html)).toBe("QRコード生成");
    expect(html).toContain('data-testid="qr-generator-loader"');
  });
});
