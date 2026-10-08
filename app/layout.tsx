import type { Metadata, Viewport } from "next";
import { LanguageProvider } from "@/components/LanguageProvider";
import RegisterServiceWorker from "@/components/RegisterServiceWorker";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinGuard",
  description: "Don't just detect the scam. Know what to do next.",
  // The tab and iPhone home-screen icons; the other home-screen icons are in app/manifest.ts.
  icons: {
    icon: [
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
  },
  // Opens full-screen from the iPhone home screen too, like the manifest's "standalone".
  appleWebApp: { capable: true, title: "FinGuard", statusBarStyle: "black" },
  // The current name for the tag above, so Chrome doesn't warn that it's deprecated.
  other: { "mobile-web-app-capable": "yes" },
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
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
