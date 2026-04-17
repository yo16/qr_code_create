"use client";

import { useState, useRef } from "react";
import { UrlInput } from "@/components/qr/UrlInput/UrlInput";
import { UtmBuilder } from "@/components/qr/UtmBuilder/UtmBuilder";
import { UrlPreview } from "@/components/qr/UrlPreview/UrlPreview";
import { QrPreview } from "@/components/qr/QrPreview/QrPreview";
import { DownloadPanel } from "@/components/qr/DownloadPanel/DownloadPanel";
import { ColorCustomizer } from "@/components/qr/DecorationPanel/ColorCustomizer";
import { FrameSelector } from "@/components/qr/DecorationPanel/FrameSelector";
import { LogoUploader } from "@/components/qr/DecorationPanel/LogoUploader";
import { CaptionEditor } from "@/components/qr/DecorationPanel/CaptionEditor";
import { ProgressBar } from "@/components/ui/ProgressBar/ProgressBar";
import { buildUtmUrl } from "@/lib/url/buildUtmUrl";
import { DEFAULT_FRAME_CONFIG, type FrameConfig } from "@/lib/qr/frameRenderer";
import { INITIAL_QR_STATE, type CaptionConfig, type LogoConfig, type QrState } from "@/types/qr";
import styles from "./QrGenerator.module.css";

function getCompletionPercent(state: QrState): number {
  let steps = 0;
  if (state.isUrlValid) steps += 1;
  const hasUtm =
    state.utm.source.trim() !== "" ||
    state.utm.medium.trim() !== "" ||
    state.utm.campaign.trim() !== "" ||
    state.utm.term.trim() !== "" ||
    state.utm.content.trim() !== "";
  if (hasUtm) steps += 1;
  const hasDecoration =
    state.decoration.fgColor !== "#000000" ||
    state.decoration.bgColor !== "#ffffff" ||
    (state.decoration.frameType !== null && state.decoration.frameType !== "none") ||
    state.decoration.caption.text !== "" ||
    state.decoration.logo !== null;
  if (hasDecoration) steps += 1;
  return Math.round((steps / 3) * 100);
}

function getProgressMessage(percent: number): string {
  if (percent === 0) return "URLを入力してQRコードを作成しましょう";
  if (percent <= 33) return "UTMパラメータを設定するとマーケティング効果UP！";
  if (percent <= 66) return "装飾でQRコードをもっと魅力的に";
  return "QRコードが完成しました！";
}

function getStepState(
  stepNumber: number,
  currentStep: number
): "active" | "completed" | "default" {
  if (stepNumber === currentStep) return "active";
  if (stepNumber < currentStep) return "completed";
  return "default";
}

function stepCardClassName(
  state: "active" | "completed" | "default",
  baseStyles: Record<string, string>
): string {
  if (state === "active")
    return `${baseStyles.stepCard} ${baseStyles.active}`;
  if (state === "completed")
    return `${baseStyles.stepCard} ${baseStyles.completed}`;
  return baseStyles.stepCard;
}

