import { ja } from "@/i18n/ja";
import {
  UTM_SOURCE_OPTIONS,
  UTM_MEDIUM_OPTIONS,
  UTM_FIELD_HELP,
  UTM_USAGE_EXAMPLES,
  buildUtmSourceOptions,
  buildUtmMediumOptions,
  buildUtmFieldHelp,
  buildUtmUsageExamples,
} from "@/lib/constants/utmPresets";
import {
  DECORATION_PRESETS,
  buildDecorationPresets,
} from "@/lib/constants/decorationPresets";
import { FRAME_OPTIONS, buildFrameOptions } from "@/lib/qr/frameRenderer";

/** ja を壊さないよう深いコピーを作る */
function cloneJa(): typeof ja {
  return JSON.parse(JSON.stringify(ja)) as typeof ja;
}

describe("プリセット値の互換性（辞書化前と同じ並び）", () => {
  // 意図: UTM ソースの値は言語によらず固定（F-012）。GA のレポートが割れないよう並びも固定
  it("UTM_SOURCE_OPTIONS の value の並び", () => {
    expect(UTM_SOURCE_OPTIONS.map((o) => o.value)).toEqual([
      "flyer",
      "poster",
      "business_card",
      "brochure",
      "banner",
      "receipt",
      "product_package",
      "menu",
      "signage",
    ]);
  });

  // 意図: UTM ソースの日本語表示名が辞書化前と一字一句同じ
  it("UTM_SOURCE_OPTIONS の ja の label", () => {
    expect(UTM_SOURCE_OPTIONS.map((o) => o.label)).toEqual([
      "チラシ・フライヤー",
      "ポスター",
      "名刺",
      "パンフレット",
      "看板",
      "レシート",
      "製品パッケージ",
      "メニュー",
      "店内POP",
    ]);
  });

  // 意図: UTM メディアの値と表示名
  it("UTM_MEDIUM_OPTIONS の value と label", () => {
    expect(UTM_MEDIUM_OPTIONS).toEqual([
      { value: "qr", label: "QRコード" },
      { value: "print", label: "印刷物" },
    ]);
  });

  // 意図: 用途別設定例の値（source / medium / campaign）が固定
  it("UTM_USAGE_EXAMPLES の値", () => {
    expect(
      UTM_USAGE_EXAMPLES.map(({ source, medium, campaign }) => ({
        source,
        medium,
        campaign,
      }))
    ).toEqual([
      { source: "business_card", medium: "qr", campaign: "networking_2026" },
      { source: "flyer", medium: "qr", campaign: "sale_2026" },
      { source: "poster", medium: "qr", campaign: "event_2026" },
      { source: "signage", medium: "qr", campaign: "store_promo_2026" },
    ]);
  });

  // 意図: UTM_FIELD_HELP のキー（フィールド名）が固定
  it("UTM_FIELD_HELP のキー", () => {
    expect(Object.keys(UTM_FIELD_HELP)).toEqual([
      "source",
      "medium",
      "campaign",
      "term",
      "content",
    ]);
  });

  // 意図: 装飾プリセットの id と並びが固定
  it("DECORATION_PRESETS の id の並び", () => {
    expect(DECORATION_PRESETS.map((p) => p.id)).toEqual([
      "simple",
      "business",
      "casual",
      "elegant",
      "pop",
    ]);
  });

  // 意図: 装飾プリセットの言語に依存しない値（色・フレーム・文字サイズ）が固定
  it("DECORATION_PRESETS の値（色・フレーム・文字サイズ）", () => {
    expect(
      DECORATION_PRESETS.map((p) => [
        p.id,
        p.fgColor,
        p.bgColor,
        p.frameType,
        p.frameColor,
        p.caption.fontSize,
      ])
    ).toEqual([
      ["simple", "#000000", "#ffffff", "none", "#000000", 14],
      ["business", "#1a365d", "#ffffff", "business", "#1a365d", 12],
      ["casual", "#2d7d46", "#f0fff4", "rounded", "#2d7d46", 14],
      ["elegant", "#44337a", "#faf5ff", "elegant", "#44337a", 12],
      ["pop", "#c53030", "#fff5f5", "pop", "#c53030", 16],
    ]);
  });

  // 意図: フレームの type の並びが固定
  it("FRAME_OPTIONS の type の並び", () => {
    expect(FRAME_OPTIONS.map((o) => o.type)).toEqual([
      "none",
      "simple",
      "rounded",
      "ornate",
      "elegant",
      "pop",
      "business",
      "festive",
      "img-simple-black",
      "img-simple-blue",
      "img-simple-gray",
      "img-simple-red",
      "img-elaborated-japanese",
      "img-elaborated-gothic",
      "img-elaborated-baroque",
    ]);
  });

  // 意図: category は GA イベント（frame_selected）の値に使うため ja のまま固定
  it("FRAME_OPTIONS の category（GA の値）", () => {
    expect(FRAME_OPTIONS.map((o) => o.category)).toEqual([
      "基本",
      "基本",
      "基本",
      "装飾",
      "ターゲット別",
      "ターゲット別",
      "ターゲット別",
      "ターゲット別",
      "画像：シンプル",
      "画像：シンプル",
      "画像：シンプル",
      "画像：シンプル",
      "画像：装飾",
      "画像：装飾",
      "画像：装飾",
    ]);
  });

  // 意図: 画像フレームの画像パスが固定、CSS フレームは imageSrc を持たない
  it("FRAME_OPTIONS の imageSrc", () => {
    expect(FRAME_OPTIONS.map((o) => o.imageSrc)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      "/images/frames/simple/black-frame.png",
      "/images/frames/simple/blue-frame.png",
      "/images/frames/simple/gray-frame.png",
      "/images/frames/simple/red-frame.png",
      "/images/frames/elaborated/japanese.png",
      "/images/frames/elaborated/gothic.png",
      "/images/frames/elaborated/luxurious-baroque-style-gold.png",
    ]);
    // imageSrc を持たないフレームはキー自体が無い（既存の形を保つ）
    expect("imageSrc" in FRAME_OPTIONS[0]).toBe(false);
  });
});

