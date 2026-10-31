import type { Metadata } from "next";
import "./globals.css";
import { nunito } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Axolotl — Is your site ready for AI agents?",
  description: "Axolotl scores how well AI agents can find, navigate and complete tasks on your website, then ranks the fixes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={nunito.className}>
      <body>{children}</body>
    </html>
  );
}
