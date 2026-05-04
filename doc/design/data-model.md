# データモデル設計

## 関連ドキュメント

- [アーキテクチャ設計](./architecture.md)
- [コンポーネント設計](./component-design.md)
- [ディレクトリ構造設計](./directory-structure.md)
- [UI/UX仕様](./ui-ux-spec.md)
- [要件定義書](../requirements.md)
- [マーケティング戦略 - アナリティクス計測計画](../marketing-strategy.md)

---

## 1. 型定義ファイル構成

```
src/types/
├── content.ts      # MDXコンテンツ関連の型
├── qr.ts           # QRコード関連の型（状態、装飾、ダウンロード等）
└── analytics.ts    # GA4イベント関連の型
```

---

## 2. QRコード関連の型（`src/types/qr.ts`）

### 2.1 UTMパラメータ

```typescript
/**
 * UTMパラメータの型定義
 * Google Analyticsでトラフィック元を分析するための5つのパラメータ
 */
export interface UtmParams {
  /** トラフィックの参照元（例: flyer, poster, business_card） */
  source: string;
  /** マーケティング媒体（例: qr, print） */
  medium: string;
  /** キャンペーン名（例: spring_sale_2026） */
  campaign: string;
  /** 検索キーワード（任意） */
  term: string;
  /** コンテンツの識別（任意、A/Bテスト等） */
  content: string;
}
```

### 2.2 装飾設定

