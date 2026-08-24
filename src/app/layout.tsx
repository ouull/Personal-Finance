import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Providers from "@/components/Providers";
import { Navigation } from "@/components/Navigation";
import { QuickCaptureWrapper } from "@/components/QuickCaptureWrapper";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Personal Finance Dashboard",
  description: "Manage your personal finance effortlessly.",
};

import { getTranslation } from "@/lib/i18n";

import { TranslationProvider } from "@/lib/TranslationContext";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { t, language } = await getTranslation();

  return (
    <html lang={language === "ID" ? "id" : "en"}>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-slate-50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-white to-cyan-50 min-h-screen selection:bg-indigo-100 selection:text-indigo-900`}
      >
        <TranslationProvider dictionary={t} language={language}>
          <Providers>
            <div className="min-h-screen flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 relative">
              <Navigation translations={(t as any).navigation || {}} />
              {children}
              <QuickCaptureWrapper />
            </div>
            <Toaster />
          </Providers>
        </TranslationProvider>
      </body>
    </html>
  );
}
