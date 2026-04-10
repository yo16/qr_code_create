"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { buildUtmUrl } from "@/lib/url/buildUtmUrl";
import styles from "./UrlPreview.module.css";

interface UrlPreviewProps {
  url: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
}

export function UrlPreview({
  url,
  utmSource,
  utmMedium,
  utmCampaign,
  utmTerm,
  utmContent,
}: UrlPreviewProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const builtUrl = buildUtmUrl(url, {
    source: utmSource,
    medium: utmMedium,
    campaign: utmCampaign,
    term: utmTerm,
    content: utmContent,
  });

  const handleCopy = useCallback(async () => {
    if (!builtUrl) return;
    try {
      await navigator.clipboard.writeText(builtUrl);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available
    }
  }, [builtUrl]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>生成URLプレビュー</span>
        {builtUrl && (
          <button
            type="button"
            className={styles.copyButton}
            onClick={handleCopy}
            aria-label="URLをクリップボードにコピー"
          >
            {copied ? "コピーしました" : "コピー"}
          </button>
        )}
      </div>

      <div className={styles.previewArea}>
        {builtUrl ? (
          <code className={styles.urlCode}>{builtUrl}</code>
        ) : (
          <span className={styles.placeholder}>
            URLを入力するとプレビューが表示されます
          </span>
        )}
      </div>

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={styles.srOnly}
      >
        {copied ? "URLをコピーしました" : ""}
      </div>
    </div>
  );
}
