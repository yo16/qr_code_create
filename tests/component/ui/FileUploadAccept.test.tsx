import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileUpload } from "@/components/ui/FileUpload/FileUpload";
import { jaClient as ja } from "@/i18n/jaClient";

const UNSUPPORTED = ja.ui.fileUpload.unsupportedType;

function setup(accept?: string) {
  const onFileSelect = jest.fn();
  render(<FileUpload label="ロゴ画像" accept={accept} onFileSelect={onFileSelect} />);
  const dropZone = screen.getByRole("button", { name: /ロゴ画像/ });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  return { onFileSelect, dropZone, input };
}

function drop(zone: HTMLElement, file: File): void {
  fireEvent.drop(zone, { dataTransfer: { files: [file] } });
}

describe("FileUpload accept の許可リスト照合", () => {
  describe("ドロップ", () => {
    it("text/html のファイルは onFileSelect(file) が呼ばれず、エラーが出る", () => {
      const { onFileSelect, dropZone } = setup("image/png,image/jpeg,image/svg+xml");
      const file = new File(["<script>"], "evil.html", { type: "text/html" });
      drop(dropZone, file);
      expect(onFileSelect).not.toHaveBeenCalledWith(file);
      expect(onFileSelect).toHaveBeenCalledWith(null);
      expect(screen.getByRole("alert")).toHaveTextContent(UNSUPPORTED);
      expect(screen.queryByText("evil.html")).not.toBeInTheDocument();
    });

    it("許可された MIME のファイルはドロップで受け付ける", () => {
      const { onFileSelect, dropZone } = setup("image/png,image/jpeg");
      const file = new File(["x"], "a.png", { type: "image/png" });
      drop(dropZone, file);
      expect(onFileSelect).toHaveBeenCalledWith(file);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("選択", () => {
    it("input 経由でも不許可の形式は拒否される", () => {
      const { onFileSelect, input } = setup("image/png");
      const file = new File(["x"], "a.gif", { type: "image/gif" });
      fireEvent.change(input, { target: { files: [file] } });
      expect(onFileSelect).not.toHaveBeenCalledWith(file);
      expect(screen.getByRole("alert")).toHaveTextContent(UNSUPPORTED);
    });

    it("拒否の後に許可されたファイルを選ぶとエラーが消える", () => {
      const { onFileSelect, input } = setup("image/png");
      fireEvent.change(input, { target: { files: [new File(["x"], "a.gif", { type: "image/gif" })] } });
      expect(screen.getByRole("alert")).toBeInTheDocument();
      const ok = new File(["x"], "a.png", { type: "image/png" });
      fireEvent.change(input, { target: { files: [ok] } });
      expect(onFileSelect).toHaveBeenLastCalledWith(ok);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("accept の書式", () => {
    it.each([
      ["MIME 完全一致で許可", "image/png", "a.png", "image/png", true],
      ["MIME 完全一致で別 MIME を拒否", "image/png", "a.jpg", "image/jpeg", false],
      ["MIME は大文字小文字を区別しない", "IMAGE/PNG", "a.png", "image/png", true],
      ["カンマ後の空白を許す", "image/png, image/jpeg", "a.jpg", "image/jpeg", true],
      ["image/* で image 配下を許可", "image/*", "a.webp", "image/webp", true],
      ["image/* で text を拒否", "image/*", "a.txt", "text/plain", false],
      ["image/* は接頭辞だけの似た MIME を許可しない", "image/*", "a.x", "imagefoo/png", false],
      ["拡張子で許可", ".svg", "logo.svg", "image/svg+xml", true],
      ["拡張子は大文字でも許可", ".svg", "LOGO.SVG", "image/svg+xml", true],
      ["拡張子が違えば拒否", ".svg", "logo.png", "image/png", false],
      ["拡張子だけでなく末尾で判定する", ".svg", "logo.svg.html", "text/html", false],
    ])("%s", (_name, accept, fileName, mime, allowed) => {
      const { onFileSelect, input } = setup(accept);
      const file = new File(["x"], fileName, { type: mime });
      fireEvent.change(input, { target: { files: [file] } });
      if (allowed) {
        expect(onFileSelect).toHaveBeenCalledWith(file);
      } else {
        expect(onFileSelect).not.toHaveBeenCalledWith(file);
        expect(screen.getByRole("alert")).toHaveTextContent(UNSUPPORTED);
      }
    });

    it("accept が未指定ならどの形式も許可する", () => {
      const { onFileSelect, input } = setup();
      const file = new File(["x"], "a.html", { type: "text/html" });
      fireEvent.change(input, { target: { files: [file] } });
      expect(onFileSelect).toHaveBeenCalledWith(file);
    });
  });

  describe("MIME が空のファイル", () => {
    it("MIME 指定の accept では拒否される", () => {
      const { onFileSelect, input } = setup("image/png");
      const file = new File(["x"], "a.png", { type: "" });
      fireEvent.change(input, { target: { files: [file] } });
      expect(onFileSelect).not.toHaveBeenCalledWith(file);
      expect(screen.getByRole("alert")).toHaveTextContent(UNSUPPORTED);
    });

    it("image/* でも拒否される", () => {
      const { onFileSelect, input } = setup("image/*");
      const file = new File(["x"], "a.png", { type: "" });
      fireEvent.change(input, { target: { files: [file] } });
      expect(onFileSelect).not.toHaveBeenCalledWith(file);
    });

    it("拡張子指定の accept では拡張子が合えば許可される", () => {
      const { onFileSelect, input } = setup(".svg");
      const file = new File(["x"], "logo.svg", { type: "" });
      fireEvent.change(input, { target: { files: [file] } });
      expect(onFileSelect).toHaveBeenCalledWith(file);
    });
  });
});
