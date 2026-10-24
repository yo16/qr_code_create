"use client";

import { trackCaptionSet } from "@/lib/analytics/events";
import { formatMessage } from "@/i18n/format";
import { useDict } from "@/i18n/useDict";
import type { CaptionConfig } from "@/types/qr";
import styles from "./CaptionEditor.module.css";

export type { CaptionConfig };

interface CaptionEditorProps {
  caption: CaptionConfig;
  onChange: (caption: CaptionConfig) => void;
}

const MAX_LENGTH = 15;
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 24;

const TEMPLATE_KEYS = ["scan", "access", "read", "web", "check"] as const;

export function CaptionEditor({ caption, onChange }: CaptionEditorProps) {
  const t = useDict().decoration.caption;
  const templateOptions = TEMPLATE_KEYS.map((key) => t.templates[key]);

  const handleTextChange = (text: string) => {
    onChange({ ...caption, text });
    trackCaptionSet(text.length, false);
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "") return;
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
          {t.templateLabel}
        </label>
        <select
          id="caption-template"
          className={styles.select}
          value=""
          onChange={handleTemplateChange}
        >
          <option value="">{t.templatePlaceholder}</option>
          {templateOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="caption-text" className={styles.label}>
          {t.textLabel}
        </label>
        <div className={styles.inputWrapper}>
          <input
            id="caption-text"
            type="text"
            className={`${styles.input} ${isOverLimit ? styles["input--warning"] : ""}`}
            value={caption.text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={t.textPlaceholder}
            aria-describedby={isOverLimit ? "caption-warning" : "caption-count"}
          />
          <span
            id="caption-count"
            className={`${styles.charCount} ${isOverLimit ? styles["charCount--warning"] : ""}`}
            aria-live="polite"
          >
            {formatMessage(t.count, {
              length: caption.text.length,
              max: MAX_LENGTH,
            })}
          </span>
        </div>
        {isOverLimit && (
          <p
            id="caption-warning"
            className={styles.warningMessage}
            role="status"
          >
            {t.tooLong}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="caption-font-size" className={styles.label}>
          {formatMessage(t.fontSizeLabel, { size: caption.fontSize })}
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
          aria-label={formatMessage(t.fontSizeAria, { size: caption.fontSize })}
        />
        <div className={styles.sliderTicks}>
          <span className={styles.sliderTick}>{MIN_FONT_SIZE}px</span>
          <span className={styles.sliderTick}>{MAX_FONT_SIZE}px</span>
        </div>
      </div>
    </div>
  );
}
