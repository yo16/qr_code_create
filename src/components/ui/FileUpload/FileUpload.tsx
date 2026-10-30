"use client";

import { useRef, useState, useId } from "react";
import { formatMessage } from "@/i18n/format";
import { useDict } from "@/i18n/useDict";
import styles from "./FileUpload.module.css";

interface FileUploadProps {
  label: string;
  accept?: string;
  maxSizeKB?: number;
  onFileSelect: (file: File | null) => void;
  preview?: string | null;
  error?: string;
}

/**
 * accept（MIME・"type/*"・拡張子のカンマ区切り）を許可リストとして検査する。
 * ドラッグ&ドロップでは accept が効かないため、ここで再検査する。
 */
function isAcceptedFile(file: File, accept?: string): boolean {
  if (!accept) return true;
  const tokens = accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith(".")) return name.endsWith(token);
    if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

export function FileUpload({
  label,
  accept,
  maxSizeKB,
  onFileSelect,
  preview,
  error,
}: FileUploadProps) {
  const t = useDict().ui.fileUpload;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [internalError, setInternalError] = useState<string | null>(null);
  const dropZoneId = useId();
  const errorId = `${dropZoneId}-error`;

  const displayError = error ?? internalError;

  const processFile = (file: File) => {
    if (!isAcceptedFile(file, accept)) {
      setInternalError(t.unsupportedType);
      setSelectedFileName(null);
      onFileSelect(null);
      return;
    }
    if (maxSizeKB && file.size > maxSizeKB * 1024) {
      setInternalError(formatMessage(t.sizeExceeded, { max: maxSizeKB }));
      setSelectedFileName(null);
      onFileSelect(null);
      return;
    }
    setInternalError(null);
    setSelectedFileName(file.name);
    onFileSelect(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  const handleRemove = () => {
    setSelectedFileName(null);
    setInternalError(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={styles.wrapper}>
      <p className={styles.label}>{label}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className={styles.hiddenInput}
        aria-hidden="true"
        tabIndex={-1}
      />
      <button
        type="button"
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={handleKeyDown}
        className={[
          styles.dropZone,
          isDragging ? styles.dragging : "",
          displayError ? styles.dropZoneError : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={formatMessage(t.dropZoneAria, { label })}
        aria-describedby={displayError ? errorId : undefined}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={t.previewAlt}
            className={styles.preview}
          />
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.icon} aria-hidden="true">
              &#128193;
            </span>
            <span className={styles.placeholderText}>{t.dropText}</span>
            {accept && (
              <span className={styles.acceptText}>
                {formatMessage(t.accept, { accept })}
              </span>
            )}
            {maxSizeKB && (
              <span className={styles.acceptText}>
                {formatMessage(t.maxSize, { max: maxSizeKB })}
              </span>
            )}
          </div>
        )}
      </button>
      {selectedFileName && (
        <div className={styles.fileInfo}>
          <span className={styles.fileName}>{selectedFileName}</span>
          <button
            type="button"
            onClick={handleRemove}
            className={styles.removeButton}
            aria-label={t.removeAria}
          >
            &#x2715;
          </button>
        </div>
      )}
      {displayError && (
        <p id={errorId} className={styles.errorText} role="alert">
          {displayError}
        </p>
      )}
    </div>
  );
}
