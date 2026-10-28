/**
 * 日本語辞書の Client スライス（common / ui / tool / utm / decoration）。
 * Client から届くファイル（useDict、lib の定数など）はこちらだけを import する。
 * Server スライスを含む ja.ts を Client バンドルに入れないため。
 */
export const jaClient = {
  common: {
    loading: "読み込み中",
    // 行き先の言語名。hint は読み上げ補足（視覚的に隠す）
    languageSwitch: {
      label: "EN",
      hint: " (English)",
      buttonLabel: "言語（Language）",
      listLabel: "言語を選ぶ",
    },
    mobileMenu: {
      open: "メニューを開く",
      close: "メニューを閉じる",
      // header.cta（ja.ts）と同じ文言にする。MobileNav は Client なので別スライスに置いている
      cta: "QRコード生成",
    },
    notFound: {
      title: "ページが見つかりません",
      body: "お探しのページは存在しないか、移動した可能性があります。",
      link: "トップページへ戻る",
    },
    comingSoon: {
      badge: "準備中",
      noteLine1: "現在このページは準備中です。コンテンツは順次追加予定です。",
      noteLine2:
        "先にQRコードを作成したい方は、以下のボタンからツールをご利用いただけます。",
      create: "QRコードを作成する",
      backToTop: "トップに戻る",
    },
    // ArticleCta は Client Component のため Client スライスに置く
    articleCta: {
      ariaLabel: "QRコード作成への案内",
      heading: "このページの内容でQRコードを作ってみましょう",
      defaultText: "QRコードを作成する",
      note: "無料・登録不要",
    },
  },
  ui: {
    select: {
      placeholder: "選択してください",
      customOption: "その他（自由入力）",
      customPlaceholder: "自由に入力してください",
      customAria: "{label}（自由入力）",
    },
    fileUpload: {
      sizeExceeded: "ファイルサイズが上限（{max}KB）を超えています。",
      dropZoneAria: "{label}。クリックまたはドラッグ&ドロップでファイルを選択",
      previewAlt: "プレビュー",
      dropText: "クリックまたはドラッグ&ドロップ",
      accept: "対応形式: {accept}",
      maxSize: "最大サイズ: {max}KB",
      removeAria: "選択したファイルを削除",
    },
    colorPicker: {
      pickerAria: "{label}のカラーピッカー",
      textLabel: "{label}のカラーコード入力",
      textAria: "{label}のカラーコード",
    },
    progressBar: {
      defaultLabel: "ステップ {current}/{total}",
    },
    tabs: {
      listAria: "タブ",
    },
  },
  tool: {
    pageHeading: "QRコード生成",
    steps: {
      url: { label: "ステップ1: URL入力", title: "URLを入力" },
      utm: { label: "ステップ2: UTMパラメータ設定", title: "UTMパラメータ設定" },
      decoration: { label: "ステップ3: 装飾設定", title: "装飾設定" },
      download: { label: "ステップ4: ダウンロード", title: "ダウンロード" },
    },
    progress: {
      label: "完成度",
      start: "URLを入力してQRコードを作成しましょう",
      utm: "UTMパラメータを設定するとマーケティング効果UP！",
      decoration: "装飾でQRコードをもっと魅力的に",
      done: "QRコードが完成しました！",
    },
    urlInput: {
      label: "URL",
      placeholder: "https://example.com",
    },
    validation: {
      invalidUrl: "有効なURLを入力してください",
    },
    urlPreview: {
      label: "生成URLプレビュー",
      copyAria: "URLをクリップボードにコピー",
      copy: "コピー",
      copied: "コピーしました",
      placeholder: "URLを入力するとプレビューが表示されます",
      copiedStatus: "URLをコピーしました",
    },
    qrPreview: {
      label: "QRコードプレビュー",
      ariaGenerated: "生成されたQRコード",
      ariaPlaceholder: "QRコードプレースホルダー",
      placeholder: "URLを入力してQRコードを生成",
      error: "QRコードの生成に失敗しました",
      contrastWarning:
        "前景色と背景色のコントラスト比が不足しています（WCAG AA 基準: 4.5:1 以上）。QRコードが読み取りにくい場合があります。",
    },
    download: {
      disabledMessage: "QRコードを生成するとダウンロードできます",
      resolutionLabel: "出力解像度",
      resolutionNormal: "通常",
      hint2x: "印刷向け（推奨）",
      warning4x: "高品質。ファイルサイズが大きくなります",
      fileSize: "約{n}KB",
      pngButton: "PNG形式でダウンロード",
      svgButton: "SVG形式でダウンロード",
      pdfButton: "PDF形式でダウンロード",
      pdfGenerating: "PDF生成中...",
      posterCta: "印刷用ポスターを作る →",
      posterCtaAria: "印刷用ポスターを作る（/posterページへ移動）",
    },
  },
  utm: {
    title: "UTMパラメータ設定",
    toggleLabel: "UTMを設定する",
    toggleAria: "UTMパラメータを設定する",
    noUtmWarning:
      "UTMパラメータなしでは、このQRコードからのアクセスをGoogle Analyticsで追跡できません",
    advancedShow: "詳細設定を表示",
    advancedHide: "詳細設定を非表示",
    helpButtonAria: "{label}のヘルプ",
    fieldLabels: {
      source: "utm_source（掲載場所）",
      medium: "utm_medium（配布手段）",
      campaign: "utm_campaign（キャンペーン名）",
      term: "utm_term（検索キーワード）",
      content: "utm_content（コンテンツ識別子）",
    },
    fieldPlaceholders: {
      campaign: "例: spring_sale_2026",
      term: "例: QRコード 作成",
      content: "例: banner_top",
    },
    campaignHint: "日付や内容を含めると管理しやすくなります",
    fieldHelp: {
      source: "QRコードを掲載する場所を指定します（チラシ、名刺、ポスターなど）",
      medium:
        "ユーザーに届ける手段を指定します。QRコードの場合は「QRコード」がおすすめです",
      campaign:
        "キャンペーン名を指定します。日付や内容を含めると管理しやすくなります（例: spring_sale_2026）",
      term: "検索キーワードを指定します。主にリスティング広告向けですが、QRコードでは省略可能です",
      content:
        "同一キャンペーン内でA/Bテストを行う場合などに使います。複数のQRコードを使い分ける際に便利です",
    },
    sourceLabels: {
      flyer: "チラシ・フライヤー",
      poster: "ポスター",
      business_card: "名刺",
      brochure: "パンフレット",
      banner: "看板",
      receipt: "レシート",
      product_package: "製品パッケージ",
      menu: "メニュー",
      signage: "店内POP",
    },
    mediumLabels: {
      qr: "QRコード",
      print: "印刷物",
    },
    usageExamplesLabel: "用途別設定例:",
    usageExampleLabels: {
      business_card: "名刺に印刷",
      flyer: "チラシに印刷",
      poster: "ポスター掲示",
      signage: "店内POP",
    },
    effectiveness: {
      label: "マーケティング効果度: {level}",
      levels: {
        low: "低",
        normal: "普通",
        high: "高",
        highest: "最高",
      },
      messages: {
        none: "マーケティング効果の測定ができません",
        basic: "基本的なトラッキングが可能です",
        better: "効果測定の精度が上がります",
        detailed: "Google Analyticsで詳細な分析が可能です",
        perfect: "完璧なトラッキング設定です！",
      },
    },
  },
  decoration: {
    presetGroupLabel: "装飾プリセット",
    presetItemLabel: "プリセット: {name} - {description}",
    presets: {
      simple: {
        name: "シンプル",
        description: "白黒でクリーンなデザイン",
        caption: "",
      },
      business: {
        name: "ビジネス",
        description: "信頼感のある落ち着いたデザイン",
        caption: "詳しくはこちら",
      },
      casual: {
        name: "カジュアル",
        description: "親しみやすいナチュラルデザイン",
        caption: "スキャンしてチェック",
      },
      elegant: {
        name: "エレガント",
        description: "上品で洗練されたデザイン",
        caption: "QRコードを読み取る",
      },
      pop: {
        name: "ポップ",
        description: "目を引くカラフルなデザイン",
        caption: "今すぐアクセス!",
      },
    },
    color: {
      fg: "前景色",
      bg: "背景色",
      contrastRatio: "コントラスト比: {ratio}:1",
      ok: "読み取りやすいコントラストです",
      caution: "読み取りにくくなる可能性があります",
      warning: "QRコードが読み取れない可能性があります",
      reset: "デフォルトに戻す",
    },
    logo: {
      upload: "ロゴ画像をアップロード",
      alt: "ロゴ: {fileName}",
      sizeLabel: "ロゴサイズ: {percent}%",
      sizeAria: "ロゴサイズを調整",
      remove: "ロゴを削除",
      removeAria: "ロゴを削除",
    },
    frame: {
      groupLabel: "{category}フレーム",
      itemLabel: "フレーム: {label}",
      colorLabel: "フレームの色",
      categories: {
        basic: "基本",
        ornate: "装飾",
        target: "ターゲット別",
        imageSimple: "画像：シンプル",
        imageOrnate: "画像：装飾",
      },
      labels: {
        none: "なし",
        simple: "シンプル",
        rounded: "角丸",
        ornate: "装飾",
        elegant: "エレガント",
        pop: "ポップ",
        business: "ビジネス",
        festive: "フェスティブ",
        "img-simple-black": "ブラック",
        "img-simple-blue": "ブルー",
        "img-simple-gray": "グレー",
        "img-simple-red": "レッド",
        "img-elaborated-japanese": "和風",
        "img-elaborated-gothic": "ゴシック",
        "img-elaborated-baroque": "バロック",
      },
    },
    caption: {
      templateLabel: "テンプレートから選ぶ",
      templatePlaceholder: "-- テンプレートを選択 --",
      templates: {
        scan: "スキャンして詳細を見る",
        access: "こちらからアクセス",
        read: "QRコードを読み取る",
        web: "詳しくはWebで",
        check: "今すぐチェック",
      },
      textLabel: "キャプションテキスト",
      textPlaceholder: "キャプションを入力",
      count: "{length}/{max}文字",
      tooLong: "キャプションが長すぎると印刷時に見にくくなります",
      fontSizeLabel: "フォントサイズ: {size}px",
      fontSizeAria: "フォントサイズ {size}px",
    },
  },
};
