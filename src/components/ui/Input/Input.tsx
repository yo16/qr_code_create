"use client";

import { useId } from "react";
import styles from "./Input.module.css";

interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "url" | "number";
  placeholder?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  id?: string;
}

export function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  helpText,
  required = false,
  id,
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={styles.wrapper}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={describedBy}
        className={[styles.input, error ? styles.inputError : ""]
          .filter(Boolean)
          .join(" ")}
      />
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
