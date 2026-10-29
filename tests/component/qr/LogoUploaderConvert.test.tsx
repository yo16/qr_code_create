import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { LogoUploader } from "@/components/qr/DecorationPanel/LogoUploader";
import { svgDataUrlToPngDataUrl } from "@/lib/qr/svgToPng";
import { MAX_LOGO_DATA_URL_LENGTH } from "@/lib/handoff/posterHandoff";
import { jaClient as ja } from "@/i18n/jaClient";
import type { LogoConfig } from "@/types/qr";

jest.mock("@/lib/analytics/events");
jest.mock("@/lib/qr/svgToPng", () => ({
  svgDataUrlToPngDataUrl: jest.fn(),
}));

const convert = svgDataUrlToPngDataUrl as jest.MockedFunction<typeof svgDataUrlToPngDataUrl>;
const CONVERT_FAILED = ja.ui.fileUpload.convertFailed;
const PNG = "data:image/png;base64,QUJD";

function selectFile(file: File): void {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}

function dropFile(file: File): void {
  const zone = screen.getByRole("button", { name: /ロゴ画像/ });
  fireEvent.drop(zone, { dataTransfer: { files: [file] } });
}

async function tick(ms: number): Promise<void> {
  await act(async () => {
    await new Promise<void>((r) => setTimeout(r, ms));
  });
}

function svgFile(): File {
  return new File(["<svg xmlns='http://www.w3.org/2000/svg'/>"], "logo.svg", { type: "image/svg+xml" });
}

function lastCall(onChange: jest.Mock): LogoConfig | null | undefined {
  const calls = onChange.mock.calls;
  return calls.length ? (calls[calls.length - 1][0] as LogoConfig | null) : undefined;
}

beforeEach(() => {
  convert.mockReset();
});

