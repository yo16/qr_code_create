"use client";

import { useId } from "react";
import styles from "./MarkdownInput.module.css";

/** 説明文の文字数の目安（超えても入力は止めない） */
export const DESCRIPTION_SOFT_LIMIT = 500;

interface MarkdownInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownInput({ value, onChange, placeholder }: MarkdownInputProps) {
  const id = useId();
  const textareaId = `${id}-textarea`;
  const hintId = `${id}-hint`;
  const countId = `${id}-count`;
  const length = value.length;
  const isOver = length > DESCRIPTION_SOFT_LIMIT;

  return (
    <div className={styles.container}>
      <label htmlFor={textareaId} className={styles.label}>
        説明文（Markdown）
      </label>
      <textarea
        id={textareaId}
        className={`${styles.textarea}${isOver ? ` ${styles.textareaOver}` : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={8}
        aria-describedby={`${hintId} ${countId}`}
      />
      <div className={styles.meta}>
        <p id={hintId} className={styles.hint}>
          ポスターのQRコードの横に表示する説明文を入力します
        </p>
        <p
          id={countId}
          className={`${styles.count}${isOver ? ` ${styles.countOver}` : ""}`}
        >
          {length} / {DESCRIPTION_SOFT_LIMIT}文字
        </p>
      </div>
      {isOver && (
        <p className={styles.warning} role="status">
          文字数が目安を超えています。印刷したときにカードに収まらない場合があります。
        </p>
      )}

      <details className={styles.help}>
        <summary className={styles.helpSummary}>使える記法</summary>
        <ul className={styles.helpList}>
          <li>
            <code>**太字**</code>、<code>*斜体*</code>、<code>~~打ち消し~~</code>
          </li>
          <li>
            <code>## 見出し</code>（<code>#</code> から <code>####</code> まで）
          </li>
          <li>
            <code>- 項目</code> で箇条書き、<code>1. 項目</code> で番号付きリスト
          </li>
          <li>
            <code>[表示する文字](https://example.com)</code> でリンク
          </li>
          <li>
            <code>&gt; 引用</code>、<code>---</code> で区切り線、表も使えます
          </li>
          <li>画像とHTMLタグは使えません</li>
        </ul>
      </details>
    </div>
  );
}
