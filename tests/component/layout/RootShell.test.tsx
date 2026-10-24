/**
 * @jest-environment node
 */
// RootShell（qr_code_create-01z.1）: ja / en のルートレイアウトが共有する <html> 骨格のテスト。
// <html> を含むため RTL の render ではなく renderToStaticMarkup で文字列にして検証する。
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("next/font/google", () => ({
  Noto_Sans_JP: () => ({ variable: "mock-font-variable", className: "mock-font" }),
}));

jest.mock("next/script", () => {
  const MockScript = ({ id, src }: { id?: string; src?: string }) => (
    <script data-testid="mock-script" data-id={id} data-src={src} />
  );
  MockScript.displayName = "MockScript";
  return MockScript;
});

jest.mock("@/components/layout/Header/Header", () => ({
  Header: () => <header data-mock="header">MOCK_HEADER</header>,
}));

jest.mock("@/components/layout/Footer/Footer", () => ({
  Footer: () => <footer data-mock="footer">MOCK_FOOTER</footer>,
}));

jest.mock("@/app/globals.css", () => ({}));

const GA_KEY = "NEXT_PUBLIC_GA_MEASUREMENT_ID";

/** GA_ID はモジュール読み込み時に評価されるため、環境変数を設定してから isolateModules で読み込む */
function loadRootShell(gaId: string | undefined) {
  const original = process.env[GA_KEY];
  if (gaId === undefined) {
    delete process.env[GA_KEY];
  } else {
    process.env[GA_KEY] = gaId;
  }
  let mod: typeof import("@/components/layout/RootShell/RootShell") | undefined;
  jest.isolateModules(() => {
    // GA_ID をモジュール評価時に読むため、環境変数ごとに読み込み直す必要があり require を使う
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require("@/components/layout/RootShell/RootShell");
  });
  if (original === undefined) {
    delete process.env[GA_KEY];
  } else {
    process.env[GA_KEY] = original;
  }
  return mod!.RootShell;
}

describe("RootShell", () => {
  describe.each(["ja", "en"] as const)("locale=%s", (locale) => {
    it(`<html lang="${locale}"> を出すこと`, () => {
      const RootShell = loadRootShell(undefined);
      const html = renderToStaticMarkup(
        <RootShell locale={locale}>
          <main>CHILD_CONTENT</main>
        </RootShell>
      );
      expect(html).toContain(`<html lang="${locale}"`);
    });

    it("Header・children・Footer をこの順で含むこと", () => {
      const RootShell = loadRootShell(undefined);
      const html = renderToStaticMarkup(
        <RootShell locale={locale}>
          <main>CHILD_CONTENT</main>
        </RootShell>
      );
      const h = html.indexOf("MOCK_HEADER");
      const c = html.indexOf("CHILD_CONTENT");
      const f = html.indexOf("MOCK_FOOTER");
      expect(h).toBeGreaterThan(-1);
      expect(c).toBeGreaterThan(h);
      expect(f).toBeGreaterThan(c);
    });

    it("フォントの CSS 変数クラスを <html> に付けること", () => {
      const RootShell = loadRootShell(undefined);
      const html = renderToStaticMarkup(<RootShell locale={locale}>x</RootShell>);
      expect(html).toMatch(/<html[^>]*class="mock-font-variable"/);
    });
  });

  it("NEXT_PUBLIC_GA_MEASUREMENT_ID が無いとき GA の Script を出さないこと", () => {
    const RootShell = loadRootShell(undefined);
    const html = renderToStaticMarkup(<RootShell locale="ja">x</RootShell>);
    expect(html).not.toContain("mock-script");
    expect(html).not.toContain("googletagmanager");
  });

  it("NEXT_PUBLIC_GA_MEASUREMENT_ID が空文字のとき GA の Script を出さないこと", () => {
    const RootShell = loadRootShell("");
    const html = renderToStaticMarkup(<RootShell locale="ja">x</RootShell>);
    expect(html).not.toContain("mock-script");
    expect(html).not.toContain("googletagmanager");
  });

  it("NEXT_PUBLIC_GA_MEASUREMENT_ID があるとき gtag.js と ga4-init の Script を出すこと", () => {
    const RootShell = loadRootShell("G-TEST123");
    const html = renderToStaticMarkup(<RootShell locale="en">x</RootShell>);
    expect(html).toContain('data-src="https://www.googletagmanager.com/gtag/js?id=G-TEST123"');
    expect(html).toContain('data-id="ga4-init"');
  });
});
