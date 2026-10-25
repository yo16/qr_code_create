import { trackPosterGenerated } from "@/lib/analytics/events";

describe("trackPosterGenerated", () => {
  beforeEach(() => {
    window.gtag = jest.fn();
  });
  afterEach(() => {
    (window as unknown as Record<string, unknown>).gtag = undefined;
  });

  it("poster_generated イベントを has_utm・has_logo・description_length つきで送ること", () => {
    trackPosterGenerated({ hasUtm: true, hasLogo: false, descriptionLength: 120 });

    expect(window.gtag).toHaveBeenCalledTimes(1);
    expect(window.gtag).toHaveBeenCalledWith("event", "poster_generated", {
      has_utm: true,
      has_logo: false,
      description_length: 120,
    });
  });

  it("値を反転しても、そのまま対応するパラメータに入ること", () => {
    trackPosterGenerated({ hasUtm: false, hasLogo: true, descriptionLength: 0 });

    expect(window.gtag).toHaveBeenCalledWith("event", "poster_generated", {
      has_utm: false,
      has_logo: true,
      description_length: 0,
    });
  });

  it("説明文そのものや URL をパラメータに含めないこと（個人情報を送らない）", () => {
    trackPosterGenerated({ hasUtm: true, hasLogo: true, descriptionLength: 5 });

    const params = (window.gtag as jest.Mock).mock.calls[0][2];
    expect(Object.keys(params).sort()).toEqual(["description_length", "has_logo", "has_utm"]);
  });

  it("window.gtag が無くても例外にならないこと", () => {
    (window as unknown as Record<string, unknown>).gtag = undefined;
    expect(() =>
      trackPosterGenerated({ hasUtm: false, hasLogo: false, descriptionLength: 1 })
    ).not.toThrow();
  });
});
