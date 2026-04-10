# コンポーネント設計

## 関連ドキュメント

- [アーキテクチャ設計](./architecture.md)
- [ディレクトリ構造設計](./directory-structure.md)
- [データモデル設計](./data-model.md)
- [UI/UX仕様](./ui-ux-spec.md)
- [ページ・ルーティング設計](./page-routing.md)

---

## 1. コンポーネント階層図

```
app/layout.tsx (Server Component)
├── Header (Server Component)
│   └── MobileNav ('use client')
├── {children} ← 各ページのコンテンツ
└── Footer (Server Component)

/create ページ:
  page.tsx (Server Component)
  ├── JsonLd (Server Component)
  └── QrGenerator ('use client') ← dynamic import, ssr: false
      ├── ProgressBar
      ├── UrlInput
      ├── UtmBuilder
      │   ├── UtmField (x5: source, medium, campaign, term, content)
      │   ├── UtmGuide
      │   └── EffectivenessIndicator
      ├── DecorationPanel
      │   ├── PresetSelector
      │   ├── LogoUploader
      │   ├── ColorPicker (x2: foreground, background)
      │   ├── FrameSelector
      │   └── CaptionEditor
      ├── QrPreview
      └── QrDownload

(marketing) ページ:
  page.tsx (Server Component)
  ├── Breadcrumb (Server Component)
  ├── JsonLd (Server Component)
  ├── MdxContent (Server Component)
  └── CtaButton (Server Component)
```

---

## 2. QR関連コンポーネント（`src/components/qr/`）

### 2.1 QrGenerator

QRコード生成機能のメインコンテナ。全子コンポーネントの状態を一元管理する。

**種別**: Client Component (`'use client'`)

**読み込み方法**: `next/dynamic` で動的インポート（`ssr: false`）

```typescript
// app/(tool)/create/page.tsx での使用
import dynamic from 'next/dynamic';
import { QrGeneratorSkeleton } from '@/components/qr/QrGenerator/QrGeneratorSkeleton';

const QrGenerator = dynamic(
  () => import('@/components/qr/QrGenerator/QrGenerator').then(mod => ({ default: mod.QrGenerator })),
  { ssr: false, loading: () => <QrGeneratorSkeleton /> }
);
```

**Props**: なし（状態は全て内部管理）

