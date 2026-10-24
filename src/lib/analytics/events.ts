type EventParams = Record<string, string | number | boolean>;

// 連続発火するイベントの送信を遅延させる間隔（ms）
export const EVENT_DEBOUNCE_MS = 1000;

export function trackEvent(eventName: string, params?: EventParams): void {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", eventName, params);
}

const pendingEvents = new Map<
  string,
  { timer: ReturnType<typeof setTimeout>; params?: EventParams }
>();

// 入力のたびに送ると集計がノイズになるため、同一イベント名ごとに
// 最後の呼び出しだけを EVENT_DEBOUNCE_MS 後に送る（trailing debounce）
function trackEventDebounced(eventName: string, params?: EventParams): void {
  const existing = pendingEvents.get(eventName);
  if (existing) clearTimeout(existing.timer);

  const timer = setTimeout(() => {
    pendingEvents.delete(eventName);
    trackEvent(eventName, params);
  }, EVENT_DEBOUNCE_MS);
  pendingEvents.set(eventName, { timer, params });
}

// 保留中のdebounceイベントを即時に送信する（ページ離脱前などに使用）
export function flushPendingEvents(): void {
  const entries = Array.from(pendingEvents.entries());
  pendingEvents.clear();
  for (const [eventName, { timer, params }] of entries) {
    clearTimeout(timer);
    trackEvent(eventName, params);
  }
}

// URL入力完了
export function trackUrlEntered(urlDomain: string): void {
  trackEvent("url_entered", { url_domain: urlDomain });
}

// UTM ON/OFF切替
export function trackUtmToggled(enabled: boolean): void {
  trackEvent("utm_toggled", { enabled });
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

  // 入力のたびに呼ばれるため debounce して集計ノイズを抑える
  trackEventDebounced(eventName, params);
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
  // 色選択中の連続発火を抑えるため debounce
  trackEventDebounced("color_customized", {
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
  // 文字入力のたびに送ると集計がノイズになるため debounce
  trackEventDebounced("caption_set", {
    caption_length: captionLength,
    is_template: isTemplate,
  });
}

// プリセット選択
export function trackPresetSelected(presetName: string): void {
  trackEvent("preset_selected", { preset_name: presetName });
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
