import React from "react";
import { render, screen, act, within } from "@testing-library/react";
import { PosterPreview } from "@/components/poster/PosterPreview/PosterPreview";
import type { DecorationConfig } from "@/types/qr";

// QrPreview を差し替え、各カードの「描画完了」をテストから好きなタイミングで起こす。
// 実物の QrPreview は onRenderSettled を「生成を始めた時点の関数」で呼ぶので、
// ここでも props.onRenderSettled をカードごとに控え、完了時に呼ぶ形で同じ振る舞いを再現する。
interface QrProps {
  url: string;
  frameConfig?: { type: string; color: string };
  bare?: boolean;
  onRenderSettled?: () => void;
  [key: string]: unknown;
}
// 描画のたびに最新の props を記録する（カードの並び順で 0〜3）
let latestProps: QrProps[] = [];
jest.mock("@/components/qr/QrPreview/QrPreview", () => ({
  QrPreview: function MockQrPreview(props: QrProps) {
    latestProps.push(props);
    return <div data-testid="qr-mock" />;
  },
}));

const decoration: DecorationConfig = {
  fgColor: "#000000",
  bgColor: "#ffffff",
  logo: null,
  frameType: null,
  caption: { text: "", fontSize: 16 },
  preset: null,
};

/** 直近の描画で各カードに渡された onRenderSettled（カード 0〜3 の順） */
function currentSettlers(): Array<() => void> {
  return latestProps.slice(-4).map((p) => p.onRenderSettled as () => void);
}

/** カード index の「いま渡されている」完了通知を呼ぶ */
async function settle(indices: number[], settlers = currentSettlers()) {
  await act(async () => {
    for (const i of indices) settlers[i]();
  });
}

type Props = React.ComponentProps<typeof PosterPreview>;

function setup(overrides: Partial<Props> = {}) {
  const onReadyChange = jest.fn();
  const base: Props = {
    url: "https://example.com/a",
    isUrlValid: true,
    description: "説明",
    decoration,
    onReadyChange,
  };
  const utils = render(<PosterPreview {...base} {...overrides} />);
  const update = (next: Partial<Props>) =>
    utils.rerender(<PosterPreview {...base} {...overrides} {...next} />);
  const lastReady = () => {
    const calls = onReadyChange.mock.calls;
    return calls.length ? calls[calls.length - 1][0] : undefined;
  };
  return { onReadyChange, update, lastReady, ...utils };
}

beforeEach(() => {
  latestProps = [];
});

