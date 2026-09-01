import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Providers from "@/components/Providers";
import { Navigation } from "@/components/Navigation";
import { MobileNavigation } from "@/components/MobileNavigation";
import { QuickCaptureWrapper } from "@/components/QuickCaptureWrapper";
import { CurrencyProvider } from "@/lib/CurrencyContext";
import { PageTransition } from "@/components/PageTransition";
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
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[#FCFCFD] min-h-screen selection:bg-black selection:text-white flex overflow-hidden`}
      >
        <TranslationProvider dictionary={t} language={language}>
          <Providers>
            <CurrencyProvider>
              {/* Sidebar */}
              <Navigation translations={(t as any).navigation || {}} />
              <MobileNavigation translations={(t as any).navigation || {}} />

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
                <div className="max-w-6xl w-full mx-auto px-4 pt-6 pb-24 md:px-10 md:py-10">
                  <PageTransition>{children}</PageTransition>
                  <QuickCaptureWrapper />
                </div>
              </div>
              <Toaster />
            </CurrencyProvider>
          </Providers>
        </TranslationProvider>
      </body>
    </html>
  );
}