```typescript
/**
 * ロゴ画像設定
 * アップロードされた画像をクライアントサイドで保持するための型
 */
export interface LogoConfig {
  /** FileReaderで読み込んだ data URL (base64) */
  dataUrl: string;
  /** 元ファイル名 */
  fileName: string;
  /** MIME type (image/png, image/jpeg, image/svg+xml) */
  fileType: 'image/png' | 'image/jpeg' | 'image/svg+xml';
  /** ファイルサイズ(KB) */
  fileSizeKb: number;
  /** QRコード内でのサイズ比率 (10-25%、誤り訂正レベルHの安全範囲) */
  sizePercent: number;
}

/**
 * フレーム種別
 */
export type FrameType =
  | 'none'
  | 'simple'
  | 'rounded'
  | 'ornate'
  | 'elegant'
  | 'pop'
  | 'business'
  | 'festive';

/**
 * フレームカテゴリ
 */
export type FrameCategory = 'basic' | 'decorative' | 'target';

/**
 * フレーム設定
 */
export interface FrameConfig {
  /** フレーム種別 */
  type: FrameType;
  /** フレームカテゴリ */
  category: FrameCategory;
  /** フレーム色（#RRGGBB） */
  color: string;
}

/**
 * フレーム画像仕様
 *
 * フレームを画像ファイルで提供する場合の仕様。
 * Canvas描画による既存フレーム（simple, rounded等）とは別に、
 * より複雑なデザインのフレームを画像で追加できる。
 *
 * ## 領域構成
 *
 * 画像は外側から「フレーム装飾領域」「クワイエットゾーン」「QRコードデータ領域」
 * の3層で構成される。
 *
 * - QRコードデータ領域: 中央 520 x 520 px — QRコードのデータモジュールが描画される領域
 * - クワイエットゾーン: QRコードデータ領域の外周 80px — QRコード仕様で推奨される
 *   4モジュール分の余白。この領域は必ず白（背景色）のままにすること。
 *   80px = 想定される最大モジュールサイズ(20px) × 4モジュール
 * - フレーム装飾領域: 最外周 132px — フレームのデザインを自由に配置できる領域
 *
 * ## 基本仕様
 * - 画像サイズ: 944 x 944 px（キャプションなし）
 * - 透過領域: 中央 680 x 680 px（QRコードデータ領域 + クワイエットゾーン）
 *   - 位置: 左上 (132, 132) から 680 x 680 px
 * - フレーム装飾領域: 上下左右 132px
 * - 形式: SVG（推奨）または PNG（透過背景）
 * - 色: 単色（黒）で作成し、ランタイムで着色
 *
 * ## クワイエットゾーン（静寂領域）
 * QRコード規格では、QRコードのデータモジュール周囲に最小4モジュール分の
 * 余白（クワイエットゾーン）が必要とされる。この余白がないと、
 * 読み取り機がQRコードの境界を正しく認識できない場合がある。
 *
 * 本仕様では:
 * - 680x680の透過領域のうち、外周80pxがクワイエットゾーン
 * - QRコード生成時に margin: 4（モジュール単位）を設定することで確保
 * - フレーム画像の装飾が透過領域（680x680）に侵入しないこと
 *
 * ## キャプション付きフレーム
 * - 画像サイズ: 944 x (944 + キャプション領域高さ) px
 * - 幅は常に 944px で統一
 * - QRコード配置領域の位置は変わらない: (132, 132) から 680 x 680 px
 * - キャプション領域: 下部に必要分だけ縦方向に追加
 * - height > 944 の場合、キャプション付きフレームと判別できる
 *
 * ## 配置先
 * - public/images/frames/ に格納
 *
 * ```
 * 基本フレーム (944 x 944)
 * +-------------------------------+
 * |  フレーム装飾領域 (132px)       |
 * |   +-------------------------+ |
 * |   | クワイエットゾーン (80px) | |
 * |   |   +---+---+---+---+   | |
 * |   |   | QRコードデータ |   | |
 * |132|80 |  520 x 520    |80 |132|
 * |   |   +---+---+---+---+   | |
 * |   |         80px           | |
 * |   +-------------------------+ |
 * |           132px                |
 * +-------------------------------+
 *
 * キャプション付き (944 x 944+α)
 * +-------------------------------+
 * |  (上記と同じ構成)              |
 * +-------------------------------+
 * |  キャプション領域              |
 * +-------------------------------+
 * ```
 */

/** フレーム画像定数 */
const FRAME_IMAGE = {
  /** フレーム画像の幅 (px) */
  WIDTH: 944,
  /** 基本フレーム画像の高さ (px) */
  BASE_HEIGHT: 944,
  /** フレーム装飾領域の幅 (px) */
  BORDER_WIDTH: 132,
  /** 透過領域（QRコード + クワイエットゾーン）のオフセット (px) */
  QR_AREA_OFFSET: 132,
  /** 透過領域（QRコード + クワイエットゾーン）のサイズ (px) */
  QR_AREA_SIZE: 680,
  /** クワイエットゾーンの幅 (px) */
  QUIET_ZONE: 80,
  /** QRコードデータ領域のサイズ (px) */
  QR_DATA_SIZE: 520,
} as const;

/** QRコード生成設定 */
const QR_GENERATION = {
  /** クワイエットゾーン（モジュール単位、QRコード規格推奨値: 4） */
  MARGIN_MODULES: 4,
} as const;

/**
 * キャプション設定
 */
export interface CaptionConfig {
  /** キャプションテキスト */
  text: string;
  /** フォントサイズ (px) */
  fontSize: number;
}

/**
 * 装飾プリセット名
 */
export type DecorationPreset =
  | 'simple'
  | 'business'
  | 'casual'
  | 'elegant'
  | 'pop';

/**
 * 装飾設定全体
 */
export interface DecorationConfig {
  /** 選択中のプリセット（null = カスタム） */
  preset: DecorationPreset | null;
  /** ロゴ画像設定 */
  logo: LogoConfig | null;
  /** 前景色（QRコードのドット色、#RRGGBB） */
  foregroundColor: string;
  /** 背景色（#RRGGBB） */
  backgroundColor: string;
  /** フレーム設定 */
  frame: FrameConfig | null;
  /** キャプション設定 */
  caption: CaptionConfig;
}
```

### 2.3 QRコード生成状態

```typescript
/**
 * QRコード生成の全体状態
 * QrGeneratorコンポーネントで useState で管理する
 */
export interface QrState {
  /** 入力URL */
  url: string;
  /** UTMパラメータ */
  utm: UtmParams;
  /** 装飾設定 */
  decoration: DecorationConfig;
  /** 現在のステップ (1: URL入力, 2: UTM設定, 3: 装飾, 4: ダウンロード) */
  currentStep: 1 | 2 | 3 | 4;
}
```

### 2.4 QRコード生成オプション

