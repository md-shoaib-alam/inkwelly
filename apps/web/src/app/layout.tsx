import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { MonitoringProvider } from "@/components/monitoring-provider";
import { GlobalErrorBoundary } from "@/components/error-boundary";
import JsonLd from "@/components/json-ld";
import { OfflineGuard } from "@/components/offline-guard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { generateAdvancedMetadata } from "@/lib/seo/metadata";

export const metadata = generateAdvancedMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          storageKey="schoolsaas-theme"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Providers>
            <MonitoringProvider>
              <GlobalErrorBoundary>
                <OfflineGuard>
                  {children}
                </OfflineGuard>
              </GlobalErrorBoundary>
            </MonitoringProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
