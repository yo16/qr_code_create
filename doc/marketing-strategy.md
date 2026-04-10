# QR Code Create マーケティング戦略

## 1. マーケティング戦略概要

### 戦略の全体像

QR Code Createは、UTMパラメータ設定ガイダンスと装飾フレーム機能を備えた無料QRコード生成ツールである。ターゲットは日本の中小事業者・イベント主催者で、「QRコードを作りたい」という明確なニーズに対し、マーケティング効果測定の知識も同時に提供する。

**マーケティングの基本方針:**

- **SEOファースト**: 「QRコード 作成」「QRコード 無料」等の検索需要を獲得する
- **教育コンテンツ**: UTMパラメータの理解促進を通じてツールの差別化価値を伝える
- **プロダクト主導**: ツール自体がマーケティング資産（自然なリンク獲得、口コミ）
- **段階的拡大**: Phase 1はSEO/ブランド構築、Phase 2で有料機能（短縮URL、スキャン追跡）

### KPI

| 指標 | 3ヶ月目標 | 6ヶ月目標 | 12ヶ月目標 |
|------|-----------|-----------|------------|
| 月間PV | 5,000 | 20,000 | 50,000 |
| QRコード生成数/月 | 500 | 3,000 | 10,000 |
| UTMパラメータ設定率 | 30% | 45% | 60% |
| 検索流入割合 | 40% | 60% | 70% |
| 被リンクドメイン数 | 10 | 30 | 80 |

---

## 2. フリーツール戦略

### ツール評価スコアカード

| 評価項目 | スコア (1-5) | 根拠 |
|----------|-------------|------|
| 検索需要 | ★★★★★ | 「QRコード 作成」月間検索ボリューム高い。「UTMパラメータ」も一定の需要あり |
| ターゲット適合度 | ★★★★☆ | 事業者・イベント主催者はQRコードを頻繁に必要とする。UTM知識は不足している層 |
| ユニークネス | ★★★★☆ | UTMパラメータガイダンス付きQR生成は他にない。装飾フレームも差別化要素 |
| 構築可能性 | ★★★★★ | フロントエンドのみ。Next.js + Vercelで完結。バックエンド不要 |
| リンク獲得可能性 | ★★★★☆ | 実用的な無料ツールはブログやまとめ記事から自然リンクを獲得しやすい |
| **総合スコア** | **4.4/5** | 実装コスト低・差別化明確・需要高のバランスが良い |

### このツール自体がマーケティング資産

QR Code Createは他の製品への誘導ツールではなく、これ自体がプロダクトである。マーケティング上の位置づけは以下の通り。

- **Phase 1（現在）**: 完全無料ツールとしてSEO流入とブランド認知を獲得
- **Phase 2（将来）**: 短縮URL機能、スキャン追跡ダッシュボード等の有料機能を追加

### マネタイゼーションパス

```
完全無料ツール（Phase 1）
  → ブランド認知・SEO資産の構築
  → ユーザーベースの拡大
  → Phase 2: 有料機能の追加
     - 短縮URL（カスタムドメイン対応）
     - スキャン追跡ダッシュボード
     - チームコラボレーション
     - APIアクセス
```

### リードキャプチャ戦略

Phase 1ではツール利用にメールアドレス等の登録は一切不要とする（完全アンゲート）。これはSEOとブランド構築に集中するためである。

**オプションのリードキャプチャ:**
- 「QRコードマーケティングガイド」PDFダウンロード（メールアドレス任意入力）
- ブログ記事のニュースレター登録（フッターに控えめに配置）

### リンク構築ポテンシャル

無料で実用的なツールは自然リンクを獲得しやすい。以下のパターンを想定する。

- 「おすすめQRコード作成ツール」まとめ記事からのリンク
- UTMパラメータ解説記事からの参照リンク
- マーケティング系ブログからの紹介リンク
- 個人ブログ・SNSでの口コミリンク

---

## 3. サイトアーキテクチャ

### サイトマップ

```
Homepage (/)
├── QRコード生成 (/create) - メインツールページ
├── 使い方ガイド (/guide)
│   ├── UTMパラメータとは (/guide/utm-parameters)
│   ├── QRコードの効果的な使い方 (/guide/effective-qr-usage)
│   ├── QRコードデザインのコツ (/guide/design-tips)
│   └── Google Analyticsでの効果測定 (/guide/analytics-measurement)
├── 用途別QRコード (/use-cases)
│   ├── 名刺用QRコード (/use-cases/business-card)
│   ├── チラシ・フライヤー用 (/use-cases/flyer)
│   ├── ポスター用 (/use-cases/poster)
│   ├── イベント用 (/use-cases/event)
│   ├── 店舗用 (/use-cases/store)
│   ├── 製品パッケージ用 (/use-cases/product-package)
│   └── レシート用 (/use-cases/receipt)
├── ブログ (/blog)
│   ├── QRコードマーケティング (/blog/category/qr-marketing)
│   ├── UTM活用術 (/blog/category/utm-tips)
│   └── 事例紹介 (/blog/category/case-studies)
├── 比較 (/compare)
│   ├── QRのススメとの違い (/compare/qr-no-susume)
│   └── 他のQRコード作成ツールとの違い (/compare/other-tools)
├── よくある質問 (/faq)
├── プライバシーポリシー (/privacy)
└── 利用規約 (/terms)
```

### ナビゲーション設計

**ヘッダーナビゲーション:**
- ホーム
- QRコード生成（CTAボタンとして強調）
- 使い方
- 用途別
- ブログ
- FAQ

**フッターナビゲーション:**
- プライバシーポリシー
- 利用規約
- お問い合わせ

### パンくずリスト実装

すべてのページにパンくずリストを実装する。構造化データ（BreadcrumbList）と併用する。

