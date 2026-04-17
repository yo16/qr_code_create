"use client";

import { Button } from "@/components/ui/Button/Button";
import {
  canvasToPngScaled,
  canvasToSvg,
  downloadFile,
  type ExportFormat,
} from "@/lib/qr/canvasExporter";
import { trackQrDownloaded } from "@/lib/analytics/events";
import { createCanvasWithCaption } from "@/lib/qr/captionCompositor";
import type { CaptionConfig } from "@/types/qr";
import type { Resolution } from "./ResolutionSelector";

interface DownloadButtonProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  format: ExportFormat;
  disabled?: boolean;
  hasUtm: boolean;
  decorationCount: number;
  resolution?: Resolution;
  caption?: CaptionConfig;
}

export function DownloadButton({
  canvasRef,
  format,
  disabled = false,
  hasUtm,
  decorationCount,
  resolution = 1,
  caption,
}: DownloadButtonProps) {
  const label =
    format === "png" ? "PNG形式でダウンロード" : "SVG形式でダウンロード";

  const handleClick = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = createCanvasWithCaption(canvas, caption);

    if (format === "png") {
      const dataUrl = canvasToPngScaled(exportCanvas, resolution);
      downloadFile(dataUrl, "qrcode.png", "image/png");
    } else {
      const svgString = canvasToSvg(exportCanvas);
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
