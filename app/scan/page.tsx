import type { Metadata } from "next";
import { Suspense } from "react";
import Scanner from "@/components/scanner";

export const metadata: Metadata = { title: "Scan your site — Axolotl" };

export default function ScanPage() {
  // Scanner reads ?url= with useSearchParams, which needs a Suspense boundary when prerendered.
  return (
    <Suspense>
      <Scanner />
    </Suspense>
  );
}