```
例: /guide/utm-parameters
ホーム > 使い方ガイド > UTMパラメータとは

例: /use-cases/business-card
ホーム > 用途別QRコード > 名刺用QRコード

例: /blog/category/qr-marketing
ホーム > ブログ > QRコードマーケティング
```

### URL設計原則

| 原則 | 説明 | 例 |
|------|------|-----|
| 小文字のみ | URLは全て小文字 | `/use-cases/business-card` |
| ハイフン区切り | 単語の区切りはハイフン | `/guide/utm-parameters` |
| 英語スラッグ | URLパスは英語（日本語ページでも） | `/guide/design-tips` |
| 階層構造 | カテゴリ/サブカテゴリの明確な階層 | `/blog/category/utm-tips` |
| 末尾スラッシュなし | トレーリングスラッシュは付けない | `/create`（`/create/`ではない） |
| 短く意味のある名前 | 簡潔で内容が推測できるURL | `/faq`、`/compare` |

### 内部リンク戦略（ハブ&スポークモデル）

```
                    ┌─ /guide/utm-parameters
                    ├─ /guide/effective-qr-usage
/guide (ハブ) ──────├─ /guide/design-tips
                    └─ /guide/analytics-measurement

                    ┌─ /use-cases/business-card
                    ├─ /use-cases/flyer
/use-cases (ハブ) ──├─ /use-cases/poster
                    ├─ /use-cases/event
                    ├─ /use-cases/store
                    ├─ /use-cases/product-package
                    └─ /use-cases/receipt
```

**内部リンクルール:**
- すべてのスポークページからハブページへリンク
- すべてのスポークページから `/create`（ツールページ）へCTAリンク
- ガイドページと用途別ページの間でクロスリンク（例: UTMパラメータガイドから名刺用QRコードページへ）
- ブログ記事から関連するガイドページ・用途別ページへリンク
- ツールページ（`/create`）から関連ガイドへのコンテキストリンク

---

## 4. コンテンツ戦略

### コンテンツピラー

#### Pillar 1: UTMパラメータ活用（検索向け）

| トピック | 種別 | バイヤーステージ | 優先度 |
|----------|------|-----------------|--------|
| UTMパラメータとは？初心者向け完全ガイド | 検索向け | 認知 | P0 |
| UTMパラメータの設定例：業種別ベストプラクティス | 検索向け | 検討 | P1 |
| Google AnalyticsでUTMパラメータを分析する方法 | 検索向け | 検討 | P1 |
| UTMパラメータの命名規則ガイド | 検索向け | 検討 | P2 |

#### Pillar 2: QRコードマーケティング（検索+共有向け）

| トピック | 種別 | バイヤーステージ | 優先度 |
|----------|------|-----------------|--------|
| QRコードを使った集客方法 | 検索+共有 | 認知 | P0 |
| QRコードのデザイン：読み取りやすさと見た目の両立 | 検索+共有 | 検討 | P1 |
| 業種別QRコード活用事例 | 共有向け | 検討 | P1 |
| QRコードの印刷サイズガイド | 検索向け | 利用 | P2 |

#### Pillar 3: 効果測定・分析（検索向け）

| トピック | 種別 | バイヤーステージ | 優先度 |
|----------|------|-----------------|--------|
| オフライン広告の効果測定方法 | 検索向け | 認知 | P1 |
| チラシ・ポスターのROI測定 | 検索向け | 検討 | P2 |
| Google Analytics初心者ガイド | 検索向け | 認知 | P2 |

#### Pillar 4: マーケティングTips（共有向け）

| トピック | 種別 | バイヤーステージ | 優先度 |
|----------|------|-----------------|--------|
| 小規模事業者のためのマーケティング入門 | 共有向け | 認知 | P1 |
| イベント集客のコツ | 共有向け | 認知 | P2 |
| 名刺を営業ツールにする方法 | 共有向け | 検討 | P2 |

### 優先トピック一覧

| # | トピック | 検索/共有 | バイヤーステージ | 優先度 |
|---|---------|-----------|-----------------|--------|
| 1 | UTMパラメータとは？初心者向け完全ガイド | 検索 | 認知 | P0 |
| 2 | QRコードを使った集客方法 | 検索+共有 | 認知 | P0 |
| 3 | UTMパラメータの設定例：業種別ベストプラクティス | 検索 | 検討 | P1 |
| 4 | Google AnalyticsでUTMパラメータを分析する方法 | 検索 | 検討 | P1 |
| 5 | QRコードのデザイン：読み取りやすさと見た目の両立 | 検索+共有 | 検討 | P1 |
| 6 | 業種別QRコード活用事例 | 共有 | 検討 | P1 |
| 7 | オフライン広告の効果測定方法 | 検索 | 認知 | P1 |
| 8 | 小規模事業者のためのマーケティング入門 | 共有 | 認知 | P1 |
| 9 | UTMパラメータの命名規則ガイド | 検索 | 検討 | P2 |
| 10 | QRコードの印刷サイズガイド | 検索 | 利用 | P2 |
| 11 | チラシ・ポスターのROI測定 | 検索 | 検討 | P2 |
| 12 | Google Analytics初心者ガイド | 検索 | 認知 | P2 |
| 13 | イベント集客のコツ | 共有 | 認知 | P2 |
| 14 | 名刺を営業ツールにする方法 | 共有 | 検討 | P2 |

---

## 5. プログラマティックSEO

### Pattern 1: 用途別QRコード (`/use-cases/[use-case]`)

**テンプレート変数:**
- `use_case_name`: 用途名（名刺用、チラシ用 等）
- `typical_utm`: 推奨UTM設定
- `recommended_decoration`: おすすめ装飾フレーム
- `print_size_guide`: 印刷サイズガイド

**生成ページ一覧:**

