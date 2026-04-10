"use client";

import dynamic from "next/dynamic";
import { QrGeneratorSkeleton } from "@/components/qr/QrGenerator";

const QrGenerator = dynamic(
  () =>
    import("@/components/qr/QrGenerator/QrGenerator").then(
      (m) => m.QrGenerator
    ),
  { ssr: false, loading: () => <QrGeneratorSkeleton /> }
);

export function QrGeneratorLoader() {
  return <QrGenerator />;
}
