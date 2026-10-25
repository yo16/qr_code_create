import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { PdfDownloadButton } from "@/components/poster/PdfDownloadButton/PdfDownloadButton";

const mockGeneratePosterPdf = jest.fn();
jest.mock("@/lib/pdf/generatePosterPdf", () => ({
  generatePosterPdf: (...args: unknown[]) => mockGeneratePosterPdf(...args),
}));

const mockTrackPosterGenerated = jest.fn();
const mockTrackErrorOccurred = jest.fn();
jest.mock("@/lib/analytics/events", () => ({
  trackPosterGenerated: (...args: unknown[]) => mockTrackPosterGenerated(...args),
  trackErrorOccurred: (...args: unknown[]) => mockTrackErrorOccurred(...args),
}));

const READY_LABEL = "PDFをダウンロード（A4印刷用）";

type Props = React.ComponentProps<typeof PdfDownloadButton>;

function setup(props: Partial<Props> = {}) {
  const element = document.createElement("div");
  const previewRef = { current: element } as React.RefObject<HTMLDivElement | null>;
  const utils = render(
    <PdfDownloadButton
      previewRef={previewRef}
      hasUtm={true}
      hasLogo={false}
      descriptionLength={12}
      {...props}
    />
  );
  const rerenderWith = (next: Partial<Props>) =>
    utils.rerender(
      <PdfDownloadButton
        previewRef={previewRef}
        hasUtm={true}
        hasLogo={false}
        descriptionLength={12}
        {...props}
        {...next}
      />
    );
  return { element, rerenderWith, ...utils };
}

