import type { Metadata, Viewport } from "next";
import { LanguageProvider } from "@/components/LanguageProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinGuard",
  description: "Don't just detect the scam. Know what to do next.",
};

// Darkens the mobile browser chrome to match the page.
export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100 antialiased">
        {/* Shares the header's language choice with the analyser. */}
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