```typescript
/**
 * QRコード生成時のオプション
 * qrcode ライブラリに渡すパラメータ
 */
export interface QrGenerateOptions {
  /** 生成するURL（UTMパラメータ付き） */
  url: string;
  /** QRコードのサイズ (px) */
  size: number;
  /** 前景色 */
  foregroundColor: string;
  /** 背景色 */
  backgroundColor: string;
  /** エラー訂正レベル（ロゴ挿入時はHを使用） */
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  /** ロゴ画像のdata URL（null = ロゴなし） */
  logoDataUrl: string | null;
  /** ロゴサイズ比率 (0.1-0.3) */
  logoSizeRatio: number;
}
```

### 2.5 ダウンロード設定

```typescript
/**
 * ダウンロードフォーマット
 */
export type DownloadFormat = 'png' | 'svg' | 'pdf';

/**
 * 解像度倍率
 */
export type ResolutionScale = 1 | 2 | 3;

/**
 * ダウンロードオプション
 */
export interface DownloadOptions {
  /** ファイルフォーマット */
  format: DownloadFormat;
  /** 解像度倍率（1x, 2x, 3x） */
  scale: ResolutionScale;
  /** ファイル名（拡張子なし） */
  fileName: string;
}
```

### 2.6 バリデーション結果

```typescript
/**
 * QRコード読み取り可否の検証結果
 */
export interface QrValidationResult {
  /** 読み取り可能かどうか */
  isReadable: boolean;
  /** 警告メッセージ一覧 */
  warnings: QrWarning[];
}

/**
 * QRコード警告種別
 */
export type QrWarningType =
  | 'low_contrast'
  | 'logo_too_large'
  | 'url_too_long'
  | 'invalid_url';

/**
 * QRコード警告
 */
export interface QrWarning {
  /** 警告種別 */
  type: QrWarningType;
  /** 警告メッセージ */
  message: string;
  /** 重要度 */
  severity: 'info' | 'warning' | 'error';
}
```

### 2.7 コントラスト計算

```typescript
/**
 * コントラスト比チェック結果
 */
export interface ContrastResult {
  /** コントラスト比 (1:1 〜 21:1) */
  ratio: number;
  /** WCAG AA基準を満たすか */
  meetsAA: boolean;
  /** QRコード読み取りに十分か（3:1以上を推奨） */
  isSufficientForQr: boolean;
  /** 警告メッセージ（基準未満の場合） */
  warning: string | null;
}
```

---

## 3. MDXコンテンツ関連の型（`src/types/content.ts`）

### 3.1 共通フロントマター

```typescript
/**
 * 全コンテンツ共通のフロントマター基本型
 */
export interface BaseFrontmatter {
  /** 記事タイトル */
  title: string;
  /** メタディスクリプション */
  description: string;
  /** 公開日 (YYYY-MM-DD) */
  publishedAt: string;
  /** 更新日 (YYYY-MM-DD) */
  updatedAt?: string;
}
```

### 3.2 ガイドフロントマター

```typescript
/**
 * ガイド記事のフロントマター
 * src/content/guide/*.mdx で使用
 */
export interface GuideFrontmatter extends BaseFrontmatter {
  /** 表示順序（小さいほど上に表示） */
  order: number;
  /** OGP画像パス（public/images/og/ からの相対パス） */
  ogImage?: string;
  /** 関連する用途別ページのslug一覧 */
  relatedUseCases?: string[];
}
```

**MDXフロントマター例**:

```yaml
---
title: "UTMパラメータとは？初心者向け完全ガイド"
description: "UTMパラメータの基本から設定方法、Google Analyticsでの確認方法まで、初心者にもわかりやすく解説します。"
publishedAt: "2026-04-15"
order: 1
relatedUseCases:
  - business-card
  - flyer
---
```

### 3.3 用途別フロントマター

```typescript
/**
 * 用途別ページのフロントマター
 * src/content/use-cases/*.mdx で使用
 */
export interface UseCaseFrontmatter extends BaseFrontmatter {
  /** 用途名（日本語） */
  useCaseName: string;
  /** 推奨 utm_source 値 */
  recommendedSource: string;
  /** 推奨 utm_medium 値 */
  recommendedMedium: string;
  /** おすすめ装飾プリセット名 */
  recommendedPreset: DecorationPreset;
  /** 推奨印刷最小サイズ (mm) */
  minPrintSizeMm: number;
  /** 推奨印刷サイズ (mm) */
  recommendedPrintSizeMm: number;
  /** 推奨余白 (mm) */
  marginMm: number;
  /** OGP画像パス */
  ogImage?: string;
}
```

