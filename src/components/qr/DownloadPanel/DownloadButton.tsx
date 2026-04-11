"use client";

import { Button } from "@/components/ui/Button/Button";
import {
  canvasToPng,
  canvasToSvg,
  downloadFile,
  type ExportFormat,
} from "@/lib/qr/canvasExporter";
import { trackQrDownloaded } from "@/lib/analytics/events";

interface DownloadButtonProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  format: ExportFormat;
  disabled?: boolean;
  hasUtm: boolean;
  decorationCount: number;
}

export function DownloadButton({
  canvasRef,
  format,
  disabled = false,
  hasUtm,
  decorationCount,
}: DownloadButtonProps) {
  const label =
    format === "png" ? "PNG形式でダウンロード" : "SVG形式でダウンロード";

  const handleClick = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (format === "png") {
      const dataUrl = canvasToPng(canvas);
      downloadFile(dataUrl, "qrcode.png", "image/png");
    } else {
      const svgString = canvasToSvg(canvas);
      downloadFile(svgString, "qrcode.svg", "image/svg+xml");
    }

    trackQrDownloaded({ format, hasUtm, decorationCount });
  };

  return (
    <Button
      variant={format === "png" ? "primary" : "secondary"}
      disabled={disabled}
      onClick={handleClick}
    >
      {label}
    </Button>
  );
}
