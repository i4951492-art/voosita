import type { Metadata } from "next";
import "./globals.css";
import AuthSync from "@/components/auth-sync";

export const metadata: Metadata = {
  title: { default: "VOOSITA WORK", template: "%s · VOOSITA WORK" },
  description: "VOOSITA WORK: ish, xizmat va uy-joy e’lonlari. Barcha asosiy imkoniyatlar bepul.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>
        <AuthSync />
        {children}
      </body>
    </html>
  );
}
