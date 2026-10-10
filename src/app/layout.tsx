import type { Metadata, Viewport } from "next";
import { PWAHandler } from "@/components/pwa/PWAHandler";
import "./globals.css";

export const metadata: Metadata = {
  title: "Track - Cinéma & Séries",
  description: "Votre cinémathèque personnelle et carnet de bord cinéphile sur iPhone",
  applicationName: "Track",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Track",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" },
      { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#050507",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark bg-[#050507]" suppressHydrationWarning>
      <body
        className="min-h-screen bg-[#050507] text-white antialiased selection:bg-[#E50914]/30"
        suppressHydrationWarning
      >
        <PWAHandler />
        {children}
      </body>
    </html>
  );
}
