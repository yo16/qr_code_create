"use client";

import dynamic from "next/dynamic";

const PosterEditor = dynamic(
  () =>
    import("@/components/poster/PosterEditor/PosterEditor").then(
      (m) => m.PosterEditor
    ),
  {
    ssr: false,
    loading: () => (
      <div aria-live="polite" aria-busy="true">
        ポスターエディタを読み込み中...
      </div>
    ),
  }
);

export function PosterEditorLoader() {
  return <PosterEditor />;
}
