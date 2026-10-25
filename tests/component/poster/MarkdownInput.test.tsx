import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  MarkdownInput,
  DESCRIPTION_SOFT_LIMIT,
} from "@/components/poster/MarkdownInput/MarkdownInput";

// 実ユーザーに近い「入力が state に反映される」状態を作る制御ラッパー
function Controlled({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <MarkdownInput value={value} onChange={setValue} />;
}

describe("MarkdownInput", () => {
  it("入力すると onChange が入力値で呼ばれること", () => {
    const onChange = jest.fn();
    render(<MarkdownInput value="" onChange={onChange} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "## こんにちは" } });

    expect(onChange).toHaveBeenCalledWith("## こんにちは");
  });

  it("label と textarea が関連付いていること", () => {
    render(<MarkdownInput value="" onChange={() => {}} />);
    expect(screen.getByLabelText("説明文（Markdown）")).toBe(screen.getByRole("textbox"));
  });

  it("aria-describedby がヒントと文字数の要素を指すこと", () => {
    render(<MarkdownInput value="abc" onChange={() => {}} />);
    const ids = screen.getByRole("textbox").getAttribute("aria-describedby")!.split(" ");
    expect(ids).toHaveLength(2);
    const texts = ids.map((id) => document.getElementById(id)?.textContent);
    expect(texts[0]).toContain("説明文を入力します");
    expect(texts[1]).toBe(`3 / ${DESCRIPTION_SOFT_LIMIT}文字`);
  });

  it("placeholder が渡されること", () => {
    render(<MarkdownInput value="" onChange={() => {}} placeholder="例" />);
    expect(screen.getByPlaceholderText("例")).toBeInTheDocument();
  });

  describe("文字数のソフトリミット（境界値）", () => {
    it("空のときは 0 文字と表示され、警告が出ないこと", () => {
      render(<MarkdownInput value="" onChange={() => {}} />);
      expect(screen.getByText(`0 / ${DESCRIPTION_SOFT_LIMIT}文字`)).toBeInTheDocument();
      expect(screen.queryByRole("status")).toBeNull();
    });

    it("ちょうど 500 文字では警告が出ないこと", () => {
      render(<MarkdownInput value={"a".repeat(DESCRIPTION_SOFT_LIMIT)} onChange={() => {}} />);
      expect(screen.queryByRole("status")).toBeNull();
    });

    it("501 文字で警告が出ること", () => {
      render(<MarkdownInput value={"a".repeat(DESCRIPTION_SOFT_LIMIT + 1)} onChange={() => {}} />);
      expect(screen.getByRole("status")).toHaveTextContent("文字数が目安を超えています");
    });

    it("超過しても入力は止まらず、値が全文反映されること（maxLength を持たない）", () => {
      render(<Controlled initial={"a".repeat(DESCRIPTION_SOFT_LIMIT)} />);
      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      expect(textarea).not.toHaveAttribute("maxlength");

      fireEvent.change(textarea, { target: { value: "a".repeat(DESCRIPTION_SOFT_LIMIT + 100) } });

      expect(textarea.value).toHaveLength(DESCRIPTION_SOFT_LIMIT + 100);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("500 文字以下に戻すと警告が消えること", () => {
      render(<Controlled initial={"a".repeat(DESCRIPTION_SOFT_LIMIT + 1)} />);
      expect(screen.getByRole("status")).toBeInTheDocument();

      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "a".repeat(DESCRIPTION_SOFT_LIMIT) },
      });

      expect(screen.queryByRole("status")).toBeNull();
    });
  });

  it("記法ヘルプが details で用意され、画像とHTMLが使えない旨が書かれていること", () => {
    const { container } = render(<MarkdownInput value="" onChange={() => {}} />);
    expect(container.querySelector("details")).not.toBeNull();
    expect(screen.getByText("使える記法")).toBeInTheDocument();
    expect(screen.getByText("画像とHTMLタグは使えません")).toBeInTheDocument();
  });
});
