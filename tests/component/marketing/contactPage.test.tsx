import React from "react";
import { render, screen } from "@testing-library/react";
import ContactPage from "@/app/(marketing)/contact/page";

jest.mock("next/link", () => {
  const MockLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("ContactPage", () => {
  it("エラーなくレンダリングされること", () => {
    expect(() => render(<ContactPage />)).not.toThrow();
  });

  it("「お問い合わせ」の見出しが表示されること", () => {
    render(<ContactPage />);
    expect(screen.getByRole("heading", { level: 1, name: "お問い合わせ" })).toBeInTheDocument();
  });

  it("フォームが存在すること", () => {
    const { container } = render(<ContactPage />);
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
  });

  it("フォームのaction属性がフォームメーラーのURLであること", () => {
    const { container } = render(<ContactPage />);
    const form = container.querySelector("form");
    expect(form?.getAttribute("action")).toBe("https://ssl.form-mailer.jp/fm/service/Forms/confirm");
  });

  it("フォームのmethod属性がpostであること", () => {
    const { container } = render(<ContactPage />);
    const form = container.querySelector("form");
    expect(form?.getAttribute("method")).toBe("post");
  });

  it("hidden input にkey値が設定されていること", () => {
    const { container } = render(<ContactPage />);
    const keyInput = container.querySelector('input[name="key"]') as HTMLInputElement;
    expect(keyInput).not.toBeNull();
    expect(keyInput.value).toBe("bd905569880937");
    expect(keyInput.type).toBe("hidden");
  });

  it("hidden input にcode=utf8が設定されていること", () => {
    const { container } = render(<ContactPage />);
    const codeInput = container.querySelector('input[name="code"]') as HTMLInputElement;
    expect(codeInput).not.toBeNull();
    expect(codeInput.value).toBe("utf8");
  });

  it("姓フィールド（field_7707589_sei）が存在すること", () => {
    const { container } = render(<ContactPage />);
    const input = container.querySelector('input[name="field_7707589_sei"]');
    expect(input).not.toBeNull();
  });

  it("名フィールド（field_7707589_mei）が存在すること", () => {
    const { container } = render(<ContactPage />);
    const input = container.querySelector('input[name="field_7707589_mei"]');
    expect(input).not.toBeNull();
  });

  it("メールアドレスフィールド（field_7707595）が存在すること", () => {
    const { container } = render(<ContactPage />);
    const input = container.querySelector('input[name="field_7707595"]');
    expect(input).not.toBeNull();
  });

  it("件名フィールド（field_7707596）が存在すること", () => {
    const { container } = render(<ContactPage />);
    const input = container.querySelector('input[name="field_7707596"]');
    expect(input).not.toBeNull();
  });

  it("お問合せ内容フィールド（field_7707597）がtextareaであること", () => {
    const { container } = render(<ContactPage />);
    const textarea = container.querySelector('textarea[name="field_7707597"]');
    expect(textarea).not.toBeNull();
  });

  it("送信ボタン（確認画面へ）が存在すること", () => {
    render(<ContactPage />);
    expect(screen.getByRole("button", { name: "確認画面へ" })).toBeInTheDocument();
  });

  it("必須フィールドにrequired属性が設定されていること", () => {
    const { container } = render(<ContactPage />);
    const seiInput = container.querySelector('input[name="field_7707589_sei"]') as HTMLInputElement;
    const meiInput = container.querySelector('input[name="field_7707589_mei"]') as HTMLInputElement;
    const emailInput = container.querySelector('input[name="field_7707595"]') as HTMLInputElement;
    const messageTextarea = container.querySelector('textarea[name="field_7707597"]') as HTMLTextAreaElement;
    expect(seiInput.required).toBe(true);
    expect(meiInput.required).toBe(true);
    expect(emailInput.required).toBe(true);
    expect(messageTextarea.required).toBe(true);
  });

  it("件名フィールドにrequired属性が設定されていないこと", () => {
    const { container } = render(<ContactPage />);
    const subjectInput = container.querySelector('input[name="field_7707596"]') as HTMLInputElement;
    expect(subjectInput.required).toBe(false);
  });
});
