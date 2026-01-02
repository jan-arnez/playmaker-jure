import { Geist as FontSans } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { PerformanceMonitor } from "@/components/performance-monitor";
import { AuthModalProvider } from "@/components/auth-modal";

// Prevent iOS zoom on input focus
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const fontSans = FontSans({
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Get messages for client components
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={cn("antialiased", fontSans.className)}>
        <NextIntlClientProvider messages={messages}>
          <NuqsAdapter>
            <AuthModalProvider>
              {children}
            </AuthModalProvider>
            <Toaster />
            <PerformanceMonitor />
          </NuqsAdapter>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
