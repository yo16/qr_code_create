import {
  trackEvent,
  trackUrlEntered,
  trackUtmToggled,
  trackUtmSet,
  trackQrGenerated,
  trackQrDownloaded,
  trackLogoUploaded,
  trackColorCustomized,
  trackFrameSelected,
  trackCaptionSet,
  trackPresetSelected,
  trackGuideTooltipOpened,
  trackCtaClicked,
  trackFaqOpened,
  trackErrorOccurred,
  flushPendingEvents,
  EVENT_DEBOUNCE_MS,
} from "@/lib/analytics/events";

describe("analytics/events", () => {
  beforeEach(() => {
    window.gtag = jest.fn();
  });

  afterEach(() => {
    // window.gtag を undefined に戻してクリーンアップ
    // TypeScriptの型定義上 undefined は許容しないため as unknown as を使用
    (window as unknown as Record<string, unknown>).gtag = undefined;
  });

  // ─────────────────────────────────────────────
  // trackEvent
  // ─────────────────────────────────────────────
  describe("trackEvent", () => {
    it("window.gtagが存在する場合にgtag('event', name, params)が呼ばれること", () => {
      trackEvent("test_event", { key: "value" });

      expect(window.gtag).toHaveBeenCalledTimes(1);
      expect(window.gtag).toHaveBeenCalledWith("event", "test_event", {
        key: "value",
      });
    });

    it("window.gtagが存在しない場合にエラーが発生しないこと", () => {
      (window as unknown as Record<string, unknown>).gtag = undefined;

      expect(() => trackEvent("test_event", { key: "value" })).not.toThrow();
    });

    it("paramsなしで呼び出した場合にundefinedが渡されること", () => {
      trackEvent("test_event");

      expect(window.gtag).toHaveBeenCalledWith(
        "event",
        "test_event",
        undefined
      );
    });
  });

  // ─────────────────────────────────────────────
  // trackUrlEntered
  // ─────────────────────────────────────────────
  describe("trackUrlEntered", () => {
    it("url_domainパラメータ付きでurl_enteredイベントが送信されること", () => {
      trackUrlEntered("example.com");

      expect(window.gtag).toHaveBeenCalledWith("event", "url_entered", {
        url_domain: "example.com",
      });
    });
  });

  // ─────────────────────────────────────────────
  // trackUtmToggled
  // ─────────────────────────────────────────────
  describe("trackUtmToggled", () => {
    it("enabled=true のとき utm_toggled イベントに enabled:true が渡されること", () => {
      trackUtmToggled(true);

      expect(window.gtag).toHaveBeenCalledWith("event", "utm_toggled", {
        enabled: true,
      });
    });

    it("enabled=false のとき utm_toggled イベントに enabled:false が渡されること", () => {
      trackUtmToggled(false);

      expect(window.gtag).toHaveBeenCalledWith("event", "utm_toggled", {
        enabled: false,
      });
    });

    it("window.gtagが存在しない場合にエラーが発生しないこと", () => {
      (window as unknown as Record<string, unknown>).gtag = undefined;

      expect(() => trackUtmToggled(true)).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────
  // trackUtmSet
  // ─────────────────────────────────────────────
  // trackUtmSet は入力のたびに呼ばれるため trailing debounce（1000ms）で送信される。
  // 各テストは呼び出し後に 1000ms 進めてから gtag の呼び出し内容を検証する。
  describe("trackUtmSet", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it("source指定時にutm_source_valueが送信されること", () => {
      trackUtmSet("source", "google", "dropdown");
      jest.advanceTimersByTime(1000);

      expect(window.gtag).toHaveBeenCalledTimes(1);
      expect(window.gtag).toHaveBeenCalledWith("event", "utm_source_set", {
        utm_source_value: "google",
        input_method: "dropdown",
      });
    });

    it("medium指定時にutm_medium_valueとinput_methodが送信されること", () => {
      trackUtmSet("medium", "cpc", "custom");
      jest.advanceTimersByTime(1000);

      expect(window.gtag).toHaveBeenCalledTimes(1);
      expect(window.gtag).toHaveBeenCalledWith("event", "utm_medium_set", {
        utm_medium_value: "cpc",
        input_method: "custom",
      });
    });

    it("campaign指定時にutm_campaign_valueとhas_date_patternが送信されること", () => {
      trackUtmSet("campaign", "spring_sale");
      jest.advanceTimersByTime(1000);

      expect(window.gtag).toHaveBeenCalledTimes(1);
      expect(window.gtag).toHaveBeenCalledWith("event", "utm_campaign_set", {
        utm_campaign_value: "spring_sale",
        has_date_pattern: false,
      });
    });

    it("campaign値に年（4桁数字）が含まれる場合has_date_pattern=trueになること", () => {
      trackUtmSet("campaign", "sale_2024_spring");
      jest.advanceTimersByTime(1000);

      expect(window.gtag).toHaveBeenCalledTimes(1);
      expect(window.gtag).toHaveBeenCalledWith("event", "utm_campaign_set", {
        utm_campaign_value: "sale_2024_spring",
        has_date_pattern: true,
      });
    });

    it("campaign値に年が含まれない場合has_date_pattern=falseになること", () => {
      trackUtmSet("campaign", "summer_campaign");
      jest.advanceTimersByTime(1000);

      expect(window.gtag).toHaveBeenCalledTimes(1);
      expect(window.gtag).toHaveBeenCalledWith("event", "utm_campaign_set", {
        utm_campaign_value: "summer_campaign",
        has_date_pattern: false,
      });
    });

    it("sourceにinputMethodなしで呼び出した場合input_methodが送信されないこと", () => {
      trackUtmSet("source", "google");
      jest.advanceTimersByTime(1000);

      expect(window.gtag).toHaveBeenCalledTimes(1);
      expect(window.gtag).toHaveBeenCalledWith("event", "utm_source_set", {
        utm_source_value: "google",
      });
    });

    it("source/medium/campaign以外のparamName（term）の場合、空paramsでイベントが送信されること", () => {
      trackUtmSet("term", "discount");
      jest.advanceTimersByTime(1000);

      expect(window.gtag).toHaveBeenCalledTimes(1);
      expect(window.gtag).toHaveBeenCalledWith("event", "utm_term_set", {});
    });

    it("source/medium/campaign以外のparamName（content）の場合、空paramsでイベントが送信されること", () => {
      trackUtmSet("content", "header_qr");
      jest.advanceTimersByTime(1000);

      expect(window.gtag).toHaveBeenCalledTimes(1);
      expect(window.gtag).toHaveBeenCalledWith("event", "utm_content_set", {});
    });
  });

  // ─────────────────────────────────────────────
  // trackQrGenerated
  // ─────────────────────────────────────────────
  describe("trackQrGenerated", () => {
    it("全パラメータが正しくマッピングされること", () => {
      trackQrGenerated({
        hasUtm: true,
        utmCount: 3,
        hasLogo: false,
        hasFrame: true,
        hasCaption: false,
      });

      expect(window.gtag).toHaveBeenCalledWith("event", "qr_generated", {
        has_utm: true,
        utm_count: 3,
        has_logo: false,
        has_frame: true,
        has_caption: false,
      });
    });
  });

  // ─────────────────────────────────────────────
  // trackQrDownloaded
  // ─────────────────────────────────────────────
  describe("trackQrDownloaded", () => {
    it("format=pngが正しく送信されること", () => {
      trackQrDownloaded({ format: "png", hasUtm: true, decorationCount: 2 });
      expect(window.gtag).toHaveBeenCalledWith("event", "qr_downloaded", {
        format: "png", has_utm: true, decoration_count: 2,
      });
    });

    it("format=svgが正しく送信されること", () => {
      trackQrDownloaded({ format: "svg", hasUtm: false, decorationCount: 0 });
      expect(window.gtag).toHaveBeenCalledWith("event", "qr_downloaded", {
        format: "svg", has_utm: false, decoration_count: 0,
      });
    });

    it("format=pdfが正しく送信されること", () => {
      trackQrDownloaded({ format: "pdf", hasUtm: true, decorationCount: 5 });
      expect(window.gtag).toHaveBeenCalledWith("event", "qr_downloaded", {
        format: "pdf", has_utm: true, decoration_count: 5,
      });
    });
  });

  // ─────────────────────────────────────────────
  // trackLogoUploaded
  // ─────────────────────────────────────────────
  describe("trackLogoUploaded", () => {
    it("fileType, fileSizeKbが正しく送信されること", () => {
      trackLogoUploaded("image/png", 120);

      expect(window.gtag).toHaveBeenCalledWith("event", "logo_uploaded", {
        file_type: "image/png",
        file_size_kb: 120,
      });
    });
  });

  // ─────────────────────────────────────────────
  // trackColorCustomized
  // ─────────────────────────────────────────────
  // trackColorCustomized はカラーピッカーのドラッグ中に連続で呼ばれるため
  // trailing debounce（1000ms）で送信される。1000ms 進めてから検証する。
  describe("trackColorCustomized", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it("foreground_color, background_colorが送信されること", () => {
      trackColorCustomized("#000000", "#ffffff");
      jest.advanceTimersByTime(1000);

      expect(window.gtag).toHaveBeenCalledTimes(1);
      expect(window.gtag).toHaveBeenCalledWith("event", "color_customized", {
        foreground_color: "#000000",
        background_color: "#ffffff",
      });
    });
  });

  // ─────────────────────────────────────────────
  // その他のイベント関数
  // ─────────────────────────────────────────────
  describe("trackFrameSelected", () => {
    it("正しいイベント名とパラメータで呼ばれること", () => {
      trackFrameSelected("rounded", "basic");

      expect(window.gtag).toHaveBeenCalledWith("event", "frame_selected", {
        frame_type: "rounded",
        frame_category: "basic",
      });
    });
  });

  // trackCaptionSet はキャプション入力の 1 文字ごとに呼ばれるため
  // trailing debounce（1000ms）で送信される。1000ms 進めてから検証する。
  describe("trackCaptionSet", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it("正しいイベント名とパラメータで呼ばれること", () => {
      trackCaptionSet(10, true);
      jest.advanceTimersByTime(1000);

      expect(window.gtag).toHaveBeenCalledTimes(1);
      expect(window.gtag).toHaveBeenCalledWith("event", "caption_set", {
        caption_length: 10,
        is_template: true,
      });
    });
  });

  describe("trackPresetSelected", () => {
    it("正しいイベント名とパラメータで呼ばれること", () => {
      trackPresetSelected("dark_mode");

      expect(window.gtag).toHaveBeenCalledWith("event", "preset_selected", {
        preset_name: "dark_mode",
      });
    });
  });

  describe("trackGuideTooltipOpened", () => {
    it("正しいイベント名とパラメータで呼ばれること", () => {
      trackGuideTooltipOpened("tooltip_source", "utm_source");

      expect(window.gtag).toHaveBeenCalledWith(
        "event",
        "guide_tooltip_opened",
        {
          tooltip_id: "tooltip_source",
          field_name: "utm_source",
        }
      );
    });
  });

  describe("trackCtaClicked", () => {
    it("正しいイベント名とbutton_text, locationで呼ばれること", () => {
      trackCtaClicked("今すぐ試す", "hero");

      expect(window.gtag).toHaveBeenCalledWith("event", "cta_clicked", {
        button_text: "今すぐ試す",
        location: "hero",
      });
    });
  });

  describe("trackFaqOpened", () => {
    it("正しいイベント名とquestion_idで呼ばれること", () => {
      trackFaqOpened("faq_01");

      expect(window.gtag).toHaveBeenCalledWith("event", "faq_opened", {
        question_id: "faq_01",
      });
    });
  });

  describe("trackErrorOccurred", () => {
    it("正しいイベント名とerror_type, error_messageで呼ばれること", () => {
      trackErrorOccurred("network_error", "Failed to fetch");

      expect(window.gtag).toHaveBeenCalledWith("event", "error_occurred", {
        error_type: "network_error",
        error_message: "Failed to fetch",
      });
    });
  });

  // ─────────────────────────────────────────────
  // debounce（連続発火の抑制）
  // ─────────────────────────────────────────────
  // 背景: GA4 で utm_campaign_set が 23 ユーザーで 918 回、color_customized が
  // 2 ユーザーで 344 回、caption_set が 5 ユーザーで 133 回発火していた。
  // 入力のたびに送信していたため、連続呼び出しを trailing debounce（1000ms）で
  // 1 回にまとめる契約を検証する。
  describe("debounce（連続発火の抑制）", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it("trackUtmSet を 10 回連続で呼んでも 1000ms 後に gtag は 1 回だけ呼ばれ、最後の値が送られること", () => {
      // 意図: 1 文字ずつ入力して campaign が "a" → "ab" → ... → "abcdefghij" と変化しても
      // 送信は最終値 1 回のみ。中間値は送らない（trailing debounce）。
      const base = "abcdefghij";
      for (let i = 1; i <= 10; i++) {
        trackUtmSet("campaign", base.slice(0, i));
      }
      jest.advanceTimersByTime(1000);

      expect(window.gtag).toHaveBeenCalledTimes(1);
      expect(window.gtag).toHaveBeenCalledWith("event", "utm_campaign_set", {
        utm_campaign_value: "abcdefghij",
        has_date_pattern: false,
      });
    });

    it("1000ms 未満では送信されないこと", () => {
      // 意図: 最後の呼び出しから 1000ms 経過するまでは送信を保留し、
      // ちょうど 1000ms で送信される（境界値の確認）。
      trackUtmSet("campaign", "spring_sale");

      jest.advanceTimersByTime(999);
      expect(window.gtag).toHaveBeenCalledTimes(0);

      jest.advanceTimersByTime(1);
      expect(window.gtag).toHaveBeenCalledTimes(1);
    });

    it("連続呼び出しの途中で 1000ms 経たなければ送信が延期されること", () => {
      // 意図: 500ms 間隔で呼び続ける間はタイマーがリセットされ続け送信されない。
      // 最後の呼び出しから 1000ms 経過した時点で初めて 1 回送信される。
      trackUtmSet("campaign", "a");
      jest.advanceTimersByTime(500);
      trackUtmSet("campaign", "ab");
      jest.advanceTimersByTime(500);
      trackUtmSet("campaign", "abc");

      // 最初の呼び出しから 1000ms 経過しているが、最後の呼び出しからは 0ms なので未送信
      expect(window.gtag).toHaveBeenCalledTimes(0);

      jest.advanceTimersByTime(999);
      expect(window.gtag).toHaveBeenCalledTimes(0);

      jest.advanceTimersByTime(1);
      expect(window.gtag).toHaveBeenCalledTimes(1);
      expect(window.gtag).toHaveBeenCalledWith("event", "utm_campaign_set", {
        utm_campaign_value: "abc",
        has_date_pattern: false,
      });
    });

    it("utm_source_set と utm_campaign_set は独立して 1 回ずつ送られること", () => {
      // 意図: イベント名ごとに独立したタイマーを持ち、別イベントの呼び出しが
      // 他方のタイマーをキャンセル・上書きしない。
      trackUtmSet("source", "goo", "custom");
      trackUtmSet("campaign", "spr");
      trackUtmSet("source", "google", "custom");
      trackUtmSet("campaign", "spring_sale");
      jest.advanceTimersByTime(1000);

      expect(window.gtag).toHaveBeenCalledTimes(2);
      expect(window.gtag).toHaveBeenCalledWith("event", "utm_source_set", {
        utm_source_value: "google",
        input_method: "custom",
      });
      expect(window.gtag).toHaveBeenCalledWith("event", "utm_campaign_set", {
        utm_campaign_value: "spring_sale",
        has_date_pattern: false,
      });
    });

    it("trackColorCustomized を 20 回連続で呼んでも 1 回だけ送られ、最後の色が送られること", () => {
      // 意図: カラーピッカーのドラッグ中に 20 回色が変わっても送信は確定した最終色 1 回のみ。
      for (let i = 0; i < 20; i++) {
        const hex = i.toString(16).padStart(2, "0");
        trackColorCustomized(`#${hex}${hex}${hex}`, "#ffffff");
      }
      jest.advanceTimersByTime(1000);

      expect(window.gtag).toHaveBeenCalledTimes(1);
      expect(window.gtag).toHaveBeenCalledWith("event", "color_customized", {
        foreground_color: "#131313",
        background_color: "#ffffff",
      });
    });

    it("trackCaptionSet を連続で呼んでも 1 回だけ送られること", () => {
      // 意図: キャプションを 1 文字ずつ入力して caption_length が 1 → 5 と増えても
      // 送信は最終状態 1 回のみ。
      for (let len = 1; len <= 5; len++) {
        trackCaptionSet(len, false);
      }
      jest.advanceTimersByTime(1000);

      expect(window.gtag).toHaveBeenCalledTimes(1);
      expect(window.gtag).toHaveBeenCalledWith("event", "caption_set", {
        caption_length: 5,
        is_template: false,
      });
    });

    it("trackQrGenerated は debounce されず即時に送られること", () => {
      // 意図: 連続発火しないイベントは従来どおり即時送信（debounce の適用範囲を限定する）。
      trackQrGenerated({
        hasUtm: true,
        utmCount: 1,
        hasLogo: false,
        hasFrame: false,
        hasCaption: false,
      });

      // タイマーを進めずに検証
      expect(window.gtag).toHaveBeenCalledTimes(1);
      expect(window.gtag).toHaveBeenCalledWith("event", "qr_generated", {
        has_utm: true,
        utm_count: 1,
        has_logo: false,
        has_frame: false,
        has_caption: false,
      });
    });

    it("trackPresetSelected は即時に送られること", () => {
      // 意図: クリック操作のイベントは debounce の対象外で即時送信される。
      trackPresetSelected("dark_mode");

      // タイマーを進めずに検証
      expect(window.gtag).toHaveBeenCalledTimes(1);
      expect(window.gtag).toHaveBeenCalledWith("event", "preset_selected", {
        preset_name: "dark_mode",
      });
    });

    it("flushPendingEvents() で保留中のイベントが即時送信され、その後タイマーが発火しても二重送信されないこと", () => {
      // 意図: ページ離脱時などに保留中のイベントを失わずに送るための flush。
      // flush 後はタイマーが消えているため、時間が経過しても再送されない。
      trackUtmSet("campaign", "spring_sale");
      trackColorCustomized("#000000", "#ffffff");
      expect(window.gtag).toHaveBeenCalledTimes(0);

      flushPendingEvents();

      expect(window.gtag).toHaveBeenCalledTimes(2);
      expect(window.gtag).toHaveBeenCalledWith("event", "utm_campaign_set", {
        utm_campaign_value: "spring_sale",
        has_date_pattern: false,
      });
      expect(window.gtag).toHaveBeenCalledWith("event", "color_customized", {
        foreground_color: "#000000",
        background_color: "#ffffff",
      });

      jest.advanceTimersByTime(1000);
      expect(window.gtag).toHaveBeenCalledTimes(2);
    });

    it("EVENT_DEBOUNCE_MS が 1000 であること", () => {
      // 意図: debounce 間隔を定数として公開し、テスト・呼び出し側が同じ値を参照できるようにする。
      expect(EVENT_DEBOUNCE_MS).toBe(1000);
    });
  });
});
