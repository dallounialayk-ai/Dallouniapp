import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { CapAppInit } from "@/components/CapAppInit";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: "دلّوني عليك | حلقة الوصل لبناء منزلك",
  description:
    "تطبيق يربط بين أصحاب الأراضي الراغبين ببناء منازلهم وبين جميع المهندسين والفنيين والحرفيين ومحلات مواد البناء والمقاولين في اليمن.",
  keywords: [
    "دلوني عليك",
    "بناء منازل",
    "مهندسين",
    "فنيين",
    "حرفيين",
    "مواد بناء",
    "مقاولين",
    "اليمن",
  ],
  authors: [{ name: "دلّوني عليك" }],
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/logo.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "دلّوني عليك",
    description: "حلقة الوصل بينك وبين كل من تحتاجه لبناء منزلك",
    type: "website",
    locale: "ar_YE",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "دلّوني عليك" }],
  },
  twitter: {
    card: "summary",
    title: "دلّوني عليك",
    description: "حلقة الوصل بينك وبين كل من تحتاجه لبناء منزلك",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
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
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground overflow-x-hidden overflow-y-hidden w-full max-w-full">
        <CapAppInit />
        {children}
        <Toaster />
        <SonnerToaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
