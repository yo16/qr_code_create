import { jaClient as ja } from "@/i18n/jaClient";
import type { Dict } from "@/i18n/types";

export function validateUrl(
  url: string,
  messages: Dict["tool"]["validation"] = ja.tool.validation
): { isValid: boolean; error?: string } {
  // 空文字は未入力としてエラーなし
  if (!url) {
    return { isValid: false };
  }

  // http:// または https:// で始まること
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return { isValid: false, error: messages.invalidUrl };
  }

  // URL形式チェック
  try {
    new URL(url);
  } catch {
    return { isValid: false, error: messages.invalidUrl };
  }

  return { isValid: true };
}
