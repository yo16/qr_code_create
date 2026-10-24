"use client";

import { useState, useId } from "react";
import { formatMessage } from "@/i18n/format";
import { useDict } from "@/i18n/useDict";
import styles from "./Select.module.css";

const CUSTOM_VALUE = "__custom__";

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allowCustom?: boolean;
  customPlaceholder?: string;
  helpText?: string;
  error?: string;
  id?: string;
  disabled?: boolean;
}

export function Select({
  label,
  value,
  onChange,
  options,
  allowCustom = false,
  customPlaceholder,
  helpText,
  error,
  id,
  disabled = false,
}: SelectProps) {
  const t = useDict().ui.select;
  const placeholderText = customPlaceholder ?? t.customPlaceholder;
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const helpId = helpText ? `${selectId}-help` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  // Determine if current value matches one of the preset options
  const isPresetValue = options.some((opt) => opt.value === value);
  const [isCustomMode, setIsCustomMode] = useState(
    allowCustom && value !== "" && !isPresetValue
  );
  const [customValue, setCustomValue] = useState(
    isCustomMode ? value : ""
  );

  const selectValue = isCustomMode ? CUSTOM_VALUE : value;

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    if (newVal === CUSTOM_VALUE) {
      setIsCustomMode(true);
      onChange(customValue);
    } else {
      setIsCustomMode(false);
      onChange(newVal);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setCustomValue(newVal);
    onChange(newVal);
  };

  const allOptions = allowCustom
    ? [...options, { value: CUSTOM_VALUE, label: t.customOption }]
    : options;

  return (
    <div className={styles.wrapper}>
      <label htmlFor={selectId} className={styles.label}>
        {label}
      </label>
      <select
        id={selectId}
        value={selectValue}
        onChange={handleSelectChange}
        aria-describedby={describedBy}
        aria-invalid={error ? "true" : "false"}
        disabled={disabled}
        className={[styles.select, error ? styles.selectError : ""]
          .filter(Boolean)
          .join(" ")}
      >
        <option value="" disabled>
          {t.placeholder}
        </option>
        {allOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {isCustomMode && (
        <input
          type="text"
          value={customValue}
          onChange={handleCustomChange}
          placeholder={placeholderText}
          className={styles.customInput}
          aria-label={formatMessage(t.customAria, { label })}
          disabled={disabled}
        />
      )}
      {helpText && !error && (
        <p id={helpId} className={styles.helpText}>
          {helpText}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.errorText} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
