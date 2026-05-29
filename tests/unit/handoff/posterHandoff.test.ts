import {
  savePosterHandoff,
  loadPosterHandoff,
  clearPosterHandoff,
  POSTER_HANDOFF_KEY,
  POSTER_HANDOFF_MAX_AGE_MS,
} from "@/lib/handoff/posterHandoff";
import type { PosterHandoffPayload } from "@/types/poster";

// テスト用のデフォルト payload（savedAt を除く）
const basePayload: Omit<PosterHandoffPayload, "savedAt"> = {
  url: "https://example.com",
  isUrlValid: true,
  utm: { source: "test", medium: "qr", campaign: "campaign1", term: "", content: "" },
  utmEnabled: true,
  decoration: {
    fgColor: "#000000",
    bgColor: "#ffffff",
    logo: null,
    frameType: null,
    caption: { text: "", fontSize: 14 },
    preset: null,
  },
};

beforeEach(() => {
  sessionStorage.clear();
  jest.restoreAllMocks();
});

describe("savePosterHandoff", () => {
  it("sessionStorage に正しい payload + savedAt が保存されること", () => {
    savePosterHandoff(basePayload);

    const raw = sessionStorage.getItem(POSTER_HANDOFF_KEY);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw!) as PosterHandoffPayload;
    expect(parsed.url).toBe(basePayload.url);
    expect(parsed.isUrlValid).toBe(basePayload.isUrlValid);
    expect(parsed.utm).toEqual(basePayload.utm);
    expect(parsed.utmEnabled).toBe(basePayload.utmEnabled);
    expect(parsed.decoration).toEqual(basePayload.decoration);
    // savedAt が ISO8601形式の文字列であること
    expect(typeof parsed.savedAt).toBe("string");
    expect(() => new Date(parsed.savedAt)).not.toThrow();
    expect(new Date(parsed.savedAt).toISOString()).toBe(parsed.savedAt);
  });

  it("SSR環境（window未定義）では save がエラーにならず安全に動作すること", () => {
    const windowSpy = jest.spyOn(global, "window", "get");
    // @ts-expect-error window を undefined にしてSSR環境をシミュレート
    windowSpy.mockReturnValue(undefined);

    expect(() => savePosterHandoff(basePayload)).not.toThrow();
    // 実際には sessionStorage に保存されないが、エラーにもならない
  });
});

describe("loadPosterHandoff", () => {
  it("保存した payload が読み出せること", () => {
    savePosterHandoff(basePayload);

    const result = loadPosterHandoff();

    expect(result).not.toBeNull();
    expect(result!.url).toBe(basePayload.url);
    expect(result!.isUrlValid).toBe(basePayload.isUrlValid);
    expect(result!.utm).toEqual(basePayload.utm);
    expect(result!.utmEnabled).toBe(basePayload.utmEnabled);
    expect(result!.decoration).toEqual(basePayload.decoration);
  });

  it("1時間超過の payload は null を返し、sessionStorage から削除されること", () => {
    // 1時間1ミリ秒前の savedAt を持つ payload を直接保存
    const expiredPayload: PosterHandoffPayload = {
      ...basePayload,
      savedAt: new Date(Date.now() - POSTER_HANDOFF_MAX_AGE_MS - 1).toISOString(),
    };
    sessionStorage.setItem(POSTER_HANDOFF_KEY, JSON.stringify(expiredPayload));

    const result = loadPosterHandoff();

    expect(result).toBeNull();
    // sessionStorage から削除されていること
    expect(sessionStorage.getItem(POSTER_HANDOFF_KEY)).toBeNull();
  });

  it("キーが存在しない時は null を返すこと", () => {
    // sessionStorage は beforeEach でクリア済み
    const result = loadPosterHandoff();
    expect(result).toBeNull();
  });

  it("JSON parse 失敗時は null を返すこと", () => {
    sessionStorage.setItem(POSTER_HANDOFF_KEY, "invalid-json{{{");

    const result = loadPosterHandoff();

    expect(result).toBeNull();
  });

  it("読み込み成功後に sessionStorage がクリアされること（再利用防止）", () => {
    savePosterHandoff(basePayload);

    // 1回目は取得できる
    const result = loadPosterHandoff();
    expect(result).not.toBeNull();

    // sessionStorage からキーが削除されていること
    expect(sessionStorage.getItem(POSTER_HANDOFF_KEY)).toBeNull();

    // 2回目は null が返ること
    const secondResult = loadPosterHandoff();
    expect(secondResult).toBeNull();
  });

  it("SSR環境（window未定義）では load がエラーにならず null を返すこと", () => {
    const windowSpy = jest.spyOn(global, "window", "get");
    // @ts-expect-error window を undefined にしてSSR環境をシミュレート
    windowSpy.mockReturnValue(undefined);

    expect(() => {
      const result = loadPosterHandoff();
      expect(result).toBeNull();
    }).not.toThrow();
  });
});

describe("clearPosterHandoff", () => {
  it("clearPosterHandoff で sessionStorage から削除されること", () => {
    savePosterHandoff(basePayload);
    // 保存されていることを確認
    expect(sessionStorage.getItem(POSTER_HANDOFF_KEY)).not.toBeNull();

    clearPosterHandoff();

    expect(sessionStorage.getItem(POSTER_HANDOFF_KEY)).toBeNull();
  });

  it("SSR環境（window未定義）では clear がエラーにならず安全に動作すること", () => {
    const windowSpy = jest.spyOn(global, "window", "get");
    // @ts-expect-error window を undefined にしてSSR環境をシミュレート
    windowSpy.mockReturnValue(undefined);

    expect(() => clearPosterHandoff()).not.toThrow();
  });
});