**MDXフロントマター例**:

```yaml
---
title: "名刺用QRコードの作り方"
description: "名刺に最適なQRコードの作成方法を解説。UTMパラメータの設定例、印刷サイズの目安、おすすめデザインを紹介します。"
publishedAt: "2026-05-01"
useCaseName: "名刺用QRコード"
recommendedSource: "business_card"
recommendedMedium: "qr"
recommendedPreset: "business"
minPrintSizeMm: 15
recommendedPrintSizeMm: 20
marginMm: 2
---
```

### 3.4 業種別フロントマター

```typescript
/**
 * 業種別ページのフロントマター
 * src/content/industry/*.mdx で使用
 */
export interface IndustryFrontmatter extends BaseFrontmatter {
  /** 業種名（日本語） */
  industryName: string;
  /** よくある活用シーン */
  commonUseCases: string[];
  /** 業種特有のUTM設定例 */
  utmExamples: Array<{
    scene: string;
    source: string;
    medium: string;
    campaign: string;
  }>;
  /** OGP画像パス */
  ogImage?: string;
}
```

**MDXフロントマター例**:

```yaml
---
title: "飲食店のQRコード活用ガイド"
description: "飲食店でのQRコード活用方法を紹介。メニュー、テーブルPOP、レシートなど、シーン別の設定例とデザインのコツを解説します。"
publishedAt: "2026-06-01"
industryName: "飲食店"
commonUseCases:
  - "メニュー"
  - "テーブルPOP"
  - "レシート"
utmExamples:
  - scene: "メニュー表"
    source: "menu"
    medium: "qr"
    campaign: "restaurant_menu_2026"
  - scene: "テーブルPOP"
    source: "table_pop"
    medium: "qr"
    campaign: "table_order_2026"
---
```

### 3.5 ブログフロントマター

```typescript
/**
 * ブログ記事のフロントマター
 * src/content/blog/*.mdx で使用
 */
export interface BlogFrontmatter extends BaseFrontmatter {
  /** カテゴリslug */
  category: BlogCategory;
  /** タグ一覧 */
  tags?: string[];
  /** OGP画像パス */
  ogImage?: string;
  /** 著者名 */
  author?: string;
}

/**
 * ブログカテゴリ
 */
export type BlogCategory = 'qr-marketing' | 'utm-tips' | 'case-studies';

/**
 * ブログカテゴリの表示情報
 */
export const BLOG_CATEGORIES: Record<BlogCategory, { label: string; description: string }> = {
  'qr-marketing': {
    label: 'QRコードマーケティング',
    description: 'QRコードを活用したマーケティング施策の解説',
  },
  'utm-tips': {
    label: 'UTM活用術',
    description: 'UTMパラメータの設定方法と活用テクニック',
  },
  'case-studies': {
    label: '事例紹介',
    description: 'QRコードマーケティングの成功事例',
  },
};
```

### 3.6 比較ページフロントマター

```typescript
/**
 * 比較ページのフロントマター
 * src/content/compare/*.mdx で使用
 */
export interface CompareFrontmatter extends BaseFrontmatter {
  /** 比較対象ツール名 */
  competitorName?: string;
  /** 比較テーブルデータ */
  comparisonData?: Array<{
    feature: string;
    ours: string;
    theirs: string;
  }>;
  /** OGP画像パス */
  ogImage?: string;
}
```

### 3.7 コンテンツ取得関数の型

```typescript
/**
 * コンテンツ種別
 */
export type ContentType = 'guide' | 'use-cases' | 'industry' | 'blog' | 'compare';

/**
 * フロントマターの型マップ
 */
export type FrontmatterMap = {
  guide: GuideFrontmatter;
  'use-cases': UseCaseFrontmatter;
  industry: IndustryFrontmatter;
  blog: BlogFrontmatter;
  compare: CompareFrontmatter;
};

/**
 * コンテンツ取得結果
 */
export interface ContentResult<T extends ContentType> {
  /** フロントマターデータ */
  frontmatter: FrontmatterMap[T];
  /** MDX本文 */
  content: string;
  /** ファイルslug */
  slug: string;
}

/**
 * コンテンツ一覧の各アイテム
 */
export interface ContentListItem<T extends ContentType> {
  /** フロントマターデータ */
  frontmatter: FrontmatterMap[T];
  /** ファイルslug */
  slug: string;
}
```

