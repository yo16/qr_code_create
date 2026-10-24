"use client";

import { useState } from "react";
import { UtmField } from "./UtmField";
import { UtmGuide } from "./UtmGuide";
import { EffectivenessIndicator } from "./EffectivenessIndicator";
import {
  buildUtmSourceOptions,
  buildUtmMediumOptions,
} from "@/lib/constants/utmPresets";
import { useDict } from "@/i18n/useDict";
import {
  trackUtmSet,
  trackUtmToggled,
  trackGuideTooltipOpened,
} from "@/lib/analytics/events";
import styles from "./UtmBuilder.module.css";

export interface UtmValues {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
}

interface UtmBuilderProps {
  values: UtmValues;
  onChange: (values: UtmValues) => void;
  /** UTM設定全体の有効/無効フラグ (デフォルト: true) */
  enabled: boolean;
  /** UTM ON/OFF切替時に呼ばれるコールバック */
  onEnabledChange: (enabled: boolean) => void;
}

export function UtmBuilder({ values, onChange, enabled, onEnabledChange }: UtmBuilderProps) {
  const { utm: t } = useDict();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const sourceOptions = buildUtmSourceOptions(t);
  const mediumOptions = buildUtmMediumOptions(t);

  const filledCount = [
    values.source,
    values.medium,
    values.campaign,
    values.term,
    values.content,
  ].filter((v) => v.trim() !== "").length;

  const hasNoUtm = filledCount === 0;

  const handleChange = (field: keyof UtmValues) => (value: string) => {
    const newValues = { ...values, [field]: value };
    onChange(newValues);
    if (value.trim() !== "") {
      trackUtmSet(field, value);
    }
  };

  const handleApplyExample = (example: {
    source: string;
    medium: string;
    campaign: string;
  }) => {
    const newValues = {
      ...values,
      source: example.source,
      medium: example.medium,
      campaign: example.campaign,
    };
    onChange(newValues);
    trackUtmSet("source", example.source, "dropdown");
    trackUtmSet("medium", example.medium, "dropdown");
    trackUtmSet("campaign", example.campaign);
  };

  const makeTooltipOpenHandler = (fieldName: string) => () => {
    trackGuideTooltipOpened(`utm_${fieldName}_help`, fieldName);
  };

  const handleToggle = () => {
    const newEnabled = !enabled;
    onEnabledChange(newEnabled);
    trackUtmToggled(newEnabled);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t.title}</h3>
        <div className={styles.headerRight}>
          <label className={styles.toggleLabel}>
            <span className={styles.toggleLabelText}>{t.toggleLabel}</span>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label={t.toggleAria}
              className={`${styles.toggleSwitch}${enabled ? ` ${styles.toggleSwitchOn}` : ""}`}
              onClick={handleToggle}
            >
              <span className={styles.toggleKnob} aria-hidden="true" />
            </button>
          </label>
          <div className={enabled ? undefined : styles.indicatorDisabled}>
            <EffectivenessIndicator utmCount={enabled ? filledCount : 0} />
          </div>
        </div>
      </div>

      {enabled && hasNoUtm && (
        <div className={styles.warningBanner} role="alert">
          <span className={styles.warningIcon} aria-hidden="true">
            ⚠
          </span>
          <p className={styles.warningText}>{t.noUtmWarning}</p>
        </div>
      )}

      {enabled && (
        <UtmGuide
          currentSource={values.source}
          onApplyExample={handleApplyExample}
        />
      )}

      <div className={styles.fields}>
        <UtmField
          name="source"
          label={t.fieldLabels.source}
          value={values.source}
          onChange={handleChange("source")}
          helpText={t.fieldHelp.source}
          options={sourceOptions}
          onTooltipOpen={makeTooltipOpenHandler("source")}
          disabled={!enabled}
        />

        <UtmField
          name="medium"
          label={t.fieldLabels.medium}
          value={values.medium}
          onChange={handleChange("medium")}
          helpText={t.fieldHelp.medium}
          options={mediumOptions}
          onTooltipOpen={makeTooltipOpenHandler("medium")}
          disabled={!enabled}
        />

        <UtmField
          name="campaign"
          label={t.fieldLabels.campaign}
          value={values.campaign}
          onChange={handleChange("campaign")}
          helpText={t.fieldHelp.campaign}
          placeholder={t.fieldPlaceholders.campaign}
          onTooltipOpen={makeTooltipOpenHandler("campaign")}
          disabled={!enabled}
        />

        <div className={styles.advancedToggle}>
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => setShowAdvanced((prev) => !prev)}
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? t.advancedHide : t.advancedShow}
            <span className={styles.toggleIcon} aria-hidden="true">
              {showAdvanced ? "▲" : "▼"}
            </span>
          </button>
        </div>

        {showAdvanced && (
          <div className={styles.advancedFields}>
            <UtmField
              name="term"
              label={t.fieldLabels.term}
              value={values.term}
              onChange={handleChange("term")}
              helpText={t.fieldHelp.term}
              placeholder={t.fieldPlaceholders.term}
              onTooltipOpen={makeTooltipOpenHandler("term")}
              disabled={!enabled}
            />

            <UtmField
              name="content"
              label={t.fieldLabels.content}
              value={values.content}
              onChange={handleChange("content")}
              helpText={t.fieldHelp.content}
              placeholder={t.fieldPlaceholders.content}
              onTooltipOpen={makeTooltipOpenHandler("content")}
              disabled={!enabled}
            />
          </div>
        )}
      </div>
    </div>
  );
}
