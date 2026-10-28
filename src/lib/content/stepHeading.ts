const STEP_PATTERN = /^(?:ステップ|Step|Paso|Etapa|Schritt)\s*(\d+)/;

/** 「ステップN」「Step N」（es Paso / pt-br Etapa / de Schritt）で始まる見出しなら "step-N" を返す。それ以外は undefined */
export function getStepHeadingId(text: string): string | undefined {
  const match = STEP_PATTERN.exec(text.trim());
  return match ? `step-${Number(match[1])}` : undefined;
}