| ページ | URL | utm_source推奨値 | 推奨装飾 |
|--------|-----|------------------|----------|
| 名刺用QRコード | /use-cases/business-card | business_card | ビジネス |
| チラシ・フライヤー用 | /use-cases/flyer | flyer | ポップ |
| ポスター用 | /use-cases/poster | poster | エレガント |
| イベント用 | /use-cases/event | event | ポップ |
| 店舗用 | /use-cases/store | store | ビジネス |
| 製品パッケージ用 | /use-cases/product-package | package | エレガント |
| レシート用 | /use-cases/receipt | receipt | ビジネス |
| メニュー用 | /use-cases/menu | menu | エレガント |
| 看板用 | /use-cases/signage | signage | ポップ |

**各ページの構成:**
1. 用途の説明と課題（なぜQRコードが有効か）
2. 推奨UTMパラメータ設定（具体的な設定例）
3. 装飾フレームの提案（用途に合ったスタイル）
4. 印刷時の注意点（サイズ、余白、コントラスト）
5. CTA:「この設定でQRコードを作成する」→ `/create` にパラメータ付きリンク

**テンプレート例（名刺用）:**

```
# 名刺用QRコードの作り方

名刺にQRコードを印刷することで、紙の名刺からWebサイトへの
アクセスを促進できます。UTMパラメータを設定すれば、
名刺からのアクセス数をGoogle Analyticsで正確に計測できます。

## 推奨UTM設定
- utm_source: business_card
- utm_medium: qr
- utm_campaign: networking_2026（年度を含める）

## おすすめ装飾
ビジネススタイルのフレームがおすすめです。
シンプルで洗練されたデザインが名刺の雰囲気に合います。

## 印刷サイズの目安
- 最小サイズ: 15mm x 15mm
- 推奨サイズ: 20mm x 20mm
- 余白: QRコードの周囲に最低2mm

[この設定でQRコードを作成する →]
```

### Pattern 2: 業種別QRコード活用 (`/industry/[industry]`)

**テンプレート変数:**
- `industry_name`: 業種名
- `common_use_cases`: よくある活用シーン
- `utm_examples`: 業種特有のUTM設定例
- `case_study`: 活用事例

**生成ページ一覧:**

| ページ | URL | 主な活用シーン |
|--------|-----|---------------|
| 飲食店 | /industry/restaurant | メニュー、テーブルPOP、レシート |
| 美容室 | /industry/beauty-salon | 名刺、フライヤー、店内POP |
| 不動産 | /industry/real-estate | 物件チラシ、看板、名刺 |
| イベント企画 | /industry/event-planning | チケット、ポスター、パンフレット |
| 小売店 | /industry/retail | POP、レシート、商品タグ |
| 医療クリニック | /industry/medical-clinic | パンフレット、名刺、案内板 |
| 教育機関 | /industry/education | パンフレット、ポスター、名刺 |

**各ページの構成:**
1. 業種におけるQRコードの活用メリット
2. 業種特有のUTM設定例（具体的なcampaign名等）
3. おすすめの装飾スタイル
4. 成功パターンの紹介
5. CTA:「あなたの業種に合ったQRコードを作成する」

---

## 6. 競合比較・差別化

### 競合分析

| 機能 | QR Code Create | QRのススメ | cman.jp | Canva QR |
|------|---------------|-----------|---------|----------|
| 無料利用 | 完全無料 | 無料 | 無料 | 一部無料 |
| 登録不要 | 不要 | 不要 | 不要 | 要登録 |
| UTMパラメータガイダンス | あり（独自機能） | なし | なし | なし |
| 装飾フレーム | あり（3スタイル） | なし | なし | デザインテンプレート |
| 使いやすさ | ステップ形式 | シンプル | シンプル | 高機能 |
| マーケティング教育 | ガイドコンテンツ付き | なし | なし | なし |
| ロゴ埋め込み | あり | なし | なし | あり |
| 出力形式 | PNG/SVG/PDF | PNG | PNG | PNG/SVG |

### 差別化マトリクス

**当ツール固有の強み:**
- UTMパラメータガイダンス: QRコード生成時にUTM設定をステップバイステップで案内
- 装飾フレーム: エレガント/ポップ/ビジネスの3スタイル
- マーケティング教育: ガイドコンテンツを通じてユーザーのスキルアップを支援

**競合の強み（正直に認める）:**
- QRのススメ: UIが極めてシンプルで、迷わない
- cman.jp: 長年の実績と信頼性
- Canva: デザインの自由度が高い、他のデザインツールとの統合

**当ツールが選ばれる理由:**
- 「QRコードを作りたい」+「マーケティング効果を測定したい」の両方を同時に満たす
- UTMパラメータの設定を忘れがちな問題を解決する
- 登録不要・完全無料でハードルが低い

### 比較ページ戦略

**`/compare/other-tools`（一般比較ページ）**
- 複数の代替ツールを公平に紹介
- 各ツールの特徴を表形式で比較
- 「UTMパラメータの設定を忘れたくない方には当ツールがおすすめ」と自然に誘導

**`/compare/qr-no-susume`（個別比較ページ）**
- QRのススメの良い点を認めた上で差別化ポイントを説明
- 「シンプルさを求めるならQRのススメ、マーケティング効果測定も重視するならQR Code Create」

---

## 7. ページCRO戦略

### コンバージョン定義

- **プライマリコンバージョン**: QRコードのダウンロード（UTMパラメータ付き）
- **セカンダリコンバージョン**: QRコードの生成（ダウンロード前のプレビュー段階）

### 主要課題

ユーザーがオプションのUTMフィールドを入力せずにQRコードを生成してしまうこと。UTMパラメータの設定率を上げることが最大のCRO課題である。

### CRO施策

#### 施策1: プログレッシブディスクロージャー

URL入力だけでまずQRコードを生成できる状態にし、その後UTMセクションを表示する。

```
ステップ1: URL入力 → QRコードプレビュー表示
ステップ2: 「マーケティング効果を上げましょう」→ UTMセクションを展開
ステップ3: UTM入力 → QRコードがリアルタイム更新
ステップ4: 装飾カスタマイズ
ステップ5: ダウンロード
```

