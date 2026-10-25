"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { INITIAL_POSTER_STATE, type PosterState } from "@/types/poster";
import type { DecorationConfig } from "@/types/qr";
import { UtmBuilder } from "@/components/qr/UtmBuilder/UtmBuilder";
import { MarkdownInput } from "@/components/poster/MarkdownInput";
import { isContrastSufficient } from "@/lib/color/contrastChecker";
import { useDict } from "@/i18n/useDict";
import { PosterPreview } from "@/components/poster/PosterPreview";
import { PdfDownloadButton } from "@/components/poster/PdfDownloadButton";
import { FRAME_OPTIONS } from "@/lib/qr/frameRenderer";
import { buildUtmUrl } from "@/lib/url/buildUtmUrl";
import { loadPosterHandoff } from "@/lib/handoff/posterHandoff";
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
    frameColor: payload.frameColor,
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
  const previewRef = useRef<HTMLDivElement>(null);
  const tQr = useDict().tool.qrPreview;
  // 最初のレンダリングで QR が描かれるまでは押せないようにする（PosterPreview が確定後に伝える）
  const [qrReady, setQrReady] = useState(false);
  // 4 枚のうち 1 枚でも QR の生成に失敗したか（URL が長すぎるときなど）
  const [qrFailed, setQrFailed] = useState(false);
  const contrastOk = isContrastSufficient(state.decoration.fgColor, state.decoration.bgColor);
  const hasDescription = state.description.trim() !== "";

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
  // PDF の中身に影響する入力。変わったら前回の成功/失敗メッセージを消す
  const resultResetKey = useMemo(
    () => JSON.stringify([qrUrl, state.description, state.decoration, state.frameColor]),
    [qrUrl, state.description, state.decoration, state.frameColor]
  );

  return (
    <div className={styles.layout}>
      <div className={styles.form}>
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
      </div>

      <section className={styles.preview} aria-labelledby="poster-preview-title">
        <h2 id="poster-preview-title" className={styles.previewTitle}>プレビュー</h2>
        {/* QRコードの色の組み合わせが読み取りにくいときの注意は、カードの中ではなくここに 1 回だけ出す */}
        {state.isUrlValid && !contrastOk && (
          <p className={styles.contrastWarning} role="alert">
            {tQr.contrastWarning}
          </p>
        )}
        <div className={styles.previewSheet}>
          <PosterPreview
            url={qrUrl}
            isUrlValid={state.isUrlValid}
            description={state.description}
            decoration={state.decoration}
            frameColor={state.frameColor}
            innerRef={previewRef}
            onReadyChange={setQrReady}
            onFailedChange={setQrFailed}
          />
        </div>
      </section>

      <div className={styles.actions}>
        <PdfDownloadButton
          previewRef={previewRef}
          disabled={!state.isUrlValid || !hasDescription}
          ready={qrReady}
          renderFailed={qrFailed}
          resetKey={resultResetKey}
          hasUtm={state.utmEnabled && qrUrl.includes("utm_")}
          hasLogo={state.decoration.logo != null}
          descriptionLength={state.description.length}
        />
        {!state.isUrlValid && (
          <p className={styles.disabledHint}>
            有効なURLを入力するとPDFをダウンロードできます
          </p>
        )}
        {state.isUrlValid && !hasDescription && (
          <p className={styles.disabledHint}>
            説明文を入力するとPDFをダウンロードできます
          </p>
        )}
      </div>
    </div>
  );
}
