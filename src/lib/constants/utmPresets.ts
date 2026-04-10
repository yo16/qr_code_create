export const UTM_SOURCE_OPTIONS = [
  { value: "flyer", label: "チラシ・フライヤー" },
  { value: "poster", label: "ポスター" },
  { value: "business_card", label: "名刺" },
  { value: "brochure", label: "パンフレット" },
  { value: "banner", label: "看板" },
  { value: "receipt", label: "レシート" },
  { value: "product_package", label: "製品パッケージ" },
  { value: "menu", label: "メニュー" },
  { value: "signage", label: "店内POP" },
];

export const UTM_MEDIUM_OPTIONS = [
  { value: "qr", label: "QRコード" },
  { value: "print", label: "印刷物" },
];

export const UTM_FIELD_HELP = {
  source:
    "QRコードを掲載する場所を指定します（チラシ、名刺、ポスターなど）",
  medium:
    "ユーザーに届ける手段を指定します。QRコードの場合は「QRコード」がおすすめです",
  campaign:
    "キャンペーン名を指定します。日付や内容を含めると管理しやすくなります（例: spring_sale_2026）",
  term: "検索キーワードを指定します。主にリスティング広告向けですが、QRコードでは省略可能です",
  content:
    "同一キャンペーン内でA/Bテストを行う場合などに使います。複数のQRコードを使い分ける際に便利です",
};

// 用途別設定例
export const UTM_USAGE_EXAMPLES = [
  {
    label: "名刺に印刷",
    source: "business_card",
    medium: "qr",
    campaign: "networking_2026",
  },
  {
    label: "チラシに印刷",
    source: "flyer",
    medium: "qr",
    campaign: "sale_2026",
  },
  {
    label: "ポスター掲示",
    source: "poster",
    medium: "qr",
    campaign: "event_2026",
  },
  {
    label: "店内POP",
    source: "signage",
    medium: "qr",
    campaign: "store_promo_2026",
  },
];