describe("LogoUploader SVG の PNG 化", () => {
  it("SVG を選ぶと保持される dataUrl が data:image/png になり、元の形式は fileType に残る", async () => {
    convert.mockResolvedValue(PNG);
    const onChange = jest.fn();
    render(<LogoUploader logo={null} onChange={onChange} />);
    selectFile(svgFile());
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const logo = lastCall(onChange) as LogoConfig;
    expect(logo.dataUrl).toBe(PNG);
    expect(logo.dataUrl.startsWith("data:image/png")).toBe(true);
    expect(logo.fileType).toBe("image/svg+xml");
    expect(logo.fileName).toBe("logo.svg");
    expect(convert).toHaveBeenCalledTimes(1);
    expect(convert.mock.calls[0][0]).toMatch(/^data:image\/svg\+xml/);
  });

  it("PNG は変換せずそのまま保持される", async () => {
    const onChange = jest.fn();
    render(<LogoUploader logo={null} onChange={onChange} />);
    selectFile(new File(["abc"], "logo.png", { type: "image/png" }));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(convert).not.toHaveBeenCalled();
    expect((lastCall(onChange) as LogoConfig).dataUrl.startsWith("data:image/png")).toBe(true);
  });

  it("変換に失敗すると onChange(null) が呼ばれ、convertFailed の文言が出る", async () => {
    convert.mockRejectedValue(new Error("svg load failed"));
    const onChange = jest.fn();
    render(<LogoUploader logo={null} onChange={onChange} />);
    selectFile(svgFile());
    expect(await screen.findByText(CONVERT_FAILED)).toBeInTheDocument();
    expect(lastCall(onChange)).toBeNull();
    expect(onChange.mock.calls.some(([v]) => v !== null)).toBe(false);
  });

  it("変換後の長さが上限を超えると失敗扱いになる", async () => {
    const prefix = "data:image/png;base64,";
    convert.mockResolvedValue(prefix + "A".repeat(MAX_LOGO_DATA_URL_LENGTH - prefix.length + 1));
    const onChange = jest.fn();
    render(<LogoUploader logo={null} onChange={onChange} />);
    selectFile(svgFile());
    expect(await screen.findByText(CONVERT_FAILED)).toBeInTheDocument();
    expect(lastCall(onChange)).toBeNull();
    expect(onChange.mock.calls.some(([v]) => v !== null)).toBe(false);
  });

  it("変換後の長さが上限ちょうどなら受け付ける", async () => {
    const prefix = "data:image/png;base64,";
    convert.mockResolvedValue(prefix + "A".repeat(MAX_LOGO_DATA_URL_LENGTH - prefix.length));
    const onChange = jest.fn();
    render(<LogoUploader logo={null} onChange={onChange} />);
    selectFile(svgFile());
    await waitFor(() => expect(lastCall(onChange)).not.toBeUndefined());
    expect(lastCall(onChange)).not.toBeNull();
    expect(screen.queryByText(CONVERT_FAILED)).not.toBeInTheDocument();
  });

  it("text/html をドロップしても、FileReader の完了を待った後で onChange に非 null が渡らず、変換も呼ばれない", async () => {
    const onChange = jest.fn();
    render(<LogoUploader logo={null} onChange={onChange} />);
    dropFile(new File(["<html>"], "x.html", { type: "text/html" }));
    await tick(50);
    expect(onChange.mock.calls.some(([v]) => v !== null)).toBe(false);
    expect(convert).not.toHaveBeenCalled();
  });

  it("対照: PNG をドロップして同じ待ち方をすると onChange にロゴが届く", async () => {
    const onChange = jest.fn();
    render(<LogoUploader logo={null} onChange={onChange} />);
    dropFile(new File(["abc"], "ok.png", { type: "image/png" }));
    await tick(50);
    expect(onChange.mock.calls.some(([v]) => v !== null)).toBe(true);
    expect((lastCall(onChange) as LogoConfig).fileName).toBe("ok.png");
  });

  it("対照: 連番が一致する通常の SVG は、解決後に待っても onChange される", async () => {
    convert.mockResolvedValue(PNG);
    const onChange = jest.fn();
    render(<LogoUploader logo={null} onChange={onChange} />);
    selectFile(svgFile());
    await waitFor(() => expect(convert).toHaveBeenCalled());
    await tick(0);
    expect((lastCall(onChange) as LogoConfig).dataUrl).toBe(PNG);
  });

  it("レース: A の変換中に B を選び、B が先・A が後に解決しても、最終は B で A は無視される", async () => {
    let resolveA!: (v: string) => void;
    let resolveB!: (v: string) => void;
    convert
      .mockReturnValueOnce(new Promise<string>((r) => { resolveA = r; }))
      .mockReturnValueOnce(new Promise<string>((r) => { resolveB = r; }));
    const onChange = jest.fn();
    render(<LogoUploader logo={null} onChange={onChange} />);
    selectFile(new File(["a"], "a.svg", { type: "image/svg+xml" }));
    await waitFor(() => expect(convert).toHaveBeenCalledTimes(1));
    selectFile(new File(["b"], "b.svg", { type: "image/svg+xml" }));
    await waitFor(() => expect(convert).toHaveBeenCalledTimes(2));
    onChange.mockClear();

    resolveB("data:image/png;base64,QkJC");
    await tick(0);
    expect((lastCall(onChange) as LogoConfig).fileName).toBe("b.svg");
    const callsAfterB = onChange.mock.calls.length;

    resolveA("data:image/png;base64,QUFB");
    await tick(0);
    expect(onChange.mock.calls.length).toBe(callsAfterB);
    expect((lastCall(onChange) as LogoConfig).dataUrl).toBe("data:image/png;base64,QkJC");
  });

  it("レース: 古い選択 A が後から reject しても、新しい選択 B の結果を onChange(null) や convertFailed で潰さない", async () => {
    let rejectA!: (e: Error) => void;
    let resolveB!: (v: string) => void;
    convert
      .mockReturnValueOnce(new Promise<string>((_r, rej) => { rejectA = rej; }))
      .mockReturnValueOnce(new Promise<string>((r) => { resolveB = r; }));
    const onChange = jest.fn();
    render(<LogoUploader logo={null} onChange={onChange} />);
    selectFile(new File(["a"], "a.svg", { type: "image/svg+xml" }));
    await waitFor(() => expect(convert).toHaveBeenCalledTimes(1));
    selectFile(new File(["b"], "b.svg", { type: "image/svg+xml" }));
    await waitFor(() => expect(convert).toHaveBeenCalledTimes(2));
    onChange.mockClear();

    resolveB("data:image/png;base64,QkJC");
    await tick(0);
    rejectA(new Error("late failure"));
    await tick(0);

    expect(onChange.mock.calls.some(([v]) => v === null)).toBe(false);
    expect((lastCall(onChange) as LogoConfig).fileName).toBe("b.svg");
    expect(screen.queryByText(CONVERT_FAILED)).not.toBeInTheDocument();
  });

  it("変換中に選択ファイルを削除すると、遅れて返った結果で onChange されない", async () => {
    let resolve!: (v: string) => void;
    convert.mockReturnValue(new Promise<string>((r) => { resolve = r; }));
    const onChange = jest.fn();
    render(<LogoUploader logo={null} onChange={onChange} />);
    selectFile(svgFile());
    await waitFor(() => expect(convert).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: ja.ui.fileUpload.removeAria }));
    onChange.mockClear();
    resolve(PNG);
    await tick(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("変換中に別のファイルを選ぶと、古い結果は捨てられ新しい結果だけが反映される", async () => {
    let resolveOld!: (v: string) => void;
    convert.mockReturnValueOnce(new Promise<string>((r) => { resolveOld = r; }));
    const onChange = jest.fn();
    render(<LogoUploader logo={null} onChange={onChange} />);
    selectFile(svgFile());
    await waitFor(() => expect(convert).toHaveBeenCalled());
    selectFile(new File(["abc"], "new.png", { type: "image/png" }));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect((lastCall(onChange) as LogoConfig).fileName).toBe("new.png");
    onChange.mockClear();
    resolveOld("data:image/png;base64,T0xE");
    await tick(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("変換中に削除した SVG の変換が失敗しても、古い失敗は表示されない", async () => {
    let reject!: (e: Error) => void;
    convert.mockReturnValue(new Promise<string>((_r, rej) => { reject = rej; }));
    const onChange = jest.fn();
    render(<LogoUploader logo={null} onChange={onChange} />);
    selectFile(svgFile());
    await waitFor(() => expect(convert).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: ja.ui.fileUpload.removeAria }));
    onChange.mockClear();
    reject(new Error("late"));
    await tick(0);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText(CONVERT_FAILED)).not.toBeInTheDocument();
  });
});
