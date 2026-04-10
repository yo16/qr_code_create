"use client";

import { useRef, useState, useId } from "react";
import styles from "./FileUpload.module.css";

interface FileUploadProps {
  label: string;
  accept?: string;
  maxSizeKB?: number;
  onFileSelect: (file: File | null) => void;
  preview?: string | null;
  error?: string;
}

export function FileUpload({
  label,
  accept,
  maxSizeKB,
  onFileSelect,
  preview,
  error,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [internalError, setInternalError] = useState<string | null>(null);
  const dropZoneId = useId();
  const errorId = `${dropZoneId}-error`;

  const displayError = error ?? internalError;

  const processFile = (file: File) => {
    if (maxSizeKB && file.size > maxSizeKB * 1024) {
      setInternalError(
        `ファイルサイズが上限（${maxSizeKB}KB）を超えています。`
      );
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
        aria-label={`${label}。クリックまたはドラッグ&ドロップでファイルを選択`}
        aria-describedby={displayError ? errorId : undefined}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="プレビュー"
            className={styles.preview}
          />
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.icon} aria-hidden="true">
              &#128193;
            </span>
            <span className={styles.placeholderText}>
              クリックまたはドラッグ&ドロップ
            </span>
            {accept && (
              <span className={styles.acceptText}>
                対応形式: {accept}
              </span>
            )}
            {maxSizeKB && (
              <span className={styles.acceptText}>
                最大サイズ: {maxSizeKB}KB
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
            aria-label="選択したファイルを削除"
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
