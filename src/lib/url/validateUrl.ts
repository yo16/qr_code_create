export function validateUrl(url: string): { isValid: boolean; error?: string } {
  // 空文字は未入力としてエラーなし
  if (!url) {
    return { isValid: false };
  }

  // http:// または https:// で始まること
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return { isValid: false, error: "有効なURLを入力してください" };
  }

  // URL形式チェック
  try {
    new URL(url);
  } catch {
    return { isValid: false, error: "有効なURLを入力してください" };
  }

  return { isValid: true };
}
