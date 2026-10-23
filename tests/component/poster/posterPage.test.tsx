import React from "react";
import { render, screen } from "@testing-library/react";

// 機能フラグ モック（OFF）
// jest.mock はファイル単位で固定されるため、フラグ ON の挙動は posterPage.flagOn.test.tsx で検証する
jest.mock("@/lib/constants/features", () => ({
  FEATURE_FLAGS: { posterPage: false },
}));

// next/navigation notFound モック（Next.js 本体と同様に throw して描画を中断する）
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

describe("PosterPage（機能フラグ OFF）", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    notFound.mockClear();
    // 描画中の throw を React / jsdom が console.error に出力するため、テスト出力を汚さないよう抑制する
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("FEATURE_FLAGS.posterPage=false のとき notFound() が呼ばれて描画が中断されること", () => {
    // 意図: 未完成の /poster に直接アクセスされても、本番では 404 として扱う
    expect(() => render(<PosterPage />)).toThrow("notFound called");
    expect(notFound).toHaveBeenCalled();
  });

  it("FEATURE_FLAGS.posterPage=false のとき h1 と PosterEditorLoader が描画されないこと", () => {
    // 意図: notFound() より前にページ内容が描画（コミット）されていないことを保証する
    try {
      render(<PosterPage />);
    } catch {
      // notFound() による描画中断は想定どおりなので無視する
    }
    expect(
      screen.queryByRole("heading", { level: 1, name: "印刷用QRコードポスター作成" })
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("poster-editor")).not.toBeInTheDocument();
  });
});
