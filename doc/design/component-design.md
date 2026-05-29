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

/poster ページ:
  page.tsx (Server Component)
  ├── JsonLd (Server Component)
  └── PosterEditor ('use client') ← dynamic import, ssr: false
      ├── (引き継ぎ要約表示)
      ├── UrlInput (再編集用)
      ├── UtmBuilder (再編集用、折りたたみ)
      ├── MarkdownInput
      ├── PosterPreview
      │   ├── QrPreview (x4)
      │   └── Markdown レンダリング (x4)
      └── PdfDownloadButton

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

**内部状態**（[データモデル設計 QrState](./data-model.md#23-qrコード生成状態)参照）:

```typescript
import { INITIAL_QR_STATE } from '@/types/qr';
import type { QrState } from '@/types/qr';

// QrGenerator 内部で管理する状態
// INITIAL_QR_STATE は src/types/qr.ts でエクスポートされる初期値定数。
// utmEnabled: true (UTM設定ONがデフォルト) を含む。
const [state, setState] = useState<QrState>(INITIAL_QR_STATE);
```

**責務**:
- 子コンポーネントへの状態配信と更新関数の提供
- UTMパラメータ付きURLの構築（`lib/url/buildUtmUrl.ts` を使用、`state.utmEnabled` を第3引数として渡す）
- QRコード生成トリガー（500ms デバウンス）
- 進捗度の算出（UTM OFF時はUTMステップを自動完了扱い、詳細は [UI/UX仕様 3.2](./ui-ux-spec.md#32-progressbar-の完了度算出)）
- GA4イベントの発火タイミング制御（UTM ON/OFF時の `trackUtmToggled` 含む）
- `utmEnabled` 状態の管理（UtmBuilder の `onEnabledChange` ハンドラ経由）
- **`DownloadPanel` への引き継ぎ用 props 配信**: `url`, `isUrlValid`, `utm`, `utmEnabled`, `decoration` を渡す。これにより DownloadPanel の「印刷用ポスターを作る →」CTA が sessionStorage 保存用の payload を構築できる（詳細は [2.13](#213-qrdownload--downloadpanel) を参照）

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
  /** UTM設定全体の有効/無効フラグ (デフォルト: true) */
  enabled: boolean;
  /** UTM ON/OFF切替時に呼ばれるコールバック */
  onEnabledChange: (enabled: boolean) => void;
}
```

**機能**:
- 5つのUTMパラメータ入力フィールドをまとめる
- セクション開閉（プログレッシブディスクロージャー）
- UTM未設定時の注意メッセージ（損失回避メッセージ）
- EffectivenessIndicator の表示
- **UTM全体のON/OFFトグル**（ヘッダー右側、詳細は [UI/UX仕様 2.3.1](./ui-ux-spec.md#231-utm-onoff-トグル仕様)）
- OFF時の挙動:
  - 各 `UtmField` に `disabled={true}` を渡す
  - `UtmGuide` および 損失回避メッセージを非表示にする
  - `EffectivenessIndicator` を淡色表示にする
  - `utm` の値はメモリ上に保持（再ON時に復元）
- ON/OFF切替時に `trackUtmToggled(enabled)` GA4イベントを発火

**内部構成**:

```
UtmBuilder
├── セクションヘッダー
│   ├── タイトル「マーケティング効果を上げましょう」
│   └── ON/OFFトグル（右側、「UTMを設定する [●]」）
├── 損失回避メッセージ（enabled=true かつ UTM=0個のとき表示）
├── UtmField (utm_source)     ← Select + 自由入力, disabled={!enabled}
├── UtmField (utm_medium)     ← Select + 自由入力（デフォルト: qr）, disabled={!enabled}
├── UtmField (utm_campaign)   ← 自由入力 + 命名ガイダンス, disabled={!enabled}
├── UtmField (utm_term)       ← 自由入力（任意、折りたたみ）, disabled={!enabled}
├── UtmField (utm_content)    ← 自由入力（任意、折りたたみ）, disabled={!enabled}
├── EffectivenessIndicator    ← enabled=false 時は淡色表示
└── UtmGuide                  ← enabled=false 時は非表示
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
  /** フィールドを無効化（グレーアウト・操作不能）にする。UTM ON/OFFトグルOFF時に true (デフォルト: false) */
  disabled?: boolean;
}
```

**機能**:
- ラベル + ツールチップ（Tooltipコンポーネント使用）
- source/medium: Selectコンポーネント + 「その他（自由入力）」
- campaign/term/content: Inputコンポーネント
- ヘルプテキスト表示（「utm_sourceとは？」の説明）
- 変更時に対応するGA4イベント発火（`trackUtmSet`）
- ツールチップ表示時に `trackGuideTooltipOpened` 発火
- **disabled時**: 入力要素を `disabled` 属性で操作不能化し、ラベル・ヘルプテキスト・ツールチップを淡色化（`opacity: 0.5` 程度、`cursor: not-allowed`）。GA4イベントは発火しない

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
- ロゴサイズ調整スライダー（QRコードの10%〜25%、誤り訂正レベルHの安全範囲）
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
  sizePercent: number;  // QRコード内でのサイズ比率 (10-25、誤り訂正レベルHの安全範囲)
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

**フレーム画像仕様**:

フレームは以下の2方式で提供される:
1. **Canvas描画**: コードで線・図形を描画（simple, rounded, ornate等の既存フレーム）
2. **画像ファイル**: より複雑なデザインのフレームを画像で提供

画像フレームの仕様:

| 項目 | 値 |
|------|-----|
| 画像サイズ（基本） | 944 x 944 px |
| 透過領域 | 中央 680 x 680 px（位置: 左上 (132, 132)） |
| フレーム装飾領域 | 上下左右 132px |
| クワイエットゾーン | 透過領域の外周 80px（装飾禁止） |
| QRコードデータ領域 | 中央 520 x 520 px |
| 画像形式 | SVG（推奨）または PNG（透過背景） |
| 色 | 単色（黒）で作成、ランタイムで着色 |
| 配置先 | `public/images/frames/` |

**領域構成（外側→内側）**:
- フレーム装飾領域（132px）: デザインを自由に配置できる
- クワイエットゾーン（80px）: 白（背景色）のまま。QRコード読み取り精度のために必須
- QRコードデータ領域（520px）: QRコードのモジュールが描画される

**クワイエットゾーン**: QRコード規格で推奨される4モジュール分の余白。QRコード生成時に `margin: 4`（モジュール単位）を設定することで、680x680の透過領域内に自動的に確保される。フレーム画像の装飾は透過領域（680x680）に侵入してはならない。

キャプション付きフレームの場合:
- 幅は 944px で統一
- 高さのみ 944px + キャプション領域分を追加（縦長になる）
- QRコード配置位置 (132, 132) は変わらない
- `height > 944` でキャプション付きフレームと判別

フレーム適用時の描画手順:
1. フレーム画像をCanvasに描画（944 x 944 以上）
2. QRコードを (132, 132) の位置に 680 x 680 で描画（margin: 4 により内部にクワイエットゾーンを含む）
3. 必要に応じてキャプションテキストを下部領域に描画

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
  fgColor?: string;
  bgColor?: string;
  size?: number;
  logo?: LogoConfig | null;
  frameConfig?: FrameConfig;
  caption?: CaptionConfig;
  isUrlValid?: boolean;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}
```

**機能**:
- `qrcode` ライブラリでCanvasにQRコードを描画
- 装飾（ロゴ、フレーム、色）をCanvasに重ねて描画
- **キャプションはCanvas外のHTMLテキスト要素で表示**（Canvas内には描画しない）
- キャプション付き画像のダウンロードは `captionCompositor.ts` で一時Canvas合成して出力
- コントラスト不足警告（`lib/color/contrastChecker.ts`）
- URL未入力時はプレースホルダー表示

**デバウンス**: 入力変更から500ms後にQRコード再生成（パフォーマンス要件）

---

### 2.13 QrDownload / DownloadPanel

ダウンロードボタン群。

> 実装上のファイル名は `DownloadPanel`（`src/components/qr/DownloadPanel/DownloadPanel.tsx`）。本設計書では役割上「QrDownload」と「DownloadPanel」を同義に扱う。

**種別**: Client Component（QrGeneratorの子）

```typescript
interface DownloadPanelProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  disabled: boolean;
  hasUtm: boolean;
  decorationCount: number;
  caption: CaptionConfig;
  /** ポスターCTA用: 引き継ぎstateの構築に必要な値 */
  url: string;
  isUrlValid: boolean;
  utm: UtmParams;
  utmEnabled: boolean;
  decoration: DecorationConfig;
}
```

**機能**:
- フォーマット選択（PNG / SVG / PDF）
- 高解像度オプション（通常: 1x、高解像度: 2x, 3x）
- ダウンロードボタン
- ダウンロード時に `trackQrDownloaded` GA4イベント発火
- ダウンロード処理は `lib/qr/downloadQr.ts` に委譲
- PDF出力は `jsPDF` を動的インポート
- **印刷用ポスターCTAボタン**「印刷用ポスターを作る →」を追加
  - 配置: PNG/SVG/PDF ボタンの下に独立した行として配置（または同じ行の右端）
  - クリック時の挙動:
    1. `posterHandoff.save({ url, isUrlValid, utm, utmEnabled, decoration, savedAt: new Date().toISOString() })` を呼ぶ
    2. `router.push('/poster')` で遷移
  - 表示条件: `isUrlValid === true` のとき有効化（無効URLでは disabled）
  - GA4 イベント: クリック時に `poster_cta_clicked`（簡易・実装時に必要に応じて追加検討、現状は `poster_generated` のみを設計に含める）

---

## 2A. ポスター関連コンポーネント（`src/components/poster/`）

`/poster` ページで使用するコンポーネント群。全て Client Component (`'use client'`)。

### 2A.1 コンポーネント階層

```
/poster ページ:
  page.tsx (Server Component)
  ├── JsonLd (Server Component)
  └── PosterEditor ('use client') ← dynamic import, ssr: false
      ├── 左カラム
      │   ├── 引き継ぎ要約表示（URL/UTM/装飾の概要）
      │   ├── UrlInput              ← 引き継ぎなし時、または編集時に表示
      │   ├── UtmBuilder            ← 既存コンポーネントを再利用（任意で再編集）
      │   ├── MarkdownInput         ← 説明文（Markdown）入力
      │   └── PdfDownloadButton     ← A4 2x2 PDFダウンロード
      └── 右カラム
          └── PosterPreview         ← A4縦比率の2x2カード配置プレビュー
              ├── QrPreview (x4)    ← 既存コンポーネントを4枚分使用
              └── Markdownレンダリング結果 (x4)
```

### 2A.2 PosterEditor

`/poster` ページのトップレベル Client Component。引き継ぎ state の読込、全体 state の管理を行う。

**種別**: Client Component (`'use client'`)

**読み込み方法**: `next/dynamic` で動的インポート（`ssr: false`）

**Props**: なし（状態は全て内部管理）

**内部状態**: `PosterState`（[データモデル設計 2.8](./data-model.md#28-ポスター関連の型) 参照）

**責務**:
- マウント時に `posterHandoff.load()` を呼び、引き継ぎ payload を読み込む
  - 読込成功 → `INITIAL_POSTER_STATE` に対して payload の値で上書き
  - 読込失敗（payload なし／鮮度切れ／JSON parse失敗）→ `INITIAL_POSTER_STATE` のままで開始（URL入力欄表示）
  - 読込後、即座に `posterHandoff.clear()` でキーを削除（リロード時の二重消費を防ぐ）
- **必ず `typeof window !== "undefined"` ガードを使う**（[アーキテクチャ 9.3](./architecture.md#93-ガード条件) 参照）。実際には `useEffect` 内で実行されるため SSR では呼ばれないが、明示的にガードを書く方針
- URL・UTM・装飾の再編集（UtmBuilder を再利用）
- Markdown説明文の編集
- PosterPreview への state 配信
- PdfDownloadButton への PosterState 配信

**レイアウト**:

```
┌─────────────────────────────────────────────────────┐
│ [ホームに戻る] [/createに戻る]                       │
├──────────────────────────┬──────────────────────────┤
│ 左カラム                  │ 右カラム                  │
│                          │                          │
│ 引き継ぎ要約             │  ┌────────────────────┐  │
│ URL: https://...         │  │ A4縦プレビュー       │  │
│ UTM: source=flyer 等      │  │ (210:297 比率)      │  │
│ 装飾: ロゴあり            │  │                    │  │
│                          │  │  ┌──────┬──────┐    │  │
│ ── 編集 ──                │  │  │ QR   │ QR   │    │  │
│ [URL入力] (再編集)        │  │  │ 説明  │ 説明  │    │  │
│ [UtmBuilder] (折りたたみ) │  │  ├──────┼──────┤    │  │
│                          │  │  │ QR   │ QR   │    │  │
│ ── 説明文 ──              │  │  │ 説明  │ 説明  │    │  │
│ [MarkdownInput]          │  │  └──────┴──────┘    │  │
│                          │  └────────────────────┘  │
│                          │                          │
│ [PdfDownloadButton]      │                          │
└──────────────────────────┴──────────────────────────┘
```

### 2A.3 MarkdownInput

Markdown形式での説明文入力 + ライブプレビュー。

**種別**: Client Component（PosterEditorの子）

```typescript
interface MarkdownInputProps {
  value: string;
  onChange: (value: string) => void;
  /** プレビュー領域の高さ目安（カード幅・行数に合わせて調整） */
  maxRows?: number;
}
```

**機能**:
- 左半分: テキストエリア（Markdown入力）
- 右半分（または下半分）: レンダリング結果プレビュー（縮小表示）
- 入力例ヒント: 「**太字** で強調、- でリスト、見出しは ## で」
- 文字数カウンター（A4縦1/4カードに収まる目安: 200-400文字程度、設計時 TBD として実装時に文字幅とフォントサイズから決定）

**ライブラリ**:
- `react-markdown` を使用
- プラグイン: `remark-gfm`（テーブル・打ち消し線・タスクリスト等のGFM拡張）
- **`rehype-raw` は使わない**: 生 HTML の埋め込みを許可するとXSSリスクが上がるため。Markdown構文のみをサポートする
- 許可するMarkdown要素: 段落・見出し（h1-h4）・太字・斜体・リスト・リンク・コード・引用・水平線・テーブル

**セキュリティ**:
- 外部リンクの `<a>` には `rel="noopener noreferrer"` を自動付与（カスタム components プロパティで実装）
- 画像埋め込み (`![alt](url)`) は **不許可**（カスタム components プロパティで `img` を `null` に置換、または引用文として表示）

### 2A.4 PosterPreview

A4縦比率の枠内に2x2のカード配置でプレビューを表示する。

**種別**: Client Component（PosterEditorの子）

```typescript
interface PosterPreviewProps {
  url: string;            // UTMパラメータ付き完成URL（buildUtmUrl 適用後）
  description: string;    // Markdown文字列
  decoration: DecorationConfig;
  /** PDF生成時に html2canvas が捕捉するDOM要素にrefを当てる用 */
  innerRef?: React.RefObject<HTMLDivElement | null>;
}
```

**機能**:
- 外枠: A4縦の比率 (210:297) を `aspect-ratio: 210 / 297` で表現
- 内部: CSS Grid で 2x2 のカードを配置
- 各カード:
  - サイズ: A4縦の1/4 = 105mm × 148.5mm（CSS上は親要素の50% × 50%）
  - 内部レイアウト: 上部に説明文（Markdownレンダリング結果、高さ約60%）、下部にQRコード（カード幅の60-70%を占有）
  - QRコードは既存 `QrPreview` コンポーネントを再利用（4枚分インスタンス化、全て同一URL・同一装飾）
- レスポンシブ: 左カラムの幅に追従して縮小表示（実寸表示ではなく比率維持の縮小プレビュー）
- リアルタイム更新: URL / 説明文 / 装飾の変更を即時反映（500msデバウンスは不要、PosterEditor 側で必要に応じてデバウンス）

### 2A.5 PdfDownloadButton

A4 2x2 のPDF生成・ダウンロードボタン。

**種別**: Client Component（PosterEditorの子）

```typescript
interface PdfDownloadButtonProps {
  /** PosterPreview のDOM要素への参照（html2canvasで画像化する対象） */
  previewRef: React.RefObject<HTMLDivElement | null>;
  /** 無効化フラグ（URL未入力時など） */
  disabled?: boolean;
  /** GA4イベント発火用のメタデータ */
  hasUtm: boolean;
  hasLogo: boolean;
  descriptionLength: number;
}
```

**機能**:
- ボタンラベル: 「PDFをダウンロード（A4印刷用）」
- クリック時の処理:
  1. `lib/pdf/generatePosterPdf.ts` を**動的インポート**
  2. `generatePosterPdf({ previewElement: previewRef.current })` を呼ぶ
  3. 内部で `html2canvas(previewElement, { scale: 2-3, useCORS: true })` を実行し、得られた canvas を A4縦サイズの `jsPDF` に `addImage` で貼り付け
  4. `pdf.save('qr-poster.pdf')` でダウンロードトリガー
- 生成中はローディング表示（ボタン無効化 + スピナー）
- 成功時に GA4 イベント `poster_generated` を発火（パラメータは [データモデル 4.1](./data-model.md#41-イベント定義) 参照）

### 2A.6 既存コンポーネントの再利用

| 既存コンポーネント | `/poster` での用途 |
|---|---|
| `UrlInput` | URL再編集（または引き継ぎなし時の最小入力欄） |
| `UtmBuilder` | UTM再編集（折りたたみで提供）。`enabled` / `onEnabledChange` プロパティをそのまま使用 |
| `QrPreview` | PosterPreview の各カード内で4枚使用 |

これらは `src/components/qr/` 配下のものを `import` してそのまま利用する。新規ラッパーは作らない。

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