let clickedLinks: HTMLAnchorElement[];
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockGeneratePosterPdf.mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" }));
  mockCreateObjectURL.mockReturnValue("blob:mock-url");
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: mockCreateObjectURL });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: mockRevokeObjectURL });
  clickedLinks = [];
  jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement
  ) {
    clickedLinks.push(this);
  });
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe("PdfDownloadButton", () => {
  describe("生成と保存", () => {
    it("クリックで generatePosterPdf が previewElement を渡して呼ばれること", async () => {
      const { element } = setup();

      fireEvent.click(screen.getByRole("button", { name: READY_LABEL }));

      await waitFor(() => expect(mockGeneratePosterPdf).toHaveBeenCalledTimes(1));
      expect(mockGeneratePosterPdf).toHaveBeenCalledWith({ previewElement: element });
    });

    it("生成した Blob が qr-poster-YYYYMMDD-HHmmss.pdf の名前の a 要素で保存されること", async () => {
      setup();

      fireEvent.click(screen.getByRole("button", { name: READY_LABEL }));

      await waitFor(() => expect(clickedLinks).toHaveLength(1));
      expect(clickedLinks[0].download).toMatch(/^qr-poster-\d{8}-\d{6}\.pdf$/);
      expect(clickedLinks[0].href).toBe("blob:mock-url");
      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    });

    it("保存に使った一時 a 要素が DOM に残らないこと", async () => {
      setup();
      fireEvent.click(screen.getByRole("button", { name: READY_LABEL }));
      await waitFor(() => expect(clickedLinks).toHaveLength(1));

      expect(document.body.querySelector("a[download]")).toBeNull();
    });

    it("revokeObjectURL は保存の直後ではなく 1 秒後に呼ばれること", async () => {
      jest.useFakeTimers();
      setup();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: READY_LABEL }));
      });
      await waitFor(() => expect(clickedLinks).toHaveLength(1));

      expect(mockRevokeObjectURL).not.toHaveBeenCalled();
      act(() => {
        jest.advanceTimersByTime(999);
      });
      expect(mockRevokeObjectURL).not.toHaveBeenCalled();
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });
  });

  describe("押せない条件", () => {
    it("ready が false のとき無効で「QRコードを準備中...」と表示され、押しても生成されないこと", () => {
      setup({ ready: false });

      const button = screen.getByRole("button", { name: "QRコードを準備中..." });
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(mockGeneratePosterPdf).not.toHaveBeenCalled();
    });

    it("disabled（説明文が空・URL が無効など）のとき押せず、準備中とは表示しないこと", () => {
      setup({ disabled: true, ready: false });

      const button = screen.getByRole("button", { name: READY_LABEL });
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(mockGeneratePosterPdf).not.toHaveBeenCalled();
      expect(screen.queryByText("QRコードを準備中...")).toBeNull();
    });

    it("ready と disabled の既定値では押せること", () => {
      setup();
      expect(screen.getByRole("button", { name: READY_LABEL })).not.toBeDisabled();
    });

    it("ready が false から true に変わると押せるようになること", () => {
      const { rerenderWith } = setup({ ready: false });
      expect(screen.getByRole("button")).toBeDisabled();

      rerenderWith({ ready: true });

      expect(screen.getByRole("button", { name: READY_LABEL })).not.toBeDisabled();
    });

    it("生成中は「生成中...」で無効になり、二重に生成されないこと", async () => {
      let resolvePdf!: (blob: Blob) => void;
      mockGeneratePosterPdf.mockReturnValue(
        new Promise<Blob>((resolve) => {
          resolvePdf = resolve;
        })
      );
      setup();

      fireEvent.click(screen.getByRole("button", { name: READY_LABEL }));

      const busy = await screen.findByRole("button", { name: "生成中..." });
      expect(busy).toHaveAttribute("aria-busy", "true");
      expect(busy).toBeDisabled();
      fireEvent.click(busy);
      expect(mockGeneratePosterPdf).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolvePdf(new Blob(["pdf"]));
      });
      await waitFor(() =>
        expect(screen.getByRole("button", { name: READY_LABEL })).not.toBeDisabled()
      );
    });
  });

  describe("成功時", () => {
    it("trackPosterGenerated が hasUtm・hasLogo・descriptionLength で呼ばれ、エラー計測は呼ばれないこと", async () => {
      setup({ hasUtm: true, hasLogo: true, descriptionLength: 42 });

      fireEvent.click(screen.getByRole("button", { name: READY_LABEL }));

      await waitFor(() => expect(mockTrackPosterGenerated).toHaveBeenCalledTimes(1));
      expect(mockTrackPosterGenerated).toHaveBeenCalledWith({
        hasUtm: true,
        hasLogo: true,
        descriptionLength: 42,
      });
      expect(mockTrackErrorOccurred).not.toHaveBeenCalled();
    });

    it("成功メッセージが出て、4 秒後に消えること", async () => {
      jest.useFakeTimers();
      setup();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: READY_LABEL }));
      });
      await waitFor(() => expect(screen.getByText("PDFをダウンロードしました")).toBeInTheDocument());

      act(() => {
        jest.advanceTimersByTime(4000);
      });
      expect(screen.queryByText("PDFをダウンロードしました")).toBeNull();
    });
  });

  describe("失敗時", () => {
    it("trackErrorOccurred('pdf_generate', 'poster') が呼ばれ、role=alert のエラーが出ること", async () => {
      mockGeneratePosterPdf.mockRejectedValue(new Error("boom"));
      setup();

      fireEvent.click(screen.getByRole("button", { name: READY_LABEL }));

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("PDFの生成に失敗しました");
      expect(mockTrackErrorOccurred).toHaveBeenCalledWith("pdf_generate", "poster");
      expect(mockTrackPosterGenerated).not.toHaveBeenCalled();
      expect(clickedLinks).toHaveLength(0);
    });

    it("失敗後はボタンが再び押せること", async () => {
      mockGeneratePosterPdf.mockRejectedValueOnce(new Error("boom"));
      setup();

      fireEvent.click(screen.getByRole("button", { name: READY_LABEL }));
      await screen.findByRole("alert");

      expect(screen.getByRole("button", { name: READY_LABEL })).not.toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: READY_LABEL }));
      await waitFor(() => expect(mockTrackPosterGenerated).toHaveBeenCalledTimes(1));
    });

    it("resetKey が変わるとエラーメッセージが消えること", async () => {
      mockGeneratePosterPdf.mockRejectedValue(new Error("boom"));
      const { rerenderWith } = setup({ resetKey: "a" });
      fireEvent.click(screen.getByRole("button", { name: READY_LABEL }));
      await screen.findByRole("alert");

      rerenderWith({ resetKey: "b" });

      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("resetKey が同じ間はエラーメッセージが残ること", async () => {
      mockGeneratePosterPdf.mockRejectedValue(new Error("boom"));
      const { rerenderWith } = setup({ resetKey: "a" });
      fireEvent.click(screen.getByRole("button", { name: READY_LABEL }));
      await screen.findByRole("alert");

      rerenderWith({ resetKey: "a", descriptionLength: 99 });

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("resetKey が変わると成功メッセージも消えること", async () => {
      const { rerenderWith } = setup({ resetKey: "a" });
      fireEvent.click(screen.getByRole("button", { name: READY_LABEL }));
      await screen.findByText("PDFをダウンロードしました");

      rerenderWith({ resetKey: "b" });

      expect(screen.queryByText("PDFをダウンロードしました")).toBeNull();
    });
  });
});

describe("PdfDownloadButton の QR 生成失敗（renderFailed）", () => {
  const FAILED_MESSAGE = "QRコードを作れませんでした。URL やロゴ・フレームの画像を確認してください";

  it("renderFailed のときボタンが無効で、理由が role=alert で表示されること", () => {
    setup({ renderFailed: true, ready: false });

    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(FAILED_MESSAGE);
  });

  it("renderFailed のときラベルは「QRコードを準備中...」にならず、通常のままであること", () => {
    setup({ renderFailed: true, ready: false });

    expect(screen.getByRole("button", { name: READY_LABEL })).toBeInTheDocument();
    expect(screen.queryByText("QRコードを準備中...")).toBeNull();
  });

  it("renderFailed のとき押しても生成されないこと", () => {
    setup({ renderFailed: true, ready: false });

    fireEvent.click(screen.getByRole("button"));

    expect(mockGeneratePosterPdf).not.toHaveBeenCalled();
  });

  it("renderFailed が false に戻ると理由が消え、ready なら押せること", () => {
    const { rerenderWith } = setup({ renderFailed: true, ready: false });

    rerenderWith({ renderFailed: false, ready: true });

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("button", { name: READY_LABEL })).not.toBeDisabled();
  });

  it("renderFailed でないとき、理由は表示されないこと", () => {
    setup({ ready: true });
    expect(screen.queryByText(FAILED_MESSAGE)).toBeNull();
  });
});