---

## 4. GA4イベント関連の型（`src/types/analytics.ts`）

### 4.1 イベント定義

[マーケティング戦略 セクション10](../marketing-strategy.md) に基づく全16種のカスタムイベント。

```typescript
/**
 * GA4カスタムイベント名
 */
export type AnalyticsEventName =
  | 'url_entered'
  | 'utm_source_set'
  | 'utm_medium_set'
  | 'utm_campaign_set'
  | 'utm_term_set'
  | 'utm_content_set'
  | 'utm_params_count'
  | 'logo_uploaded'
  | 'color_customized'
  | 'frame_selected'
  | 'caption_set'
  | 'preset_selected'
  | 'qr_generated'
  | 'qr_downloaded'
  | 'guide_tooltip_opened'
  | 'help_article_clicked';

/**
 * 各イベントのプロパティ型
 */
export interface AnalyticsEventParams {
  url_entered: {
    url_domain: string;
  };
  utm_source_set: {
    utm_source_value: string;
    input_method: 'dropdown' | 'custom';
  };
  utm_medium_set: {
    utm_medium_value: string;
    input_method: 'dropdown' | 'custom';
  };
  utm_campaign_set: {
    has_date_pattern: boolean;
  };
  utm_term_set: Record<string, never>;
  utm_content_set: Record<string, never>;
  utm_params_count: {
    count: number;
  };
  logo_uploaded: {
    file_type: string;
    file_size_kb: number;
  };
  color_customized: {
    foreground_color: string;
    background_color: string;
  };
  frame_selected: {
    frame_type: string;
    frame_category: string;
  };
  caption_set: {
    caption_length: number;
    is_template: boolean;
  };
  preset_selected: {
    preset_name: string;
  };
  qr_generated: {
    has_utm: boolean;
    utm_count: number;
    has_logo: boolean;
    has_frame: boolean;
    has_caption: boolean;
  };
  qr_downloaded: {
    format: 'png' | 'svg' | 'pdf';
    has_utm: boolean;
    decoration_count: number;
  };
  guide_tooltip_opened: {
    tooltip_id: string;
    field_name: string;
  };
  help_article_clicked: {
    article_slug: string;
  };
}
```

### 4.2 gtag型拡張

```typescript
/**
 * window.gtag の型定義
 * GA4用グローバル型拡張
 */
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js',
      targetIdOrEvent: string | Date,
      params?: Record<string, unknown>
    ) => void;
    dataLayer: Array<unknown>;
  }
}

export {};
```

---

## 5. 定数データ（`src/lib/constants/`）

### 5.1 UTMプリセット（`utmPresets.ts`）

```typescript
/**
 * utm_source のおすすめ選択肢
 */
export const UTM_SOURCE_OPTIONS = [
  { value: 'flyer', label: 'チラシ (flyer)' },
  { value: 'poster', label: 'ポスター (poster)' },
  { value: 'business_card', label: '名刺 (business_card)' },
  { value: 'brochure', label: 'パンフレット (brochure)' },
  { value: 'banner', label: '看板 (banner)' },
  { value: 'receipt', label: 'レシート (receipt)' },
  { value: 'product_package', label: '製品パッケージ (product_package)' },
  { value: 'menu', label: 'メニュー (menu)' },
  { value: 'table_pop', label: 'テーブルPOP (table_pop)' },
] as const;

/**
 * utm_medium のおすすめ選択肢
 */
export const UTM_MEDIUM_OPTIONS = [
  { value: 'qr', label: 'QRコード (qr)' },
  { value: 'print', label: '印刷物 (print)' },
] as const;

/**
 * 配布用途別のUTM設定例
 */
export const UTM_USAGE_EXAMPLES = [
  {
    label: '名刺に印刷する場合',
    icon: '💼',
    source: 'business_card',
    medium: 'qr',
    campaign: 'networking_2026',
  },
  {
    label: 'チラシに印刷する場合',
    icon: '📄',
    source: 'flyer',
    medium: 'qr',
    campaign: 'spring_sale_2026',
  },
  {
    label: 'ポスターに印刷する場合',
    icon: '📋',
    source: 'poster',
    medium: 'qr',
    campaign: 'event_promotion_2026',
  },
  {
    label: '店舗に設置する場合',
    icon: '🏪',
    source: 'store',
    medium: 'qr',
    campaign: 'store_promotion_2026',
  },
] as const;
```