#### 施策2: リアルタイムビジュアルフィードバック

UTMフィールドを入力するたびに、QRコードのプレビューがリアルタイムに更新される。視覚的な変化がユーザーの入力意欲を維持する。

#### 施策3: マーケティング効果度インジケーター

```
UTMパラメータ 0個: マーケティング効果度 ★☆☆☆☆
UTMパラメータ 1個: マーケティング効果度 ★★☆☆☆
UTMパラメータ 2個: マーケティング効果度 ★★★☆☆
UTMパラメータ 3個: マーケティング効果度 ★★★★☆
UTMパラメータ 5個: マーケティング効果度 ★★★★★
```

#### 施策4: コンテキストヘルプ

ユーザーの行動に合わせた文脈的なヘルプメッセージ。

```
「このQRコードをチラシに印刷しますか？
→ utm_sourceに 'flyer' を設定しましょう」

「名刺に使う予定ですか？
→ utm_sourceに 'business_card' を設定しましょう」
```

#### 施策5: スマートデフォルト

- `utm_medium` に `qr` を自動で事前設定
- よく使われる `utm_source` 値をドロップダウンで提供（flyer, poster, business_card等）

#### 施策6: 損失回避メッセージ

```
「UTMパラメータなしでは、このQRコードからのアクセスを
Google Analyticsで追跡できません。
チラシやポスターの効果がわからなくなります。」
```

#### 施策7: ソーシャルプルーフ

```
「ユーザーの78%がUTMパラメータを設定しています」
```
（目標値として設定。実際の数値が出たら更新する）

#### 施策8: IKEA効果の活用

装飾フレームのカスタマイズ（色、スタイル、キャプション）をユーザーが自分で行うことで、成果物への愛着が生まれる。愛着があるとUTM設定も完了させやすくなる。

---

## 8. マーケティング心理学の適用

### 適用する心理学原則

#### Goal-Gradient Effect（ゴールグラディエント効果）

ゴールに近づくほどモチベーションが上がる現象を活用する。

**実装:**
- QRコード作成プロセスに進捗バーを表示
- 「QRコード完成度: 60%」→「あと少しで完璧なQRコードに！」
- 各ステップの完了でバーが進行する視覚フィードバック

#### IKEA Effect（IKEA効果）

自分で作ったものに価値を感じる心理を活用する。

**実装:**
- 装飾フレームの選択・カスタマイズ機能
- 色のカスタマイズ（前景色・背景色）
- キャプションの自由入力
- プレビューのリアルタイム反映で「自分だけのQRコード」感を演出

#### Default Effect（デフォルト効果）

人はデフォルト設定を変更しない傾向がある。

**実装:**
- `utm_medium` のデフォルト値を `qr` に設定
- 装飾フレームのデフォルトを「なし」ではなく「おすすめ」に設定
- 出力形式のデフォルトを最も汎用的なPNGに設定

#### Zero-Price Effect（ゼロ価格効果）

無料であることの心理的インパクトは、低価格とは質的に異なる。

**実装:**
- ヘッダーに「完全無料・登録不要」を目立つ位置に配置
- 「0円」「無料」を繰り返し強調
- 「隠れコストなし」のメッセージを明示

#### Reciprocity（返報性の原理）

無料で価値を受け取ると、お返しをしたくなる心理。

**実装:**
- 無料ツール + 無料教育コンテンツの提供
- 結果として: ソーシャルシェア、ブログでの紹介、自然リンクの獲得
- 「このツールが役立ったらシェアしてください」の控えめなCTA

#### Mere Exposure Effect（単純接触効果）

繰り返し接触することで好意が増す現象。

**実装:**
- 統一されたブランドカラー・ロゴをすべてのページで使用
- コンテンツ記事内でのツール名の自然な言及
- ソーシャルメディアでの定期的な発信

#### Zeigarnik Effect（ツァイガルニク効果）

未完了のタスクが完了タスクよりも記憶に残りやすい現象。

**実装:**
- 「あと1ステップでマーケティング効果UP！」
- UTM未設定時に「あとutm_campaignを設定すれば完璧です」
- 進捗バーを未完了状態で表示し続ける

#### Loss Aversion（損失回避）

得られるものより、失うもののほうが心理的インパクトが大きい。

**実装:**
- 「設定すると得られるもの」ではなく「設定しないと失うもの」としてフレーミング
- 「UTMパラメータなしでは、チラシからのアクセス数がわかりません」
- 「効果測定できないまま印刷コストだけがかかります」

#### Pratfall Effect（プラットフォール効果）

完璧でない部分を正直に見せることで、かえって信頼が増す現象。

**実装:**
- 「高度なスキャン分析には有料ツールが必要です」と正直に記載
- 「当ツールはシンプルさを重視しているため、API連携には対応していません」
- 競合比較ページで相手の強みも認める

---

## 9. 構造化データ（Schema Markup）

