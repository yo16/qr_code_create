import {
  trackEvent,
  trackUrlEntered,
  trackUtmSet,
  trackQrGenerated,
  trackQrDownloaded,
  trackLogoUploaded,
  trackColorCustomized,
  trackFrameSelected,
  trackCaptionSet,
  trackPresetSelected,
  trackUtmParamsCount,
  trackGuideTooltipOpened,
  trackHelpArticleClicked,
  trackCtaClicked,
  trackFaqOpened,
  trackErrorOccurred,
  trackFormatSelected,
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
  // trackUtmSet
  // ─────────────────────────────────────────────
  describe("trackUtmSet", () => {
    it("source指定時にutm_source_valueが送信されること", () => {
      trackUtmSet("source", "google", "dropdown");

      expect(window.gtag).toHaveBeenCalledWith("event", "utm_source_set", {
        utm_source_value: "google",
        input_method: "dropdown",
      });
    });

    it("medium指定時にutm_medium_valueとinput_methodが送信されること", () => {
      trackUtmSet("medium", "cpc", "custom");

      expect(window.gtag).toHaveBeenCalledWith("event", "utm_medium_set", {
        utm_medium_value: "cpc",
        input_method: "custom",
      });
    });

    it("campaign指定時にutm_campaign_valueとhas_date_patternが送信されること", () => {
      trackUtmSet("campaign", "spring_sale");

      expect(window.gtag).toHaveBeenCalledWith("event", "utm_campaign_set", {
        utm_campaign_value: "spring_sale",
        has_date_pattern: false,
      });
    });

    it("campaign値に年（4桁数字）が含まれる場合has_date_pattern=trueになること", () => {
      trackUtmSet("campaign", "sale_2024_spring");

      expect(window.gtag).toHaveBeenCalledWith("event", "utm_campaign_set", {
        utm_campaign_value: "sale_2024_spring",
        has_date_pattern: true,
      });
    });

    it("campaign値に年が含まれない場合has_date_pattern=falseになること", () => {
      trackUtmSet("campaign", "summer_campaign");

      expect(window.gtag).toHaveBeenCalledWith("event", "utm_campaign_set", {
        utm_campaign_value: "summer_campaign",
        has_date_pattern: false,
      });
    });

    it("sourceにinputMethodなしで呼び出した場合input_methodが送信されないこと", () => {
      trackUtmSet("source", "google");

      expect(window.gtag).toHaveBeenCalledWith("event", "utm_source_set", {
        utm_source_value: "google",
      });
    });

    it("source/medium/campaign以外のparamName（term）の場合、空paramsでイベントが送信されること", () => {
      trackUtmSet("term", "discount");

      expect(window.gtag).toHaveBeenCalledWith("event", "utm_term_set", {});
    });

    it("source/medium/campaign以外のparamName（content）の場合、空paramsでイベントが送信されること", () => {
      trackUtmSet("content", "header_qr");

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
  describe("trackColorCustomized", () => {
    it("foreground_color, background_colorが送信されること", () => {
      trackColorCustomized("#000000", "#ffffff");

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

  describe("trackCaptionSet", () => {
    it("正しいイベント名とパラメータで呼ばれること", () => {
      trackCaptionSet(10, true);

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

  describe("trackUtmParamsCount", () => {
    it("正しいイベント名とcountパラメータで呼ばれること", () => {
      trackUtmParamsCount(3);

      expect(window.gtag).toHaveBeenCalledWith("event", "utm_params_count", {
        count: 3,
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

  describe("trackHelpArticleClicked", () => {
    it("正しいイベント名とarticle_slugで呼ばれること", () => {
      trackHelpArticleClicked("how-to-use-utm");

      expect(window.gtag).toHaveBeenCalledWith(
        "event",
        "help_article_clicked",
        {
          article_slug: "how-to-use-utm",
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

  describe("trackFormatSelected", () => {
    it("format=svgが正しく送信されること", () => {
      trackFormatSelected("svg");
      expect(window.gtag).toHaveBeenCalledWith("event", "format_selected", { format: "svg" });
    });

    it("format=pngが正しく送信されること", () => {
      trackFormatSelected("png");
      expect(window.gtag).toHaveBeenCalledWith("event", "format_selected", { format: "png" });
    });

    it("format=pdfが正しく送信されること", () => {
      trackFormatSelected("pdf");
      expect(window.gtag).toHaveBeenCalledWith("event", "format_selected", { format: "pdf" });
    });
  });
});
