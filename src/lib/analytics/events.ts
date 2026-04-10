/// <reference path="../../types/gtag.d.ts" />

type EventParams = Record<string, string | number | boolean>;

export function trackEvent(eventName: string, params?: EventParams): void {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", eventName, params);
}

// URL入力完了
export function trackUrlEntered(urlDomain: string): void {
  trackEvent("url_entered", { url_domain: urlDomain });
}

// UTMパラメータ設定
export function trackUtmSet(
  paramName: string,
  value: string,
  inputMethod?: "dropdown" | "custom"
): void {
  const eventName = `utm_${paramName}_set`;
  const params: EventParams = {};

  // source/mediumは選択方法（dropdown/custom）も記録
  if (paramName === "source" || paramName === "medium") {
    params[`utm_${paramName}_value`] = value;
    if (inputMethod) {
      params.input_method = inputMethod;
    }
  }

  // campaignは値に加えて日付パターン含有を記録（命名規則の遵守率分析用）
  if (paramName === "campaign") {
    params.utm_campaign_value = value;
    params.has_date_pattern = /\d{4}/.test(value);
  }

  trackEvent(eventName, params);
}

// QRコード生成
export function trackQrGenerated(options: {
  hasUtm: boolean;
  utmCount: number;
  hasLogo: boolean;
  hasFrame: boolean;
  hasCaption: boolean;
}): void {
  trackEvent("qr_generated", {
    has_utm: options.hasUtm,
    utm_count: options.utmCount,
    has_logo: options.hasLogo,
    has_frame: options.hasFrame,
    has_caption: options.hasCaption,
  });
}

// QRコードダウンロード
export function trackQrDownloaded(options: {
  format: "png" | "svg" | "pdf";
  hasUtm: boolean;
  decorationCount: number;
}): void {
  trackEvent("qr_downloaded", {
    format: options.format,
    has_utm: options.hasUtm,
    decoration_count: options.decorationCount,
  });
}

// ロゴアップロード
export function trackLogoUploaded(
  fileType: string,
  fileSizeKb: number
): void {
  trackEvent("logo_uploaded", {
    file_type: fileType,
    file_size_kb: fileSizeKb,
  });
}

// 色カスタマイズ
export function trackColorCustomized(
  foregroundColor: string,
  backgroundColor: string
): void {
  trackEvent("color_customized", {
    foreground_color: foregroundColor,
    background_color: backgroundColor,
  });
}

// フレーム選択
export function trackFrameSelected(
  frameType: string,
  frameCategory: string
): void {
  trackEvent("frame_selected", {
    frame_type: frameType,
    frame_category: frameCategory,
  });
}

// キャプション設定
export function trackCaptionSet(
  captionLength: number,
  isTemplate: boolean
): void {
  trackEvent("caption_set", {
    caption_length: captionLength,
    is_template: isTemplate,
  });
}

// プリセット選択
export function trackPresetSelected(presetName: string): void {
  trackEvent("preset_selected", { preset_name: presetName });
}

// UTMパラメータ設定数
export function trackUtmParamsCount(count: number): void {
  trackEvent("utm_params_count", { count });
}

// ガイドツールチップ表示
export function trackGuideTooltipOpened(
  tooltipId: string,
  fieldName: string
): void {
  trackEvent("guide_tooltip_opened", {
    tooltip_id: tooltipId,
    field_name: fieldName,
  });
}

// ヘルプ記事クリック
export function trackHelpArticleClicked(articleSlug: string): void {
  trackEvent("help_article_clicked", { article_slug: articleSlug });
}

// CTAクリック
export function trackCtaClicked(buttonText: string, location: string): void {
  trackEvent("cta_clicked", {
    button_text: buttonText,
    location,
  });
}

// FAQ開閉
export function trackFaqOpened(questionId: string): void {
  trackEvent("faq_opened", { question_id: questionId });
}

// エラー発生
export function trackErrorOccurred(
  errorType: string,
  errorMessage: string
): void {
  trackEvent("error_occurred", {
    error_type: errorType,
    error_message: errorMessage,
  });
}

// フォーマット選択
export function trackFormatSelected(format: "png" | "svg" | "pdf"): void {
  trackEvent("format_selected", { format });
}