### 5.2 装飾プリセット（`decorationPresets.ts`）

```typescript
import type { DecorationPreset, DecorationConfig } from '@/types/qr';

/**
 * 装飾プリセット定義
 */
export const DECORATION_PRESETS: Record<DecorationPreset, Omit<DecorationConfig, 'preset' | 'logo'>> = {
  simple: {
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    frame: null,
    caption: { text: '', fontSize: 14 },
  },
  business: {
    foregroundColor: '#1a365d',
    backgroundColor: '#ffffff',
    frame: { type: 'simple', category: 'basic', color: '#1a365d' },
    caption: { text: '詳しくはこちら', fontSize: 14 },
  },
  casual: {
    foregroundColor: '#2d7d46',
    backgroundColor: '#f0fff4',
    frame: { type: 'rounded', category: 'basic', color: '#2d7d46' },
    caption: { text: 'スキャンしてチェック', fontSize: 14 },
  },
  elegant: {
    foregroundColor: '#44337a',
    backgroundColor: '#faf5ff',
    frame: { type: 'elegant', category: 'target', color: '#44337a' },
    caption: { text: 'QRコードを読み取る', fontSize: 14 },
  },
  pop: {
    foregroundColor: '#c53030',
    backgroundColor: '#fff5f5',
    frame: { type: 'pop', category: 'target', color: '#c53030' },
    caption: { text: '今すぐアクセス!', fontSize: 16 },
  },
};
```

### 5.3 フレームプリセット（`framePresets.ts`）

```typescript
import type { FrameType, FrameCategory } from '@/types/qr';

/**
 * フレーム情報
 */
export interface FramePresetInfo {
  type: FrameType;
  category: FrameCategory;
  label: string;
  description: string;
  defaultColor: string;
}

export const FRAME_PRESETS: FramePresetInfo[] = [
  {
    type: 'none',
    category: 'basic',
    label: 'なし',
    description: 'フレームを使用しません',
    defaultColor: '#000000',
  },
  {
    type: 'simple',
    category: 'basic',
    label: 'シンプル',
    description: 'シンプルな線のみの枠',
    defaultColor: '#333333',
  },
  {
    type: 'rounded',
    category: 'basic',
    label: '角丸',
    description: '角が丸い枠',
    defaultColor: '#333333',
  },
  {
    type: 'ornate',
    category: 'decorative',
    label: '額縁風',
    description: '装飾的な額縁風の枠',
    defaultColor: '#8b6914',
  },
  {
    type: 'elegant',
    category: 'target',
    label: 'エレガント',
    description: '上品で洗練されたデザイン',
    defaultColor: '#44337a',
  },
  {
    type: 'pop',
    category: 'target',
    label: 'ポップ',
    description: '明るく目を引くカラフルなデザイン',
    defaultColor: '#c53030',
  },
  {
    type: 'business',
    category: 'target',
    label: 'ビジネス',
    description: 'シンプルで信頼感のあるデザイン',
    defaultColor: '#1a365d',
  },
  {
    type: 'festive',
    category: 'target',
    label: 'イベント',
    description: '華やかで季節感のあるデザイン',
    defaultColor: '#d69e2e',
  },
];
```

### 5.4 キャプションテンプレート（`captionTemplates.ts`）