### WebApplication Schema（ツールページ用）

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "QR Code Create",
  "description": "UTMパラメータガイダンス付きの無料QRコード生成ツール。装飾フレームでQRコードをカスタマイズできます。登録不要。",
  "url": "https://qr-code-create.vercel.app/create",
  "applicationCategory": "UtilityApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "JPY"
  },
  "featureList": [
    "QRコード生成",
    "UTMパラメータガイダンス",
    "装飾フレーム（エレガント・ポップ・ビジネス）",
    "ロゴ埋め込み",
    "色カスタマイズ",
    "PNG/SVG/PDF出力"
  ],
  "screenshot": "https://qr-code-create.vercel.app/images/screenshot.png",
  "inLanguage": "ja"
}
```

### FAQPage Schema（FAQページ・ガイドページ用）

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "QRコードの作成に料金はかかりますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "いいえ、QR Code Createは完全無料でご利用いただけます。会員登録も不要です。UTMパラメータの設定、装飾フレームの追加、ロゴの埋め込みなど、すべての機能を無料でお使いいただけます。"
      }
    },
    {
      "@type": "Question",
      "name": "UTMパラメータとは何ですか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "UTMパラメータは、URLに追加するトラッキング用のパラメータです。Google Analyticsなどのアクセス解析ツールで、どの媒体（チラシ、名刺、ポスターなど）からのアクセスかを識別できるようになります。utm_source、utm_medium、utm_campaign、utm_term、utm_contentの5種類があります。"
      }
    },
    {
      "@type": "Question",
      "name": "QRコードにロゴを埋め込めますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "はい、QR Code Createではロゴ画像をQRコードの中央に埋め込むことができます。QRコードにはエラー訂正機能があるため、ロゴを埋め込んでも読み取りに支障はありません。"
      }
    },
    {
      "@type": "Question",
      "name": "作成したQRコードはどのような形式でダウンロードできますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "PNG、SVG、PDFの3つの形式でダウンロードできます。Web掲載にはPNG、印刷物にはSVGまたはPDFがおすすめです。"
      }
    },
    {
      "@type": "Question",
      "name": "装飾フレームにはどのようなスタイルがありますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "エレガント、ポップ、ビジネスの3つのスタイルをご用意しています。エレガントは上品で洗練されたデザイン、ポップは明るく目を引くデザイン、ビジネスはシンプルで信頼感のあるデザインです。それぞれキャプション（「詳しくはこちら」等）も追加できます。"
      }
    }
  ]
}
```

### HowTo Schema（QRコード作成プロセス用）

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "UTMパラメータ付きQRコードの作り方",
  "description": "UTMパラメータを設定したQRコードを無料で作成する手順を解説します。",
  "totalTime": "PT3M",
  "tool": {
    "@type": "HowToTool",
    "name": "QR Code Create"
  },
  "step": [
    {
      "@type": "HowToStep",
      "name": "URLを入力する",
      "text": "QRコードにしたいWebページのURLを入力します。",
      "url": "https://qr-code-create.vercel.app/create#step1"
    },
    {
      "@type": "HowToStep",
      "name": "UTMパラメータを設定する",
      "text": "utm_source（参照元: flyer, posterなど）、utm_medium（メディア: qr）、utm_campaign（キャンペーン名）を設定します。ガイダンスに従って入力すれば、Google Analyticsでの効果測定が可能になります。",
      "url": "https://qr-code-create.vercel.app/create#step2"
    },
    {
      "@type": "HowToStep",
      "name": "装飾をカスタマイズする",
      "text": "装飾フレーム（エレガント・ポップ・ビジネス）の選択、色の変更、ロゴの追加、キャプションの設定など、デザインをカスタマイズします。",
      "url": "https://qr-code-create.vercel.app/create#step3"
    },
    {
      "@type": "HowToStep",
      "name": "QRコードを生成・ダウンロードする",
      "text": "プレビューを確認し、PNG・SVG・PDFのいずれかの形式でQRコードをダウンロードします。",
      "url": "https://qr-code-create.vercel.app/create#step4"
    }
  ]
}
```

### BreadcrumbList Schema（全ページ共通）

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "ホーム",
      "item": "https://qr-code-create.vercel.app/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "使い方ガイド",
      "item": "https://qr-code-create.vercel.app/guide"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "UTMパラメータとは",
      "item": "https://qr-code-create.vercel.app/guide/utm-parameters"
    }
  ]
}
```

### Organization Schema（サイト全体）

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "QR Code Create",
  "url": "https://qr-code-create.vercel.app",
  "logo": "https://qr-code-create.vercel.app/images/logo.png",
  "description": "UTMパラメータガイダンス付きの無料QRコード生成ツール",
  "sameAs": [
    "https://twitter.com/qrcodecreate",
    "https://note.com/qrcodecreate"
  ]
}
```

### Article/BlogPosting Schema（ブログ記事用）

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "UTMパラメータとは？初心者向け完全ガイド",
  "description": "UTMパラメータの基本から設定方法、Google Analyticsでの確認方法まで、初心者にもわかりやすく解説します。",
  "author": {
    "@type": "Organization",
    "name": "QR Code Create"
  },
  "publisher": {
    "@type": "Organization",
    "name": "QR Code Create",
    "logo": {
      "@type": "ImageObject",
      "url": "https://qr-code-create.vercel.app/images/logo.png"
    }
  },
  "datePublished": "2026-04-15",
  "dateModified": "2026-04-15",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://qr-code-create.vercel.app/guide/utm-parameters"
  },
  "image": "https://qr-code-create.vercel.app/images/blog/utm-guide-cover.png",
  "inLanguage": "ja"
}
```

---

## 10. アナリティクス計測計画

### GA4イベントトラッキング

| イベント名 | 説明 | プロパティ | トリガー |
|-----------|------|-----------|---------|
| url_entered | URL入力完了 | url_domain | URLフィールドのblur時（有効なURL入力時） |
| utm_source_set | utm_source設定 | utm_source_value, input_method (dropdown/custom) | フィールド変更時 |
| utm_medium_set | utm_medium設定 | utm_medium_value, input_method | フィールド変更時 |
| utm_campaign_set | utm_campaign設定 | has_date_pattern (bool) | フィールド変更時 |
| utm_term_set | utm_term設定 | - | フィールド変更時 |
| utm_content_set | utm_content設定 | - | フィールド変更時 |
| utm_params_count | UTMパラメータ設定数 | count (0-5) | QRコード生成時 |
| logo_uploaded | ロゴアップロード | file_type, file_size_kb | アップロード完了時 |
| color_customized | 色カスタマイズ | foreground_color, background_color | 色変更時 |
| frame_selected | フレーム選択 | frame_type, frame_category | フレーム選択時 |
| caption_set | キャプション設定 | caption_length, is_template | キャプション変更時 |
| preset_selected | プリセット選択 | preset_name | プリセットクリック時 |
| qr_generated | QRコード生成 | has_utm, utm_count, has_logo, has_frame, has_caption | 生成ボタンクリック時 |
| qr_downloaded | QRコードダウンロード | format (png/svg/pdf), has_utm, decoration_count | ダウンロードボタンクリック時 |
| guide_tooltip_opened | ガイド表示 | tooltip_id, field_name | ツールチップ/ヘルプクリック時 |
| help_article_clicked | ヘルプ記事クリック | article_slug | ヘルプリンククリック時 |

