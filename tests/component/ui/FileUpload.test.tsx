import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fireEvent } from "@testing-library/react";
import { FileUpload } from "@/components/ui/FileUpload/FileUpload";

describe("FileUpload", () => {
  describe("正常系", () => {
    it("ラベルが表示されること", () => {
      render(<FileUpload label="ロゴ画像" onFileSelect={jest.fn()} />);
      expect(screen.getByText("ロゴ画像")).toBeInTheDocument();
    });

    it("ファイル選択でonFileSelectが呼ばれること", () => {
      const handleFileSelect = jest.fn();
      render(
        <FileUpload label="ロゴ画像" onFileSelect={handleFileSelect} />
      );
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = new File(["content"], "test.png", { type: "image/png" });
      fireEvent.change(input, { target: { files: [file] } });
      expect(handleFileSelect).toHaveBeenCalledWith(file);
    });

    it("ファイル選択後にファイル名が表示されること", () => {
      render(<FileUpload label="ロゴ画像" onFileSelect={jest.fn()} />);
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = new File(["content"], "logo.png", { type: "image/png" });
      fireEvent.change(input, { target: { files: [file] } });
      expect(screen.getByText("logo.png")).toBeInTheDocument();
    });

    it("previewが指定された場合にimg要素が表示されること", () => {
      render(
        <FileUpload
          label="ロゴ画像"
          onFileSelect={jest.fn()}
          preview="data:image/png;base64,abc"
        />
      );
      const img = screen.getByAltText("プレビュー");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "data:image/png;base64,abc");
    });
  });

  describe("異常系・エッジケース", () => {
    it("maxSizeKB超過でエラーメッセージが表示されること", () => {
      const handleFileSelect = jest.fn();
      render(
        <FileUpload
          label="ロゴ画像"
          onFileSelect={handleFileSelect}
          maxSizeKB={1}
        />
      );
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      // 2KBのファイルを作成（1KB超）
      const largeContent = "a".repeat(2 * 1024);
      const file = new File([largeContent], "large.png", {
        type: "image/png",
      });
      fireEvent.change(input, { target: { files: [file] } });
      expect(
        screen.getByText("ファイルサイズが上限（1KB）を超えています。")
      ).toBeInTheDocument();
      expect(handleFileSelect).toHaveBeenCalledWith(null);
    });

    it("maxSizeKB超過でエラーがrole='alert'で表示されること", () => {
      render(
        <FileUpload
          label="ロゴ画像"
          onFileSelect={jest.fn()}
          maxSizeKB={1}
        />
      );
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const largeContent = "a".repeat(2 * 1024);
      const file = new File([largeContent], "large.png", {
        type: "image/png",
      });
      fireEvent.change(input, { target: { files: [file] } });
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("外部errorプロパティが表示されること", () => {
      render(
        <FileUpload
          label="ロゴ画像"
          onFileSelect={jest.fn()}
          error="ファイルを選択してください"
        />
      );
      expect(
        screen.getByText("ファイルを選択してください")
      ).toBeInTheDocument();
    });

    it("ドロップゾーンに適切なaria-labelが付与されること", () => {
      render(<FileUpload label="ロゴ画像" onFileSelect={jest.fn()} />);
      const dropZone = screen.getByRole("button");
      expect(dropZone).toHaveAttribute(
        "aria-label",
        "ロゴ画像。クリックまたはドラッグ&ドロップでファイルを選択"
      );
    });

    it("ドラッグオーバー時にdraggingスタイルが適用されること", () => {
      render(<FileUpload label="ロゴ画像" onFileSelect={jest.fn()} />);
      const dropZone = screen.getByRole("button");
      fireEvent.dragOver(dropZone, { preventDefault: () => {} });
      expect(dropZone.className).toMatch(/dragging/);
    });

    it("ドロップでファイルが処理されること", () => {
      const handleFileSelect = jest.fn();
      render(<FileUpload label="ロゴ画像" onFileSelect={handleFileSelect} />);
      const dropZone = screen.getByRole("button");
      const file = new File(["content"], "dropped.png", { type: "image/png" });
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });
      expect(handleFileSelect).toHaveBeenCalledWith(file);
    });

    it("ファイル削除ボタンクリックでonFileSelect(null)が呼ばれること", () => {
      const handleFileSelect = jest.fn();
      render(<FileUpload label="ロゴ画像" onFileSelect={handleFileSelect} />);
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const file = new File(["content"], "test.png", { type: "image/png" });
      fireEvent.change(input, { target: { files: [file] } });
      handleFileSelect.mockClear();
      const removeButton = screen.getByRole("button", {
        name: "選択したファイルを削除",
      });
      fireEvent.click(removeButton);
      expect(handleFileSelect).toHaveBeenCalledWith(null);
    });

    it("accept属性の対応形式テキストが表示されること", () => {
      render(
        <FileUpload
          label="ロゴ画像"
          onFileSelect={jest.fn()}
          accept="image/png,image/jpeg"
        />
      );
      expect(
        screen.getByText("対応形式: image/png,image/jpeg")
      ).toBeInTheDocument();
    });

    it("maxSizeKBの最大サイズテキストが表示されること", () => {
      render(
        <FileUpload label="ロゴ画像" onFileSelect={jest.fn()} maxSizeKB={500} />
      );
      expect(screen.getByText("最大サイズ: 500KB")).toBeInTheDocument();
    });
  });
});
