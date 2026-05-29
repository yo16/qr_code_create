"use client";

import { useState, useEffect } from "react";
import { INITIAL_POSTER_STATE, type PosterState } from "@/types/poster";
import { loadPosterHandoff } from "@/lib/handoff/posterHandoff";
import { generatePosterPdf } from "@/lib/pdf/generatePosterPdf";
import { validateUrl } from "@/lib/url/validateUrl";
import styles from "./PosterEditor.module.css";

export function PosterEditor() {
  const [state, setState] = useState<PosterState>(INITIAL_POSTER_STATE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [handoffLoaded, setHandoffLoaded] = useState(false);

  // マウント時に sessionStorage から引き継ぎ state を読み込む
  useEffect(() => {
    const payload = loadPosterHandoff();
    if (payload) {
      setState((prev) => ({
        ...prev,
        url: payload.url,
        isUrlValid: payload.isUrlValid,
        utm: payload.utm,
        utmEnabled: payload.utmEnabled,
        decoration: payload.decoration,
      }));
    }
    setHandoffLoaded(true);
  }, []);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    const result = validateUrl(url);
    setState((prev) => ({
      ...prev,
      url,
      isUrlValid: result.isValid,
    }));
  };

  const handleDownload = async () => {
    if (!state.isUrlValid || isGenerating) return;
    setIsGenerating(true);
    try {
      await generatePosterPdf(state);
    } finally {
      setIsGenerating(false);
    }
  };

  // handoff 読み込み前は何も表示しない（ちらつき防止）
  if (!handoffLoaded) {
    return <div className={styles.loading} aria-live="polite">読み込み中...</div>;
  }

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
        <p className={styles.notice}>
          Markdown説明文の入力欄・プレビューは準備中です。次のバージョンで追加されます。
        </p>
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
