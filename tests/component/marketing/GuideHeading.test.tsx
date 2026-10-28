import React from "react";
import { render, screen } from "@testing-library/react";
import { GuideHeading } from "@/components/marketing/GuideHeading/GuideHeading";

describe("GuideHeading", () => {
  it("「ステップN」で始まる h2 に id=step-N が付くこと", () => {
    render(<GuideHeading>ステップ1: URLを入力する</GuideHeading>);
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2).toHaveAttribute("id", "step-1");
    expect(h2).toHaveTextContent("ステップ1: URLを入力する");
  });

  it("「Step N」で始まる h2 にも id が付くこと", () => {
    render(<GuideHeading>Step 3: Download</GuideHeading>);
    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", "step-3");
  });

  it("ステップでない h2 には id が付かないこと", () => {
    render(<GuideHeading>まとめ</GuideHeading>);
    expect(screen.getByRole("heading", { level: 2 })).not.toHaveAttribute("id");
  });

  it("子要素に strong があっても、テキストを取り出して判定できること", () => {
    render(
      <GuideHeading>
        <strong>ステップ2</strong>: 装飾
      </GuideHeading>
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", "step-2");
  });

  it("子要素にリンクが入れ子になっていても判定できること", () => {
    render(
      <GuideHeading>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/create">
          <em>Step 1</em>
        </a>
        : Enter
      </GuideHeading>
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", "step-1");
  });

  it("「ステップ」が先頭になければ、strong の中にあっても id を付けないこと", () => {
    render(
      <GuideHeading>
        UTMの<strong>ステップ1</strong>
      </GuideHeading>
    );
    expect(screen.getByRole("heading", { level: 2 })).not.toHaveAttribute("id");
  });

  it("MDX から渡される props（className など）が保たれること", () => {
    render(
      <GuideHeading className="custom" data-x="y" title="t">
        ステップ1
      </GuideHeading>
    );
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2).toHaveClass("custom");
    expect(h2).toHaveAttribute("data-x", "y");
    expect(h2).toHaveAttribute("title", "t");
    expect(h2).toHaveAttribute("id", "step-1");
  });

  it("props に id が渡されていても、ステップ見出しでは step-N が使われ、そうでなければ元の id が残ること", () => {
    const { rerender } = render(<GuideHeading id="orig">ステップ2</GuideHeading>);
    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", "step-2");
    rerender(<GuideHeading id="orig">まとめ</GuideHeading>);
    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", "orig");
  });
});
