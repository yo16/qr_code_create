"use client";

import { useState } from "react";
import { UtmField } from "./UtmField";
import { UtmGuide } from "./UtmGuide";
import { EffectivenessIndicator } from "./EffectivenessIndicator";
import {
  UTM_SOURCE_OPTIONS,
  UTM_MEDIUM_OPTIONS,
  UTM_FIELD_HELP,
} from "@/lib/constants/utmPresets";
import {
  trackUtmSet,
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
}

export function UtmBuilder({ values, onChange }: UtmBuilderProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>UTMパラメータ設定</h3>
        <EffectivenessIndicator utmCount={filledCount} />
      </div>

      {hasNoUtm && (
        <div className={styles.warningBanner} role="alert">
          <span className={styles.warningIcon} aria-hidden="true">
            ⚠
          </span>
          <p className={styles.warningText}>
            UTMパラメータなしでは、このQRコードからのアクセスをGoogle
            Analyticsで追跡できません
          </p>
        </div>
      )}

      <UtmGuide
        currentSource={values.source}
        onApplyExample={handleApplyExample}
      />

      <div className={styles.fields}>
        <UtmField
          name="source"
          label="utm_source（掲載場所）"
          value={values.source}
          onChange={handleChange("source")}
          helpText={UTM_FIELD_HELP.source}
          options={UTM_SOURCE_OPTIONS}
          onTooltipOpen={makeTooltipOpenHandler("source")}
        />

        <UtmField
          name="medium"
          label="utm_medium（配布手段）"
          value={values.medium}
          onChange={handleChange("medium")}
          helpText={UTM_FIELD_HELP.medium}
          options={UTM_MEDIUM_OPTIONS}
          onTooltipOpen={makeTooltipOpenHandler("medium")}
        />

        <UtmField
          name="campaign"
          label="utm_campaign（キャンペーン名）"
          value={values.campaign}
          onChange={handleChange("campaign")}
          helpText={UTM_FIELD_HELP.campaign}
          placeholder="例: spring_sale_2026"
          onTooltipOpen={makeTooltipOpenHandler("campaign")}
        />

        <div className={styles.advancedToggle}>
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => setShowAdvanced((prev) => !prev)}
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? "詳細設定を非表示" : "詳細設定を表示"}
            <span className={styles.toggleIcon} aria-hidden="true">
              {showAdvanced ? "▲" : "▼"}
            </span>
          </button>
        </div>

        {showAdvanced && (
          <div className={styles.advancedFields}>
            <UtmField
              name="term"
              label="utm_term（検索キーワード）"
              value={values.term}
              onChange={handleChange("term")}
              helpText={UTM_FIELD_HELP.term}
              placeholder="例: QRコード 作成"
              onTooltipOpen={makeTooltipOpenHandler("term")}
            />

            <UtmField
              name="content"
              label="utm_content（コンテンツ識別子）"
              value={values.content}
              onChange={handleChange("content")}
              helpText={UTM_FIELD_HELP.content}
              placeholder="例: banner_top"
              onTooltipOpen={makeTooltipOpenHandler("content")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
