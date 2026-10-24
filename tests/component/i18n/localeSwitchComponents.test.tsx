import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getClientMessages } from "@/i18n/getDict";
import type { ClientDict } from "@/i18n/types";
import { FrameSelector } from "@/components/qr/DecorationPanel/FrameSelector";
import { UrlInput } from "@/components/qr/UrlInput/UrlInput";
import { DEFAULT_FRAME_CONFIG } from "@/lib/qr/frameRenderer";
import { trackFrameSelected } from "@/lib/analytics/events";

// GA4 イベント送信をモックし、送られる値だけを検証する
jest.mock("@/lib/analytics/events", () => ({
  trackFrameSelected: jest.fn(),
  trackUrlEntered: jest.fn(),
}));

const mockTrackFrameSelected = trackFrameSelected as jest.MockedFunction<
  typeof trackFrameSelected
>;

/** ja の Client スライスの深いコピー */
function cloneMessages(): ClientDict {
  return JSON.parse(JSON.stringify(getClientMessages("ja"))) as ClientDict;
}

/** フレーム関連の文言だけ英語にした messages */
function frameEnMessages(): ClientDict {
  const m = cloneMessages();
  m.decoration.frame.groupLabel = "{category} frames";
  m.decoration.frame.itemLabel = "Frame: {label}";
  m.decoration.frame.categories = {
    basic: "Basic",
    ornate: "Ornate",
    target: "By audience",
    imageSimple: "Image: simple",
    imageOrnate: "Image: ornate",
  };
  m.decoration.frame.labels = {
    ...m.decoration.frame.labels,
    none: "None",
    simple: "Simple",
    rounded: "Rounded",
    ornate: "Ornate",
    elegant: "Elegant",
    pop: "Pop",
    business: "Business",
    festive: "Festive",
    "img-simple-black": "Black",
    "img-simple-blue": "Blue",
    "img-simple-gray": "Gray",
    "img-simple-red": "Red",
    "img-elaborated-japanese": "Japanese",
    "img-elaborated-gothic": "Gothic",
    "img-elaborated-baroque": "Baroque",
  };
  return m;
}

describe("FrameSelector（en の messages）", () => {
  beforeEach(() => {
    mockTrackFrameSelected.mockClear();
  });

  // 意図: 見出し・グループの aria-label・ボタンの aria-label とラベルが辞書（英語）から出る
  it("見出しと aria-label が英語になる", () => {
    render(
      <I18nProvider locale="en" messages={frameEnMessages()}>
        <FrameSelector frame={DEFAULT_FRAME_CONFIG} onChange={jest.fn()} />
      </I18nProvider>
    );
    expect(screen.getByRole("group", { name: "Basic frames" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Ornate frames" })).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "By audience frames" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Image: simple frames" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Image: ornate frames" })
    ).toBeInTheDocument();
    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Frame: None" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Frame: Baroque" })).toBeInTheDocument();
    // 日本語のカテゴリ見出しは出ない
    expect(screen.queryByText("基本")).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "基本フレーム" })).not.toBeInTheDocument();
  });

  // 意図: 表示は英語でも、GA に送る category は ja の値のまま（レポートが言語で割れない）
  it("クリックすると trackFrameSelected が ja の category で呼ばれる", () => {
    const onChange = jest.fn();
    render(
      <I18nProvider locale="en" messages={frameEnMessages()}>
        <FrameSelector frame={DEFAULT_FRAME_CONFIG} onChange={onChange} />
      </I18nProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "Frame: Simple" }));
    expect(mockTrackFrameSelected).toHaveBeenCalledWith("simple", "基本");
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FRAME_CONFIG, type: "simple" });

    fireEvent.click(screen.getByRole("button", { name: "Frame: Japanese" }));
    expect(mockTrackFrameSelected).toHaveBeenLastCalledWith(
      "img-elaborated-japanese",
      "画像：装飾"
    );
  });
});

/** 実際の使い方に合わせた制御コンポーネント */
function UrlInputWrapper() {
  const [value, setValue] = useState("");
  return <UrlInput value={value} onChange={setValue} />;
}

describe("UrlInput（en の messages）", () => {
  // 意図: バリデーションのエラー文が Provider の辞書から出る
  it("無効な URL で英語のエラー文が出る", () => {
    const m = cloneMessages();
    m.tool.validation.invalidUrl = "Please enter a valid URL";
    m.tool.urlInput.label = "Page URL";
    render(
      <I18nProvider locale="en" messages={m}>
        <UrlInputWrapper />
      </I18nProvider>
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "not-a-url" },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Please enter a valid URL");
    expect(screen.queryByText("有効なURLを入力してください")).not.toBeInTheDocument();
    expect(screen.getByText("Page URL", { selector: "label" })).toBeInTheDocument();
  });
});