### GA4実装コード例

```typescript
// lib/analytics.ts

type EventParams = Record<string, string | number | boolean>;

export function trackEvent(eventName: string, params?: EventParams): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

// URL入力完了
export function trackUrlEntered(url: string): void {
  try {
    const domain = new URL(url).hostname;
    trackEvent('url_entered', { url_domain: domain });
  } catch {
    // 無効なURLの場合はトラッキングしない
  }
}

// UTMパラメータ設定
export function trackUtmSet(
  paramName: 'source' | 'medium' | 'campaign' | 'term' | 'content',
  value: string,
  inputMethod?: 'dropdown' | 'custom'
): void {
  const eventName = `utm_${paramName}_set`;
  const params: EventParams = {};

  if (paramName === 'source' || paramName === 'medium') {
    params[`utm_${paramName}_value`] = value;
    if (inputMethod) {
      params.input_method = inputMethod;
    }
  }

  if (paramName === 'campaign') {
    // 日付パターンの検出（例: 2026_spring, 202604）
    params.has_date_pattern = /\d{4}/.test(value);
  }

  trackEvent(eventName, params);
}

// QRコード生成
export function trackQrGenerated(options: {
  hasUtm: boolean;
  utmCount: number;
  hasLogo: boolean;
  hasFrame: boolean;
  hasCaption: boolean;
}): void {
  trackEvent('qr_generated', {
    has_utm: options.hasUtm,
    utm_count: options.utmCount,
    has_logo: options.hasLogo,
    has_frame: options.hasFrame,
    has_caption: options.hasCaption,
  });
}

// QRコードダウンロード
export function trackQrDownloaded(options: {
  format: 'png' | 'svg' | 'pdf';
  hasUtm: boolean;
  decorationCount: number;
}): void {
  trackEvent('qr_downloaded', {
    format: options.format,
    has_utm: options.hasUtm,
    decoration_count: options.decorationCount,
  });
}

// フレーム選択
export function trackFrameSelected(frameType: string, frameCategory: string): void {
  trackEvent('frame_selected', {
    frame_type: frameType,
    frame_category: frameCategory,
  });
}

// ガイドツールチップ表示
export function trackGuideTooltipOpened(tooltipId: string, fieldName: string): void {
  trackEvent('guide_tooltip_opened', {
    tooltip_id: tooltipId,
    field_name: fieldName,
  });
}
```

### カスタムディメンション

| ディメンション名 | スコープ | 説明 |
|----------------|---------|------|
| utm_completion_rate | ユーザー | UTMパラメータの入力完了率（0-100%） |
| decoration_usage | セッション | 装飾機能の使用状況（none/frame/logo/color/caption） |

### コンバージョン設定

| コンバージョン | 種別 | イベント |
|--------------|------|---------|
| QRコードダウンロード | プライマリ | qr_downloaded |
| QRコード生成 | セカンダリ | qr_generated |

### キーファネル

```
URL入力 (url_entered)
  ↓ ドロップ率を計測
UTM設定 (utm_params_count > 0)
  ↓ ドロップ率を計測
装飾設定 (frame_selected / color_customized)
  ↓ ドロップ率を計測
QRコード生成 (qr_generated)
  ↓ ドロップ率を計測
ダウンロード (qr_downloaded)
```

**ファネル分析で注目すべき指標:**
- URL入力→UTM設定の遷移率（UTMガイダンスの効果を測定）
- UTM設定数の分布（0個, 1個, 2個, 3個, 4個, 5個の割合）
- 生成→ダウンロードの遷移率（プレビューの品質を測定）
- ガイドツールチップの表示率と表示後のUTM入力率

---

## 11. AI SEO戦略

### ターゲットクエリ

| クエリ | 意図 | 対策ページ |
|--------|------|-----------|
| QRコード作成 おすすめ ツール | ツール比較 | /compare/other-tools |
| UTMパラメータ付き QRコード | 機能特定 | /create, /guide/utm-parameters |
| QRコード マーケティング 効果測定 | 知識獲得 | /guide/analytics-measurement |
| 無料 QRコード 作成 | ツール利用 | /, /create |
| QRコード デザイン おしゃれ | デザイン | /guide/design-tips |
| チラシ QRコード 作り方 | 用途特定 | /use-cases/flyer |

### AI検索最適化アクション

#### 1. 構造化コンテンツ（抽出しやすいブロック）

AIが情報を抽出しやすい形式でコンテンツを作成する。

```markdown
## UTMパラメータとは

UTMパラメータ（Urchin Tracking Module）は、URLに追加するトラッキング用の
パラメータです。以下の5種類があります：

| パラメータ | 必須 | 説明 | 例 |
|-----------|------|------|-----|
| utm_source | 必須 | 参照元 | flyer, poster, business_card |
| utm_medium | 必須 | メディア | qr, print, email |
| utm_campaign | 必須 | キャンペーン名 | spring_sale_2026 |
| utm_term | 任意 | キーワード | discount, new_menu |
| utm_content | 任意 | コンテンツ識別 | header_qr, footer_qr |
```

#### 2. FAQ Schemaの充実

一般的なUTM/QR関連の質問に対する回答をFAQ Schema付きで提供する（セクション9参照）。

#### 3. 統計情報の引用

