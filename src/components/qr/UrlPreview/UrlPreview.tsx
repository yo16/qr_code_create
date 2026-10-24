"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { buildUtmUrl } from "@/lib/url/buildUtmUrl";
import { useDict } from "@/i18n/useDict";
import styles from "./UrlPreview.module.css";

interface UrlPreviewProps {
  url: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  /** UTM有効/無効フラグ。false の場合 UTM パラメータをプレビューに表示しない (デフォルト: true) */
  utmEnabled?: boolean;
}

export function UrlPreview({
  url,
  utmSource,
  utmMedium,
  utmCampaign,
  utmTerm,
  utmContent,
  utmEnabled = true,
}: UrlPreviewProps) {
  const t = useDict().tool.urlPreview;
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const builtUrl = buildUtmUrl(
    url,
    {
      source: utmSource,
      medium: utmMedium,
      campaign: utmCampaign,
      term: utmTerm,
      content: utmContent,
    },
    utmEnabled
  );

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
        <span className={styles.label}>{t.label}</span>
        {builtUrl && (
          <button
            type="button"
            className={styles.copyButton}
            onClick={handleCopy}
            aria-label={t.copyAria}
          >
            {copied ? t.copied : t.copy}
          </button>
        )}
      </div>

      <div className={styles.previewArea}>
        {builtUrl ? (
          <code className={styles.urlCode}>{builtUrl}</code>
        ) : (
          <span className={styles.placeholder}>{t.placeholder}</span>
        )}
      </div>

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={styles.srOnly}
      >
        {copied ? t.copiedStatus : ""}
      </div>
    </div>
  );
}
