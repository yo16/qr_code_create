"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { INITIAL_POSTER_STATE, type PosterState } from "@/types/poster";
import type { DecorationConfig } from "@/types/qr";
import { UtmBuilder } from "@/components/qr/UtmBuilder/UtmBuilder";
import { MarkdownInput } from "@/components/poster/MarkdownInput";
import { PosterPreview } from "@/components/poster/PosterPreview";
import { FRAME_OPTIONS } from "@/lib/qr/frameRenderer";
import { buildUtmUrl } from "@/lib/url/buildUtmUrl";
import { loadPosterHandoff } from "@/lib/handoff/posterHandoff";
import { generatePosterPdf } from "@/lib/pdf/generatePosterPdf";
import { validateUrl } from "@/lib/url/validateUrl";
import styles from "./PosterEditor.module.css";

const subscribeNoop = () => () => {};

/** sessionStorage から引き継ぎ state を読み込んで初期 state を作る */
function createInitialState(): PosterState {
  const payload = loadPosterHandoff();
  if (!payload) return INITIAL_POSTER_STATE;
  return {
    ...INITIAL_POSTER_STATE,
    url: payload.url,
    isUrlValid: payload.isUrlValid,
    utm: payload.utm,
    utmEnabled: payload.utmEnabled,
    decoration: payload.decoration,
  };
}

/** 引き継いだ装飾の要約文を作る */
function summarizeDecoration(decoration: DecorationConfig): string {
  const parts = [`色（${decoration.fgColor} / ${decoration.bgColor}）`];
  if (decoration.frameType && decoration.frameType !== "none") {
    const label =
      FRAME_OPTIONS.find((o) => o.type === decoration.frameType)?.label ??
      decoration.frameType;
    parts.push(`フレーム（${label}）`);
  }
  if (decoration.logo) parts.push("ロゴあり");
  if (decoration.caption.text.trim() !== "") {
    parts.push(`キャプション（${decoration.caption.text.trim()}）`);
  }
  return `適用される装飾: ${parts.join("、")}`;
}

export function PosterEditor() {
  // サーバー/ハイドレーション時は false、クライアントで確定後に true（sessionStorage はクライアントでのみ読める）
  const isClient = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );

  // handoff 読み込み前は何も表示しない（ちらつき防止）
  if (!isClient) {
    return <div className={styles.loading} aria-live="polite">読み込み中...</div>;
  }

  return <PosterEditorContent />;
}

function PosterEditorContent() {
  const [state, setState] = useState<PosterState>(createInitialState);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    const result = validateUrl(url);
    setState((prev) => ({
      ...prev,
      url,
      isUrlValid: result.isValid,
    }));
  };

  const qrUrl = useMemo(
    () => buildUtmUrl(state.url, state.utm, state.utmEnabled),
    [state.url, state.utm, state.utmEnabled]
  );

  const handleDownload = async () => {
    if (!state.isUrlValid || isGenerating) return;
    setIsGenerating(true);
    try {
      await generatePosterPdf(state);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <label htmlFor="poster-url" className={styles.label}>
          QRコードに埋め込むURL
        </label>
        <input
          id="poster-url"
          type="url"
          className={styles.urlInput}
          value={state.url}
          onChange={handleUrlChange}
          placeholder="https://example.com"
          aria-describedby="poster-url-hint"
        />
        <p id="poster-url-hint" className={styles.hint}>
          {state.url && !state.isUrlValid
            ? "有効なURLを入力してください（https:// から始まるURL）"
            : "印刷用ポスターに使用するURLを入力してください"}
        </p>
      </section>

      <section className={styles.section}>
        <UtmBuilder
          values={state.utm}
          onChange={(utm) => setState((prev) => ({ ...prev, utm }))}
          enabled={state.utmEnabled}
          onEnabledChange={(utmEnabled) => setState((prev) => ({ ...prev, utmEnabled }))}
        />
      </section>

      <section className={styles.section} aria-label="適用される装飾">
        <p className={styles.summary}>{summarizeDecoration(state.decoration)}</p>
      </section>

      <section className={styles.section}>
        <MarkdownInput
          value={state.description}
          onChange={(description) => setState((prev) => ({ ...prev, description }))}
          placeholder={"## お店の名前\n\n**今週のおすすめ** はこちらから"}
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.previewTitle}>プレビュー</h2>
        <PosterPreview
          url={qrUrl}
          isUrlValid={state.isUrlValid}
          description={state.description}
          decoration={state.decoration}
        />
      </section>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.downloadButton}
          onClick={handleDownload}
          disabled={!state.isUrlValid || isGenerating}
          aria-busy={isGenerating}
        >
          {isGenerating ? "生成中..." : "PDFをダウンロード"}
        </button>
        {!state.isUrlValid && (
          <p className={styles.disabledHint}>
            有効なURLを入力するとPDFをダウンロードできます
          </p>
        )}
      </div>
    </div>
  );
}
