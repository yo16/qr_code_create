"use client";

import Image from "next/image";
import { ColorPicker } from "@/components/ui/ColorPicker/ColorPicker";
import {
  FRAME_CATEGORY_KEYS,
  FRAME_DEFINITIONS,
  FRAME_OPTIONS,
  isImageFrame,
  type FrameCategoryKey,
  type FrameConfig,
  type FrameDefinition,
  type FrameType,
} from "@/lib/qr/frameRenderer";
import { trackFrameSelected } from "@/lib/analytics/events";
import { formatMessage } from "@/i18n/format";
import { useDict } from "@/i18n/useDict";
import styles from "./FrameSelector.module.css";

interface FrameSelectorProps {
  frame: FrameConfig;
  onChange: (frame: FrameConfig) => void;
}

function groupByCategory(
  definitions: FrameDefinition[]
): Record<FrameCategoryKey, FrameDefinition[]> {
  const result = {} as Record<FrameCategoryKey, FrameDefinition[]>;
  for (const key of FRAME_CATEGORY_KEYS) {
    result[key] = definitions.filter((d) => d.categoryKey === key);
  }
  return result;
}

export function FrameSelector({ frame, onChange }: FrameSelectorProps) {
  const t = useDict().decoration.frame;
  const grouped = groupByCategory(FRAME_DEFINITIONS);

  const handleTypeChange = (type: FrameType) => {
    // GA の category 値は言語によらず ja の値で送る（FRAME_OPTIONS は ja 辞書から組み立てた既存 export）
    const option = FRAME_OPTIONS.find((o) => o.type === type);
    const category = option?.category ?? "";
    onChange({ ...frame, type });
    trackFrameSelected(type, category);
  };

  const handleColorChange = (color: string) => {
    onChange({ ...frame, color });
  };

  const showColorPicker = frame.type !== "none" && !isImageFrame(frame.type);

  return (
    <div className={styles.container}>
      {FRAME_CATEGORY_KEYS.map((categoryKey) => {
        const options = grouped[categoryKey];
        if (!options || options.length === 0) return null;
        const category = t.categories[categoryKey];
        return (
          <div key={categoryKey} className={styles.category}>
            <p className={styles.categoryLabel}>{category}</p>
            <div
              className={styles.grid}
              role="group"
              aria-label={formatMessage(t.groupLabel, { category })}
            >
              {options.map((option) => {
                const isSelected = frame.type === option.type;
                const label = t.labels[option.type];
                return (
                  <button
                    key={option.type}
                    type="button"
                    className={`${styles.frameButton} ${isSelected ? styles["frameButton--selected"] : ""}`}
                    onClick={() => handleTypeChange(option.type)}
                    aria-pressed={isSelected}
                    aria-label={formatMessage(t.itemLabel, { label })}
                  >
                    <span className={styles.framePreview} aria-hidden="true">
                      {option.imageSrc ? (
                        <Image
                          src={option.imageSrc}
                          alt=""
                          width={48}
                          height={48}
                          className={styles.frameThumbnail}
                        />
                      ) : (
                        <FramePreviewIcon type={option.type} />
                      )}
                    </span>
                    <span className={styles.frameLabel}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {showColorPicker && (
        <div className={styles.colorSection}>
          <ColorPicker
            label={t.colorLabel}
            value={frame.color}
            onChange={handleColorChange}
          />
        </div>
      )}
    </div>
  );
}

// フレームのプレビューアイコン（SVGベース）
function FramePreviewIcon({ type }: { type: FrameType }) {
  const size = 32;
  const color = "currentColor";

  if (type === "none") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <line x1="4" y1="28" x2="28" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "simple") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="26" height="26" stroke={color} strokeWidth="2" />
      </svg>
    );
  }
  if (type === "rounded") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="26" height="26" rx="6" stroke={color} strokeWidth="2" />
      </svg>
    );
  }
  if (type === "ornate") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" stroke={color} strokeWidth="2" />
        <rect x="5" y="5" width="22" height="22" stroke={color} strokeWidth="1" />
      </svg>
    );
  }
  if (type === "elegant") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="4" y="4" width="24" height="24" stroke={color} strokeWidth="1" />
        <path d="M4,10 L4,4 L10,4" stroke={color} strokeWidth="2" fill="none" />
        <path d="M22,4 L28,4 L28,10" stroke={color} strokeWidth="2" fill="none" />
        <path d="M4,22 L4,28 L10,28" stroke={color} strokeWidth="2" fill="none" />
        <path d="M22,28 L28,28 L28,22" stroke={color} strokeWidth="2" fill="none" />
      </svg>
    );
  }
  if (type === "pop") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="26" height="26" stroke={color} strokeWidth="4" strokeDasharray="6 4" />
      </svg>
    );
  }
  if (type === "business") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="4" y="4" width="24" height="24" stroke={color} strokeWidth="1" />
      </svg>
    );
  }
  if (type === "festive") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" stroke={color} strokeWidth="2" />
        <rect x="6" y="6" width="20" height="20" stroke={color} strokeWidth="1" />
        <rect x="0" y="0" width="5" height="5" fill={color} />
        <rect x="27" y="0" width="5" height="5" fill={color} />
        <rect x="0" y="27" width="5" height="5" fill={color} />
        <rect x="27" y="27" width="5" height="5" fill={color} />
      </svg>
    );
  }
  return null;
}
