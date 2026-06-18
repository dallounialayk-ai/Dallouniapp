import type { Metadata, Viewport } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const cairo = Cairo({
  variable: "--font-sans",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-display",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
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
    icon: "/logo.svg",
  },
  openGraph: {
    title: "دلّوني عليك",
    description: "حلقة الوصل بينك وبين كل من تحتاجه لبناء منزلك",
    type: "website",
    locale: "ar_YE",
  },
  twitter: {
    card: "summary_large_image",
    title: "دلّوني عليك",
    description: "حلقة الوصل بينك وبين كل من تحتاجه لبناء منزلك",
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
      <body
        className={`${cairo.variable} ${tajawal.variable} font-sans antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