```markdown
- QRコードの利用率は年々増加しており、2024年には日本のスマートフォンユーザーの
  約80%がQRコード決済を利用している（出典: 総務省 情報通信白書）
- 中小企業のうち、オフライン広告の効果測定を実施しているのは約25%にとどまる
  （出典: 中小企業庁 中小企業白書）
```

#### 4. llms.txt の作成

```
# QR Code Create

## 概要
QR Code Createは、UTMパラメータガイダンス付きの無料QRコード生成ツールです。

## 主な機能
- QRコード生成（URL入力のみで即座に生成）
- UTMパラメータ設定ガイダンス（ステップバイステップで案内）
- 装飾フレーム（エレガント・ポップ・ビジネスの3スタイル）
- ロゴ埋め込み
- 色カスタマイズ（前景色・背景色）
- キャプション追加
- PNG/SVG/PDF出力

## 対象ユーザー
日本の中小事業者、イベント主催者、マーケティング担当者

## 特徴
- 完全無料・登録不要
- UTMパラメータの設定忘れを防ぐガイダンス機能
- 装飾フレームでQRコードをおしゃれにカスタマイズ
- マーケティング教育コンテンツ付き

## URL
https://qr-code-create.vercel.app
```

#### 5. robots.txt の設定

```
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://qr-code-create.vercel.app/sitemap.xml
```

#### 6. サードパーティプレゼンスの構築

| プラットフォーム | コンテンツ種別 | 目的 |
|----------------|-------------|------|
| note | 長文記事 | ブランド認知、被リンク |
| Qiita | 技術記事 | 開発者コミュニティ、被リンク |
| Zenn | 技術記事 | 開発者コミュニティ、被リンク |
| Twitter/X | 短文+画像 | 認知拡大、トラフィック |

**note記事案:**
- 「なぜUTMパラメータ付きQRコード生成ツールを作ったのか」
- 「QRコードマーケティング入門：効果測定の基本」
- 「Next.jsで無料ツールを作って公開するまでの全記録」

**Qiita/Zenn記事案:**
- 「Next.js + Vercelで無料QRコードジェネレーターを作った」
- 「QRコードライブラリの比較と選定」
- 「GA4でカスタムイベントを使ったUX分析の実装」

---

## 12. ソーシャルメディア戦略

### プラットフォーム選定

| プラットフォーム | 優先度 | 目的 | 投稿頻度 |
|----------------|--------|------|---------|
| Twitter/X | P0 | 認知拡大、コミュニティ形成 | 週5回 |
| note | P1 | 深い教育コンテンツ、SEO | 月2回 |
| Qiita/Zenn | P2 | 開発者リーチ、被リンク | 月1回 |

### ソーシャルメディアのコンテンツ構成

| カテゴリ | 割合 | 内容 |
|---------|------|------|
| UTM教育コンテンツ | 40% | 「知ってた？UTMパラメータを使うと...」 |
| QRコードデザイン紹介 | 30% | 装飾QRコードのビジュアル投稿 |
| マーケティングTips | 20% | 中小事業者向けの実用的なヒント |
| ツール更新情報 | 10% | 新機能、改善のお知らせ |

### Twitter/X コンテンツカレンダー（週次）

| 曜日 | コンテンツ | 形式 |
|------|-----------|------|
| 月曜 | UTM教育スレッド | テキスト（スレッド形式） |
| 火曜 | QRコードデザイン紹介 | 画像付き投稿 |
| 水曜 | マーケティングTip | テキスト（1投稿） |
| 木曜 | ユーザー事例/活用法 | テキスト or 画像 |
| 金曜 | 週末のイベント向けQRコード作成リマインド | テキスト + CTA |

**投稿テンプレート例:**

```
【月曜: UTM教育スレッド】
チラシを配っても「何枚配って何人がサイトに来たか」わかりますか？

UTMパラメータを設定すれば、Google Analyticsで
「チラシからのアクセス」を正確に把握できます。

設定方法はとてもシンプル👇
(スレッドで解説)

---

【火曜: デザイン紹介】
名刺にこんなQRコードはいかがですか？

ビジネススタイルのフレームで、
洗練された印象のQRコードを作成できます。

▶ 無料で作成: https://qr-code-create.vercel.app/create
(装飾QRコードの画像添付)

---

【金曜: 週末リマインド】
週末にイベントを控えている方へ

まだQRコードを準備していなければ、
今のうちにUTMパラメータ付きで作成しておきましょう。

utm_source=event
utm_medium=qr
utm_campaign=イベント名

▶ 3分で作成: https://qr-code-create.vercel.app/create
```

### note記事計画

月2本のlong-form記事を投稿する。

| 月 | 記事1 | 記事2 |
|----|-------|-------|
| 1ヶ月目 | なぜUTMパラメータ付きQRコード生成ツールを作ったのか | UTMパラメータ完全ガイド |
| 2ヶ月目 | QRコードマーケティング事例集 | チラシの効果測定入門 |
| 3ヶ月目 | QRコードデザインのコツ | 名刺をマーケティングツールにする方法 |
| 4ヶ月目 | イベント集客にQRコードを活用する方法 | Google Analyticsで効果測定する手順 |

**記事内からツールへの自然な導線:**
- 記事中で具体的なUTM設定例を紹介 → 「この設定でQRコードを作成する」リンク
- 「実際に試してみましょう」のセクションでツールを案内
- 記事末尾に控えめなCTA

### ローンチ時のソーシャルコンテンツ

1. **ローンチ告知スレッド（Twitter/X）**
   - 問題提起: 「チラシを配っても効果がわからない問題」
   - 解決策: 「UTMパラメータ付きQRコードで解決」
   - ツール紹介: 「無料・登録不要で作れるツールを作りました」
   - 機能紹介: スクリーンショット付き

2. **デモ動画（30秒）**
   - URL入力→UTM設定→装飾選択→ダウンロードの流れ

3. **装飾QRコードのビジュアル投稿**
   - 3スタイル（エレガント・ポップ・ビジネス）の比較画像

