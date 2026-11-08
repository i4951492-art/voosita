import type { Metadata } from "next";
import "./globals.css";
import BotGuard from "@/components/bot-guard";

export const metadata: Metadata = {
  title: "VOOSITA — Imkoniyatlar bir joyda",
  description:
    "VOOSITA — O‘zbekistonda ish, xizmat va uy-joy topish platformasi. Работа, услуги и жильё в одном месте.",
  keywords: ["VOOSITA", "Uzbekistan", "jobs", "services", "housing", "Tashkent"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body>
        <BotGuard>{children}</BotGuard>
      </body>
    </html>
  );
}
