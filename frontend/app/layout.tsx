import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";
import { localBusinessJsonLd, organizationJsonLd } from "@/lib/jsonld";

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Beefshteks — доставка бургеров",
  description:
    "Закажите сочные бургеры, закуски и напитки с доставкой. Beefshteks — быстро, вкусно, по-настоящему.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Beefshteks" },
  openGraph: {
    title: "Beefshteks — доставка бургеров",
    description: "Сочные бургеры с доставкой за 45 минут",
    type: "website",
    locale: "ru_RU",
  },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${outfit.variable} ${fraunces.variable}`}>
      <body className="min-h-screen font-sans">
        <Script
          id="jsonld-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <Script
          id="jsonld-business"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd()) }}
        />
        <ClientProviders>{children}</ClientProviders>
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
          }`}
        </Script>
      </body>
    </html>
  );
}
