import { getStepHeadingId } from "@/lib/content/stepHeading";

describe("getStepHeadingId", () => {
  it.each([
    ["ステップ1: URLを入力する", "step-1"],
    ["Step 2: Customize", "step-2"],
    ["ステップ10", "step-10"],
    ["ステップ01", "step-1"],
    ["Step3", "step-3"],
    ["ステップ 4 ダウンロード", "step-4"],
    ["  ステップ2: 前後に空白", "step-2"],
    ["Paso 1: Escribe tu URL", "step-1"],
    ["Etapa 2", "step-2"],
    ["Schritt 3", "step-3"],
    ["Paso3", "step-3"],
  ])("「%s」→ %s", (text, expected) => {
    expect(getStepHeadingId(text)).toBe(expected);
  });

  it.each([
    ["まとめ"],
    ["ステップ"],
    ["Step"],
    ["ステップ１: 全角の数字"],
    ["UTMパラメータのステップ1"],
    ["Next Step 1"],
    ["step 1（小文字）"],
    ["paso 1"],
    ["Pasos 1"],
    ["Schritte 1"],
    ["Paso"],
    ["Siguiente Paso 1"],
    ["Etapa"],
    ["Schritt"],
    ["etapa 1"],
    ["schritt 1"],
    [""],
  ])("「%s」→ undefined", (text) => {
    expect(getStepHeadingId(text)).toBeUndefined();
  });
});