describe("build* に ja を渡した結果は既存 export と同じ", () => {
  // 意図: 既存 export が ja 辞書からの組み立てと一致する
  it("buildUtmSourceOptions(ja.utm)", () => {
    expect(buildUtmSourceOptions(ja.utm)).toEqual(UTM_SOURCE_OPTIONS);
  });

  it("buildUtmMediumOptions(ja.utm)", () => {
    expect(buildUtmMediumOptions(ja.utm)).toEqual(UTM_MEDIUM_OPTIONS);
  });

  it("buildUtmFieldHelp(ja.utm)", () => {
    expect(buildUtmFieldHelp(ja.utm)).toEqual(UTM_FIELD_HELP);
  });

  it("buildUtmUsageExamples(ja.utm)", () => {
    expect(buildUtmUsageExamples(ja.utm)).toEqual(UTM_USAGE_EXAMPLES);
  });

  it("buildDecorationPresets(ja.decoration)", () => {
    expect(buildDecorationPresets(ja.decoration)).toEqual(DECORATION_PRESETS);
  });

  it("buildFrameOptions(ja.decoration)", () => {
    expect(buildFrameOptions(ja.decoration)).toEqual(FRAME_OPTIONS);
  });
});

describe("辞書を差し替えても値は変わらない（en の担保）", () => {
  // 意図: label を差し替えると label だけが変わり、value は変わらない
  it("buildUtmSourceOptions は label だけが辞書に従う", () => {
    const dict = cloneJa();
    dict.utm.sourceLabels.flyer = "Flyer";
    dict.utm.sourceLabels.business_card = "Business card";
    const options = buildUtmSourceOptions(dict.utm);
    expect(options.map((o) => o.value)).toEqual(
      UTM_SOURCE_OPTIONS.map((o) => o.value)
    );
    expect(options.find((o) => o.value === "flyer")?.label).toBe("Flyer");
    expect(options.find((o) => o.value === "business_card")?.label).toBe(
      "Business card"
    );
    expect(options.find((o) => o.value === "poster")?.label).toBe("ポスター");
  });

  // 意図: メディアも同様に value は固定
  it("buildUtmMediumOptions は label だけが辞書に従う", () => {
    const dict = cloneJa();
    dict.utm.mediumLabels.qr = "QR code";
    const options = buildUtmMediumOptions(dict.utm);
    expect(options).toEqual([
      { value: "qr", label: "QR code" },
      { value: "print", label: "印刷物" },
    ]);
  });

  // 意図: 用途別設定例も label だけが変わる
  it("buildUtmUsageExamples は label だけが辞書に従う", () => {
    const dict = cloneJa();
    dict.utm.usageExampleLabels.flyer = "Print on flyers";
    const examples = buildUtmUsageExamples(dict.utm);
    expect(examples[1]).toEqual({
      label: "Print on flyers",
      source: "flyer",
      medium: "qr",
      campaign: "sale_2026",
    });
  });

  // 意図: 装飾プリセットは name / description / caption.text だけが変わる
  it("buildDecorationPresets は文言だけが辞書に従う", () => {
    const dict = cloneJa();
    dict.decoration.presets.business = {
      name: "Business",
      description: "Calm design",
      caption: "Learn more",
    };
    const presets = buildDecorationPresets(dict.decoration);
    const business = presets.find((p) => p.id === "business");
    const original = DECORATION_PRESETS.find((p) => p.id === "business");
    expect(business).toEqual({
      ...original,
      name: "Business",
      description: "Calm design",
      caption: { ...original!.caption, text: "Learn more" },
    });
  });

  // 意図: フレームの label は辞書に従い、type / imageSrc は変わらない
  it("buildFrameOptions は label だけが辞書に従う", () => {
    const dict = cloneJa();
    dict.decoration.frame.labels["img-simple-black"] = "Black";
    const options = buildFrameOptions(dict.decoration);
    expect(options.map((o) => o.type)).toEqual(FRAME_OPTIONS.map((o) => o.type));
    expect(options.map((o) => o.imageSrc)).toEqual(
      FRAME_OPTIONS.map((o) => o.imageSrc)
    );
    expect(options.find((o) => o.type === "img-simple-black")?.label).toBe(
      "Black"
    );
  });
});
