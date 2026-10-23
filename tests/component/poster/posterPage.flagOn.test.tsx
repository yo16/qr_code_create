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
jest.mock("@/app/(tool)/poster/PosterEditorLoader", () => ({
  PosterEditorLoader: () => <div data-testid="poster-editor" />,
}));

// PosterPage は依存モックセットアップ後にインポート
import PosterPage from "@/app/(tool)/poster/page";

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
});
