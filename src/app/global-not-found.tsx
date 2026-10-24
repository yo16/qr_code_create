import type { Metadata } from "next";
import { RootShell } from "@/components/layout/RootShell/RootShell";
import { NotFoundContent } from "@/components/layout/NotFoundContent";

export const metadata: Metadata = {
  title: "ページが見つかりません | QR Code Create",
};

export default function GlobalNotFound() {
  return (
    <RootShell locale="ja">
      <NotFoundContent locale="ja" />
    </RootShell>
  );
}
