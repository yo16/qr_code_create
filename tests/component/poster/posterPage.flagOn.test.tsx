import React from "react";
import { render, screen } from "@testing-library/react";

// 機能フラグ モック（ON）
// posterPage.test.tsx（フラグ OFF）とは別ファイルにして、フラグ ON 時に従来どおり描画されることをガードする
jest.mock("@/lib/constants/features", () => ({
  FEATURE_FLAGS: { posterPage: true },
}));

// next/navigation notFound モック（呼ばれた場合は throw して検出できるようにする）
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("notFound called");
  }),
}));

// PosterEditorLoader モック（next/dynamic を含むため軽量な要素に差し替える）
jest.mock("@/app/(ja)/(tool)/poster/PosterEditorLoader", () => ({
  PosterEditorLoader: () => <div data-testid="poster-editor" />,
}));

// PosterPage は依存モックセットアップ後にインポート
import PosterPage from "@/app/(ja)/(tool)/poster/page";

const { notFound } = jest.requireMock("next/navigation") as { notFound: jest.Mock };

describe("PosterPage（機能フラグ ON）", () => {
  beforeEach(() => {
    notFound.mockClear();
  });

  it("FEATURE_FLAGS.posterPage=true のとき h1「印刷用QRコードポスター作成」が描画されること", () => {
    // 意図: フラグ ON では従来どおりページが描画される（機能フラグ導入による退行を防ぐ）
    render(<PosterPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "印刷用QRコードポスター作成" })
    ).toBeInTheDocument();
  });

  it("FEATURE_FLAGS.posterPage=true のとき notFound() が呼ばれないこと", () => {
    // 意図: フラグ ON で誤って 404 にならないことを保証する
    render(<PosterPage />);
    expect(notFound).not.toHaveBeenCalled();
  });

  it("FEATURE_FLAGS.posterPage=true のとき PosterEditorLoader が描画されること", () => {
    // 意図: ページ本体（エディタ読み込み部）がフラグ ON で従来どおり組み込まれていることを確認する
    render(<PosterPage />);
    expect(screen.getByTestId("poster-editor")).toBeInTheDocument();
  });

  it("JSON-LD（WebApplication と BreadcrumbList）が /poster の URL を指していること", () => {
    // 意図（qr_code_create-b4m）: SITE_URL の整理で URL 組み立てが変わっていない
    const { container } = render(<PosterPage />);
    const blocks = Array.from(container.querySelectorAll('script[type="application/ld+json"]')).map(
      (el) => JSON.parse(el.textContent ?? "{}")
    );
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://qr-create.jp";

    const app = blocks.find((b) => b["@type"] === "WebApplication");
    expect(app?.url).toBe(`${site}/poster`);
    expect(app?.name).toBe("QR Code Create - 印刷用ポスター作成");

    const crumbs = blocks.find((b) => b["@type"] === "BreadcrumbList");
    expect(crumbs?.itemListElement).toHaveLength(2);
    expect(crumbs?.itemListElement[0].item).toBe(site);
    expect(crumbs?.itemListElement[1].name).toBe("印刷用ポスター作成");
    expect(crumbs?.itemListElement[1].item).toBe(`${site}/poster`);
  });
});
