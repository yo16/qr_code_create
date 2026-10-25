import React from "react";
import { render, screen, act } from "@testing-library/react";
import { QrPreview } from "@/components/qr/QrPreview/QrPreview";

jest.mock("qrcode", () => ({
  toCanvas: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/qr/drawLogo", () => ({
  drawLogoOnCanvas: jest.fn().mockResolvedValue(undefined),
}));
const mockTrackQrGenerated = jest.fn();
const mockTrackErrorOccurred = jest.fn();
jest.mock("@/lib/analytics/events", () => ({
  trackQrGenerated: (...args: unknown[]) => mockTrackQrGenerated(...args),
  trackErrorOccurred: (...args: unknown[]) => mockTrackErrorOccurred(...args),
}));

import QRCode from "qrcode";
const mockToCanvas = QRCode.toCanvas as jest.Mock;

// コントラストが足りない色の組み合わせ（警告が出る条件）
const LOW_CONTRAST = { fgColor: "#cccccc", bgColor: "#dddddd" };

async function flush() {
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
  // qrcode の動的 import と描画の Promise を流す
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockToCanvas.mockReset();
  mockToCanvas.mockResolvedValue(undefined);
  mockTrackQrGenerated.mockClear();
  mockTrackErrorOccurred.mockClear();
});
afterEach(() => {
  jest.useRealTimers();
});