**内部状態**（[データモデル設計 QrState](./data-model.md#3-qrコード生成状態)参照）:

```typescript
import type { QrState } from '@/types/qr';

// QrGenerator 内部で管理する状態
const [state, setState] = useState<QrState>({
  url: '',
  utm: {
    source: '',
    medium: 'qr',  // デフォルト値（Default Effect）
    campaign: '',
    term: '',
    content: '',
  },
  decoration: {
    preset: null,
    logo: null,
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    frame: null,
    caption: {
      text: '',
      fontSize: 14,
    },
  },
  currentStep: 1,
});
```

**責務**:
- 子コンポーネントへの状態配信と更新関数の提供
- UTMパラメータ付きURLの構築（`lib/url/buildUtmUrl.ts` を使用）
- QRコード生成トリガー（500ms デバウンス）
- 進捗度の算出
- GA4イベントの発火タイミング制御

**レイアウト**:
```
┌──────────────────────────────────────────────────────┐
│ ProgressBar                                          │
├──────────────────────────┬───────────────────────────┤
│ 入力エリア（左/上）       │ プレビューエリア（右/下）  │
│                          │                           │
│ ┌──────────────────────┐ │ ┌───────────────────────┐ │
│ │ UrlInput             │ │ │ QrPreview             │ │
│ └──────────────────────┘ │ │                       │ │
│ ┌──────────────────────┐ │ │   [QRコード画像]       │ │
│ │ UtmBuilder           │ │ │                       │ │
│ │  EffectivenessInd.   │ │ │  生成URL表示           │ │
│ └──────────────────────┘ │ │                       │ │
│ ┌──────────────────────┐ │ └───────────────────────┘ │
│ │ DecorationPanel      │ │ ┌───────────────────────┐ │
│ │                      │ │ │ QrDownload            │ │
│ └──────────────────────┘ │ └───────────────────────┘ │
└──────────────────────────┴───────────────────────────┘
```

PC: 2カラム（左: 入力、右: プレビュー+ダウンロード）
タブレット/スマホ: 1カラム（上: 入力、下: プレビュー+ダウンロード）

---

### 2.2 UrlInput

URL入力フィールド。

**種別**: Client Component（QrGeneratorの子）

```typescript
interface UrlInputProps {
  value: string;
  onChange: (url: string) => void;
  onValidationChange: (isValid: boolean) => void;
}
```

**機能**:
- URL入力フィールド（type="url"）
- リアルタイムバリデーション（`lib/url/validateUrl.ts`）
- エラーメッセージ表示（「有効なURLを入力してください」）
- blur時に `trackUrlEntered` GA4イベント発火
- プレースホルダー: `https://example.com`

---

### 2.3 UtmBuilder

UTMパラメータ入力セクション。

**種別**: Client Component（QrGeneratorの子）

```typescript
import type { UtmParams } from '@/types/qr';

interface UtmBuilderProps {
  value: UtmParams;
  onChange: (utm: UtmParams) => void;
}
```

**機能**:
- 5つのUTMパラメータ入力フィールドをまとめる
- セクション開閉（プログレッシブディスクロージャー）
- UTM未設定時の注意メッセージ（損失回避メッセージ）
- EffectivenessIndicator の表示

**内部構成**:

```
UtmBuilder
├── セクションヘッダー（「マーケティング効果を上げましょう」）
├── 損失回避メッセージ（UTM=0個のとき表示）
├── UtmField (utm_source)     ← Select + 自由入力
├── UtmField (utm_medium)     ← Select + 自由入力（デフォルト: qr）
├── UtmField (utm_campaign)   ← 自由入力 + 命名ガイダンス
├── UtmField (utm_term)       ← 自由入力（任意、折りたたみ）
├── UtmField (utm_content)    ← 自由入力（任意、折りたたみ）
├── EffectivenessIndicator
└── UtmGuide（用途に応じた設定例）
```

---

### 2.4 UtmField

個別UTMパラメータ入力フィールド。

**種別**: Client Component（UtmBuilderの子）

```typescript
interface UtmFieldProps {
  name: 'source' | 'medium' | 'campaign' | 'term' | 'content';
  label: string;
  value: string;
  onChange: (value: string) => void;
  helpText: string;
  placeholder: string;
  options?: Array<{ value: string; label: string }>; // プルダウン選択肢
  required?: boolean;
}
```

**機能**:
- ラベル + ツールチップ（Tooltipコンポーネント使用）
- source/medium: Selectコンポーネント + 「その他（自由入力）」
- campaign/term/content: Inputコンポーネント
- ヘルプテキスト表示（「utm_sourceとは？」の説明）
- 変更時に対応するGA4イベント発火（`trackUtmSet`）
- ツールチップ表示時に `trackGuideTooltipOpened` 発火

---

### 2.5 UtmGuide

用途に応じたUTM設定例を表示するガイドセクション。

**種別**: Client Component（UtmBuilderの子）

```typescript
interface UtmGuideProps {
  currentSource: string;
  onApplyExample: (example: { source: string; medium: string; campaign: string }) => void;
}
```

**機能**:
- 配布用途別の設定例カード（名刺、チラシ、ポスター等）
- 設定例をクリックすると値が自動入力される
- 「この設定を使う」ボタン

設定例データ（`lib/constants/utmPresets.ts` から取得）:

```typescript
export const UTM_USAGE_EXAMPLES = [
  {
    label: '名刺に印刷する場合',
    source: 'business_card',
    medium: 'qr',
    campaign: 'networking_2026',
  },
  {
    label: 'チラシに印刷する場合',
    source: 'flyer',
    medium: 'qr',
    campaign: 'spring_sale_2026',
  },
  // ...
] as const;
```

---

### 2.6 EffectivenessIndicator

マーケティング効果度インジケーター。UTMパラメータ設定数に応じた星表示。

**種別**: Client Component（UtmBuilderの子）

```typescript
interface EffectivenessIndicatorProps {
  utmCount: number; // 設定済みUTMパラメータ数 (0-5)
}
```

**表示ロジック**:

| UTMパラメータ数 | 表示 | メッセージ |
|---|---|---|
| 0 | ★☆☆☆☆ | マーケティング効果測定ができません |
| 1 | ★★☆☆☆ | 基本的な計測ができます |
| 2 | ★★★☆☆ | 効果測定の精度が上がります |
| 3 | ★★★★☆ | しっかり効果測定できます |
| 4-5 | ★★★★★ | 完璧な効果測定ができます |

---

### 2.7 DecorationPanel

装飾設定セクション。

**種別**: Client Component（QrGeneratorの子）

```typescript
import type { DecorationConfig } from '@/types/qr';

interface DecorationPanelProps {
  value: DecorationConfig;
  onChange: (decoration: DecorationConfig) => void;
}
```

**機能**:
- Tabsコンポーネントでサブセクションを切り替え
  - プリセット
  - ロゴ
  - 色
  - フレーム
  - キャプション
- プログレッシブディスクロージャー（URL/UTM入力後に展開可能に）

---

### 2.8 PresetSelector

装飾プリセット選択。

**種別**: Client Component（DecorationPanelの子）

```typescript
import type { DecorationPreset } from '@/types/qr';

interface PresetSelectorProps {
  value: DecorationPreset | null;
  onChange: (preset: DecorationPreset) => void;
}
```

**プリセット一覧**（`lib/constants/decorationPresets.ts`）:

| プリセット名 | 前景色 | 背景色 | フレーム | キャプション |
|---|---|---|---|---|
| シンプル | #000000 | #ffffff | なし | なし |
| ビジネス | #1a365d | #ffffff | シンプル枠 | 「詳しくはこちら」 |
| カジュアル | #2d7d46 | #f0fff4 | 角丸枠 | 「スキャンしてチェック」 |
| エレガント | #44337a | #faf5ff | 装飾枠 | 「QRコードを読み取る」 |
| ポップ | #c53030 | #fff5f5 | カラフル枠 | 「今すぐアクセス!」 |

---

### 2.9 LogoUploader

ロゴ画像アップロード。

**種別**: Client Component（DecorationPanelの子）

```typescript
interface LogoUploaderProps {
  value: LogoConfig | null;
  onChange: (logo: LogoConfig | null) => void;
}
```

**機能**:
- FileUploadコンポーネントを使用（PNG/JPG/SVG対応）
- アップロード後の画像プレビュー
- ロゴサイズ調整スライダー（QRコードの10%〜30%）
- 「ロゴを削除」ボタン
- アップロード完了時に `trackLogoUploaded` GA4イベント発火
- 画像はクライアントサイドで `FileReader` として保持（サーバー送信なし）

```typescript
// types/qr.ts
export interface LogoConfig {
  dataUrl: string;      // FileReaderで読み込んだ data URL
  fileName: string;     // 元ファイル名
  fileType: string;     // MIME type
  fileSizeKb: number;   // ファイルサイズ(KB)
  sizePercent: number;  // QRコード内でのサイズ比率 (10-30)
}
```

---

### 2.10 FrameSelector

フレーム選択。

**種別**: Client Component（DecorationPanelの子）

```typescript
import type { FrameConfig } from '@/types/qr';

interface FrameSelectorProps {
  value: FrameConfig | null;
  onChange: (frame: FrameConfig | null) => void;
}
```

**フレームカテゴリ**:

| カテゴリ | フレーム | 説明 |
|---|---|---|
| 基本 | none | フレームなし |
| 基本 | simple | シンプル枠（線のみ） |
| 基本 | rounded | 角丸枠 |
| 装飾 | ornate | 額縁風 |
| ターゲット別 | elegant | エレガント（女性向け） |
| ターゲット別 | pop | ポップ（カラフル） |
| ターゲット別 | business | ビジネス（フォーマル） |
| ターゲット別 | festive | イベント向け（華やか） |

各フレームのプレビューサムネイルを表示し、選択可能とする。フレームの色は ColorPicker で変更可能。

---

### 2.11 CaptionEditor

キャプション（QRコード下部テキスト）編集。

**種別**: Client Component（DecorationPanelの子）

```typescript
import type { CaptionConfig } from '@/types/qr';

interface CaptionEditorProps {
  value: CaptionConfig;
  onChange: (caption: CaptionConfig) => void;
}
```

**機能**:
- テキスト入力フィールド
- テンプレート選択肢（ドロップダウン）
  - 「スキャンして詳細を見る」
  - 「こちらからアクセス」
  - 「QRコードを読み取る」
  - 「詳しくはWebで」
  - 「今すぐチェック」
- 文字数カウンター + 適正文字数ガイダンス（推奨: 15文字以内）
- フォントサイズ調整スライダー（10px〜24px）
- 変更時に `trackCaptionSet` GA4イベント発火

---

### 2.12 QrPreview

QRコードのリアルタイムプレビュー。

**種別**: Client Component（QrGeneratorの子）

```typescript
interface QrPreviewProps {
  url: string;            // UTMパラメータ付き完成URL
  decoration: DecorationConfig;
  isUrlValid: boolean;
}
```

**機能**:
- `qrcode` ライブラリでCanvas/SVGにQRコードを描画
- 装飾（ロゴ、フレーム、キャプション、色）をCanvasに重ねて描画
- 生成URLのテキスト表示（コピーボタン付き）
- QR読み取り可否の検証結果表示（警告アイコン）
- コントラスト不足警告（`lib/color/contrastChecker.ts`）
- URL未入力時はプレースホルダー表示

**デバウンス**: 入力変更から500ms後にQRコード再生成（パフォーマンス要件）

---

### 2.13 QrDownload

ダウンロードボタン群。

**種別**: Client Component（QrGeneratorの子）

```typescript
interface QrDownloadProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  url: string;
  decoration: DecorationConfig;
  utmCount: number;
  isReady: boolean;
}
```

**機能**:
- フォーマット選択（PNG / SVG / PDF）
- 高解像度オプション（通常: 1x、高解像度: 2x, 3x）
- ダウンロードボタン
- ダウンロード時に `trackQrDownloaded` GA4イベント発火
- ダウンロード処理は `lib/qr/downloadQr.ts` に委譲
- PDF出力は `jsPDF` を動的インポート

---

## 3. UIコンポーネント（`src/components/ui/`）

### 3.1 Button

```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
}
```

### 3.2 Input

```typescript
interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'url' | 'number';
  placeholder?: string;
  error?: string;
  helpText?: string;
  disabled?: boolean;
  required?: boolean;
}
```

### 3.3 Select

```typescript
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  allowCustom?: boolean;          // 「その他（自由入力）」を許可
  customPlaceholder?: string;
  helpText?: string;
  error?: string;
}
```

`allowCustom=true` の場合、選択肢の末尾に「その他（自由入力）」を追加し、選択時にテキスト入力フィールドに切り替わる。

### 3.4 Tooltip

```typescript
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  onOpen?: () => void;  // GA4イベント発火用
}
```

### 3.5 ColorPicker

```typescript
interface ColorPickerProps {
  label: string;
  value: string;          // #RRGGBB
  onChange: (color: string) => void;
}
```

- `<input type="color">` をスタイリングして使用
- カラーコード直接入力フィールドも併設

### 3.6 FileUpload

```typescript
interface FileUploadProps {
  accept: string;           // 'image/png,image/jpeg,image/svg+xml'
  maxSizeKb: number;        // 最大ファイルサイズ(KB)
  onUpload: (file: File, dataUrl: string) => void;
  onRemove: () => void;
  preview?: string;         // プレビュー画像のdata URL
  label: string;
}
```

- ドラッグ&ドロップ対応
- ファイルサイズ上限チェック
- アップロード後のプレビュー表示

### 3.7 ProgressBar

```typescript
interface ProgressBarProps {
  currentStep: number;     // 現在のステップ (1-4)
  totalSteps: number;      // 総ステップ数 (4)
  completionPercent: number; // 完了率 (0-100)
  message?: string;         // 「あと1ステップで完璧なQRコードに!」等
}
```

Goal-Gradient Effect を活用した進捗バー。ステップ完了に応じてアニメーション付きで進行する。

### 3.8 Tabs

```typescript
interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultActiveId?: string;
}
```

### 3.9 Breadcrumb

```typescript
interface BreadcrumbItem {
  label: string;
  href?: string;   // 最後の要素はhrefなし（現在のページ）
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}
```

Server Component として実装。構造化データ（BreadcrumbList）は別途 JsonLd コンポーネントで出力する。

---

## 4. レイアウトコンポーネント（`src/components/layout/`）

### 4.1 Header

**種別**: Server Component（MobileNavのみClient Component）

```typescript
// Header.tsx (Server Component)
export function Header() {
  return (
    <header className={styles.header}>
      <Container>
        <div className={styles.inner}>
          <Link href="/" className={styles.logo}>QR Code Create</Link>
          <span className={styles.badge}>完全無料・登録不要</span>
          <nav className={styles.desktopNav}>
            <Link href="/">ホーム</Link>
            <Link href="/guide">使い方</Link>
            <Link href="/use-cases/flyer">用途別</Link>
            <Link href="/blog">ブログ</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/create" className={styles.ctaLink}>QRコード生成</Link>
          </nav>
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
```

**ナビゲーション項目**（[マーケティング戦略 セクション3](../marketing-strategy.md) 参照）:
- ホーム
- 使い方
- 用途別
- ブログ
- FAQ
- **QRコード生成**（CTAボタンとして強調表示）

### 4.2 Footer

**種別**: Server Component

```typescript
export function Footer() {
  // プライバシーポリシー、利用規約、お問い合わせ等
  // 控えめなニュースレター登録（将来機能）
  // コピーライト表示
}
```

### 4.3 Container

```typescript
interface ContainerProps {
  children: React.ReactNode;
  size?: 'default' | 'narrow' | 'wide';
}
```

コンテンツの最大幅を制御するラッパーコンポーネント。

- `default`: max-width: 1200px
- `narrow`: max-width: 800px（記事ページ用）
- `wide`: max-width: 1440px

---

## 5. マーケティングコンポーネント（`src/components/marketing/`）

### 5.1 HeroSection

トップページのヒーローセクション。

```typescript
interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
}
```

### 5.2 FeatureCard

特徴紹介カード。

```typescript
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}
```

### 5.3 UseCaseCard

用途別カード（トップページ等で使用）。

```typescript
interface UseCaseCardProps {
  title: string;
  description: string;
  href: string;
  recommendedSource: string;
}
```

### 5.4 CtaButton

行動喚起ボタン（マーケティングページ下部等）。

```typescript
interface CtaButtonProps {
  text: string;
  href: string;
  variant?: 'primary' | 'secondary';
  utmParams?: Record<string, string>; // 用途別ページからのパラメータ付きリンク用
}
```

### 5.5 ComparisonTable

競合比較テーブル。

```typescript
interface ComparisonRow {
  feature: string;
  values: Record<string, string | boolean>;
}

interface ComparisonTableProps {
  competitors: string[];
  rows: ComparisonRow[];
  highlightColumn?: string; // 自社カラムの強調
}
```

### 5.6 MdxContent

MDXコンテンツのレンダリングコンポーネント。

```typescript
interface MdxContentProps {
  source: string;          // MDXの本文
  components?: Record<string, React.ComponentType>; // カスタムコンポーネント
}
```

`next-mdx-remote` を使用してMDXをレンダリングする。MDX内で使用可能なカスタムコンポーネント（CtaButton等）をマッピングする。

---

## 6. SEOコンポーネント（`src/components/seo/`）

### 6.1 JsonLd

**種別**: Server Component

```typescript
interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

使用例:

```typescript
// 各page.tsxで使用
import { JsonLd } from '@/components/seo/JsonLd';
import { buildWebApplicationSchema } from '@/lib/schema/buildWebApplicationSchema';
import { buildBreadcrumbSchema } from '@/lib/schema/buildBreadcrumbSchema';

export default function CreatePage() {
  return (
    <>
      <JsonLd data={buildWebApplicationSchema()} />
      <JsonLd data={buildBreadcrumbSchema([
        { name: 'ホーム', url: '/' },
        { name: 'QRコード生成', url: '/create' },
      ])} />
      <QrGenerator />
    </>
  );
}
```
