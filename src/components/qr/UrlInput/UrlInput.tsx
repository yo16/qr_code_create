"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/Input/Input";
import { validateUrl } from "@/lib/url/validateUrl";
import styles from "./UrlInput.module.css";

interface UrlInputProps {
  value: string;
  onChange: (url: string) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export function UrlInput({ value, onChange, onValidationChange }: UrlInputProps) {
  const [error, setError] = useState<string | undefined>(undefined);

  const handleChange = useCallback(
    (url: string) => {
      onChange(url);

      const result = validateUrl(url);

      // 未入力時はエラーを表示しない
      if (!url) {
        setError(undefined);
        onValidationChange?.(false);
        return;
      }

      setError(result.error);
      onValidationChange?.(result.isValid);
    },
    [onChange, onValidationChange]
  );

  const handleBlur = useCallback(() => {
    if (value && validateUrl(value).isValid) {
      // GA4トラッキング（tue.2タスクで実装予定）
      // trackUrlEntered(value);
    }
  }, [value]);

  return (
    <div className={styles.container} onBlur={handleBlur}>
      <Input
        label="URL"
        value={value}
        onChange={handleChange}
        type="url"
        placeholder="https://example.com"
        error={error}
        required
      />
    </div>
  );
}
