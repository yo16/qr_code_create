"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import { exportToPdf } from "@/lib/qr/pdfExporter";
import { trackQrDownloaded } from "@/lib/analytics/events";

interface PdfDownloadButtonProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  disabled?: boolean;
  hasUtm: boolean;
  decorationCount: number;
}

export function PdfDownloadButton({
  canvasRef,
  disabled = false,
  hasUtm,
  decorationCount,
}: PdfDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    try {
      await exportToPdf(canvas, "qrcode.pdf");
      trackQrDownloaded({ format: "pdf", hasUtm, decorationCount });
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
      {isLoading ? "PDF生成中..." : "PDF形式でダウンロード"}
    </Button>
  );
}