describe("QrPreview bare", () => {
  it("bare のときラベル「QRコードプレビュー」が出ないこと", () => {
    render(<QrPreview url="https://example.com" isUrlValid bare />);
    expect(screen.queryByText("QRコードプレビュー")).toBeNull();
  });

  it("bare のときコントラスト警告が出ず、canvas は描かれること", () => {
    const { container } = render(
      <QrPreview url="https://example.com" isUrlValid bare {...LOW_CONTRAST} />
    );
    expect(screen.queryByRole("alert")).toBeNull();
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("bare のとき生成が成功しても qr_generated が送られないこと", async () => {
    render(<QrPreview url="https://example.com" isUrlValid bare />);
    await flush();

    expect(mockToCanvas).toHaveBeenCalledTimes(1);
    expect(mockTrackQrGenerated).not.toHaveBeenCalled();
  });

  it("bare のとき生成が失敗したら、qr_render のエラー計測は残ること", async () => {
    mockToCanvas.mockRejectedValue(new TypeError("fail"));
    render(<QrPreview url="https://example.com" isUrlValid bare />);
    await flush();

    expect(mockTrackErrorOccurred).toHaveBeenCalledWith("qr_render", "TypeError");
  });

  it("bare のときもキャプションは QrPreview 側の表示として出ること（caption を渡した場合）", () => {
    render(
      <QrPreview
        url="https://example.com"
        isUrlValid
        bare
        caption={{ text: "ご来店ください", fontSize: 16 }}
      />
    );
    expect(screen.getByText("ご来店ください")).toBeInTheDocument();
  });
});

describe("QrPreview 既定（bare でない。/create の使い方）", () => {
  it("ラベル「QRコードプレビュー」が出ること", () => {
    render(<QrPreview url="https://example.com" isUrlValid />);
    expect(screen.getByText("QRコードプレビュー")).toBeInTheDocument();
  });

  it("コントラスト不足のときは警告が role=alert で出ること", () => {
    render(<QrPreview url="https://example.com" isUrlValid {...LOW_CONTRAST} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("コントラストが十分なら警告が出ないこと", () => {
    render(<QrPreview url="https://example.com" isUrlValid />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("生成に成功すると qr_generated が 1 回送られること", async () => {
    render(<QrPreview url="https://example.com?utm_source=x" isUrlValid />);
    await flush();

    expect(mockTrackQrGenerated).toHaveBeenCalledTimes(1);
    expect(mockTrackQrGenerated).toHaveBeenCalledWith(
      expect.objectContaining({ hasUtm: true, hasLogo: false, hasFrame: false })
    );
  });
});

describe("QrPreview canvas のインライン寸法", () => {
  // 実物の qrcode.toCanvas と同じく、canvas.style.width/height に size(px) を書き込むモック
  beforeEach(() => {
    mockToCanvas.mockImplementation(
      async (canvas: HTMLCanvasElement, _url: string, opts: { width: number }) => {
        canvas.style.width = `${opts.width}px`;
        canvas.style.height = `${opts.width}px`;
      }
    );
  });

  it("bare のとき、描画後の canvas にインラインの width / height が残らないこと", async () => {
    const { container } = render(<QrPreview url="https://example.com" isUrlValid bare size={512} />);
    await flush();

    expect(mockToCanvas).toHaveBeenCalledTimes(1);
    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.style.width).toBe("");
    expect(canvas.style.height).toBe("");
    // 描画の実ピクセル数は保たれる
    expect(canvas.width).toBe(512);
  });

  it("bare でないときも、描画後の canvas にインラインの width / height が残らないこと（canvas の属性サイズは size のまま）", async () => {
    const { container } = render(<QrPreview url="https://example.com" isUrlValid size={256} />);
    await flush();

    expect(mockToCanvas).toHaveBeenCalledTimes(1);
    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.style.width).toBe("");
    expect(canvas.style.height).toBe("");
    // ダウンロードの大きさを決める属性サイズは変わらない
    expect(canvas.width).toBe(256);
    expect(canvas.height).toBe(256);
  });
});

describe("QrPreview onRenderSettled", () => {
  it("生成に成功したら 1 回呼ばれること", async () => {
    const onRenderSettled = jest.fn();
    render(<QrPreview url="https://example.com" isUrlValid onRenderSettled={onRenderSettled} />);
    expect(onRenderSettled).not.toHaveBeenCalled();

    await flush();

    expect(onRenderSettled).toHaveBeenCalledTimes(1);
  });

  it("生成に失敗しても呼ばれること", async () => {
    mockToCanvas.mockRejectedValue(new Error("fail"));
    const onRenderSettled = jest.fn();
    render(<QrPreview url="https://example.com" isUrlValid onRenderSettled={onRenderSettled} />);

    await flush();

    expect(onRenderSettled).toHaveBeenCalledTimes(1);
  });

  it("デバウンス（500ms）の間は呼ばれないこと", async () => {
    const onRenderSettled = jest.fn();
    render(<QrPreview url="https://example.com" isUrlValid onRenderSettled={onRenderSettled} />);

    await act(async () => {
      jest.advanceTimersByTime(499);
    });

    expect(onRenderSettled).not.toHaveBeenCalled();
  });

  it("URL が無効なら生成せず、呼ばれないこと", async () => {
    const onRenderSettled = jest.fn();
    render(<QrPreview url="" isUrlValid={false} onRenderSettled={onRenderSettled} />);
    await flush();

    expect(mockToCanvas).not.toHaveBeenCalled();
    expect(onRenderSettled).not.toHaveBeenCalled();
  });

  it("生成中に onRenderSettled が差し替わっても、生成を始めた時点の関数が呼ばれること", async () => {
    let finishRender!: () => void;
    mockToCanvas.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishRender = resolve;
        })
    );
    const oldSettled = jest.fn();
    const newSettled = jest.fn();
    const { rerender } = render(
      <QrPreview url="https://example.com" isUrlValid onRenderSettled={oldSettled} />
    );
    // 生成を開始させる（toCanvas は未完了のまま）
    await flush();
    expect(mockToCanvas).toHaveBeenCalledTimes(1);

    // 生成中に呼び出し側の関数だけが差し替わる（キーが変わった状況）
    rerender(<QrPreview url="https://example.com" isUrlValid onRenderSettled={newSettled} />);

    await act(async () => {
      finishRender();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(oldSettled).toHaveBeenCalledTimes(1);
    expect(newSettled).not.toHaveBeenCalled();
  });
});

describe("QrPreview onRenderSettled の結果と onRenderPending", () => {
  it("生成に成功すると { ok: true } で呼ばれること", async () => {
    const onRenderSettled = jest.fn();
    render(<QrPreview url="https://example.com" isUrlValid onRenderSettled={onRenderSettled} />);
    await flush();

    expect(onRenderSettled).toHaveBeenCalledTimes(1);
    expect(onRenderSettled).toHaveBeenCalledWith({ ok: true });
  });

  it("toCanvas が例外のときは { ok: false } で呼ばれること", async () => {
    mockToCanvas.mockRejectedValue(new Error("The amount of data is too big"));
    const onRenderSettled = jest.fn();
    render(<QrPreview url="https://example.com" isUrlValid onRenderSettled={onRenderSettled} />);
    await flush();

    expect(onRenderSettled).toHaveBeenCalledTimes(1);
    expect(onRenderSettled).toHaveBeenCalledWith({ ok: false });
  });

  it("onRenderPending はデバウンスを予約する時点（生成前）で呼ばれ、settled より先であること", async () => {
    const order: string[] = [];
    const onRenderPending = jest.fn(() => order.push("pending"));
    const onRenderSettled = jest.fn(() => order.push("settled"));
    render(
      <QrPreview
        url="https://example.com"
        isUrlValid
        onRenderPending={onRenderPending}
        onRenderSettled={onRenderSettled}
      />
    );

    expect(onRenderPending).toHaveBeenCalledTimes(1);
    expect(mockToCanvas).not.toHaveBeenCalled();
    await flush();

    expect(order).toEqual(["pending", "settled"]);
  });

  it("URL が変わるたびに onRenderPending が呼ばれること", async () => {
    const onRenderPending = jest.fn();
    const { rerender } = render(
      <QrPreview url="https://example.com/a" isUrlValid onRenderPending={onRenderPending} />
    );
    rerender(<QrPreview url="https://example.com/b" isUrlValid onRenderPending={onRenderPending} />);

    expect(onRenderPending).toHaveBeenCalledTimes(2);
  });

  it("URL が無効なら onRenderPending も呼ばれないこと", () => {
    const onRenderPending = jest.fn();
    render(<QrPreview url="" isUrlValid={false} onRenderPending={onRenderPending} />);
    expect(onRenderPending).not.toHaveBeenCalled();
  });

  it("A の生成中に B → A と変えたとき、最初の A の完了は通知されず、最新の世代の完了だけが通知されること", async () => {
    const resolvers: Array<() => void> = [];
    mockToCanvas.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvers.push(resolve);
        })
    );
    const onRenderSettled = jest.fn();
    const { rerender } = render(
      <QrPreview url="https://example.com/a" isUrlValid onRenderSettled={onRenderSettled} />
    );
    await flush(); // 最初の A の生成が始まる（未完了）
    expect(resolvers).toHaveLength(1);

    rerender(<QrPreview url="https://example.com/b" isUrlValid onRenderSettled={onRenderSettled} />);
    rerender(<QrPreview url="https://example.com/a" isUrlValid onRenderSettled={onRenderSettled} />);

    // 最初の A の生成を完了させても、世代が古いので通知されない
    await act(async () => {
      resolvers[0]();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(onRenderSettled).not.toHaveBeenCalled();

    // 戻した A の生成（デバウンス後に始まる）が完了すると通知される
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(resolvers).toHaveLength(2);
    await act(async () => {
      resolvers[1]();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(onRenderSettled).toHaveBeenCalledTimes(1);
    expect(onRenderSettled).toHaveBeenCalledWith({ ok: true });
  });
});
