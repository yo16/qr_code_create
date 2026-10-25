import React from "react";
import { render, act } from "@testing-library/react";
import { PosterPreview } from "@/components/poster/PosterPreview/PosterPreview";
import type { DecorationConfig } from "@/types/qr";

// 実物の QrPreview + PosterPreview を組み合わせ、qrcode の toCanvas だけを
// 「テストが好きなタイミングで完了させられる Promise」に差し替えて、ready の競合を再現する。
interface Pending {
  url: string;
  resolve: () => void;
}
let pending: Pending[] = [];
jest.mock("qrcode", () => ({
  toCanvas: jest.fn(
    (_canvas: unknown, url: string) =>
      new Promise<void>((resolve) => {
        pending.push({ url, resolve });
      })
  ),
}));
jest.mock("@/lib/qr/drawLogo", () => ({
  drawLogoOnCanvas: jest.fn().mockResolvedValue(undefined),
}));

const decoration: DecorationConfig = {
  fgColor: "#000000",
  bgColor: "#ffffff",
  logo: null,
  frameType: null,
  caption: { text: "", fontSize: 16 },
  preset: null,
};

const URL_A = "https://example.com/a";
const URL_B = "https://example.com/b";

/** デバウンス（500ms）を進め、動的 import などの Promise も流す */
async function advanceDebounce() {
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
  await act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  });
}

/** 指定 URL の保留中の生成をすべて完了させる */
async function resolveAll(url: string) {
  const targets = pending.filter((p) => p.url === url);
  await act(async () => {
    targets.forEach((p) => p.resolve());
    for (let i = 0; i < 5; i++) await Promise.resolve();
  });
  return targets.length;
}

function setup(url: string) {
  const onReadyChange = jest.fn();
  const element = (u: string) => (
    <PosterPreview
      url={u}
      isUrlValid
      description="説明"
      decoration={decoration}
      onReadyChange={onReadyChange}
    />
  );
  const utils = render(element(url));
  const lastReady = () => {
    const calls = onReadyChange.mock.calls;
    return calls.length ? calls[calls.length - 1][0] : undefined;
  };
  return { rerenderUrl: (u: string) => utils.rerender(element(u)), lastReady };
}

beforeEach(() => {
  pending = [];
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe("PosterPreview + QrPreview（実物）の ready 競合", () => {
  it("4 枚の生成がそろうまで ready=false で、そろった時点で true になること", async () => {
    const { lastReady } = setup(URL_A);
    expect(lastReady()).toBe(false);

    await advanceDebounce();
    expect(pending.filter((p) => p.url === URL_A)).toHaveLength(4);
    expect(lastReady()).toBe(false);

    // 3 枚だけ完了させる経路は個別には作れないので、まとめて完了させて true を確かめる
    await resolveAll(URL_A);
    expect(lastReady()).toBe(true);
  });

  it("生成中に URL を変えたとき、古い生成が終わっても ready=false のままで、新しい 4 枚が終わって初めて true になること", async () => {
    const { rerenderUrl, lastReady } = setup(URL_A);
    await advanceDebounce(); // A の生成 4 枚が始まる（未完了）
    expect(pending.filter((p) => p.url === URL_A)).toHaveLength(4);

    rerenderUrl(URL_B);
    expect(lastReady()).toBe(false);
    await advanceDebounce(); // B の生成 4 枚が始まる（未完了）
    expect(pending.filter((p) => p.url === URL_B)).toHaveLength(4);

    // 古い生成（A）が 4 枚とも終わっても、B の完了としては数えない
    await resolveAll(URL_A);
    expect(lastReady()).toBe(false);

    // B の 4 枚が終わって初めて true
    await resolveAll(URL_B);
    expect(lastReady()).toBe(true);
  });

  it("A の生成中に B → A と戻したとき、最初の A の生成を完了させても ready=false のままで、戻した A の生成が 4 枚終わって初めて true になること", async () => {
    const { rerenderUrl, lastReady } = setup(URL_A);
    await advanceDebounce();
    const firstA = pending.filter((p) => p.url === URL_A);
    expect(firstA).toHaveLength(4);

    rerenderUrl(URL_B);
    rerenderUrl(URL_A); // B のデバウンスが走る前に A へ戻す
    expect(lastReady()).toBe(false);

    // 最初の A の生成が終わっても、世代が古いので数えない（そのあとの再描画で canvas が消えるため）
    await act(async () => {
      firstA.forEach((p) => p.resolve());
      for (let i = 0; i < 5; i++) await Promise.resolve();
    });
    expect(lastReady()).toBe(false);

    // B の生成は始まらず、戻した A の生成だけがデバウンス後に始まる
    await advanceDebounce();
    expect(pending.filter((p) => p.url === URL_B)).toHaveLength(0);
    const secondA = pending.filter((p) => p.url === URL_A && !firstA.includes(p));
    expect(secondA).toHaveLength(4);
    expect(lastReady()).toBe(false);

    await act(async () => {
      secondA.forEach((p) => p.resolve());
      for (let i = 0; i < 5; i++) await Promise.resolve();
    });
    expect(lastReady()).toBe(true);
  });

  it("キーが変わらなくても再生成が走る場合（ロゴの identity だけ変更）、ready が false に戻り、新しい生成の完了で true に戻ること", async () => {
    const logo = {
      dataUrl: "data:image/png;base64,AA",
      fileName: "l.png",
      fileType: "image/png",
      fileSizeKb: 1,
      sizePercent: 15,
    };
    const onReadyChange = jest.fn();
    const element = (l: typeof logo) => (
      <PosterPreview
        url={URL_A}
        isUrlValid
        description="説明"
        decoration={{ ...decoration, logo: l }}
        onReadyChange={onReadyChange}
      />
    );
    const lastReady = () => onReadyChange.mock.calls[onReadyChange.mock.calls.length - 1][0];
    const { rerender } = render(element(logo));
    await advanceDebounce();
    const first = [...pending];
    expect(first).toHaveLength(4);
    await resolveAll(URL_A);
    expect(lastReady()).toBe(true);

    // 中身は同じで identity だけ違うロゴ（renderKey は変わらないが QrPreview は再生成する）
    rerender(element({ ...logo }));
    expect(lastReady()).toBe(false);

    await advanceDebounce();
    const second = pending.filter((p) => !first.includes(p));
    expect(second).toHaveLength(4);
    expect(lastReady()).toBe(false);

    await act(async () => {
      second.forEach((p) => p.resolve());
      for (let i = 0; i < 5; i++) await Promise.resolve();
    });
    expect(lastReady()).toBe(true);
  });
});
