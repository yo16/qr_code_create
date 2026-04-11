export type ExportFormat = "png" | "svg";

// Canvas要素をPNGのdata URLに変換
export function canvasToPng(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png");
}

// Canvas要素をSVG文字列に変換（PNGをSVG内に埋め込むアプローチ）
export function canvasToSvg(canvas: HTMLCanvasElement): string {
  const dataUrl = canvas.toDataURL("image/png");
  const width = canvas.width;
  const height = canvas.height;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><image href="${dataUrl}" width="${width}" height="${height}"/></svg>`;
}

// data URLまたはテキストをファイルとしてダウンロード
export function downloadFile(
  content: string,
  fileName: string,
  mimeType: string
): void {
  const blob = mimeType.startsWith("image/svg")
    ? new Blob([content], { type: mimeType })
    : dataUrlToBlob(content);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}
