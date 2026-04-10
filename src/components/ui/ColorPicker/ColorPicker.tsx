"use client";

import { useId, useState } from "react";
import styles from "./ColorPicker.module.css";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  id?: string;
}

function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function ColorPicker({ label, value, onChange, id }: ColorPickerProps) {
  const generatedId = useId();
  const pickerId = id ?? generatedId;
  const textId = `${pickerId}-text`;

  const [textValue, setTextValue] = useState(value);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setTextValue(newColor);
    onChange(newColor);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTextValue(raw);
    const withHash = raw.startsWith("#") ? raw : `#${raw}`;
    if (isValidHexColor(withHash)) {
      onChange(withHash);
    }
  };

  const handleTextBlur = () => {
    // Normalize to valid value on blur
    const withHash = textValue.startsWith("#") ? textValue : `#${textValue}`;
    if (isValidHexColor(withHash)) {
      setTextValue(withHash);
    } else {
      setTextValue(value);
    }
  };

  return (
    <div className={styles.wrapper}>
      <label htmlFor={pickerId} className={styles.label}>
        {label}
      </label>
      <div className={styles.controls}>
        <span
          className={styles.preview}
          style={{ backgroundColor: isValidHexColor(value) ? value : "#000000" }}
          aria-hidden="true"
        />
        <input
          id={pickerId}
          type="color"
          value={isValidHexColor(value) ? value : "#000000"}
          onChange={handleColorChange}
          className={styles.colorInput}
          aria-label={`${label}のカラーピッカー`}
        />
        <label htmlFor={textId} className={styles.srOnly}>
          {label}のカラーコード入力
        </label>
        <input
          id={textId}
          type="text"
          value={textValue}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          maxLength={7}
          className={styles.textInput}
          aria-label={`${label}のカラーコード`}
          placeholder="#000000"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