export function QrGenerator() {
  const [state, setState] = useState<QrState>(INITIAL_QR_STATE);
  const [frameConfig, setFrameConfig] = useState<FrameConfig>(DEFAULT_FRAME_CONFIG);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUrlChange = (url: string) => {
    setState((prev) => ({ ...prev, url, currentStep: 1 }));
  };

  const handleUrlValidationChange = (isUrlValid: boolean) => {
    setState((prev) => {
      const nextStep = isUrlValid && prev.currentStep === 1 ? 2 : prev.currentStep;
      return { ...prev, isUrlValid, currentStep: nextStep };
    });
  };

  const handleUtmChange = (utm: QrState["utm"]) => {
    setState((prev) => ({ ...prev, utm }));
  };

  const handleFgColorChange = (fgColor: string) => {
    setState((prev) => ({
      ...prev,
      decoration: { ...prev.decoration, fgColor },
    }));
  };

  const handleBgColorChange = (bgColor: string) => {
    setState((prev) => ({
      ...prev,
      decoration: { ...prev.decoration, bgColor },
    }));
  };

  const handleFrameChange = (frame: FrameConfig) => {
    setFrameConfig(frame);
    setState((prev) => ({
      ...prev,
      decoration: { ...prev.decoration, frameType: frame.type },
    }));
  };

  const handleLogoChange = (logo: LogoConfig | null) => {
    setState((prev) => ({
      ...prev,
      decoration: { ...prev.decoration, logo },
    }));
  };

  const handleCaptionChange = (caption: CaptionConfig) => {
    setState((prev) => ({
      ...prev,
      decoration: { ...prev.decoration, caption },
    }));
  };

  const hasUtm =
    state.utm.source.trim() !== "" ||
    state.utm.medium.trim() !== "" ||
    state.utm.campaign.trim() !== "" ||
    state.utm.term.trim() !== "" ||
    state.utm.content.trim() !== "";

  const decorationCount = [
    state.decoration.logo !== null,
    state.decoration.fgColor !== "#000000" || state.decoration.bgColor !== "#ffffff",
    state.decoration.frameType !== null,
    state.decoration.caption.text !== "",
  ].filter(Boolean).length;

  const completionPercent = getCompletionPercent(state);
  const progressMessage = getProgressMessage(completionPercent);

  const builtUrl = buildUtmUrl(state.url, state.utm);

  const step1State = getStepState(1, state.currentStep);
  const step2State = getStepState(2, state.currentStep);
  const step3State = getStepState(3, state.currentStep);
  const step4State = getStepState(4, state.currentStep);

  return (
    <div className={styles.container}>
      {/* 左カラム: ステップUI */}
      <div className={styles.leftColumn}>
        {/* ステップ1: URL入力 */}
        <section
          className={stepCardClassName(step1State, styles)}
          aria-label="ステップ1: URL入力"
        >
          <div className={styles.stepHeader}>
            <span className={styles.stepBadge} aria-hidden="true">
              1
            </span>
            <h2 className={styles.stepTitle}>URLを入力</h2>
          </div>
          <UrlInput
            value={state.url}
            onChange={handleUrlChange}
            onValidationChange={handleUrlValidationChange}
          />
        </section>

        {/* ステップ2: UTMパラメータ設定 */}
        <section
          className={stepCardClassName(step2State, styles)}
          aria-label="ステップ2: UTMパラメータ設定"
        >
          <div className={styles.stepHeader}>
            <span className={styles.stepBadge} aria-hidden="true">
              2
            </span>
            <h2 className={styles.stepTitle}>UTMパラメータ設定</h2>
          </div>
          <UtmBuilder values={state.utm} onChange={handleUtmChange} />
        </section>

        {/* ステップ3: 装飾設定 */}
        <section
          className={stepCardClassName(step3State, styles)}
          aria-label="ステップ3: 装飾設定"
        >
          <div className={styles.stepHeader}>
            <span className={styles.stepBadge} aria-hidden="true">
              3
            </span>
            <h2 className={styles.stepTitle}>装飾設定</h2>
          </div>
          <ColorCustomizer
            fgColor={state.decoration.fgColor}
            bgColor={state.decoration.bgColor}
            onFgColorChange={handleFgColorChange}
            onBgColorChange={handleBgColorChange}
          />
          <LogoUploader
            logo={state.decoration.logo}
            onChange={handleLogoChange}
          />
          <FrameSelector
            frame={frameConfig}
            onChange={handleFrameChange}
          />
          <CaptionEditor
            caption={state.decoration.caption}
            onChange={handleCaptionChange}
          />
        </section>

        {/* ステップ4: ダウンロード */}
        <section
          className={stepCardClassName(step4State, styles)}
          aria-label="ステップ4: ダウンロード"
        >
          <div className={styles.stepHeader}>
            <span className={styles.stepBadge} aria-hidden="true">
              4
            </span>
            <h2 className={styles.stepTitle}>ダウンロード</h2>
          </div>
          <DownloadPanel
            canvasRef={canvasRef}
            disabled={!state.isUrlValid}
            hasUtm={hasUtm}
            decorationCount={decorationCount}
          />
        </section>
      </div>

      {/* 右カラム: プレビューエリア */}
      <div className={styles.rightColumn}>
        <div className={styles.previewArea}>
          <div className={styles.desktopOnly}>
            <ProgressBar
              current={completionPercent}
              total={100}
              label="完成度"
              message={progressMessage}
            />
            <UrlPreview
              url={state.url}
              utmSource={state.utm.source}
              utmMedium={state.utm.medium}
              utmCampaign={state.utm.campaign}
              utmTerm={state.utm.term}
              utmContent={state.utm.content}
            />
          </div>
          <QrPreview
            url={builtUrl}
            fgColor={state.decoration.fgColor}
            bgColor={state.decoration.bgColor}
            logo={state.decoration.logo}
            frameConfig={frameConfig}
            isUrlValid={state.isUrlValid}
            canvasRef={canvasRef}
          />
        </div>
      </div>
    </div>
  );
}