describe("PosterPreview の ready 判定", () => {
  it("描画直後は ready=false で、4 枚そろった時点で true になること", async () => {
    const { lastReady } = setup();
    expect(lastReady()).toBe(false);

    await settle([0, 1, 2]);
    expect(lastReady()).toBe(false);

    await settle([3]);
    expect(lastReady()).toBe(true);
  });

  it("URL が無効なら QR を描かないので最初から ready=true であること", () => {
    const { lastReady } = setup({ url: "", isUrlValid: false });
    expect(lastReady()).toBe(true);
  });

  it("同じカードが 2 回完了しても 4 枚とは数えないこと", async () => {
    const { lastReady } = setup();

    await settle([0, 0, 0, 0]);
    expect(lastReady()).toBe(false);

    await settle([1, 1, 2, 2]);
    expect(lastReady()).toBe(false);

    await settle([3]);
    expect(lastReady()).toBe(true);
  });

  it("キー（URL）が変わると ready=false に戻り、新しいキーで 4 枚そろうまで true にならないこと", async () => {
    const { update, lastReady } = setup();
    await settle([0, 1, 2, 3]);
    expect(lastReady()).toBe(true);

    update({ url: "https://example.com/b" });
    expect(lastReady()).toBe(false);

    await settle([0, 1, 2]);
    expect(lastReady()).toBe(false);
    await settle([3]);
    expect(lastReady()).toBe(true);
  });

  it("生成中にキーが変わったとき、古い生成の完了では ready=true にならないこと", async () => {
    const { update, lastReady } = setup();
    // 古いキー（/a）で始まった生成の完了通知を控えておく
    const oldSettlers = currentSettlers();

    update({ url: "https://example.com/b" });
    expect(lastReady()).toBe(false);

    // 古い生成が遅れて 4 枚とも完了しても、新しいキーの完了としては数えない
    await settle([0, 1, 2, 3], oldSettlers);
    expect(lastReady()).toBe(false);

    // 新しい生成の完了が来て初めて true
    await settle([0, 1, 2, 3]);
    expect(lastReady()).toBe(true);
  });

  it("URL を消して同じ URL を貼り直したとき、4 枚の完了がそろうまで ready=false であること", async () => {
    const { update, lastReady } = setup();
    await settle([0, 1, 2, 3]);
    expect(lastReady()).toBe(true);

    // URL を消す（QR は描かない = ready）
    update({ url: "", isUrlValid: false });
    expect(lastReady()).toBe(true);

    // 同じ URL を貼る。以前の完了記録が残っていれば即 true になってしまう経路
    update({ url: "https://example.com/a", isUrlValid: true });
    expect(lastReady()).toBe(false);

    await settle([0, 1, 2]);
    expect(lastReady()).toBe(false);
    await settle([3]);
    expect(lastReady()).toBe(true);
  });

  it("A → B → A と戻したとき、ready がすぐ true にならないこと", async () => {
    const { update, lastReady } = setup();
    await settle([0, 1, 2, 3]);
    expect(lastReady()).toBe(true);

    update({ url: "https://example.com/b" });
    expect(lastReady()).toBe(false);

    // B の生成が終わる前に A へ戻す
    update({ url: "https://example.com/a" });
    expect(lastReady()).toBe(false);

    await settle([0, 1, 2]);
    expect(lastReady()).toBe(false);
    await settle([3]);
    expect(lastReady()).toBe(true);
  });

  it("A → B → A で、B の遅れた完了が A の完了として数えられないこと", async () => {
    const { update, lastReady } = setup();
    await settle([0, 1, 2, 3]);

    update({ url: "https://example.com/b" });
    const bSettlers = currentSettlers();
    update({ url: "https://example.com/a" });

    await settle([0, 1, 2, 3], bSettlers);
    expect(lastReady()).toBe(false);
  });

  it.each([
    ["前景色", { decoration: { ...decoration, fgColor: "#112233" } }],
    ["背景色", { decoration: { ...decoration, bgColor: "#eeeeee" } }],
    ["フレーム種別", { decoration: { ...decoration, frameType: "simple" as const } }],
    ["フレーム色", { frameColor: "#ff0000" }],
    [
      "ロゴ",
      {
        decoration: {
          ...decoration,
          logo: { dataUrl: "data:image/png;base64,AA", sizeRatio: 0.2 } as unknown as DecorationConfig["logo"],
        },
      },
    ],
  ])("%sが変わると完了記録が空になり ready=false に戻ること", async (_name, change) => {
    const { update, lastReady } = setup();
    await settle([0, 1, 2, 3]);
    expect(lastReady()).toBe(true);

    update(change as Partial<Props>);

    expect(lastReady()).toBe(false);
  });

  it("キャプションや説明文だけが変わっても、QR の描き直しは起きないので ready は true のままであること", async () => {
    const { update, lastReady } = setup();
    await settle([0, 1, 2, 3]);

    update({
      description: "別の説明",
      decoration: { ...decoration, caption: { text: "キャプション", fontSize: 20 } },
    });

    expect(lastReady()).toBe(true);
  });
});

describe("PosterPreview のカードと QrPreview への props", () => {
  it("カードが 4 枚描かれ、すべて bare で QrPreview を使うこと", () => {
    setup();
    const group = screen.getByRole("group", { name: /ポスターのプレビュー/ });
    expect(within(group).getAllByTestId("poster-card")).toHaveLength(4);
    expect(latestProps.slice(-4)).toHaveLength(4);
    for (const p of latestProps.slice(-4)) {
      expect(p.bare).toBe(true);
    }
  });

  it("frameColor がフレーム設定として QrPreview に渡ること", () => {
    setup({ frameColor: "#ff0000", decoration: { ...decoration, frameType: "simple" } });
    for (const p of latestProps.slice(-4)) {
      expect(p.frameConfig).toEqual({ type: "simple", color: "#ff0000" });
    }
  });

  it("frameColor を省略するとフレームの色は黒になること", () => {
    setup({ decoration: { ...decoration, frameType: "rounded" } });
    for (const p of latestProps.slice(-4)) {
      expect(p.frameConfig).toEqual({ type: "rounded", color: "#000000" });
    }
  });

  it("frameType が null のときフレーム種別は none になること", () => {
    setup({ frameColor: "#00ff00" });
    for (const p of latestProps.slice(-4)) {
      expect(p.frameConfig).toEqual({ type: "none", color: "#00ff00" });
    }
  });
});
