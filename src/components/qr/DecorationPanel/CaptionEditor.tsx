"use client";

import { useState } from "react";
import { trackCaptionSet } from "@/lib/analytics/events";
import type { CaptionConfig } from "@/types/qr";
import styles from "./CaptionEditor.module.css";

export type { CaptionConfig };

interface CaptionEditorProps {
  caption: CaptionConfig;
  onChange: (caption: CaptionConfig) => void;
}

const MAX_LENGTH = 15;
const DEFAULT_FONT_SIZE = 14;
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 24;

const TEMPLATE_OPTIONS = [
  "スキャンして詳細を見る",
  "こちらからアクセス",
  "QRコードを読み取る",
  "詳しくはWebで",
  "今すぐチェック",
];

export function CaptionEditor({ caption, onChange }: CaptionEditorProps) {
  const [isTemplate, setIsTemplate] = useState(false);

  const handleTextChange = (text: string) => {
    setIsTemplate(false);
    onChange({ ...caption, text });
    trackCaptionSet(text.length, false);
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "") return;
    setIsTemplate(true);
    onChange({ ...caption, text: value });
    trackCaptionSet(value.length, true);
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fontSize = Number(e.target.value);
    onChange({ ...caption, fontSize });
  };

  const isOverLimit = caption.text.length > MAX_LENGTH;

  return (
    <div className={styles.container}>
      <div className={styles.field}>
        <label htmlFor="caption-template" className={styles.label}>
          テンプレートから選ぶ
        </label>
        <select
          id="caption-template"
          className={styles.select}
          value=""
          onChange={handleTemplateChange}
        >
          <option value="">-- テンプレートを選択 --</option>
          {TEMPLATE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="caption-text" className={styles.label}>
          キャプションテキスト
        </label>
        <div className={styles.inputWrapper}>
          <input
            id="caption-text"
            type="text"
            className={`${styles.input} ${isOverLimit ? styles["input--warning"] : ""}`}
            value={caption.text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="キャプションを入力"
            aria-describedby={isOverLimit ? "caption-warning" : "caption-count"}
          />
          <span
            id="caption-count"
            className={`${styles.charCount} ${isOverLimit ? styles["charCount--warning"] : ""}`}
            aria-live="polite"
          >
            {caption.text.length}/{MAX_LENGTH}文字
          </span>
        </div>
        {isOverLimit && (
          <p
            id="caption-warning"
            className={styles.warningMessage}
            role="status"
          >
            キャプションが長すぎると印刷時に見にくくなります
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="caption-font-size" className={styles.label}>
          フォントサイズ: {caption.fontSize}px
        </label>
        <input
          id="caption-font-size"
          type="range"
          className={styles.slider}
          min={MIN_FONT_SIZE}
          max={MAX_FONT_SIZE}
          step={1}
          value={caption.fontSize}
          onChange={handleFontSizeChange}
          aria-label={`フォントサイズ ${caption.fontSize}px`}
        />
        <div className={styles.sliderTicks}>
          <span className={styles.sliderTick}>{MIN_FONT_SIZE}px</span>
          <span className={styles.sliderTick}>{MAX_FONT_SIZE}px</span>
        </div>
      </div>
    </div>
  );
}
