"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { QrGeneratorSkeleton } from "@/components/qr/QrGenerator";
import { parseCreateSearchParams } from "@/lib/url/parseCreateSearchParams";

const QrGenerator = dynamic(
  () =>
    import("@/components/qr/QrGenerator/QrGenerator").then(
      (m) => m.QrGenerator
    ),
  { ssr: false, loading: () => <QrGeneratorSkeleton /> }
);

function QrGeneratorWithParams() {
  const searchParams = useSearchParams();
  const initialParams = parseCreateSearchParams(searchParams);
  return <QrGenerator initialParams={initialParams} />;
}

export function QrGeneratorLoader() {
  return (
    <Suspense fallback={<QrGeneratorSkeleton />}>
      <QrGeneratorWithParams />
    </Suspense>
  );
}
