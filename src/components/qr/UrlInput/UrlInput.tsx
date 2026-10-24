"use client";

import { useState, useCallback, useRef } from "react";
import { trackUrlEntered } from "@/lib/analytics/events";
import { Input } from "@/components/ui/Input/Input";
import { validateUrl } from "@/lib/url/validateUrl";
import { useDict } from "@/i18n/useDict";
import styles from "./UrlInput.module.css";

interface UrlInputProps {
  value: string;
  onChange: (url: string) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export function UrlInput({ value, onChange, onValidationChange }: UrlInputProps) {
  const { tool } = useDict();
  const [error, setError] = useState<string | undefined>(undefined);
  const lastTrackedRef = useRef<string>("");

  const handleChange = useCallback(
    (url: string) => {
      onChange(url);

      const result = validateUrl(url, tool.validation);

      // 未入力時はエラーを表示しない
      if (!url) {
        setError(undefined);
        onValidationChange?.(false);
        return;
      }

      setError(result.error);
      onValidationChange?.(result.isValid);
    },
    [onChange, onValidationChange, tool.validation]
  );

  const handleBlur = useCallback(() => {
    if (!value || !validateUrl(value).isValid) return;
    // 同じ値での blur 繰り返しでは二重送信しない
    if (lastTrackedRef.current === value) return;
    lastTrackedRef.current = value;
    trackUrlEntered(new URL(value).hostname);
  }, [value]);

  return (
    <div className={styles.container} onBlur={handleBlur}>
      <Input
        label={tool.urlInput.label}
        value={value}
        onChange={handleChange}
        type="url"
        placeholder={tool.urlInput.placeholder}
        error={error}
        required
      />
    </div>
  );
}
