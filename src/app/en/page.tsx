import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// T3 で置き換える仮ページ
export default function EnHomePage() {
  return (
    <main>
      <h1>QR Code Create</h1>
      <p>English version is coming soon.</p>
    </main>
  );
}