4. **note記事**
   - 「なぜUTMパラメータ付きQRコード生成ツールを作ったのか」

---

## 13. ローンチ戦略

### Phase 1: Pre-Launch（ローンチ2週間前）

| アクション | 担当 | 完了条件 |
|-----------|------|---------|
| note記事: ツール開発の背景と課題 | コンテンツ | 記事公開済み |
| Twitter/Xでティーザー投稿（週3回） | SNS | 投稿完了 |
| 知り合いのマーケター/事業主にベータテスト依頼 | 営業 | 5名以上にフィードバック依頼 |
| OGP画像・スクリーンショットの準備 | デザイン | 各ページ分用意 |
| GA4トラッキングの動作確認 | 開発 | 全イベント発火確認 |

**ティーザー投稿例:**
```
【予告】
「チラシを配ったけど、効果がわからない...」
こんな悩み、ありませんか？

UTMパラメータ付きQRコードで解決する
無料ツールを開発中です。

来週公開予定。お楽しみに。
```

### Phase 2: Soft Launch（1週間）

| アクション | 担当 | 完了条件 |
|-----------|------|---------|
| Twitter/Xでローンチ告知スレッド | SNS | スレッド投稿完了 |
| note記事: 使い方ガイド | コンテンツ | 記事公開済み |
| ベータテスターからのフィードバック収集 | PM | フィードバック整理完了 |
| 緊急バグの修正 | 開発 | 致命的バグなし確認 |
| 初期ユーザーの行動データ分析 | 分析 | ファネルデータ取得 |

### Phase 3: Full Launch

| アクション | 担当 | 完了条件 |
|-----------|------|---------|
| Product Hunt投稿 | マーケ | 投稿完了 |
| Qiita技術記事: 開発技術の共有 | 開発 | 記事公開済み |
| Zenn技術記事 | 開発 | 記事公開済み |
| Twitter/Xスレッド: 全機能紹介 | SNS | スレッド投稿完了 |
| note記事: 活用事例 | コンテンツ | 記事公開済み |
| デモ動画の公開 | コンテンツ | 動画公開済み |

### Phase 4: Post-Launch（継続運用）

| アクション | 頻度 | KPI |
|-----------|------|-----|
| Twitter/X投稿 | 週5回 | フォロワー増加率、エンゲージメント率 |
| note記事 | 月2回 | PV、スキ数、ツールへの遷移率 |
| ブログ記事更新 | 月2回 | オーガニック検索流入 |
| ユーザーフィードバック反映 | 随時 | ユーザー満足度、UTM設定率 |
| SEOコンテンツの追加 | 月1-2ページ | 検索順位、インデックス数 |
| GA4データ分析・改善 | 週次 | ファネル完了率、離脱率改善 |

---

## 14. 実装優先度

### P0: ツール実装時に同時実装

ツールの初回リリースに含めるべき項目。

| 項目 | 種別 | 詳細 |
|------|------|------|
| Schema markup (WebApplication) | SEO | ツールページに構造化データを実装 |
| Schema markup (BreadcrumbList) | SEO | 全ページにパンくずリスト構造化データ |
| Schema markup (HowTo) | SEO | QRコード作成手順の構造化データ |
| GA4トラッキング | 分析 | 全イベントのトラッキング実装 |
| robots.txt | SEO | AIボットを含む全ボットを許可 |
| llms.txt | AI SEO | ツール説明ファイルの設置 |
| OGP/metaタグ最適化 | SEO | 全ページのtitle、description、OGP画像 |
| サイト基本構造 | 開発 | `/`、`/create`、`/faq`の3ページ |
| sitemap.xml | SEO | 全ページのサイトマップ |

### P1: ローンチ後1ヶ月以内

初期のSEOとコンテンツ基盤を構築する。

| 項目 | 種別 | 詳細 |
|------|------|------|
| ガイドページ (/guide/*) | コンテンツ | 4ページのガイドコンテンツ |
| FAQページ (FAQPage schema付き) | コンテンツ+SEO | よくある質問ページ |
| Twitter/Xアカウント運用開始 | SNS | 週5回の投稿開始 |
| note記事 第1弾 | コンテンツ | ローンチストーリー記事 |
| 比較ページ (/compare/other-tools) | コンテンツ | 競合比較コンテンツ |
| CRO施策: マーケティング効果度インジケーター | 開発 | UTM入力促進UI |

### P2: ローンチ後3ヶ月以内

プログラマティックSEOとコンテンツ拡充。

| 項目 | 種別 | 詳細 |
|------|------|------|
| 用途別ページ (/use-cases/*) | pSEO | 9ページのテンプレートページ |
| 業種別ページ (/industry/*) | pSEO | 7ページのテンプレートページ |
| ブログ記事定期更新 | コンテンツ | 月2本のブログ記事 |
| Qiita/Zenn技術記事 | 外部コンテンツ | 技術コミュニティへの発信 |
| CRO施策: コンテキストヘルプ | 開発 | 文脈に応じたUTMガイダンス |
| CRO施策: スマートデフォルト | 開発 | utm_mediumの事前設定等 |

### P3: ローンチ後6ヶ月以内

長期的なコンテンツ・マーケティングの本格化。

| 項目 | 種別 | 詳細 |
|------|------|------|
| コンテンツ拡充 | コンテンツ | Pillar 3, 4のコンテンツ制作 |
| AI SEO最適化の継続改善 | SEO | 統計データの更新、FAQ拡充 |
| ソーシャルメディア戦略の本格化 | SNS | デザイン紹介シリーズ等 |
| 比較ページ拡充 (/compare/qr-no-susume) | コンテンツ | 個別比較ページ |
| QRコードマーケティングガイドPDF | リードキャプチャ | オプションメール登録 |
| Phase 2有料機能の検討 | プロダクト | 短縮URL、スキャン追跡の設計 |
