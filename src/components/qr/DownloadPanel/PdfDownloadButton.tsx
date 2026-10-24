"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import { exportToPdf } from "@/lib/qr/pdfExporter";
import { trackQrDownloaded, trackErrorOccurred } from "@/lib/analytics/events";
import { createCanvasWithCaption } from "@/lib/qr/captionCompositor";
import { useDict } from "@/i18n/useDict";
import type { CaptionConfig } from "@/types/qr";

interface PdfDownloadButtonProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  disabled?: boolean;
  hasUtm: boolean;
  decorationCount: number;
  caption?: CaptionConfig;
}

export function PdfDownloadButton({
  canvasRef,
  disabled = false,
  hasUtm,
  decorationCount,
  caption,
}: PdfDownloadButtonProps) {
  const t = useDict().tool.download;
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    try {
      const exportCanvas = createCanvasWithCaption(canvas, caption);
      await exportToPdf(exportCanvas, "qrcode.pdf");
      trackQrDownloaded({ format: "pdf", hasUtm, decorationCount });
    } catch (error) {
      trackErrorOccurred("pdf_export", error instanceof Error ? error.name : "unknown");
      console.error("PDF export failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      disabled={disabled || isLoading}
      onClick={handleClick}
    >
      {isLoading ? t.pdfGenerating : t.pdfButton}
    </Button>
  );
}