```typescript
/**
 * キャプションテンプレート
 */
export const CAPTION_TEMPLATES = [
  { value: '', label: 'テンプレートを選択...' },
  { value: 'スキャンして詳細を見る', label: 'スキャンして詳細を見る' },
  { value: 'こちらからアクセス', label: 'こちらからアクセス' },
  { value: 'QRコードを読み取る', label: 'QRコードを読み取る' },
  { value: '詳しくはWebで', label: '詳しくはWebで' },
  { value: '今すぐチェック', label: '今すぐチェック' },
  { value: 'ご予約はこちら', label: 'ご予約はこちら' },
  { value: 'メニューを見る', label: 'メニューを見る' },
  { value: 'お問い合わせ', label: 'お問い合わせ' },
] as const;

/**
 * キャプション推奨設定
 */
export const CAPTION_GUIDELINES = {
  /** 推奨最大文字数 */
  maxRecommendedLength: 15,
  /** 最小フォントサイズ (px) */
  minFontSize: 10,
  /** 最大フォントサイズ (px) */
  maxFontSize: 24,
  /** デフォルトフォントサイズ (px) */
  defaultFontSize: 14,
} as const;
```

---

## 6. ユーティリティ関数の入出力型

### 6.1 URL構築（`lib/url/buildUtmUrl.ts`）

```typescript
/**
 * UTMパラメータ付きURLを構築する
 * @param baseUrl - ベースURL
 * @param utm - UTMパラメータ
 * @returns UTMパラメータ付きURL文字列
 */
export function buildUtmUrl(baseUrl: string, utm: UtmParams): string;
```

### 6.2 URLバリデーション（`lib/url/validateUrl.ts`）

```typescript
/**
 * URL検証結果
 */
export interface UrlValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * URLの形式を検証する
 * @param url - 検証対象のURL文字列
 * @returns 検証結果
 */
export function validateUrl(url: string): UrlValidationResult;
```

### 6.3 コントラストチェック（`lib/color/contrastChecker.ts`）

```typescript
/**
 * 2色間のコントラスト比を計算し、QRコード用途での適切性を判定する
 * @param foreground - 前景色 (#RRGGBB)
 * @param background - 背景色 (#RRGGBB)
 * @returns コントラスト比と判定結果
 */
export function checkContrast(foreground: string, background: string): ContrastResult;
```

### 6.4 コンテンツ取得（`lib/content/getContent.ts`）

```typescript
/**
 * 指定されたコンテンツ種別・slugのMDXファイルを読み込む
 * @param type - コンテンツ種別
 * @param slug - ファイルslug
 * @returns フロントマターとMDX本文
 */
export async function getContent<T extends ContentType>(
  type: T,
  slug: string
): Promise<ContentResult<T>>;

/**
 * 指定されたコンテンツ種別の全アイテム一覧を取得する
 * @param type - コンテンツ種別
 * @returns コンテンツ一覧（フロントマター + slug）
 */
export async function getContentList<T extends ContentType>(
  type: T
): Promise<ContentListItem<T>[]>;

/**
 * 指定されたコンテンツ種別の全slugを取得する
 * generateStaticParams で使用
 * @param type - コンテンツ種別
 * @returns slug文字列の配列
 */
export async function getContentSlugs(type: ContentType): Promise<string[]>;
```

---

## 7. JSON-LDスキーマの型

```typescript
// lib/schema/ 内の各関数が返す型は Record<string, unknown> とし、
// JSON-LD仕様に準拠した構造を返す。
// 型安全性よりも柔軟性を優先する（スキーマ仕様が外部依存のため）。

/**
 * JSON-LDデータ（共通型）
 */
export type JsonLdData = Record<string, unknown>;
```

各スキーマ生成関数のシグネチャ:

```typescript
// lib/schema/buildWebApplicationSchema.ts
export function buildWebApplicationSchema(): JsonLdData;

// lib/schema/buildFaqSchema.ts
export function buildFaqSchema(items: Array<{ question: string; answer: string }>): JsonLdData;

// lib/schema/buildHowToSchema.ts
export function buildHowToSchema(): JsonLdData;

// lib/schema/buildBreadcrumbSchema.ts
export function buildBreadcrumbSchema(items: Array<{ name: string; url: string }>): JsonLdData;

// lib/schema/buildOrganizationSchema.ts
export function buildOrganizationSchema(): JsonLdData;

// lib/schema/buildArticleSchema.ts
export function buildArticleSchema(frontmatter: BaseFrontmatter, path: string): JsonLdData;

// lib/schema/buildBlogPostingSchema.ts
// basePath: デフォルト "/guide"。use-casesでは "/use-cases" を指定
export function buildBlogPostingSchema(post: { title, description, slug, datePublished, dateModified?, basePath? }): JsonLdData;
```
