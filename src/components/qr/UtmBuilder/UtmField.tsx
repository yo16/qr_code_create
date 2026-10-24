"use client";

import { Select } from "@/components/ui/Select/Select";
import { Input } from "@/components/ui/Input/Input";
import { Tooltip } from "@/components/ui/Tooltip/Tooltip";
import { formatMessage } from "@/i18n/format";
import { useDict } from "@/i18n/useDict";
import styles from "./UtmBuilder.module.css";

interface UtmFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  helpText: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  onTooltipOpen?: () => void;
  /** フィールドを無効化（グレーアウト・操作不能）にする。UTM ON/OFFトグルOFF時に true (デフォルト: false) */
  disabled?: boolean;
}

export function UtmField({
  name,
  label,
  value,
  onChange,
  helpText,
  placeholder,
  options,
  onTooltipOpen,
  disabled = false,
}: UtmFieldProps) {
  const { utm: t } = useDict();
  return (
    <div
      className={`${styles.fieldRow}${disabled ? ` ${styles.fieldRowDisabled}` : ""}`}
      aria-disabled={disabled}
    >
      <div className={styles.fieldWithTooltip}>
        {options ? (
          <Select
            label={label}
            value={value}
            onChange={onChange}
            options={options}
            allowCustom={true}
            disabled={disabled}
          />
        ) : (
          <Input
            label={label}
            value={value}
            onChange={onChange}
            type="text"
            placeholder={placeholder}
            helpText={name === "campaign" ? t.campaignHint : undefined}
            disabled={disabled}
          />
        )}
        <Tooltip content={helpText} position="top" onOpen={disabled ? undefined : onTooltipOpen}>
          <button
            type="button"
            className={styles.helpButton}
            aria-label={formatMessage(t.helpButtonAria, { label })}
            disabled={disabled}
          >
            ?
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
